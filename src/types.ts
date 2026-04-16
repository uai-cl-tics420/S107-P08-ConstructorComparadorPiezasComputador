export interface Brand {
  id: number;
  name: string;
}

export interface ComponentType {
  id: number;
  name: string;
  max_quantity: number;
}

export interface Vendor {
  id: number;
  name: string;
}

export interface Price {
  id: number;
  component_id: number;
  vendor_id: number;
  vendor_name: string;
  price: number;
  recorded_at: string;
}

// Specs para verificación de compatibilidad y display
export interface ComponentSpecs {
  socket?: string;         // CPU/Motherboard: AM5, LGA1700
  ram_type?: string;       // CPU/Motherboard/RAM: DDR4, DDR5
  tdp?: number;            // CPU/GPU: consumo en watts
  form_factor?: string;    // Motherboard/Case: ATX, mATX, ITX
  storage_type?: string;   // Storage: NVMe, SATA
  wattage?: number;        // PSU: potencia
  [key: string]: string | number | boolean | null | undefined;
}

export interface Component {
  id: number;
  type_id: number;
  type_name: string;
  brand_id: number;
  brand_name: string;
  name: string;
  model: string;
  prices: Price[];
  specs?: ComponentSpecs;
}

export interface BuildComponent {
  component: Component;
  quantity: number;
}

export interface SavedBuild {
  id: string;
  name: string;
  components: BuildComponent[];
  created_at: string;
}

export interface CompatibilityIssue {
  type: "error" | "warning";
  message: string;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning";
}
