import requests
from typing import Any

CATEGORY_CPU        = 3
CATEGORY_GPU        = 2
CATEGORY_MB         = 5
CATEGORY_RAM        = 7
CATEGORY_PSU        = 9
CATEGORY_CPU_COOLER = 12
CATEGORY_FANS       = 87
CATEGORY_PC_CASE    = 10

STORES = [
    8015, 3, 8279, 7289, 4913, 128, 8378, 6365, 2570, 6101, 4, 788, 2603,
    8312, 3758, 7718, 201, 398, 397, 755, 31, 61, 193, 7, 5705, 5639, 5903,
    3164, 656, 6300, 8576, 7652, 4451, 1911, 88, 1580, 172, 38, 2801, 6398,
    8444, 9, 8147, 326, 2735, 4484, 6662, 1217, 87, 27, 281, 4287, 56, 1283,
    7388, 1845, 2967, 197, 4814, 8543, 8180, 199, 43, 8642, 3956, 4154, 294,
    6563, 23, 392, 887, 260, 195, 225, 8477, 3395, 3362, 37, 118, 39, 5144,
    2339, 6233, 257, 266, 3263, 3890, 4880, 11, 8148, 34, 12, 953, 6299,
    5177, 2471, 18, 8510, 2009, 223, 2768, 4088, 194, 7487, 293, 1877, 67,
    47, 86, 22, 1514, 3165, 955, 1086, 8213, 2670, 2438, 6464, 6134, 4121,
    176, 181, 4616, 167, 3032, 8114, 173, 264, 4220, 6992, 170, 231, 2636,
    6, 280, 2174, 789, 2141, 359, 14, 45, 85, 8411, 7619,
]


def browse_category(category_id=CATEGORY_CPU, page=1, page_size=10, exclude_refurbished=False, stores=STORES):
    url = f"https://publicapi.solotodo.com/categories/{category_id}/browse/"
    params = [
        ("exclude_refurbished", str(exclude_refurbished).lower()),
        ("page", page),
        ("page_size", page_size),
        *[("stores", store_id) for store_id in stores],
    ]
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()


def browse_cpus(page=1, page_size=10, **kwargs):
    return browse_category(category_id=CATEGORY_CPU, page=page, page_size=page_size, **kwargs)

def browse_ram(page=1, page_size=20, **kwargs):
    return browse_category(category_id=CATEGORY_RAM, page=page, page_size=page_size, **kwargs)

def browse_motherboards(page=1, page_size=20, **kwargs):
    return browse_category(category_id=CATEGORY_MB, page=page, page_size=page_size, **kwargs)

def browse_gpus(page=1, page_size=20, **kwargs):
    return browse_category(category_id=CATEGORY_GPU, page=page, page_size=page_size, **kwargs)

def browse_psus(page=1, page_size=20, **kwargs):
    return browse_category(category_id=CATEGORY_PSU, page=page, page_size=page_size, **kwargs)

def browse_cpu_coolers(page=1, page_size=20, **kwargs):
    return browse_category(category_id=CATEGORY_CPU_COOLER, page=page, page_size=page_size, **kwargs)

def browse_fans(page=1, page_size=20, **kwargs):
    return browse_category(category_id=CATEGORY_FANS, page=page, page_size=page_size, **kwargs)

def browse_pc_cases(page=1, page_size=20, **kwargs):
    return browse_category(category_id=CATEGORY_PC_CASE, page=page, page_size=page_size, **kwargs)


# Spec keys that are internal IDs or exact duplicates of product-level fields
_SKIP_SPEC_KEYS = frozenset({"id", "unicode", "default_bucket", "total_core_count"})

# String values that represent "no value" in the API
_NULL_STRINGS = frozenset({"No posee", "no posee", "N/A", ""})


def _is_traversal(base: str) -> bool:
    parts = base.split("_")

    # Pattern 1: consecutive duplicate (e.g. socket_socket, brand_brand)
    for i in range(len(parts) - 1):
        if parts[i] == parts[i + 1]:
            return True

    # Pattern 2: intermediate 'family' table (line_family_*)
    if len(parts) >= 2 and parts[1] == "family":
        return True

    # Pattern 3: brand or step sub-traversal beyond the first hop
    if len(parts) >= 3 and parts[-1] in ("brand", "step"):
        return True

    return False


def _clean_specs(raw_specs: dict) -> dict:
    # Bucket each key into its base name and suffix type
    groups: dict[str, dict[str, Any]] = {}
    plain:  dict[str, Any] = {}

    for k, v in raw_specs.items():
        if k in _SKIP_SPEC_KEYS:
            continue
        for suffix in ("_value", "_name", "_unicode"):
            if k.endswith(suffix):
                base = k[: -len(suffix)]
                groups.setdefault(base, {})[suffix.lstrip("_")] = v
                break
        else:
            plain[k] = v  # boolean / int / float with no suffix

    # Unicode-only string summaries that have a numeric quantity breakdown
    redundant_summaries = {
        base
        for base, variants in groups.items()
        if variants.keys() == {"unicode"} and (base + "_quantity") in groups
    }

    result: dict[str, Any] = {}

    # Plain fields first (direct numeric/bool attributes)
    for k, v in plain.items():
        if not _is_traversal(k):
            result[k] = v

    # Grouped fields: value > name > unicode
    for base, variants in groups.items():
        if _is_traversal(base) or base in redundant_summaries:
            continue
        if base in result:  # already set by a plain field
            continue
        v = variants.get("value", variants.get("name", variants.get("unicode")))
        result[base] = None if v in _NULL_STRINGS else v

    return result


def _to_float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _clp_prices(product_entry: dict) -> tuple[float | None, float | None]:
    """Returns (offer_price, normal_price) in CLP as floats."""
    prices = product_entry.get("metadata", {}).get("prices_per_currency", [])
    if not prices:
        return None, None
    return (
        _to_float(prices[0].get("offer_price")),
        _to_float(prices[0].get("normal_price")),
    )

def process_json_response(json_response: dict) -> dict[int, dict]:
    results: dict[int, dict] = {}

    for entry in json_response.get("results", []):
        for product_entry in entry.get("product_entries", []):
            product = product_entry.get("product", {})
            product_id = product.get("id")

            if product_id is None:
                continue

            offer_price, normal_price = _clp_prices(product_entry)

            results[product_id] = {
                # Core identity fields
                "id":           product_id,
                "name":         product.get("name"),
                "slug":         product.get("slug"),
                "picture_url":  product.get("picture_url"),
                "last_updated": product.get("last_updated"),
                # Prices as floats
                "normal_price": normal_price,
                "offer_price":  offer_price,
                # All cleaned specs merged at top level
                **_clean_specs(product.get("specs", {})),
            }

    return results
