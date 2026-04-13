import type { Brand, ComponentType, Vendor, Component } from "../types";

export const brands: Brand[] = [
  { id: 1, name: "AMD" },
  { id: 2, name: "Intel" },
  { id: 3, name: "NVIDIA" },
  { id: 4, name: "Kingston" },
  { id: 5, name: "Samsung" },
  { id: 6, name: "Corsair" },
  { id: 7, name: "ASUS" },
  { id: 8, name: "Gigabyte" },
  { id: 9, name: "Seagate" },
  { id: 10, name: "Western Digital" },
];

export const componentTypes: ComponentType[] = [
  { id: 1, name: "CPU", max_quantity: 1 },
  { id: 2, name: "GPU", max_quantity: 1 },
  { id: 3, name: "RAM", max_quantity: 4 },
  { id: 4, name: "Motherboard", max_quantity: 1 },
  { id: 5, name: "Storage", max_quantity: 4 },
  { id: 6, name: "PSU", max_quantity: 1 },
  { id: 7, name: "Case", max_quantity: 1 },
  { id: 8, name: "CPU Cooler", max_quantity: 1 },
];

export const vendors: Vendor[] = [
  { id: 1, name: "SoloTodo" },
  { id: 2, name: "PC Factory" },
  { id: 3, name: "Webbstore" },
];

export const components: Component[] = [
  // CPUs
  {
    id: 1,
    type_id: 1,
    type_name: "CPU",
    brand_id: 1,
    brand_name: "AMD",
    name: "AMD Ryzen 5 7600X",
    model: "Ryzen 5 7600X",
    prices: [
      { id: 1, component_id: 1, vendor_id: 1, vendor_name: "SoloTodo", price: 229990, recorded_at: "2026-04-10" },
      { id: 2, component_id: 1, vendor_id: 2, vendor_name: "PC Factory", price: 239990, recorded_at: "2026-04-10" },
      { id: 3, component_id: 1, vendor_id: 3, vendor_name: "Webbstore", price: 224990, recorded_at: "2026-04-10" },
    ],
    specs: { socket: "AM5", ram_type: "DDR5", tdp: 105 },
  },
  {
    id: 2,
    type_id: 1,
    type_name: "CPU",
    brand_id: 1,
    brand_name: "AMD",
    name: "AMD Ryzen 7 7700X",
    model: "Ryzen 7 7700X",
    prices: [
      { id: 4, component_id: 2, vendor_id: 1, vendor_name: "SoloTodo", price: 319990, recorded_at: "2026-04-10" },
      { id: 5, component_id: 2, vendor_id: 2, vendor_name: "PC Factory", price: 329990, recorded_at: "2026-04-10" },
    ],
    specs: { socket: "AM5", ram_type: "DDR5", tdp: 120 },
  },
  {
    id: 3,
    type_id: 1,
    type_name: "CPU",
    brand_id: 2,
    brand_name: "Intel",
    name: "Intel Core i5-13600K",
    model: "Core i5-13600K",
    prices: [
      { id: 6, component_id: 3, vendor_id: 1, vendor_name: "SoloTodo", price: 259990, recorded_at: "2026-04-10" },
      { id: 7, component_id: 3, vendor_id: 3, vendor_name: "Webbstore", price: 249990, recorded_at: "2026-04-10" },
    ],
    specs: { socket: "LGA1700", ram_type: "DDR5", tdp: 125 },
  },
  {
    id: 4,
    type_id: 1,
    type_name: "CPU",
    brand_id: 2,
    brand_name: "Intel",
    name: "Intel Core i7-13700K",
    model: "Core i7-13700K",
    prices: [
      { id: 8, component_id: 4, vendor_id: 1, vendor_name: "SoloTodo", price: 399990, recorded_at: "2026-04-10" },
      { id: 9, component_id: 4, vendor_id: 2, vendor_name: "PC Factory", price: 409990, recorded_at: "2026-04-10" },
    ],
    specs: { socket: "LGA1700", ram_type: "DDR5", tdp: 125 },
  },
  // GPUs
  {
    id: 5,
    type_id: 2,
    type_name: "GPU",
    brand_id: 3,
    brand_name: "NVIDIA",
    name: "NVIDIA GeForce RTX 4070",
    model: "RTX 4070",
    prices: [
      { id: 10, component_id: 5, vendor_id: 1, vendor_name: "SoloTodo", price: 649990, recorded_at: "2026-04-10" },
      { id: 11, component_id: 5, vendor_id: 2, vendor_name: "PC Factory", price: 659990, recorded_at: "2026-04-10" },
    ],
    specs: { tdp: 200 },
  },
  {
    id: 6,
    type_id: 2,
    type_name: "GPU",
    brand_id: 3,
    brand_name: "NVIDIA",
    name: "NVIDIA GeForce RTX 4060",
    model: "RTX 4060",
    prices: [
      { id: 12, component_id: 6, vendor_id: 1, vendor_name: "SoloTodo", price: 399990, recorded_at: "2026-04-10" },
      { id: 13, component_id: 6, vendor_id: 3, vendor_name: "Webbstore", price: 389990, recorded_at: "2026-04-10" },
    ],
    specs: { tdp: 115 },
  },
  {
    id: 7,
    type_id: 2,
    type_name: "GPU",
    brand_id: 1,
    brand_name: "AMD",
    name: "AMD Radeon RX 7700 XT",
    model: "RX 7700 XT",
    prices: [
      { id: 14, component_id: 7, vendor_id: 1, vendor_name: "SoloTodo", price: 449990, recorded_at: "2026-04-10" },
      { id: 15, component_id: 7, vendor_id: 2, vendor_name: "PC Factory", price: 459990, recorded_at: "2026-04-10" },
    ],
    specs: { tdp: 165 },
  },
  // RAM
  {
    id: 8,
    type_id: 3,
    type_name: "RAM",
    brand_id: 4,
    brand_name: "Kingston",
    name: "Kingston FURY Beast 16GB DDR5",
    model: "FURY Beast 16GB DDR5-5200",
    prices: [
      { id: 16, component_id: 8, vendor_id: 1, vendor_name: "SoloTodo", price: 89990, recorded_at: "2026-04-10" },
      { id: 17, component_id: 8, vendor_id: 2, vendor_name: "PC Factory", price: 94990, recorded_at: "2026-04-10" },
    ],
    specs: { ram_type: "DDR5" },
  },
  {
    id: 9,
    type_id: 3,
    type_name: "RAM",
    brand_id: 6,
    brand_name: "Corsair",
    name: "Corsair Vengeance 32GB DDR5",
    model: "Vengeance 32GB DDR5-6000",
    prices: [
      { id: 18, component_id: 9, vendor_id: 1, vendor_name: "SoloTodo", price: 159990, recorded_at: "2026-04-10" },
      { id: 19, component_id: 9, vendor_id: 3, vendor_name: "Webbstore", price: 149990, recorded_at: "2026-04-10" },
    ],
    specs: { ram_type: "DDR5" },
  },
  // Motherboards
  {
    id: 10,
    type_id: 4,
    type_name: "Motherboard",
    brand_id: 7,
    brand_name: "ASUS",
    name: "ASUS ROG STRIX B650E-F",
    model: "ROG STRIX B650E-F GAMING WIFI",
    prices: [
      { id: 20, component_id: 10, vendor_id: 1, vendor_name: "SoloTodo", price: 329990, recorded_at: "2026-04-10" },
      { id: 21, component_id: 10, vendor_id: 2, vendor_name: "PC Factory", price: 339990, recorded_at: "2026-04-10" },
    ],
    specs: { socket: "AM5", ram_type: "DDR5", form_factor: "ATX" },
  },
  {
    id: 11,
    type_id: 4,
    type_name: "Motherboard",
    brand_id: 8,
    brand_name: "Gigabyte",
    name: "Gigabyte B650 AORUS Elite AX",
    model: "B650 AORUS Elite AX",
    prices: [
      { id: 22, component_id: 11, vendor_id: 1, vendor_name: "SoloTodo", price: 269990, recorded_at: "2026-04-10" },
      { id: 23, component_id: 11, vendor_id: 3, vendor_name: "Webbstore", price: 259990, recorded_at: "2026-04-10" },
    ],
    specs: { socket: "AM5", ram_type: "DDR5", form_factor: "ATX" },
  },
  // Storage
  {
    id: 12,
    type_id: 5,
    type_name: "Storage",
    brand_id: 5,
    brand_name: "Samsung",
    name: "Samsung 990 Pro 1TB NVMe",
    model: "990 Pro 1TB NVMe M.2",
    prices: [
      { id: 24, component_id: 12, vendor_id: 1, vendor_name: "SoloTodo", price: 119990, recorded_at: "2026-04-10" },
      { id: 25, component_id: 12, vendor_id: 2, vendor_name: "PC Factory", price: 124990, recorded_at: "2026-04-10" },
    ],
    specs: { storage_type: "NVMe" },
  },
  {
    id: 13,
    type_id: 5,
    type_name: "Storage",
    brand_id: 9,
    brand_name: "Seagate",
    name: "Seagate Barracuda 2TB HDD",
    model: "Barracuda 2TB 7200RPM",
    prices: [
      { id: 26, component_id: 13, vendor_id: 1, vendor_name: "SoloTodo", price: 54990, recorded_at: "2026-04-10" },
      { id: 27, component_id: 13, vendor_id: 3, vendor_name: "Webbstore", price: 49990, recorded_at: "2026-04-10" },
    ],
    specs: { storage_type: "SATA" },
  },
  // PSU
  {
    id: 14,
    type_id: 6,
    type_name: "PSU",
    brand_id: 6,
    brand_name: "Corsair",
    name: "Corsair RM850x 850W 80+ Gold",
    model: "RM850x 80+ Gold Modular",
    prices: [
      { id: 28, component_id: 14, vendor_id: 1, vendor_name: "SoloTodo", price: 129990, recorded_at: "2026-04-10" },
      { id: 29, component_id: 14, vendor_id: 2, vendor_name: "PC Factory", price: 134990, recorded_at: "2026-04-10" },
    ],
    specs: { wattage: 850 },
  },
];
