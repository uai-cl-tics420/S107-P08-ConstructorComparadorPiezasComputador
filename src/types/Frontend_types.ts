// Frontend interface types

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

export interface ComponentSpecs {
  socket?: string;
  ram_type?: string;
  tdp?: number;
  form_factor?: string;
  storage_type?: string;
  wattage?: number;
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
