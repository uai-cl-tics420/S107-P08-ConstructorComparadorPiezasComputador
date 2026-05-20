import os
import sys
import uuid
from datetime import datetime
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

# MongoDB
MONGO_USER     = os.getenv("MONGO_USER")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
MONGO_HOST     = os.getenv("MONGO_HOST")
MONGO_PORT     = int(os.getenv("MONGO_PORT"))
MONGO_DB       = os.getenv("MONGO_DB")

# PostgreSQL
PG_HOST     = os.getenv("POSTGRES_HOST")
PG_PORT     = int(os.getenv("POSTGRES_PORT"))
PG_DB       = os.getenv("POSTGRES_DB")
PG_USER     = os.getenv("POSTGRES_USER")
PG_PASSWORD = os.getenv("POSTGRES_PASSWORD")

CATEGORIES = [
    ("CPU",         browse_cpus,         200),
    ("GPU",         browse_gpus,         200),
    ("RAM",         browse_ram,          200),
    ("Motherboard", browse_motherboards, 200),
    ("PSU",         browse_psu,          200),
    ("Case",        browse_pc_cases,     200),
    ("CPU Cooler",  browse_cpu_coolers,  200),
    ("Fans",        browse_fans,         200),
    ("Storage",     browse_storage,      200),
]

DISPLAY_SPECS = {
    # CPU
    "core_count": "Cores", "thread_count": "Threads", "tdp": "TDP (W)",
    "base_clock": "Base Clock", "boost_clock": "Boost Clock",
    "socket": "Socket", "gpu": "GPU Integrada",
    "cinebench_r20_single_score": "Cinebench R20 (1T)",
    "cinebench_r20_multi_score": "Cinebench R20 (nT)",
    # GPU
    "gpu_boost_clock": "Boost Clock", "vram_quantity": "VRAM",
    "gpu_tdp": "TDP (W)", "bus_width": "Bus",
    # RAM
    "capacity": "Capacidad", "bus_speed": "Velocidad",
    "ram_type": "Tipo", "module_count": "Modulos",
    # Motherboard
    "chipset": "Chipset", "memory_slots_quantity": "Slots RAM",
    # Storage
    "capacity_value": "Capacidad", "bus_type": "Interface",
    "read_speed": "Lectura", "write_speed": "Escritura",
    # PSU
    "wattage": "Watts", "certification": "Certificacion", "is_modular": "Modular",
    # Case
    "max_motherboard_form_factor": "Form Factor",
    # General
    "form_factor": "Form Factor",
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


def clean_specs(product: dict) -> dict:
    return {k: v for k, v in product.items() if k in DISPLAY_SPECS and v is not None}


def clear_database(mongo_db, pg_cursor, pg_conn):
    """Clears existing components, prices, brands, and types from the databases."""
    pg_cursor.execute("DELETE FROM public.prices;")
    pg_cursor.execute("DELETE FROM public.components_mirror;")
    pg_conn.commit()
    mongo_db["components"].delete_many({})
    mongo_db["brands"].delete_many({})
    mongo_db["component_types"].delete_many({})
    print("Cleared existing data from both databases.\n")


def main():
    sync_start_time = datetime.now()
    
    print("SoloTodo Scraper - Components + Store Prices")
    print("=" * 60)

    # Fetch store info
    stores = get_stores()

    # Connect to MongoDB
    mongo_url = (
        f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}"
        f"@{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}?authSource=admin"
    )
    mongo_client = MongoClient(mongo_url)
    mongo_db = mongo_client[MONGO_DB]

    # Connect to PostgreSQL
    pg_conn = psycopg2.connect(
        host=PG_HOST, port=PG_PORT, database=PG_DB,
        user=PG_USER, password=PG_PASSWORD,
    )
    pg_cursor = pg_conn.cursor()

    # Ensure vendor_name column exists
    try:
        pg_cursor.execute("ALTER TABLE public.prices ADD COLUMN IF NOT EXISTS vendor_name TEXT;")
        pg_conn.commit()
    except Exception:
        pg_conn.rollback()

    # Option to clear existing data via command line arg
    if "--clear" in sys.argv:
        clear_database(mongo_db, pg_cursor, pg_conn)
    else:
        print("Appending to existing data (use --clear to flush databases).\n")

    brands_cache = {}
    types_cache  = {}
    total_components = 0
    total_prices     = 0

    for type_name, browse_fn, count in CATEGORIES:
        print(f"\n[{type_name}]")

        # Upsert component type into Mongo
        if type_name not in types_cache:
            type_id = deterministic_uuid("type", type_name)
            types_cache[type_name] = type_id
            
            if not mongo_db["component_types"].find_one({"_id": type_id}):
                mongo_db["component_types"].insert_one({"_id": type_id, "name": type_name})
                
        type_id = types_cache[type_name]

        products = browse_fn(page=1, page_size=count)

        for solotodo_id, product in products.items():
            name = product.get("name", "")
            if not name:
                continue

            clean_name = name.split("[")[0].split("(")[0].strip()
            brand_name = product.get("brand") or extract_brand(name)

            # Upsert brand into Mongo
            if brand_name not in brands_cache:
                brand_id = deterministic_uuid("brand", brand_name)
                brands_cache[brand_name] = brand_id
                
                if not mongo_db["brands"].find_one({"_id": brand_id}):
                    mongo_db["brands"].insert_one({"_id": brand_id, "name": brand_name})
                    
            brand_id = brands_cache[brand_name]

            # Upsert component into Mongo keyed on name_model (has unique index)
            comp_id = deterministic_uuid("component", str(solotodo_id))
            now = datetime.now()
            existing = mongo_db["components"].find_one({"name_model": clean_name}, {"_id": 1})
            if existing:
                comp_id = existing["_id"]  # reuse existing _id to keep FK consistency
                mongo_db["components"].update_one(
                    {"_id": comp_id},
                    {"$set": {
                        "type_id":      type_id,
                        "brand_id":     brand_id,
                        "specs":        clean_specs(product),
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
                    "requirements": {},
                    "created_at":   now,
                    "updated_at":   now,
                })

            # Mirror component into PostgreSQL
            pg_cursor.execute(
                "INSERT INTO public.components_mirror (component_id, type_id, brand_id) "
                "VALUES (%s, %s, %s) ON CONFLICT (component_id) DO NOTHING",
                (comp_id, type_id, brand_id),
            )

            # Fetch per-store prices via solotodo.get_product_prices
            store_prices = get_product_prices(solotodo_id)

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
                    
                    pg_cursor.execute(
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

                best = store_prices[0]
                best_store_name = stores.get(best.get("store_id"), "?")
                print(
                    f"  {clean_name:<45} "
                    f"${best['offer_price']:>10,.0f} "
                    f"({best_store_name}) "
                    f"[{len(seen_stores)} tiendas]"
                )
            else:
                # Fallback: use the browse-level price
                fallback = int(float(
                    product.get("offer_price") or product.get("normal_price") or 0
                ))
                if fallback > 0:
                    pg_cursor.execute(
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
                    print(f"  {clean_name:<45} ${fallback:>10,} (SoloTodo) [sin tiendas]")
                else:
                    print(f"  {clean_name:<45}    sin precio")

            total_components += 1
            pg_conn.commit() # Commit instantly after processing each individual component

    # Cleanup any prices that weren't updated in this scraping run
    print("\nCleaning up sold-out items...")
    pg_cursor.execute(
        "DELETE FROM public.prices WHERE recorded_at < %s",
        (sync_start_time,)
    )
    removed_prices = pg_cursor.rowcount
    
    pg_conn.commit()
    pg_cursor.close()
    pg_conn.close()
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