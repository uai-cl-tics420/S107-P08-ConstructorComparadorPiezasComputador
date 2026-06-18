import re, time, random, requests, hashlib
from functools import lru_cache
from uuid import uuid5, NAMESPACE_URL

BASE = "https://publicapi.solotodo.com"
SESSION = requests.Session()

MAX_RETRIES = 5
BASE_DELAY = 0.5
MIN_INTERVAL = 0.12
_last_request = 0


CATEGORIES = {
    "cpu": 3, "gpu": 2, "mb": 5, "ram": 7, "psu": 9,
    "cooler": 12, "fans": 87, "case": 10, "storage": 8
}

SKIP = {"id", "unicode", "default_bucket", "total_core_count", "picture"}
NULLS = {"No posee", "no posee", "N/A", ""}


# ---------------- RATE LIMIT ----------------
def _throttle():
    global _last_request
    now = time.time()
    if (d := now - _last_request) < MIN_INTERVAL:
        time.sleep(MIN_INTERVAL - d)
    _last_request = time.time()


def request(method, url, **kwargs):
    for i in range(MAX_RETRIES):
        try:
            _throttle()
            r = SESSION.request(method, url, **kwargs)

            if r.status_code == 429:
                raise requests.exceptions.RequestException("rate limit")

            r.raise_for_status()
            return r

        except requests.exceptions.RequestException:
            if i == MAX_RETRIES - 1:
                raise
            time.sleep(BASE_DELAY * (2 ** i) + random.uniform(0, 0.3))


def _get(url, **params):
    return request("GET", url, params=params).json()


# ---------------- DEDUP ID ----------------
def component_id(type_id: str, name: str) -> str:
    key = f"{type_id}:{name.strip().lower()}"
    return str(uuid5(NAMESPACE_URL, key))


# ---------------- CLEANING ----------------
@lru_cache(512)
def is_traversal(k: str):
    p = k.split("_")
    return (
        any(p[i] == p[i + 1] for i in range(len(p) - 1)) or
        (len(p) > 1 and p[1] == "family") or
        (len(p) > 2 and p[-1] in {"brand", "step"})
    )


def clean_specs(raw):
    groups, plain = {}, {}

    for k, v in raw.items():
        if k in SKIP or k.endswith("_id"):
            continue
        if k.endswith("_value"):
            groups.setdefault(k[:-6], {})["v"] = v
        elif k.endswith("_name"):
            groups.setdefault(k[:-5], {})["n"] = v
        elif k.endswith("_unicode"):
            groups.setdefault(k[:-8], {})["u"] = v
        else:
            plain[k] = v

    res = {k: v for k, v in plain.items() if not is_traversal(k)}

    for b, g in groups.items():
        if is_traversal(b) or b in res:
            continue
        val = g.get("n") or g.get("u") or g.get("v")
        res[b] = None if val in NULLS else val

    return res


def enrich(raw):
    out = {}

    if m := re.search(r"\(([^)]+)\)", str(raw.get("chipset_unicode", ""))):
        out["socket"] = m.group(1)

    if m := re.search(r"(DDR\d)", str(raw.get("memory_slots_unicode") or raw.get("bus_unicode")), re.I):
        out["ram_type"] = m.group(1).upper()

    if isinstance(raw.get("capacity_dimm_quantity_value"), (int, float)):
        out["module_count"] = int(raw["capacity_dimm_quantity_value"])

    if f := raw.get("format_name") or raw.get("format_unicode"):
        out["form_factor"] = f

    if isinstance(raw.get("power_value"), (int, float)):
        out["wattage"] = int(raw["power_value"])

    if isinstance(gs := raw.get("grouped_sockets"), list):
        out["cooler_sockets"] = [
            s.get("socket_name") or s.get("unicode")
            for g in gs if isinstance(g, dict)
            for s in g.get("sockets", []) if isinstance(s, dict)
        ]

    if bu := raw.get("bus_unicode"):
        if bu not in NULLS:
            out["bus_type"] = str(bu)
        if re.search(r"nvme|m\.2", str(bu), re.I):
            out["is_nvme"] = True

    if isinstance(sp := raw.get("storage_ports"), list):
        out["m2_slots"] = sum(
            int(p.get("quantity", 1))
            for p in sp if isinstance(p, dict)
            and ("m.2" in str(p.get("unicode", "")).lower()
                 or "nvme" in str(p.get("unicode", "")).lower())
        ) or None

    return {k: v for k, v in out.items() if v}


# ---------------- API ----------------
def browse(category, page=1, size=10, refurbished=False):
    stores = list(get_stores().keys())

    params = [
        ("exclude_refurbished", str(refurbished).lower()),
        ("page", page),
        ("page_size", size),
        *[("stores", s) for s in stores]
    ]

    data = request("GET", f"{BASE}/categories/{category}/browse/", params=params).json()
    return process(data)


def process(data):
    out = {}

    for r in data.get("results", []):
        for e in r.get("product_entries", []):
            p = e.get("product", {})
            pid = p.get("id")
            if not pid:
                continue

            specs = p.get("specs") or {}
            offer, normal = prices(e)

            name = (p.get("name") or "").split("[")[0].split("(")[0].strip()
            if not name:
                continue

            type_id = str(p.get("type_id") or "unknown")

            cid = component_id(type_id, name)

            out[cid] = {
                "component_id": cid,
                "name_model": name,
                "type_id": type_id,
                "brand": p.get("brand"),
                "offer_price": offer,
                "normal_price": normal,
                **clean_specs(specs),
                **enrich(specs),
            }

    return out


def prices(e):
    p = e.get("metadata", {}).get("prices_per_currency")
    if not p:
        return None, None
    f = p[0]
    return _float(f.get("offer_price")), _float(f.get("normal_price"))


def _float(v):
    try:
        return float(v)
    except:
        return None


def get_stores(limit=100):
    data = request("GET", f"{BASE}/stores/").json()
    return {s["id"]: s["name"] for s in data[:limit or None]}


def get_product_prices(pid):
    try:
        data = _get(f"{BASE}/products/available_entities/", ids=pid)
        ents = data.get("results", [{}])[0].get("entities", [])

        return sorted([
            {
                "entity_id": e["id"],
                "store_id": int(e["store"].split("/")[-2]) if e.get("store") else None,
                "offer_price": _float(e.get("active_registry", {}).get("offer_price")),
            }
            for e in ents
        ], key=lambda x: x["offer_price"] or float("inf"))

    except:
        return []