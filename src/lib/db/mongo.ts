import { MongoClient, ObjectId } from 'mongodb';
import { getPricesByComponentId } from './postgres';
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

export async function getComponents(search?: string, typeId?: string, brandId?: string) {
  const query: Record<string, unknown> = {};
  if (search) query.name_model = { $regex: search, $options: 'i' };
  if (typeId) query.type_id = typeId;
  if (brandId) query.brand_id = brandId;

  // [HOTFIX] Limit to 56 results REVERT WHEN FULLY FIXED
  // [HOTFIX] Limit to 56 results REVERT WHEN FULLY FIXED
  // [HOTFIX] Limit to 56 results REVERT WHEN FULLY FIXED
  // [HOTFIX] Limit to 56 results REVERT WHEN FULLY FIXED
  // [HOTFIX] Limit to 56 results REVERT WHEN FULLY FIXED
  const docs = await db.collection('components').find(query).limit(56).toArray();
  const transformed = await Promise.all(docs.map(transformComponent));

  // Filter to only show components with prices
  return transformed.filter((comp) => comp.prices.length > 0);
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

export async function getComponentTypes() {
  const docs = await db.collection('component_types').find({}).toArray();
  return docs.map((t) => ({ id: t._id, name: t.name, max_quantity: 10 }));
}

export async function getVendorById(id: string): Promise<Vendor | null> {
  const doc = await db.collection<Vendor>('vendors').findOne({ _id: id });
  return doc;
}

export async function getComponentsByTypeName(typeName: string, limit = 60) {
  const typeDoc = await db.collection('component_types').findOne({ name: typeName });
  if (!typeDoc) return [];

  const docs = await db.collection('components')
    .find({ type_id: typeDoc._id })
    .limit(limit)
    .toArray();

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
