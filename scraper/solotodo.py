import re
import requests
from functools import lru_cache

CATEGORY_CPU        = 3
CATEGORY_GPU        = 2
CATEGORY_MB         = 5
CATEGORY_RAM        = 7
CATEGORY_PSU        = 9
CATEGORY_CPU_COOLER = 12
CATEGORY_FANS       = 87
CATEGORY_PC_CASE    = 10
CATEGORY_STORAGE    = 8

_SKIP_SPEC_KEYS = frozenset({"id", "unicode", "default_bucket", "total_core_count", "picture"})
_NULL_STRINGS   = frozenset({"No posee", "no posee", "N/A", ""})

_BASE    = "https://publicapi.solotodo.com"
_SESSION = requests.Session()


@lru_cache(maxsize=512)
def _is_traversal(base: str) -> bool:
    parts = base.split("_")
    for i in range(len(parts) - 1):
        if parts[i] == parts[i + 1]:
            return True
    if len(parts) >= 2 and parts[1] == "family":
        return True
    if len(parts) >= 3 and parts[-1] in ("brand", "step"):
        return True
    return False


def _clean_specs(raw_specs: dict) -> dict:
    groups: dict[str, dict] = {}
    plain:  dict[str, object] = {}

    for k, v in raw_specs.items():
        if k in _SKIP_SPEC_KEYS or k.endswith("_id"):
            continue
        if k.endswith("_value"):
            groups.setdefault(k[:-6], {})["value"] = v
        elif k.endswith("_name"):
            groups.setdefault(k[:-5], {})["name"] = v
        elif k.endswith("_unicode"):
            groups.setdefault(k[:-8], {})["unicode"] = v
        else:
            plain[k] = v

    redundant_summaries = {
        base
        for base, variants in groups.items()
        if tuple(variants) == ("unicode",) and (base + "_quantity") in groups
    }

    result: dict[str, object] = {}

    for k, v in plain.items():
        if not _is_traversal(k):
            result[k] = v

    for base, variants in groups.items():
        if _is_traversal(base) or base in redundant_summaries or base in result:
            continue
        
        
        name = variants.get("name") or variants.get("unicode")
        val  = variants.get("value")
        v    = name if name else val
        result[base] = None if v in _NULL_STRINGS else v

    return result


def _extract_motherboard_socket(raw: dict) -> str | None:
    for key in ("chipset_unicode", "chipset_northbridge_unicode"):
        match = re.search(r"\(([^)]+)\)", str(raw.get(key) or ""))
        if match:
            return match.group(1).strip()
    return None

def _extract_ram_type(raw: dict) -> str | None:
    for key in ("memory_slots_unicode", "bus_unicode"):
        match = re.search(r"(DDR\d)", str(raw.get(key) or ""), re.IGNORECASE)
        if match:
            return match.group(1).upper()
    return None

def _extract_ram_module_count(raw: dict) -> int | None:
    module_count = raw.get("capacity_dimm_quantity_value")
    if isinstance(module_count, (int, float)):
        return int(module_count)
    return None

def _extract_motherboard_form_factor(raw: dict) -> str | None:
    return raw.get("format_name") or raw.get("format_unicode")

def _extract_psu_wattage(raw: dict) -> int | None:
    wattage = raw.get("power_value")
    if isinstance(wattage, (int, float)):
        return int(wattage)
    return None

def _extract_case_max_motherboard_form_factor(raw: dict) -> str | None:
    return raw.get("largest_motherboard_format_format_name") or raw.get("largest_motherboard_format_unicode")

def _extract_cooler_supported_sockets(raw: dict) -> list[str] | None:
    grouped_sockets = raw.get("grouped_sockets")
    if isinstance(grouped_sockets, list):
        names: list[str] = []
        for group in grouped_sockets:
            if not isinstance(group, dict):
                continue
            for socket_obj in group.get("sockets") or []:
                if isinstance(socket_obj, dict):
                    name = socket_obj.get("socket_name") or socket_obj.get("unicode")
                    if name:
                        names.append(str(name))
        if names:
            return names
    return None

def _extract_storage_interface_type(raw: dict) -> str | None:
    bus_unicode = raw.get("bus_unicode")
    if bus_unicode and str(bus_unicode) not in ("", "No posee"):
        return str(bus_unicode)
    return None

def _extract_is_nvme(raw: dict) -> bool:
    return bool(re.search(r"nvme|m\.2", str(raw.get("bus_unicode") or ""), re.IGNORECASE))

def _extract_m2_slots_count(raw: dict) -> int | None:
    storage_ports = raw.get("storage_ports")
    if isinstance(storage_ports, list):
        m2_count = 0
        for port in storage_ports:
            if not isinstance(port, dict):
                continue
            description = str(port.get("unicode") or port.get("name") or "").lower()
            quantity = port.get("quantity")
            if "m.2" in description or "nvme" in description:
                m2_count += int(quantity) if isinstance(quantity, (int, float)) and quantity > 0 else 1
        if m2_count > 0:
            return m2_count
    return None

def _enrich_compat_specs(raw: dict) -> dict:
    out: dict[str, object] = {}

    if socket := _extract_motherboard_socket(raw):
        out["socket"] = socket

    if ram_type := _extract_ram_type(raw):
        out["ram_type"] = ram_type

    if module_count := _extract_ram_module_count(raw):
        out["module_count"] = module_count

    if form_factor := _extract_motherboard_form_factor(raw):
        out["form_factor"] = form_factor

    if wattage := _extract_psu_wattage(raw):
        out["wattage"] = wattage

    if max_motherboard_form_factor := _extract_case_max_motherboard_form_factor(raw):
        out["max_motherboard_form_factor"] = max_motherboard_form_factor

    if cooler_sockets := _extract_cooler_supported_sockets(raw):
        out["cooler_sockets"] = cooler_sockets

    if bus_type := _extract_storage_interface_type(raw):
        out["bus_type"] = bus_type

    if _extract_is_nvme(raw):
        out["is_nvme"] = True

    if m2_slots := _extract_m2_slots_count(raw):
        out["m2_slots"] = m2_slots

    return out


def _to_float(value) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _clp_prices(product_entry: dict) -> tuple[float | None, float | None]:
    prices = product_entry.get("metadata", {}).get("prices_per_currency")
    if not prices:
        return None, None
    first = prices[0]
    return _to_float(first.get("offer_price")), _to_float(first.get("normal_price"))


def _get(url: str, **params) -> dict:
    response = _SESSION.get(url, params=params)
    response.raise_for_status()
    return response.json()


def browse_category(
    category_id = CATEGORY_CPU,
    page: int    = 1,
    page_size: int = 10,
    exclude_refurbished: bool = True,
) -> dict:
    url = f"{_BASE}/categories/{category_id}/browse/"
    store_ids = list(get_stores().keys())
    params = [
        ("exclude_refurbished", str(exclude_refurbished).lower()),
        ("page", page),
        ("page_size", page_size),
    ] + [("stores", s) for s in store_ids]
    response = _SESSION.get(url, params=params)
    response.raise_for_status()
    return process_json_response(response.json())


def browse_cpus        (page=1, page_size=200, **kw): return browse_category(CATEGORY_CPU,        page, page_size, **kw)
def browse_ram         (page=1, page_size=200, **kw): return browse_category(CATEGORY_RAM,        page, page_size, **kw)
def browse_motherboards(page=1, page_size=200, **kw): return browse_category(CATEGORY_MB,         page, page_size, **kw)
def browse_gpus        (page=1, page_size=200, **kw): return browse_category(CATEGORY_GPU,        page, page_size, **kw)
def browse_psu         (page=1, page_size=200, **kw): return browse_category(CATEGORY_PSU,        page, page_size, **kw)
def browse_cpu_coolers (page=1, page_size=200, **kw): return browse_category(CATEGORY_CPU_COOLER, page, page_size, **kw)
def browse_fans        (page=1, page_size=200, **kw): return browse_category(CATEGORY_FANS,       page, page_size, **kw)
def browse_pc_cases    (page=1, page_size=200, **kw): return browse_category(CATEGORY_PC_CASE,    page, page_size, **kw)
def browse_storage     (page=1, page_size=200, **kw): return browse_category(CATEGORY_STORAGE,    page, page_size, **kw)


def process_json_response(json_response: dict) -> dict:
    results = {}
    for entry in json_response.get("results", []):
        for product_entry in entry.get("product_entries", []):
            product = product_entry.get("product", {})
            product_id = product.get("id")
            if product_id is None:
                continue
            offer_price, normal_price = _clp_prices(product_entry)
            results[product_id] = {
                "name":         product.get("name"),
                "slug":         product.get("slug"),
                "picture_url":  product.get("picture_url"),
                "last_updated": product.get("last_updated"),
                "normal_price": normal_price,
                "offer_price":  offer_price,
                **_clean_specs(product.get("specs") or {}),
                **_enrich_compat_specs(product.get("specs") or {}),
            }
    return results


def get_store_info  (store_id):   return _get(f"{_BASE}/stores/{store_id}/")
def get_product_info(product_id): return _get(f"{_BASE}/products/{product_id}/")

def process_product_prices(entities: list) -> list[dict]:
    results = []
    for entity in entities:
        registry = entity.get("active_registry", {})
        store_url = entity.get("store", "")
        store_id = int(store_url.rstrip("/").rsplit("/", 1)[-1]) if store_url else None

        results.append({
            "entity_id":    entity.get("id"),
            "store_id":     store_id,
            "store_url":    store_url,
            "name":         entity.get("name"),
            "sku":          entity.get("sku"),
            "external_url": entity.get("external_url"),
            "condition":    entity.get("condition"),
            "is_visible":   entity.get("is_visible"),
            "normal_price": _to_float(registry.get("normal_price")),
            "offer_price":  _to_float(registry.get("offer_price")),
            "is_available": registry.get("is_available"),
            "last_updated": registry.get("timestamp"),
            "picture_urls": entity.get("picture_urls", []),
            "best_coupon":  entity.get("best_coupon"),
        })

    results.sort(key=lambda x: x["offer_price"] or float("inf"))
    return results


def get_product_prices(product_id: int) -> list[dict]:
    try:
        data = _get(
            f"{_BASE}/products/available_entities/",
            ids=product_id,
            exclude_with_monthly_payment=1,
        )
        results = data.get("results", [])
        entities = results[0].get("entities", []) if results else []
        return process_product_prices(entities)
    except requests.exceptions.RequestException as e:
        print(f"Error fetching prices for product {product_id}: {e}")
        return []

def get_stores(limit=100) -> dict:
    response = requests.get("https://publicapi.solotodo.com/stores/")
    response.raise_for_status()
    
    priority_ids = {
        int(s) for s in
        "8015|3|8279|7289|4913|128|8378|6365|2570|6101|788|2603|8312|3758|7718|201|398|397|755|31|61|193|7|5705|5639|5903|3164|656|6300|8576|7652|4451|1911|88|1580|172|38|2801|6398|8444|9|8147|326|2735|4484|6662|1217|87|27|281|4287|56|1283|7388|1845|197|4814|8543|8180|199|43|8642|3956|4154|294|6563|23|392|887|260|195|225|8477|3395|3362|37|118|39|5144|2339|6233|257|266|3263|3890|4880|11|8148|34|12|953|6299|5177|2471|18|8510|2009|223|2768|4088|194|7487|293|1877|67|47|86|22|1514|3165|955|1086|8213|2670|2438|6464|6134|4121|176|181|4616|167|3032|8114|173|264|6992|170|231|2636|6|280|789|2141|359|14|45|85|8411|7619"
        .split("|") if s.strip().isdigit()
    }

    all_stores = response.json()
    
    if limit is None:
        return {s["id"]: s["name"] for s in all_stores}
    
    priority = [s for s in all_stores if s["id"] in priority_ids]
    others = [s for s in all_stores if s["id"] not in priority_ids]
    
    selected = (priority + others)[:limit]
    
    return {s["id"]: s["name"] for s in selected}