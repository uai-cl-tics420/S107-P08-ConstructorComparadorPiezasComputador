from pymongo import MongoClient
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
import os
import sys

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


def get_mongodb_connection():
    """Create MongoDB connection with auth."""
    mongo_url = f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}@{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}?authSource=admin"
    client = MongoClient(mongo_url)
    return client[MONGO_DB]


def get_postgres_connection():
    """Create PostgreSQL connection."""
    return psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        database=PG_DB,
        user=PG_USER,
        password=PG_PASSWORD
    )


def main():
    """Main entry point."""

    print("Syncing MongoDB components to PostgreSQL components_mirror")
    print("=" * 60)

    # Connect to MongoDB
    try:
        mongo_db = get_mongodb_connection()
        components = list(mongo_db['components'].find({}))
        print(f"Loaded {len(components)} components from MongoDB")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}", file=sys.stderr)
        sys.exit(1)

    # Connect to PostgreSQL
    pg_conn = None
    try:
        pg_conn = get_postgres_connection()
        cursor = pg_conn.cursor()
        print("Connected to PostgreSQL")

        # Prepare data for batch insert
        mirror_data = []
        for component in components:
            mirror_data.append((
                component['_id'],  # component_id (UUID string from MongoDB)
                component['type_id'],  # type_id
                component.get('brand_id'),  # brand_id (may be null)
            ))

        # Insert into components_mirror
        execute_values(
            cursor,
            "INSERT INTO public.components_mirror (component_id, type_id, brand_id) "
            "VALUES %s "
            "ON CONFLICT (component_id) DO UPDATE SET type_id = EXCLUDED.type_id, brand_id = EXCLUDED.brand_id",
            mirror_data,
            page_size=100
        )

        pg_conn.commit()
        print(f"Synced {len(mirror_data)} components to components_mirror")

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        if pg_conn:
            pg_conn.rollback()
        sys.exit(1)
    finally:
        if pg_conn:
            pg_conn.close()

    print("=" * 60)
    print("Done!")


if __name__ == '__main__':
    main()
