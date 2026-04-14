#!/usr/bin/env python3
"""
Fetch component prices from SoloTodo API and insert into PostgreSQL.
Maps SoloTodo product names to MongoDB component IDs and stores prices.
"""

import sys
import os
from datetime import datetime
from difflib import SequenceMatcher
from pymongo import MongoClient
import psycopg2
from psycopg2.extras import execute_values
from solotodo import (
    browse_cpus, browse_ram, browse_motherboards, browse_gpus,
    browse_psus, browse_cpu_coolers, browse_fans, browse_pc_cases,
    process_json_response
)

# MongoDB connection params
MONGO_USER = os.getenv('MONGO_USER', 'admin')
MONGO_PASSWORD = os.getenv('MONGO_PASSWORD', 'mongo123')
MONGO_HOST = os.getenv('MONGO_HOST', 'localhost')
MONGO_PORT = int(os.getenv('MONGO_PORT', 27017))
MONGO_DB = os.getenv('MONGO_DB', 'pc_builder')

# PostgreSQL connection params
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_PORT = int(os.getenv('POSTGRES_PORT', 5432))
POSTGRES_DB = os.getenv('POSTGRES_DB', 'pc_builder')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'postgres123')

# SoloTodo vendor ID for Chile
SOLOTODO_VENDOR_ID = '550e8400-e29b-41d4-a716-446655440020'

# Cache for MongoDB components
_mongo_components_cache = None


def get_mongodb_connection():
    """Create MongoDB connection with auth."""
    mongo_url = f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}@{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}?authSource=admin"
    client = MongoClient(mongo_url)
    return client[MONGO_DB]


def get_postgres_connection():
    """Create PostgreSQL connection."""
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD
    )


def load_mongodb_components():
    """Load all components from MongoDB into memory for matching."""
    global _mongo_components_cache
    if _mongo_components_cache is not None:
        return _mongo_components_cache

    try:
        db = get_mongodb_connection()
        components = list(db['components'].find({}))
        _mongo_components_cache = {c['_id']: c for c in components}
        print(f"Loaded {len(components)} components from MongoDB")
        return _mongo_components_cache
    except Exception as e:
        print(f"Error loading MongoDB components: {e}", file=sys.stderr)
        return {}


def similarity_ratio(a: str, b: str) -> float:
    """Calculate string similarity ratio (0-1)."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def find_matching_component(product_name: str) -> str | None:
    """
    Find MongoDB component ID that matches the SoloTodo product name.
    Uses fuzzy string matching.
    Returns component UUID or None if no good match found.
    """
    components = _mongo_components_cache
    if not components:
        return None

    # Extract the base name (remove part numbers like [100-100000593WOF])
    base_name = product_name.split('[')[0].strip()

    best_match = None
    best_ratio = 0.65  # Require at least 65% similarity

    for component_id, component in components.items():
        component_name = component.get('name_model', '')
        ratio = similarity_ratio(base_name, component_name)

        if ratio > best_ratio:
            best_ratio = ratio
            best_match = component_id

    return best_match


def insert_prices_batch(cursor, product_data: dict) -> int:
    """
    Insert price records into PostgreSQL prices table.
    Returns number of records inserted.
    """
    inserted = 0
    prices_to_insert = []

    for product_id, product_info in product_data.items():
        product_name = product_info.get('name', '')
        normal_price = product_info.get('normal_price')
        offer_price = product_info.get('offer_price')

        # Skip if no price data
        if not (normal_price or offer_price):
            continue

        # Find matching MongoDB component
        component_id = find_matching_component(product_name)
        if not component_id:
            continue

        # Use offer_price if available, else normal_price
        price = int(offer_price or normal_price)

        print(f"  {product_name[:45]}... -> CLP ${price:,.0f}")

        # Prepare for batch insert
        prices_to_insert.append((
            product_id,  # id
            component_id,  # component_id
            SOLOTODO_VENDOR_ID,  # vendor_id
            price,  # price
            datetime.now(),  # recorded_at
        ))

        inserted += 1

    # Batch insert into PostgreSQL
    if prices_to_insert:
        try:
            execute_values(
                cursor,
                "INSERT INTO public.prices (id, component_id, vendor_id, price, recorded_at) "
                "VALUES %s "
                "ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, recorded_at = EXCLUDED.recorded_at",
                prices_to_insert,
                page_size=100
            )
            print(f"  -> Inserted {len(prices_to_insert)} records")
        except Exception as e:
            print(f"  Error inserting prices: {e}", file=sys.stderr)

    return inserted


def fetch_and_insert_category(cursor, browse_func, category_name: str) -> int:
    """
    Fetch products from multiple pages of a category and insert prices.
    Returns count of prices inserted.
    """
    print(f"\n{category_name}:")

    total_inserted = 0
    all_product_data = {}

    # Fetch multiple pages
    for page in range(1, 4):  # Fetch pages 1-3
        try:
            response = browse_func(page=page, page_size=20)
            product_data = process_json_response(response)
            all_product_data.update(product_data)
            print(f"  Page {page}: {len(product_data)} products")
        except Exception as e:
            print(f"  Error fetching page {page}: {e}")
            break

        if not product_data:
            break  # No more products

    # Insert all products from all pages
    product_data = all_product_data

    # Insert into database
    inserted = insert_prices_batch(cursor, product_data)

    return inserted


def main():
    """Main entry point for the price scraper."""

    print("SoloTodo Price Scraper")
    print("=" * 60)

    # Load MongoDB components first
    load_mongodb_components()

    # Connect to PostgreSQL
    pg_conn = None
    try:
        pg_conn = get_postgres_connection()
        cursor = pg_conn.cursor()
        print("Connected to PostgreSQL")

        total_inserted = 0

        # Fetch each component category
        categories = [
            (browse_cpus, "CPUs"),
            (browse_ram, "RAM"),
            (browse_motherboards, "Motherboards"),
            (browse_gpus, "GPUs"),
            (browse_psus, "Power Supplies"),
            (browse_cpu_coolers, "CPU Coolers"),
            (browse_fans, "Fans"),
            (browse_pc_cases, "PC Cases"),
        ]

        for browse_func, category_name in categories:
            count = fetch_and_insert_category(cursor, browse_func, category_name)
            total_inserted += count

        # Commit all changes
        pg_conn.commit()

        print(f"\n{'='*60}")
        print(f"Total prices synced: {total_inserted}/160 products")
        print(f"{'='*60}")

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        if pg_conn:
            pg_conn.rollback()
        sys.exit(1)
    finally:
        if pg_conn:
            pg_conn.close()


if __name__ == '__main__':
    main()
