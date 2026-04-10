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

export interface Component {
  id: number;
  type_id: number;
  type_name: string;
  brand_id: number;
  brand_name: string;
  name: string;
  model: string;
  prices: Price[];
}

export interface BuildComponent {
  component: Component;
  quantity: number;
}
