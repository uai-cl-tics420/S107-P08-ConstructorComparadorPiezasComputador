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
        v = variants.get("value") or variants.get("name") or variants.get("unicode")
        result[base] = None if v in _NULL_STRINGS else v

    return result


def _enrich_compat_specs(raw: dict) -> dict:
    """Deriva campos canonicos de compatibilidad desde los specs crudos de SoloTodo.

    Solo AGREGA campos (socket, ram_type, module_count, form_factor, wattage,
    max_motherboard_form_factor, cooler_sockets); no toca los que ya produce
    _clean_specs. Cada extraccion esta acotada a campos propios de cada categoria,
    asi no contamina componentes de otro tipo (p.ej. solo la Motherboard tiene
    chipset, solo la PSU tiene power_value, etc.).
    """
    out: dict[str, object] = {}

    # Socket de la Motherboard -- embebido en el chipset: "AMD B550 (AM4)" -> "AM4"
    for key in ("chipset_unicode", "chipset_northbridge_unicode"):
        m = re.search(r"\(([^)]+)\)", str(raw.get(key) or ""))
        if m:
            out["socket"] = m.group(1).strip()
            break

    # Tipo de RAM (DDR4/DDR5)
    #   Motherboard: "4x DDR4" en memory_slots_unicode
    #   Modulo RAM:  "DIMM DDR4 3200 MT/s" en bus_unicode
    for key in ("memory_slots_unicode", "bus_unicode"):
        m = re.search(r"(DDR\d)", str(raw.get(key) or ""), re.IGNORECASE)
        if m:
            out["ram_type"] = m.group(1).upper()
            break

    # Numero de modulos del kit de RAM ("1 x 8 GB" -> 1, "2 x 8 GB" -> 2)
    mc = raw.get("capacity_dimm_quantity_value")
    if isinstance(mc, (int, float)):
        out["module_count"] = int(mc)

    # Form factor de la Motherboard: "Micro ATX", "ATX", etc.
    ff = raw.get("format_name") or raw.get("format_unicode")
    if ff:
        out["form_factor"] = ff

    # Wattaje de la PSU: power_value 650 -> wattage 650
    pw = raw.get("power_value")
    if isinstance(pw, (int, float)):
        out["wattage"] = int(pw)

    # Form factor maximo de placa que soporta el Case
    cf = (raw.get("largest_motherboard_format_format_name")
          or raw.get("largest_motherboard_format_unicode"))
    if cf:
        out["max_motherboard_form_factor"] = cf

    # Sockets soportados por el CPU Cooler (grupos anidados -> lista de nombres)
    gs = raw.get("grouped_sockets")
    if isinstance(gs, list):
        names: list[str] = []
        for group in gs:
            if not isinstance(group, dict):
                continue
            for s in group.get("sockets") or []:
                if isinstance(s, dict):
                    name = s.get("socket_name") or s.get("unicode")
                    if name:
                        names.append(str(name))
        if names:
            out["cooler_sockets"] = names

    # Tipo de interfaz del Storage (bus_unicode -> bus_type para mostrar en tarjeta)
    # Tambien aplica a GPU (PCIe) pero es inofensivo guardarlo
    bu = raw.get("bus_unicode")
    if bu and str(bu) not in ("", "No posee"):
        out["bus_type"] = str(bu)

    # NVMe detection para Storage — necesario para chequear slots M.2 del MB
    if re.search(r"nvme|m\.2", str(raw.get("bus_unicode") or ""), re.IGNORECASE):
        out["is_nvme"] = True

    # Conteo de slots M.2 de la Motherboard (desde storage_ports array)
    sp = raw.get("storage_ports")
    if isinstance(sp, list):
        m2_count = 0
        for port in sp:
            if not isinstance(port, dict):
                continue
            desc = str(port.get("unicode") or port.get("name") or "").lower()
            qty = port.get("quantity")
            if "m.2" in desc or "nvme" in desc:
                m2_count += int(qty) if isinstance(qty, (int, float)) and qty > 0 else 1
        if m2_count > 0:
            out["m2_slots"] = m2_count

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
    resp = _SESSION.get(url, params=params)
    resp.raise_for_status()
    return resp.json()


def browse_category(
    category_id = CATEGORY_CPU,
    page: int    = 1,
    page_size: int = 10,
    exclude_refurbished: bool = True,
) -> dict:
    '''
    { product_id: { name, slug, picture_url, last_updated, normal_price, offer_price, ...specs }, ... }
    '''
    url = f"{_BASE}/categories/{category_id}/browse/"
    # Limitar a las primeras 200 tiendas: balance entre cobertura (RAM, etc.) y largo URL (<2400 chars)
    store_ids = list(get_stores().keys())[:200]
    params = [
        ("exclude_refurbished", str(exclude_refurbished).lower()),
        ("page", page),
        ("page_size", page_size),
    ] + [("stores", s) for s in store_ids]
    resp = _SESSION.get(url, params=params)
    resp.raise_for_status()
    return process_json_response(resp.json())


def browse_cpus        (page=1, page_size=20, **kw): return browse_category(CATEGORY_CPU,        page, page_size, **kw)
def browse_ram         (page=1, page_size=20, **kw): return browse_category(CATEGORY_RAM,        page, page_size, **kw)
def browse_motherboards(page=1, page_size=20, **kw): return browse_category(CATEGORY_MB,         page, page_size, **kw)
def browse_gpus        (page=1, page_size=20, **kw): return browse_category(CATEGORY_GPU,        page, page_size, **kw)
def browse_psu         (page=1, page_size=20, **kw): return browse_category(CATEGORY_PSU,        page, page_size, **kw)
def browse_cpu_coolers (page=1, page_size=20, **kw): return browse_category(CATEGORY_CPU_COOLER, page, page_size, **kw)
def browse_fans        (page=1, page_size=20, **kw): return browse_category(CATEGORY_FANS,       page, page_size, **kw)
def browse_pc_cases    (page=1, page_size=20, **kw): return browse_category(CATEGORY_PC_CASE,    page, page_size, **kw)
def browse_storage     (page=1, page_size=20, **kw): return browse_category(CATEGORY_STORAGE,    page, page_size, **kw)


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
    '''
    [{ entity_id, store_id, store_url, name, sku, external_url, condition, is_visible, normal_price, offer_price, is_available, last_updated, picture_urls[], best_coupon }, ...]
    '''
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

def get_stores() -> dict:
    '''
    { store_id: store_name, ... }
    '''
    resp = requests.get("https://publicapi.solotodo.com/stores/")
    resp.raise_for_status()
    return {s['id']: s['name'] for s in resp.json()}