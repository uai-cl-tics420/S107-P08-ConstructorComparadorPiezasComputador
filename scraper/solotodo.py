import re, time, random, requests
from functools import lru_cache

BASE = "https://publicapi.solotodo.com"
SESSION = requests.Session()


MAX_RETRIES = 5
BASE_DELAY  = 0.5
MIN_INTERVAL = 0.1
_last_request = 0

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


CATEGORIES = {
    "cpu": 3, "gpu": 2, "mb": 5, "ram": 7, "psu": 9,
    "cooler": 12, "fans": 87, "case": 10, "storage": 8
}

SKIP = {"id", "unicode", "default_bucket", "total_core_count", "picture"}
NULLS = {"No posee", "no posee", "N/A", ""}

PRIORITY_IDS = {
    int(s) for s in
    "8015|3|8279|7289|4913|128|8378|6365|2570|6101|788|2603|8312|3758|7718|201|398|397|755|31|61|193|7|5705|5639|5903|3164|656|6300|8576|7652|4451|1911|88|1580|172|38|2801|6398|8444|9|8147|326|2735|4484|6662|1217|87|27|281|4287|56|1283|7388|1845|197|4814|8543|8180|199|43|8642|3956|4154|294|6563|23|392|887|260|195|225|8477|3395|3362|37|118|39|5144|2339|6233|257|266|3263|3890|4880|11|8148|34|12|953|6299|5177|2471|18|8510|2009|223|2768|4088|194|7487|293|1877|67|47|86|22|1514|3165|955|1086|8213|2670|2438|6464|6134|4121|176|181|4616|167|3032|8114|173|264|6992|170|231|2636|6|280|789|2141|359|14|45|85|8411|7619"
    .split("|") if s.strip().isdigit()
}

@lru_cache(512)
def is_traversal(k: str) -> bool:
    p = k.split("_")
    return (
        any(p[i] == p[i + 1] for i in range(len(p) - 1)) or
        (len(p) > 1 and p[1] == "family") or
        (len(p) > 2 and p[-1] in {"brand", "step"})
    )

def clean_specs(raw: dict) -> dict:
    groups, plain = {}, {}

    for k, v in raw.items():
        if k in SKIP or k.endswith("_id"): continue
        if k.endswith("_value"): groups.setdefault(k[:-6], {})["v"] = v
        elif k.endswith("_name"): groups.setdefault(k[:-5], {})["n"] = v
        elif k.endswith("_unicode"): groups.setdefault(k[:-8], {})["u"] = v
        else: plain[k] = v

    result = {k: v for k, v in plain.items() if not is_traversal(k)}

    for b, g in groups.items():
        if is_traversal(b) or b in result: continue
        val = g.get("n") or g.get("u") or g.get("v")
        result[b] = None if val in NULLS else val

    return result

def enrich(raw: dict) -> dict:
    out = {}

    find = lambda r, k: re.search(r, str(raw.get(k, "")), re.I)

    if m := find(r"\(([^)]+)\)", "chipset_unicode"):
        out["socket"] = m.group(1)

    if m := find(r"(DDR\d)", "memory_slots_unicode") or find(r"(DDR\d)", "bus_unicode"):
        out["ram_type"] = m.group(1).upper()

    if isinstance(raw.get("capacity_dimm_quantity_value"), (int, float)):
        out["module_count"] = int(raw["capacity_dimm_quantity_value"])

    if f := raw.get("format_name") or raw.get("format_unicode"):
        out["form_factor"] = f

    if isinstance(raw.get("power_value"), (int, float)):
        out["wattage"] = int(raw["power_value"])

    if cf := raw.get("largest_motherboard_format_format_name") or raw.get("largest_motherboard_format_unicode"):
        out["max_motherboard_form_factor"] = cf

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

def _get(url, **params):
    return request("GET", url, params=params).json()

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

def process(data: dict) -> dict:
    out = {}
    for r in data.get("results", []):
        for e in r.get("product_entries", []):
            p = e.get("product", {})
            pid = p.get("id")
            if not pid: continue

            specs = p.get("specs") or {}
            offer, normal = prices(e)

            out[pid] = {
                "name": p.get("name"),
                "slug": p.get("slug"),
                "picture_url": p.get("picture_url"),
                "last_updated": p.get("last_updated"),
                "offer_price": offer,
                "normal_price": normal,
                **clean_specs(specs),
                **enrich(specs),
            }
    return out

def prices(e):
    p = e.get("metadata", {}).get("prices_per_currency")
    if not p: return None, None
    f = p[0]
    return to_float(f.get("offer_price")), to_float(f.get("normal_price"))

def to_float(v):
    try: return float(v)
    except: return None

def get_stores(limit=100):
    data = request("GET", f"{BASE}/stores/").json()
    priority = [s for s in data if s["id"] in PRIORITY_IDS]
    others = [s for s in data if s["id"] not in PRIORITY_IDS]
    selected = (priority + others)[:limit]
    return {s["id"]: s["name"] for s in selected[:limit or None]}

def get_product_prices(pid):
    try:
        data = _get(f"{BASE}/products/available_entities/", ids=pid)
        ents = data.get("results", [{}])[0].get("entities", [])
        return sorted([
            {
                "entity_id": e["id"],
                "store_id": int(e["store"].split("/")[-2]) if e.get("store") else None,
                "offer_price": to_float(e.get("active_registry", {}).get("offer_price")),
            }
            for e in ents
        ], key=lambda x: x["offer_price"] or float("inf"))
    except:
        return []
