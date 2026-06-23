import os
import uuid
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from pymongo import MongoClient
import psycopg2

from solotodo import (
    browse_cpus,
    browse_gpus,
    browse_motherboards,
    browse_ram,
    browse_psu,
    browse_cpu_coolers,
    browse_fans,
    browse_pc_cases,
    browse_storage,
    get_product_prices,
    get_stores,
)

load_dotenv()

MONGO_USER     = os.getenv("MONGO_USER")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
MONGO_HOST     = os.getenv("MONGO_HOST")
MONGO_PORT     = int(os.getenv("MONGO_PORT"))
MONGO_DB       = os.getenv("MONGO_DB")

POSTGRES_HOST     = os.getenv("POSTGRES_HOST")
POSTGRES_PORT     = int(os.getenv("POSTGRES_PORT"))
POSTGRES_DB       = os.getenv("POSTGRES_DB")
POSTGRES_USER     = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")

CATEGORIES = [
    ("CPU",         browse_cpus, 200),
    ("GPU",         browse_gpus, 200),
    ("RAM",         browse_ram, 200),
    ("Motherboard", browse_motherboards, 200),
    ("PSU",         browse_psu, 200),
    ("Case",        browse_pc_cases, 200),
    ("CPU Cooler",  browse_cpu_coolers, 200),
    ("Fans",        browse_fans, 200),
    ("Storage",     browse_storage, 200),
]

MAX_WORKERS_PREVENT_RATE_LIMIT = 5

CPU_DISPLAY_SPECS = {
    "core_count": "Cores", "thread_count": "Threads", "tdp": "TDP (W)",
    "base_clock": "Base Clock", "boost_clock": "Boost Clock",
    "socket": "Socket", "gpu": "GPU Integrada",
    "cinebench_r20_single_score": "Cinebench R20 (1T)",
    "cinebench_r20_multi_score": "Cinebench R20 (nT)",
}

GPU_DISPLAY_SPECS = {
    "gpu_boost_clock": "Boost Clock", "vram_quantity": "VRAM",
    "gpu_tdp": "TDP (W)", "bus_width": "Bus",
    "length": "Largo (mm)",
}

RAM_DISPLAY_SPECS = {
    "capacity": "Capacidad", "bus_speed": "Velocidad",
    "ram_type": "Tipo", "module_count": "Modulos",
}

MOTHERBOARD_DISPLAY_SPECS = {
    "chipset": "Chipset", "memory_slots_quantity": "Slots RAM",
    "m2_slots": "Slots M.2",
    "form_factor": "Form Factor",
}

STORAGE_DISPLAY_SPECS = {
    "capacity_value": "Capacidad", "bus_type": "Interface",
    "read_speed": "Lectura", "write_speed": "Escritura",
}

PSU_DISPLAY_SPECS = {
    "wattage": "Watts", "certification": "Certificacion", "is_modular": "Modular",
}

CPU_COOLER_DISPLAY_SPECS = {
    "cooler_sockets": "Sockets",
    "height": "Altura (mm)",
}

PC_CASE_DISPLAY_SPECS = {
    "max_motherboard_form_factor": "Form Factor",
    "max_cpu_cooler_height": "Alt. máx. Cooler",
    "max_video_card_length": "Largo máx. GPU",
}

DISPLAY_SPECS = {
    **CPU_DISPLAY_SPECS,
    **GPU_DISPLAY_SPECS,
    **RAM_DISPLAY_SPECS,
    **MOTHERBOARD_DISPLAY_SPECS,
    **STORAGE_DISPLAY_SPECS,
    **PSU_DISPLAY_SPECS,
    **CPU_COOLER_DISPLAY_SPECS,
    **PC_CASE_DISPLAY_SPECS,
}


def deterministic_uuid(namespace: str, name: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"{namespace}:{name}"))


def extract_brand(product_name: str) -> str:
    brand_prefixes = [
        "AMD", "Intel", "NVIDIA", "MSI", "ASUS", "Gigabyte", "ASRock",
        "Corsair", "Kingston", "G.Skill", "Crucial", "A-DATA", "Samsung",
        "Western Digital", "WD", "Seagate", "Seasonic", "EVGA", "Cooler Master",
        "Noctua", "be quiet!", "NZXT", "Lian Li", "Fractal Design", "Thermaltake",
        "DeepCool", "Arctic", "Phanteks", "Antec", "Biostar", "Zotac", "PNY",
        "Palit", "Sparkle", "XPG", "KingSpec", "Hikvision", "Patriot",
        "Team", "Hyte", "Gamemax", "Newgen", "Sama", "XTech", "Thermalright",
        "Snake", "HP", "Dell",
    ]
    for brand in brand_prefixes:
        if product_name.lower().startswith(brand.lower()):
            return brand
    return product_name.split()[0]


ZERO_MEANS_MISSING = {"cinebench_r20_single_score", "cinebench_r20_multi_score"}


def clean_specs(product: dict) -> dict:
    specs = {k: v for k, v in product.items() if k in DISPLAY_SPECS and v is not None}
    
    for key in ZERO_MEANS_MISSING:
        if key in specs and specs[key] == 0:
            del specs[key]
    return specs


def main():
    sync_start_time = datetime.now()
    
    print("SoloTodo Scraper - Components + Store Prices")
    print("=" * 60)
    
    stores = get_stores(limit=None)


    is_azure_mongo = "cosmos.azure.com" in MONGO_HOST if MONGO_HOST else False
    mongo_options = "?tls=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000" if is_azure_mongo else "?authSource=admin"
    mongo_url = (
        f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}"
        f"@{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}{mongo_options}"
    )
    mongo_client = MongoClient(mongo_url)
    mongo_db = mongo_client[MONGO_DB]

    
    ssl_mode = "require" if os.getenv("POSTGRES_SSL") == "true" else "prefer"
    postgres_conn = psycopg2.connect(
        host=POSTGRES_HOST, port=POSTGRES_PORT, database=POSTGRES_DB,
        user=POSTGRES_USER, password=POSTGRES_PASSWORD, sslmode=ssl_mode
    )
    postgres_cursor = postgres_conn.cursor()
    
    try:
        postgres_cursor.execute("ALTER TABLE public.prices ADD COLUMN IF NOT EXISTS vendor_name TEXT;")
        postgres_conn.commit()
    except Exception:
        postgres_conn.rollback()

    brands_cache = {}
    types_cache  = {}
    total_components = 0
    total_prices     = 0

    for type_name, browse_fn, count in CATEGORIES:
        cat_start = datetime.now()
        print(f"\n[{type_name}] fetching catalog...")

        
        if type_name not in types_cache:
            type_id = deterministic_uuid("type", type_name)
            types_cache[type_name] = type_id

            if not mongo_db["component_types"].find_one({"_id": type_id}):
                mongo_db["component_types"].insert_one({"_id": type_id, "name": type_name})

        type_id = types_cache[type_name]

        products = browse_fn(page=1, page_size=count)
        product_ids = list(products.keys())
        print(f"  {len(product_ids)} productos. Pidiendo precios en paralelo ({MAX_WORKERS_PREVENT_RATE_LIMIT} workers)...")

        with ThreadPoolExecutor(max_workers=MAX_WORKERS_PREVENT_RATE_LIMIT) as pool:
            price_map = dict(zip(product_ids, pool.map(get_product_prices, product_ids)))
        
        for solotodo_id, product in products.items():
            name = product.get("name", "")
            if not name:
                continue

            clean_name = name.split("[")[0].split("(")[0].strip()
            brand_name = product.get("brand") or extract_brand(name)

            
            if brand_name not in brands_cache:
                brand_id = deterministic_uuid("brand", brand_name)
                brands_cache[brand_name] = brand_id

                if not mongo_db["brands"].find_one({"_id": brand_id}):
                    mongo_db["brands"].insert_one({"_id": brand_id, "name": brand_name})

            brand_id = brands_cache[brand_name]
            
            comp_id = deterministic_uuid("component", str(solotodo_id))
            now = datetime.now()
            existing = mongo_db["components"].find_one({
                "$or": [
                    {"name_model": clean_name},
                    {"_id": comp_id}
                ]
            }, {"_id": 1})
            if existing:
                comp_id = existing["_id"]
                mongo_db["components"].update_one(
                    {"_id": comp_id},
                    {"$set": {
                        "type_id":      type_id,
                        "brand_id":     brand_id,
                        "specs":        clean_specs(product),
                        "image_url":    product.get("picture_url"),
                        "requirements": {},
                        "updated_at":   now,
                    }},
                )
            else:
                mongo_db["components"].insert_one({
                    "_id":          comp_id,
                    "type_id":      type_id,
                    "brand_id":     brand_id,
                    "name_model":   clean_name,
                    "specs":        clean_specs(product),
                    "image_url":    product.get("picture_url"),
                    "requirements": {},
                    "created_at":   now,
                    "updated_at":   now,
                })

            postgres_cursor.execute(
                "INSERT INTO public.components_mirror (component_id, name_model, type_id, brand_id) "
                "VALUES (%s, %s, %s, %s) "
                "ON CONFLICT (component_id) DO UPDATE SET name_model = EXCLUDED.name_model",
                (comp_id, clean_name, type_id, brand_id),
            )

            store_prices = price_map.get(solotodo_id) or []

            if store_prices:
                seen_stores = set()
                for sp in store_prices:
                    offer_price = sp.get("offer_price")
                    store_id = sp.get("store_id")
                    if not offer_price or not store_id:
                        continue
                    if store_id in seen_stores:
                        continue
                    seen_stores.add(store_id)

                    store_name = stores.get(store_id, f"Store {store_id}")

                    postgres_cursor.execute(
                        "INSERT INTO public.prices "
                        "  (id, component_id, vendor_id, price, vendor_name, recorded_at) "
                        "VALUES (%s, %s, %s, %s, %s, %s) "
                        "ON CONFLICT (id) DO UPDATE SET "
                        "  price       = EXCLUDED.price, "
                        "  vendor_name = EXCLUDED.vendor_name, "
                        "  recorded_at = EXCLUDED.recorded_at",
                        (
                            sp["entity_id"],
                            comp_id,
                            deterministic_uuid("store", str(store_id)),
                            int(offer_price),
                            store_name,
                            datetime.now(),
                        ),
                    )
                    total_prices += 1
            else:
                fallback = int(float(
                    product.get("offer_price") or product.get("normal_price") or 0
                ))
                if fallback > 0:
                    postgres_cursor.execute(
                        "INSERT INTO public.prices "
                        "  (id, component_id, vendor_id, price, vendor_name, recorded_at) "
                        "VALUES (%s, %s, %s, %s, %s, %s) "
                        "ON CONFLICT (id) DO UPDATE SET "
                        "  price       = EXCLUDED.price, "
                        "  vendor_name = EXCLUDED.vendor_name, "
                        "  recorded_at = EXCLUDED.recorded_at",
                        (
                            solotodo_id,
                            comp_id,
                            deterministic_uuid("store", "SoloTodo"),
                            fallback,
                            "SoloTodo",
                            datetime.now(),
                        ),
                    )
                    total_prices += 1

            total_components += 1
        
        postgres_conn.commit()
        cat_elapsed = (datetime.now() - cat_start).total_seconds()
        print(f"  {type_name}: {len(product_ids)} componentes en {cat_elapsed:.1f}s")
    
    print("\nCleaning up sold-out items...")
    postgres_cursor.execute(
        "DELETE FROM public.prices WHERE recorded_at < %s",
        (sync_start_time,)
    )
    removed_prices = postgres_cursor.rowcount
    
    postgres_conn.commit()
    postgres_cursor.close()
    postgres_conn.close()
    mongo_client.close()

    print(f"\n{'='*60}")
    print(f"Components : {total_components}")
    print(f"Prices     : {total_prices}")
    print(f"Brands     : {len(brands_cache)}")
    print(f"Types      : {len(types_cache)}")
    print(f"Sold Out   : {removed_prices} outdated prices removed")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()