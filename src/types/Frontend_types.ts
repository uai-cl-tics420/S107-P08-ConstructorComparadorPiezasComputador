// Frontend interface types

export interface Brand {
  id: string;
  name: string;
}

export interface ComponentType {
  id: string;
  name: string;
  max_quantity: number;
}

export interface Vendor {
  id: string;
  name: string;
}

export interface Price {
  id: number;
  component_id: string;
  vendor_id: string;
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
  [key: string]: string | string[] | number | boolean | null | undefined;
}

export interface Component {
  id: string;
  type_id: string;
  type_name: string;
  brand_id: string;
  brand_name: string;
  name: string;
  model: string;
  prices: Price[];
  specs?: ComponentSpecs;
  image_url?: string | null;
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
  type: 'error' | 'warning';
  message: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}
