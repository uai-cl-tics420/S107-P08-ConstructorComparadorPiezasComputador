import { MongoClient, ObjectId } from 'mongodb';
import { getComponentIdsByFilters, getPricesByComponentId, getComponentCountByFilters } from './postgres';
import type { Vendor } from '@/types/Database_types';

const mongoUrl = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin`;

const client = new MongoClient(mongoUrl);
await client.connect();
const db = client.db(process.env.MONGO_DB);

// Transform MongoDB document to the format the frontend expects
async function transformComponent(doc: any) {
  const type = await db.collection('component_types').findOne({ _id: doc.type_id });
  const brand = doc.brand_id ? await db.collection('brands').findOne({ _id: doc.brand_id }) : null;

  // Fetch real prices from PostgreSQL
  const prices = await getPricesByComponentId(doc._id);

  return {
    id: doc._id,
    type_id: doc.type_id,
    brand_id: doc.brand_id,
    type_name: type?.name ?? 'Unknown',
    brand_name: brand?.name ?? 'Unknown',
    name: doc.name_model,
    model: doc.name_model.split(' ').pop() ?? '',
    specs: doc.specs ?? {},
    prices,
  };
}

export async function getComponents(
  search?: string,
  typeId?: string,
  brandId?: string,
  page: number = 1,
  limit: number = 16,
  sortBy: string = 'updated_at',
  sortOrder: -1 | 1 = -1,
  minPrice?: number,
  maxPrice?: number,
) {
  const componentIds = await getComponentIdsByFilters(
    // Query to PostgreSQL to get components
    search,
    typeId,
    brandId,
    minPrice,
    maxPrice,
    page,
    limit,
    sortBy,
    sortOrder,
  );

  if (componentIds.length === 0) {
    // Return early if none matched
    return [];
  }

  const idToOrder = new Map(componentIds.map((id, idx) => [id, idx])); // Map to save component order by ID

  const docs = await db // Query to Mongo to get full component data
    .collection('components')
    .find({ _id: { $in: componentIds } })
    .toArray();

  docs.sort((a, b) => (idToOrder.get(a._id) ?? 0) - (idToOrder.get(b._id) ?? 0)); // Reorder components

  const transformed = await Promise.all(docs.map(transformComponent));
  return transformed.filter((comp) => comp.prices.length > 0);
}

export async function getComponentsCount(
  search?: string,
  typeId?: string,
  brandId?: string,
  minPrice?: number,
  maxPrice?: number,
) {
  return await getComponentCountByFilters(search, typeId, brandId, minPrice, maxPrice);
}

export async function getComponentById(id: string) {
  const doc = await db.collection('components').findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  return transformComponent(doc);
}

export async function getBrands() {
  const docs = await db.collection('brands').find({}).toArray();
  return docs.map((b) => ({ id: b._id, name: b.name }));
}

const SINGLE_UNIT_TYPES = new Set(['CPU', 'GPU', 'Motherboard', 'PSU', 'CPU Cooler', 'Case']);

export async function getComponentTypes() {
  const docs = await db.collection('component_types').find({}).toArray();
  return docs.map((t) => ({
    id: t._id,
    name: t.name,
    max_quantity: SINGLE_UNIT_TYPES.has(t.name) ? 1 : 4,
  }));
}

export async function getVendorById(id: string): Promise<Vendor | null> {
  const doc = await db.collection<Vendor>('vendors').findOne({ _id: id });
  return doc;
}

export async function getComponentsByTypeName(typeName: string, limit = 60) {
  const typeDoc = await db.collection('component_types').findOne({ name: typeName });
  if (!typeDoc) return [];

  const docs = await db.collection('components').find({ type_id: typeDoc._id }).limit(limit).toArray();

  const transformed = await Promise.all(docs.map(transformComponent));
  return transformed.filter((comp) => comp.prices.length > 0);
}

export async function getComponentByStringId(id: string) {
  try {
    const doc = await db.collection('components').findOne({ _id: new ObjectId(id) });
    if (!doc) return null;
    return transformComponent(doc);
  } catch {
    return null;
  }
}
