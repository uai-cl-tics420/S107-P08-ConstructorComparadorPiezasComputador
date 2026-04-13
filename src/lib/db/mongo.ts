import { MongoClient } from 'mongodb';

const mongoUrl = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@localhost:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin`;

const client = new MongoClient(mongoUrl);
export const db = client.db(process.env.MONGO_DB);

// Transform MongoDB component to frontend format
async function transformComponent(doc: any) {
  const type = await db.collection('component_types').findOne({ _id: doc.type_id });
  const brand = doc.brand_id ? await db.collection('brands').findOne({ _id: doc.brand_id }) : null;

  // Fake prices for now (from mock data pattern)
  const prices = [
    { id: Math.random(), component_id: doc._id, vendor_id: '550e8400-e29b-41d4-a716-446655440020', vendor_name: 'SoloTodo', price: 300000, recorded_at: '2026-04-13' },
    { id: Math.random(), component_id: doc._id, vendor_id: '550e8400-e29b-41d4-a716-446655440021', vendor_name: 'PC Factory', price: 310000, recorded_at: '2026-04-13' },
  ];

  return {
    id: doc._id,
    type_id: doc.type_id,
    brand_id: doc.brand_id,
    type_name: type?.name || 'Unknown',
    brand_name: brand?.name || 'Unknown',
    name: doc.name_model,
    model: doc.name_model.split(' ').pop() || 'Model',
    specs: doc.specs || {},
    prices,
  };
}

// Get all components with search and filters
export async function getComponents(search?: string, typeId?: string, brandId?: string) {
  const query: any = {};

  if (search) {
    query.name_model = { $regex: search, $options: 'i' };
  }
  if (typeId) {
    query.type_id = typeId;
  }
  if (brandId) {
    query.brand_id = brandId;
  }

  const components = await db.collection('components').find(query).toArray();
  const transformed = await Promise.all(components.map(transformComponent));
  return transformed;
}

// Get component by ID
export async function getComponentById(id: string) {
  const component = await db.collection('components').findOne({ _id: id });
  if (!component) return null;
  return transformComponent(component);
}

// Get all brands
export async function getBrands() {
  const brands = await db.collection('brands').find({}).toArray();
  return brands.map(b => ({ id: b._id, name: b.name }));
}

// Get all component types
export async function getComponentTypes() {
  const types = await db.collection('component_types').find({}).toArray();
  return types.map(t => ({
    id: t._id,
    name: t.name,
    max_quantity: 10, // Default max quantity
  }));
}
