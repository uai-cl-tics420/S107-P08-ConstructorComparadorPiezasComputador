import os
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from pymongo import MongoClient
import psycopg2

from solotodo import browse, get_product_prices, CATEGORIES

load_dotenv()

PRICE_WORKERS = 5


def main():
    start = datetime.now()

    mongo = MongoClient(
        f"mongodb://{os.getenv('MONGO_USER')}:{os.getenv('MONGO_PASSWORD')}"
        f"@{os.getenv('MONGO_HOST')}:{os.getenv('MONGO_PORT')}/{os.getenv('MONGO_DB')}?authSource=admin"
    )[os.getenv("MONGO_DB")]

    pg = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST"),
        port=os.getenv("POSTGRES_PORT"),
        database=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
    )
    cur = pg.cursor()

    for name, cid in CATEGORIES.items():
        print(f"\n[{name.upper()}]")

        products = browse(cid, size=200)
        ids = list(products)

        with ThreadPoolExecutor(PRICE_WORKERS) as pool:
            prices = dict(zip(ids, pool.map(get_product_prices, ids)))

        for cid_, p in products.items():

            # ---------------- MONGO UPSERT (DEDUPED) ----------------
            mongo["components"].update_one(
                {"_id": cid_},
                {
                    "$set": {
                        "name_model": p["name_model"],
                        "type_id": p["type_id"],
                        "brand": p.get("brand"),
                        "specs": {k: v for k, v in p.items() if v not in (None, 0)},
                        "updated_at": datetime.now(),
                    },
                    "$setOnInsert": {
                        "created_at": datetime.now(),
                        "requirements": {}
                    }
                },
                upsert=True
            )

            # ---------------- POSTGRES MIRROR ----------------
            cur.execute(
                """INSERT INTO public.components_mirror
                (component_id, name_model, type_id, brand_id, synced_at)
                VALUES (%s,%s,%s,%s,%s)
                ON CONFLICT (component_id) DO UPDATE SET
                    name_model=EXCLUDED.name_model,
                    type_id=EXCLUDED.type_id,
                    brand_id=EXCLUDED.brand_id,
                    synced_at=EXCLUDED.synced_at""",
                (cid_, p["name_model"], p["type_id"], None, datetime.now())
            )

            # ---------------- PRICES ----------------
            for sp in prices.get(cid_, []):
                if not sp["offer_price"]:
                    continue

                cur.execute(
                    """INSERT INTO public.prices
                    (component_id, vendor_id, price, recorded_at)
                    VALUES (%s,%s,%s,%s)
                    ON CONFLICT DO NOTHING""",
                    (
                        cid_,
                        sp["entity_id"],
                        int(sp["offer_price"]),
                        datetime.now()
                    )
                )

        pg.commit()

    cur.close()
    pg.close()
    mongo.client.close()


if __name__ == "__main__":
    main()