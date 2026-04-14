// MongoDB schema interface types

export interface Brand {
  _id: string; // UUID
  name: string;
}

export interface ComponentType {
  _id: string; // UUID
  name: string;
}

export interface Vendor {
  _id: string; // UUID
  name: string;
}

export interface Component {
  _id: string; // UUID
  type_id: string; // UUID
  brand_id: string | null; // optional UUID
  name_model: string;
  specs: Record<string, any>;
  requirements: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface BuildComponent {
  component_id: string; // UUID
  quantity: number;
}

export interface Build {
  _id: string; // UUID
  user_id: string; // ObjectId from better-auth
  components: BuildComponent[];
  created_at: Date;
  updated_at: Date;
}

// PostgreSQL schema interface types

export interface ComponentMirror {
  component_id: string; // UUID
  type_id: string; // UUID
  brand_id: string | null; // optional UUID
  synced_at: Date;
}

export interface Price {
  id: number;
  component_id: string; // UUID
  vendor_id: string; // UUID
  price: number;
  discount_price?: number;
  recorded_at: Date;
}
