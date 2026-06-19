import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './PostgreSQL_schema';
import { componentsMirror, prices } from './PostgreSQL_schema';
import { sql } from 'drizzle-orm';
import { createLogger } from '@/lib/logger';

const log = createLogger('postgres');

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT!),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('connect', () => {
  log.info('Nueva conexión establecida en el pool de PostgreSQL');
});

pool.on('error', (err) => {
  log.error('Error inesperado en cliente inactivo del pool de PostgreSQL', { error: err.message });
});

export const db = drizzle(pool, { schema });

export async function getComponentIdsByFilters(
  search?: string,
  typeId?: string,
  brandId?: string,
  minPrice: number = 0,
  maxPrice: number = Number.MAX_SAFE_INTEGER,
  page: number = 1,
  limit: number = 16,
  sortBy: string = 'synced_at',
  sortOrder: -1 | 1 = -1,
) {
  log.debug('getComponentIdsByFilters llamado', {
    search,
    typeId,
    brandId,
    minPrice,
    maxPrice,
    page,
    limit,
    sortBy,
    sortOrder,
  });

  const offset = (page - 1) * limit;
  const direction = sortOrder === 1 ? 'ASC' : 'DESC';

  const allowedSortBy = new Set(['synced_at', 'final_price', 'name_model']);
  const safeSortBy = allowedSortBy.has(sortBy) ? sortBy : 'synced_at';

  const whereConditions = [sql`TRUE`];

  if (search) {
    whereConditions.push(sql`cm.name_model ILIKE ${`%${search}%`}`);
  }

  if (typeId) {
    whereConditions.push(sql`cm.type_id = ${typeId}`);
  }

  if (brandId) {
    whereConditions.push(sql`cm.brand_id = ${brandId}`);
  }

  whereConditions.push(sql`bp.effective_price >= ${minPrice}`);
  whereConditions.push(sql`bp.effective_price <= ${maxPrice}`);

  let sortExpression = sql`cm.synced_at`;

  if (safeSortBy === 'name_model') {
    sortExpression = sql`LOWER(cm.name_model)`;
  } else if (safeSortBy === 'final_price') {
    sortExpression = sql`bp.effective_price`;
  }

  const query = sql`
    WITH best_prices AS (
      SELECT
        p.component_id,
        MIN(LEAST(p.price, COALESCE(p.discount_price, p.price))) AS effective_price
      FROM ${prices} AS p
      GROUP BY p.component_id
    )
    SELECT cm.component_id
    FROM ${componentsMirror} AS cm
    INNER JOIN best_prices AS bp
      ON bp.component_id = cm.component_id
    WHERE ${sql.join(whereConditions, sql` AND `)}
    ORDER BY ${sortExpression} ${sql.raw(direction)}, cm.component_id ASC
    LIMIT ${limit} OFFSET ${offset}
  `;

  try {
    const result = await db.execute(query);
    log.debug('Consulta de IDs completada', { rowCount: result.rowCount });
    return result.rows.map((row: any) => row.component_id);
  } catch (error) {
    log.error('Error ejecutando consulta de componentes', { error: (error as Error).message, search, typeId, brandId });
    throw error;
  }
}

export async function getPricesByComponentId(componentId: string) {
  try {
    const query = sql`
      SELECT
        id,
        vendor_id,
        vendor_name,
        price,
        discount_price,
        recorded_at
      FROM ${prices}
      WHERE component_id = ${componentId}
      ORDER BY ${prices.price} ASC
    `;

    const result = await db.execute(query);

    if (result.rows.length === 0) {
      log.warn('No se encontraron precios para el componente', { componentId });
    } else {
      log.debug('Precios obtenidos', { componentId, count: result.rows.length });
    }

    return result.rows.map((row: any) => ({
      id: row.id,
      component_id: componentId,
      vendor_id: row.vendor_id,
      vendor_name: row.vendor_name || 'SoloTodo',
      price: parseInt(row.discount_price) || parseInt(row.price),
      recorded_at: row.recorded_at.split(' ')[0],
    }));
  } catch (error) {
    log.error('Error al obtener precios del componente', { componentId, error: (error as Error).message });
    return [];
  }
}

export async function getInStockComponentIds(ids: string[]): Promise<string[]> {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  log.debug('Verificando stock de componentes', { count: ids.length });
  const checks = await Promise.all(
    ids.map(async (id) => ({ id, inStock: (await getPricesByComponentId(id)).length > 0 })),
  );
  const inStock = checks.filter((c) => c.inStock).map((c) => c.id);
  const outOfStock = ids.length - inStock.length;

  if (outOfStock > 0) {
    log.warn('Componentes sin stock detectados', { total: ids.length, outOfStock, inStock: inStock.length });
  }

  return inStock;
}

export async function getComponentCountByFilters(
  search?: string,
  typeId?: string,
  brandId?: string,
  minPrice?: number,
  maxPrice?: number,
) {
  const min = minPrice ?? 0;
  const max = maxPrice ?? Number.MAX_SAFE_INTEGER;

  const whereConditions = [sql`TRUE`];

  if (search) {
    whereConditions.push(sql`cm.name_model ILIKE ${`%${search}%`}`);
  }
  if (typeId) {
    whereConditions.push(sql`cm.type_id = ${typeId}`);
  }
  if (brandId) {
    whereConditions.push(sql`cm.brand_id = ${brandId}`);
  }

  whereConditions.push(sql`bp.effective_price >= ${min}`);
  whereConditions.push(sql`bp.effective_price <= ${max}`);

  const query = sql`
    WITH best_prices AS (
      SELECT
        p.component_id,
        MIN(LEAST(p.price, COALESCE(p.discount_price, p.price))) AS effective_price
      FROM ${prices} AS p
      GROUP BY p.component_id
    )
    SELECT COUNT(*)::int AS count
    FROM ${componentsMirror} AS cm
    INNER JOIN best_prices AS bp
      ON bp.component_id = cm.component_id
    WHERE ${sql.join(whereConditions, sql` AND `)}
  `;

  try {
    const result = await db.execute(query);
    const count = Number(result.rows[0]?.count ?? 0);
    log.debug('Conteo de componentes completado', { count, search, typeId, brandId });
    return count;
  } catch (error) {
    log.error('Error al contar componentes', { error: (error as Error).message });
    throw error;
  }
}
