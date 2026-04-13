import requests

# Category IDs
CATEGORY_CPU = 3
CATEGORY_GPU = 2
CATEGORY_MB  = 5
CATEGORY_RAM = 7
CATEGORY_PSU = 9
CATEGORY_CPU_COOLER = 12
CATEGORY_FANS = 87
CATEGORY_PC_CASE = 10

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

def browse_category(category_id = CATEGORY_CPU, page = 1, page_size = 10, exclude_refurbished = False, stores = STORES):
    url = f"https://publicapi.solotodo.com/categories/{category_id}/browse/"

    params = [
        ("exclude_refurbished", str(exclude_refurbished).lower()),
        ("page", page),
        ("page_size", page_size),
    ]
    for store_id in stores:
        params.append(("stores", store_id))

    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()


def browse_cpus(page = 1, page_size = 10, **kwargs):
    return browse_category(category_id=CATEGORY_CPU, page=page, page_size=page_size, **kwargs)

def browse_ram(page = 1, page_size = 20, **kwargs):
    return browse_category(category_id=CATEGORY_RAM, page=page, page_size=page_size, **kwargs)

def browse_motherboards(page = 1, page_size = 20, **kwargs):
    return browse_category(category_id=CATEGORY_MB, page=page, page_size=page_size, **kwargs)

def browse_gpus(page = 1, page_size = 20, **kwargs):
    return browse_category(category_id=CATEGORY_GPU, page=page, page_size=page_size, **kwargs)

def browse_psus(page = 1, page_size = 20, **kwargs):
    return browse_category(category_id=CATEGORY_PSU, page=page, page_size=page_size, **kwargs)

def browse_cpu_coolers(page = 1, page_size = 20, **kwargs):
    return browse_category(category_id=CATEGORY_CPU_COOLER, page=page, page_size=page_size, **kwargs)


def browse_fans(page = 1, page_size = 20, **kwargs):
    return browse_category(category_id=CATEGORY_FANS, page=page, page_size=page_size, **kwargs)


def browse_pc_cases(page = 1, page_size = 20, **kwargs):
    return browse_category(category_id=CATEGORY_PC_CASE, page=page, page_size=page_size, **kwargs)


def _price_fields(entry):
    metadata = entry.get("metadata", {})
    prices = metadata.get("prices_per_currency", [])
    clp_offer  = prices[0].get("offer_price",  "N/A") if prices else "N/A"
    clp_normal = prices[0].get("normal_price", "N/A") if prices else "N/A"
    usd_offer  = metadata.get("offer_price_usd",  "N/A")
    usd_normal = metadata.get("normal_price_usd", "N/A")
    return clp_offer, clp_normal, usd_offer, usd_normal
