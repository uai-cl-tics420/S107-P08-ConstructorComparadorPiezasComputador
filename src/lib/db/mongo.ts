import { MongoClient, ObjectId } from 'mongodb';
import { getComponentIdsByFilters, getPricesByComponentId, getComponentCountByFilters } from './postgres';
import type { BuildComponent, Vendor } from '@/types/Frontend_types';
import { createLogger } from '@/lib/logger';
import {
  getUserBuilds,
  createUserBuild,
  deleteUserBuild,
  getSharedBuild,
  createSharedBuild,
} from '@/lib/db/DBS_buildsManager';

const log = createLogger('mongo');

const mongoUrl = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin`;

const client = new MongoClient(mongoUrl);
await client.connect();
log.info('Conexión a MongoDB establecida', { db: process.env.MONGO_DB, host: process.env.MONGO_HOST });
const db = client.db(process.env.MONGO_DB);

async function transformComponent(doc: any) {
  const type = await db.collection('component_types').findOne({ _id: doc.type_id });
  const brand = doc.brand_id ? await db.collection('brands').findOne({ _id: doc.brand_id }) : null;

  if (!type) {
    log.warn('Tipo de componente no encontrado', { type_id: doc.type_id, component_id: doc._id });
  }

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
  sortBy: string = 'synced_at',
  sortOrder: -1 | 1 = -1,
  minPrice?: number,
  maxPrice?: number,
) {
  log.debug('getComponents llamado', { search, typeId, brandId, page, limit, sortBy, sortOrder, minPrice, maxPrice });

  const componentIds = await getComponentIdsByFilters(
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
    log.info('No se encontraron componentes con los filtros aplicados', { search, typeId, brandId });
    return [];
  }

  const idToOrder = new Map(componentIds.map((id, idx) => [id, idx]));

  const docs = await db
    .collection('components')
    .find({ _id: { $in: componentIds } })
    .toArray();

  docs.sort((a, b) => (idToOrder.get(a._id) ?? 0) - (idToOrder.get(b._id) ?? 0));

  const transformed = await Promise.all(docs.map(transformComponent));
  const withPrices = transformed.filter((comp) => comp.prices.length > 0);

  log.info('Componentes obtenidos', { total: withPrices.length, page, limit });
  return withPrices;
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
  log.debug('Buscando componente por ID', { id });
  try {
    const doc = await db.collection('components').findOne({ _id: id as any });
    if (!doc) {
      log.warn('Componente no encontrado', { id });
      return null;
    }
    return transformComponent(doc);
  } catch (error) {
    log.error('Error al buscar componente por ID', { id, error: (error as Error).message });
    return null;
  }
}

export async function getBrands() {
  log.debug('Obteniendo marcas');
  const docs = await db.collection('brands').find({}).toArray();
  log.info('Marcas obtenidas', { count: docs.length });
  return docs.map((b) => ({ id: b._id, name: b.name }));
}

const SINGLE_UNIT_TYPES = new Set(['CPU', 'GPU', 'Motherboard', 'PSU', 'CPU Cooler', 'Case']);

export async function getComponentTypes() {
  log.debug('Obteniendo tipos de componentes');
  const docs = await db.collection('component_types').find({}).toArray();
  log.info('Tipos de componentes obtenidos', { count: docs.length });
  return docs.map((t) => ({
    id: t._id,
    name: t.name,
    max_quantity: SINGLE_UNIT_TYPES.has(t.name) ? 1 : 4,
  }));
}

export async function getVendorById(id: string): Promise<Vendor | null> {
  log.debug('Buscando vendedor por ID', { id });
  const doc = await db.collection<Vendor>('vendors').findOne({ _id: id as any });
  if (!doc) {
    log.warn('Vendedor no encontrado', { id });
  }
  return doc;
}

export async function getComponentsByTypeName(typeName: string, limit = 60) {
  log.debug('Buscando componentes por tipo', { typeName, limit });

  const typeDoc = await db.collection('component_types').findOne({ name: typeName });
  if (!typeDoc) {
    log.warn('Tipo de componente no encontrado al buscar por nombre', { typeName });
    return [];
  }

  const docs = await db.collection('components').find({ type_id: typeDoc._id }).limit(limit).toArray();
  const transformed = await Promise.all(docs.map(transformComponent));
  const withPrices = transformed.filter((comp) => comp.prices.length > 0);

  log.debug('Componentes por tipo obtenidos', { typeName, found: withPrices.length });
  return withPrices;
}

export async function getComponentByStringId(id: string) {
  try {
    const doc = await db.collection('components').findOne({ _id: new ObjectId(id) });
    if (!doc) return null;
    return transformComponent(doc);
  } catch {
    log.warn('ID de componente inválido o no encontrado', { id });
    return null;
  }
}

export async function getBuildsClient(userId: string) {
  const builds = await getUserBuilds(db, userId);
  return Response.json(
    builds.map((b) => ({
      id: b._id,
      name: b.name,
      components: b.components,
      created_at: b.created_at.toISOString(),
    })),
  );
}

export async function createBuildClient(userId: string, name: string, components: BuildComponent[]) {
  const build = await createUserBuild(db, userId, name, components);
  return Response.json(
    {
      id: build._id,
      name: build.name,
      components: build.components,
      created_at: build.created_at.toISOString(),
    },
    { status: 201 },
  );
}

export async function deleteBuildClient(buildId: string, userId: string) {
  const success = await deleteUserBuild(db, buildId, userId);
  if (!success) {
    log.warn('Build no encontrado al intentar eliminar', { buildId: buildId, userId: userId });
    return Response.json({ error: 'Build no encontrado' }, { status: 404 });
  }
  return Response.json({ success: true });
}

export async function getSharedBuildClient(buildId: string) {
  const build = await getSharedBuild(db, buildId);
  if (!build) {
    log.warn('Build compartido no encontrado', { buildId: buildId });
    return Response.json({ error: 'Build no encontrado' }, { status: 404 });
  }
  return Response.json({
    id: build._id,
    name: build.name,
    components: build.components,
    created_at: build.created_at.toISOString(),
  });
}

export async function createSharedBuildClient(name: string, components: BuildComponent[]) {
  const build = await createSharedBuild(db, name, components);
  return Response.json(
    {
      id: build._id,
      name: build.name,
      components: build.components,
      created_at: build.created_at.toISOString(),
    },
    { status: 201 },
  );
}
