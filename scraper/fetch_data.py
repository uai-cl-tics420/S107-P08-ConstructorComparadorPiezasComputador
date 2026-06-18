import os, uuid
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from pymongo import MongoClient
import psycopg2

from solotodo import browse, get_product_prices, get_stores, CATEGORIES

load_dotenv()

PRICE_WORKERS = 5

def uid(ns, name):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"{ns}:{name}"))


def extract_brand(name):
    return name.split()[0]


def clean_specs(p):
    return {k: v for k, v in p.items() if v not in (None, 0)}


def main():
    start = datetime.now()
    stores = get_stores(None)

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

    brands, types = {}, {}

    for name, cid in CATEGORIES.items():
        print(f"\n[{name.upper()}]")

        type_id = types.setdefault(name, uid("type", name))

        products = browse(cid, size=200)
        ids = list(products)

        with ThreadPoolExecutor(PRICE_WORKERS) as pool:
            prices = dict(zip(ids, pool.map(get_product_prices, ids)))

        for pid, p in products.items():
            n = (p.get("name") or "").split("[")[0].split("(")[0].strip()
            if not n: continue

            b = p.get("brand") or extract_brand(n)
            bid = brands.setdefault(b, uid("brand", b))
            cid_ = uid("component", str(pid))

            mongo["components"].update_one(
                {"_id": cid_},
                {"$set": {
                    "name_model": n,
                    "brand_id": bid,
                    "type_id": type_id,
                    "specs": clean_specs(p),
                    "updated_at": datetime.now(),
                }},
                upsert=True
            )

            for sp in prices.get(pid, []):
                if not sp["offer_price"]: continue

                cur.execute(
                    """INSERT INTO public.prices
                    (id, component_id, vendor_id, price, vendor_name, recorded_at)
                    VALUES (%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (id) DO UPDATE SET price=EXCLUDED.price""",
                    (
                        sp["entity_id"],
                        cid_,
                        uid("store", str(sp["store_id"])),
                        int(sp["offer_price"]),
                        stores.get(sp["store_id"], "Unknown"),
                        datetime.now()
                    )
                )

        pg.commit()

    cur.execute("DELETE FROM public.prices WHERE recorded_at < %s", (start,))
    pg.commit()

    cur.close()
    pg.close()
    mongo.client.close()
