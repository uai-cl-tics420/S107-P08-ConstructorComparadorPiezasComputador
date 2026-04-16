#!/usr/bin/env python3
"""
Scrape SoloTodo for real components and prices per store.
Populates MongoDB (components, brands, component_types) and PostgreSQL (prices).
Each component gets multiple prices from different Chilean stores.
"""

import sys
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient
import psycopg2
import requests
from solotodo import STORES, process_json_response

load_dotenv()

# MongoDB
MONGO_USER = os.getenv('MONGO_USER')
MONGO_PASSWORD = os.getenv('MONGO_PASSWORD')
MONGO_HOST = os.getenv('MONGO_HOST')
MONGO_PORT = int(os.getenv('MONGO_PORT'))
MONGO_DB = os.getenv('MONGO_DB')

# PostgreSQL
PG_HOST = os.getenv('POSTGRES_HOST')
PG_PORT = int(os.getenv('POSTGRES_PORT'))
PG_DB = os.getenv('POSTGRES_DB')
PG_USER = os.getenv('POSTGRES_USER')
PG_PASSWORD = os.getenv('POSTGRES_PASSWORD')

# SoloTodo category IDs mapped to our component types
CATEGORIES = [
    (3,  'CPU',         10),
    (2,  'GPU',         10),
    (7,  'RAM',          8),
    (5,  'Motherboard',  8),
    (8,  'Storage',      6),
    (9,  'PSU',          6),
    (10, 'Case',         6),
    (12, 'CPU Cooler',   4),
]

# Spec keys we want to show on cards (human-readable names)
DISPLAY_SPECS = {
    # CPU
    'core_count': 'Cores', 'thread_count': 'Threads', 'tdp': 'TDP (W)',
    'base_clock': 'Base Clock', 'boost_clock': 'Boost Clock',
    'socket': 'Socket', 'gpu': 'GPU Integrada',
    'cinebench_r20_single_score': 'Cinebench R20 (1T)',
    'cinebench_r20_multi_score': 'Cinebench R20 (nT)',
    # GPU
    'gpu_boost_clock': 'Boost Clock', 'vram_quantity': 'VRAM',
    'gpu_tdp': 'TDP (W)', 'bus_width': 'Bus',
    # RAM
    'capacity': 'Capacidad', 'bus_speed': 'Velocidad',
    'ram_type': 'Tipo', 'module_count': 'Modulos',
    # Motherboard
    'chipset': 'Chipset', 'memory_slots_quantity': 'Slots RAM',
    # Storage
    'capacity_value': 'Capacidad', 'bus_type': 'Interface',
    'read_speed': 'Lectura', 'write_speed': 'Escritura',
    # PSU
    'wattage': 'Watts', 'certification': 'Certificacion',
    'is_modular': 'Modular',
    # Case
    'max_motherboard_form_factor': 'Form Factor',
    # General
    'form_factor': 'Form Factor',
}


def deterministic_uuid(namespace: str, name: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"{namespace}:{name}"))


def extract_brand(product_name: str) -> str:
    brand_prefixes = [
        'AMD', 'Intel', 'NVIDIA', 'MSI', 'ASUS', 'Gigabyte', 'ASRock',
        'Corsair', 'Kingston', 'G.Skill', 'Crucial', 'A-DATA', 'Samsung',
        'Western Digital', 'WD', 'Seagate', 'Seasonic', 'EVGA', 'Cooler Master',
        'Noctua', 'be quiet!', 'NZXT', 'Lian Li', 'Fractal Design', 'Thermaltake',
        'DeepCool', 'Arctic', 'Phanteks', 'Antec', 'Biostar', 'Zotac', 'PNY',
        'Palit', 'Sparkle', 'XPG', 'KingSpec', 'Hikvision', 'Patriot',
        'Team', 'Hyte', 'Gamemax', 'Newgen', 'Sama', 'XTech', 'Thermalright',
        'Snake', 'HP', 'Dell',
    ]
    for brand in brand_prefixes:
        if product_name.lower().startswith(brand.lower()):
            return brand
    return product_name.split()[0]


def load_store_map() -> dict:
    """Load all SoloTodo stores and return {store_url: store_name}."""
    resp = requests.get("https://publicapi.solotodo.com/stores/")
    resp.raise_for_status()
    return {s['url']: s['name'] for s in resp.json()}


def get_store_prices(product_id: int, store_map: dict, max_stores: int = 5) -> list:
    """Get per-store prices for a product from SoloTodo entities API."""
    try:
        resp = requests.get(
            f"https://publicapi.solotodo.com/products/{product_id}/entities/",
            timeout=10
        )
        if resp.status_code != 200:
            return []

        entities = resp.json()
        if isinstance(entities, dict):
            entities = entities.get("results", entities)

        prices = []
        for entity in entities:
            ar = entity.get("active_registry") or {}
            offer_price = ar.get("offer_price")
            if not offer_price:
                continue

            store_url = entity.get("store", "")
            store_name = store_map.get(store_url, "Tienda")
            entity_id = entity.get("id", 0)

            prices.append({
                "entity_id": entity_id,
                "store_name": store_name,
                "price": int(float(offer_price)),
            })

        # Sort by price and take the cheapest stores
        prices.sort(key=lambda x: x["price"])
        return prices[:max_stores]

    except Exception as e:
        print(f"    Error getting store prices: {e}", file=sys.stderr)
        return []


def clean_specs(raw_specs: dict) -> dict:
    """Filter specs to only include displayable ones with clean values."""
    cleaned = {}
    for key, value in raw_specs.items():
        if key in DISPLAY_SPECS and value is not None:
            cleaned[key] = value
    return cleaned


def browse_category(category_id: int, page_size: int = 10):
    url = f"https://publicapi.solotodo.com/categories/{category_id}/browse/"
    params = [
        ("page_size", page_size),
        ("page", 1),
        *[("stores", s) for s in STORES],
    ]
    resp = requests.get(url, params=params)
    resp.raise_for_status()

    raw = resp.json()
    processed = process_json_response(raw)
    return processed


def main():
    print("SoloTodo Scraper - Components + Store Prices")
    print("=" * 60)

    # Load store names
    print("Loading store names from SoloTodo...")
    store_map = load_store_map()
    print(f"Loaded {len(store_map)} stores\n")

    # Connect to MongoDB
    mongo_url = f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}@{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}?authSource=admin"
    mongo_client = MongoClient(mongo_url)
    mongo_db = mongo_client[MONGO_DB]

    # Connect to PostgreSQL
    pg_conn = psycopg2.connect(
        host=PG_HOST, port=PG_PORT, database=PG_DB,
        user=PG_USER, password=PG_PASSWORD
    )
    pg_cursor = pg_conn.cursor()

    # Ensure vendor_name column exists
    try:
        pg_cursor.execute("ALTER TABLE public.prices ADD COLUMN IF NOT EXISTS vendor_name TEXT;")
        pg_conn.commit()
    except Exception:
        pg_conn.rollback()

    # Clear existing data
    pg_cursor.execute("DELETE FROM public.prices;")
    pg_cursor.execute("DELETE FROM public.components_mirror;")
    pg_conn.commit()
    mongo_db['components'].delete_many({})
    mongo_db['brands'].delete_many({})
    mongo_db['component_types'].delete_many({})
    print("Cleared existing data\n")

    brands_cache = {}
    types_cache = {}
    total_components = 0
    total_prices = 0

    for solotodo_cat_id, type_name, count in CATEGORIES:
        print(f"\n{type_name} (fetching {count}):")

        if type_name not in types_cache:
            type_id = deterministic_uuid('type', type_name)
            types_cache[type_name] = type_id
            mongo_db['component_types'].insert_one({
                '_id': type_id,
                'name': type_name,
            })

        type_id = types_cache[type_name]
        products = browse_category(solotodo_cat_id, page_size=count)

        for solotodo_id, product in products.items():
            name = product.get('name', '')
            if not name:
                continue

            clean_name = name.split('[')[0].split('(')[0].strip()

            # Extract brand: use API brand if available, fallback to name parsing
            brand_name = product.get('brand') or extract_brand(name)
            if brand_name not in brands_cache:
                brand_id = deterministic_uuid('brand', brand_name)
                brands_cache[brand_name] = brand_id
                mongo_db['brands'].insert_one({
                    '_id': brand_id,
                    'name': brand_name,
                })
            brand_id = brands_cache[brand_name]

            # Clean specs for display
            specs = clean_specs(product)

            comp_id = deterministic_uuid('component', str(solotodo_id))
            now = datetime.now()
            mongo_db['components'].insert_one({
                '_id': comp_id,
                'type_id': type_id,
                'brand_id': brand_id,
                'name_model': clean_name,
                'specs': specs,
                'requirements': {},
                'created_at': now,
                'updated_at': now,
            })

            # Insert component mirror
            pg_cursor.execute(
                "INSERT INTO public.components_mirror (component_id, type_id, brand_id) "
                "VALUES (%s, %s, %s) ON CONFLICT (component_id) DO NOTHING",
                (comp_id, type_id, brand_id)
            )

            # Get per-store prices
            store_prices = get_store_prices(solotodo_id, store_map, max_stores=5)

            if store_prices:
                for sp in store_prices:
                    pg_cursor.execute(
                        "INSERT INTO public.prices (id, component_id, vendor_id, price, vendor_name, recorded_at) "
                        "VALUES (%s, %s, %s, %s, %s, %s) "
                        "ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, vendor_name = EXCLUDED.vendor_name, recorded_at = EXCLUDED.recorded_at",
                        (
                            sp['entity_id'],
                            comp_id,
                            deterministic_uuid('store', sp['store_name']),
                            sp['price'],
                            sp['store_name'],
                            datetime.now(),
                        )
                    )
                    total_prices += 1

                best = store_prices[0]
                print(f"  {clean_name:<45} ${best['price']:>10,} ({best['store_name']}) [{len(store_prices)} tiendas]")
            else:
                # Fallback: use browse price
                fallback_price = int(float(product.get('offer_price') or product.get('normal_price') or 0))
                if fallback_price > 0:
                    pg_cursor.execute(
                        "INSERT INTO public.prices (id, component_id, vendor_id, price, vendor_name, recorded_at) "
                        "VALUES (%s, %s, %s, %s, %s, %s) "
                        "ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, vendor_name = EXCLUDED.vendor_name, recorded_at = EXCLUDED.recorded_at",
                        (
                            solotodo_id,
                            comp_id,
                            deterministic_uuid('store', 'SoloTodo'),
                            fallback_price,
                            'SoloTodo',
                            datetime.now(),
                        )
                    )
                    total_prices += 1
                    print(f"  {clean_name:<45} ${fallback_price:>10,} (SoloTodo) [sin tiendas]")

            total_components += 1

    pg_conn.commit()
    pg_conn.close()

    print(f"\n{'='*60}")
    print(f"Components: {total_components}")
    print(f"Prices:     {total_prices} (multiple stores per component)")
    print(f"Brands:     {len(brands_cache)}")
    print(f"Types:      {len(types_cache)}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
