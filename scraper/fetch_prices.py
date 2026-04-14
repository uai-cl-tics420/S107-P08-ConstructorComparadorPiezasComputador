#!/usr/bin/env python3
"""
Scrape SoloTodo for real components and prices.
Populates MongoDB (components, brands, component_types) and PostgreSQL (prices).
This ensures all components shown in the app have accurate, real prices.
"""

import sys
import os
import uuid
from datetime import datetime
from pymongo import MongoClient
import psycopg2
import requests
from solotodo import STORES, process_json_response

# MongoDB
MONGO_USER = os.getenv('MONGO_USER', 'admin')
MONGO_PASSWORD = os.getenv('MONGO_PASSWORD', 'mongo123')
MONGO_HOST = os.getenv('MONGO_HOST', 'localhost')
MONGO_PORT = int(os.getenv('MONGO_PORT', 27017))
MONGO_DB = os.getenv('MONGO_DB', 'pc_builder')

# PostgreSQL
PG_HOST = os.getenv('POSTGRES_HOST', 'localhost')
PG_PORT = int(os.getenv('POSTGRES_PORT', 5432))
PG_DB = os.getenv('POSTGRES_DB', 'pc_builder')
PG_USER = os.getenv('POSTGRES_USER', 'postgres')
PG_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'postgres123')

SOLOTODO_VENDOR_ID = '550e8400-e29b-41d4-a716-446655440020'

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


def deterministic_uuid(namespace: str, name: str) -> str:
    """Generate a deterministic UUID from namespace + name so IDs are stable."""
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"{namespace}:{name}"))


def extract_brand(product_name: str) -> str:
    """Extract the brand from a SoloTodo product name."""
    brand_prefixes = [
        'AMD', 'Intel', 'NVIDIA', 'MSI', 'ASUS', 'Gigabyte', 'ASRock',
        'Corsair', 'Kingston', 'G.Skill', 'Crucial', 'A-DATA', 'Samsung',
        'Western Digital', 'WD', 'Seagate', 'Seasonic', 'EVGA', 'Cooler Master',
        'Noctua', 'be quiet!', 'NZXT', 'Lian Li', 'Fractal Design', 'Thermaltake',
        'DeepCool', 'Arctic', 'Phanteks', 'Antec', 'Biostar', 'Zotac', 'PNY',
        'Palit', 'Sparkle', 'XPG', 'KingSpec', 'Hikvision', 'Patriot',
        'Team', 'Hyte', 'Gamemax', 'Newgen', 'Sama', 'XTech',
    ]
    for brand in brand_prefixes:
        if product_name.lower().startswith(brand.lower()):
            return brand
    # Fallback: first word
    return product_name.split()[0]


def browse_category(category_id: int, page_size: int = 10):
    """Browse a SoloTodo category and return processed products."""
    url = f"https://publicapi.solotodo.com/categories/{category_id}/browse/"
    params = [
        ("page_size", page_size),
        ("page", 1),
        *[("stores", s) for s in STORES],
    ]
    resp = requests.get(url, params=params)
    resp.raise_for_status()
    return process_json_response(resp.json())


def main():
    print("SoloTodo Scraper - Populate DB with real components")
    print("=" * 60)

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

    # Clear existing data
    pg_cursor.execute("DELETE FROM public.prices;")
    pg_cursor.execute("DELETE FROM public.components_mirror;")
    pg_conn.commit()
    mongo_db['components'].delete_many({})
    mongo_db['brands'].delete_many({})
    mongo_db['component_types'].delete_many({})
    print("Cleared existing data\n")

    # Track brands and types
    brands_cache = {}   # brand_name -> uuid
    types_cache = {}    # type_name -> uuid

    total_components = 0
    total_prices = 0

    for solotodo_cat_id, type_name, count in CATEGORIES:
        print(f"\n{type_name} (SoloTodo cat={solotodo_cat_id}, fetching {count}):")

        # Ensure component type exists
        if type_name not in types_cache:
            type_id = deterministic_uuid('type', type_name)
            types_cache[type_name] = type_id
            mongo_db['component_types'].insert_one({
                '_id': type_id,
                'name': type_name,
            })

        type_id = types_cache[type_name]

        # Fetch products from SoloTodo
        products = browse_category(solotodo_cat_id, page_size=count)

        for solotodo_id, product in products.items():
            name = product.get('name', '')
            offer_price = product.get('offer_price')
            normal_price = product.get('normal_price')
            price = offer_price or normal_price

            if not price or not name:
                continue

            price = int(float(price))

            # Clean name: remove part numbers in brackets
            clean_name = name.split('[')[0].split('(')[0].strip()

            # Extract and ensure brand exists
            brand_name = extract_brand(name)
            if brand_name not in brands_cache:
                brand_id = deterministic_uuid('brand', brand_name)
                brands_cache[brand_name] = brand_id
                mongo_db['brands'].insert_one({
                    '_id': brand_id,
                    'name': brand_name,
                })
            brand_id = brands_cache[brand_name]

            # Create component in MongoDB
            comp_id = deterministic_uuid('component', str(solotodo_id))
            now = datetime.now()
            mongo_db['components'].insert_one({
                '_id': comp_id,
                'type_id': type_id,
                'brand_id': brand_id,
                'name_model': clean_name,
                'specs': {k: v for k, v in product.items()
                          if k not in ('id', 'name', 'slug', 'picture_url',
                                       'last_updated', 'normal_price', 'offer_price')},
                'requirements': {},
                'created_at': now,
                'updated_at': now,
            })

            # Insert component mirror into PostgreSQL
            pg_cursor.execute(
                "INSERT INTO public.components_mirror (component_id, type_id, brand_id) "
                "VALUES (%s, %s, %s) "
                "ON CONFLICT (component_id) DO NOTHING",
                (comp_id, type_id, brand_id)
            )

            # Insert price into PostgreSQL
            pg_cursor.execute(
                "INSERT INTO public.prices (id, component_id, vendor_id, price, recorded_at) "
                "VALUES (%s, %s, %s, %s, %s) "
                "ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, recorded_at = EXCLUDED.recorded_at",
                (solotodo_id, comp_id, SOLOTODO_VENDOR_ID, price, datetime.now())
            )

            print(f"  {clean_name:<50} ${price:>10,}")
            total_components += 1
            total_prices += 1

    pg_conn.commit()
    pg_conn.close()

    print(f"\n{'='*60}")
    print(f"Components: {total_components}")
    print(f"Prices:     {total_prices}")
    print(f"Brands:     {len(brands_cache)}")
    print(f"Types:      {len(types_cache)}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
