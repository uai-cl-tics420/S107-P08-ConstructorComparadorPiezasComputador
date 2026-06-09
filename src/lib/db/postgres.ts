import { Pool } from 'pg';
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
  log.debug('getComponentIdsByFilters llamado', { search, typeId, brandId, minPrice, maxPrice, page, limit, sortBy, sortOrder });

  const offset = (page - 1) * limit;
  const direction = sortOrder === 1 ? 'ASC' : 'DESC';

  const params: any[] = [];
  const conditions: string[] = [];

  if (search) {
    params.push(search);
    conditions.push(`cm.name_model ILIKE '%' || $${params.length} || '%'`);
  }
  if (typeId) {
    params.push(typeId);
    conditions.push(`cm.type_id = $${params.length}`);
  }
  if (brandId) {
    params.push(brandId);
    conditions.push(`cm.brand_id = $${params.length}`);
  }
  params.push(minPrice);
  conditions.push(`LEAST(p.price, p.discount_price) >= $${params.length}`);
  params.push(maxPrice);
  conditions.push(`LEAST(p.price, p.discount_price) <= $${params.length}`);

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderByClause = `${sortBy} ${direction}`;

  params.push(limit, offset);
  const limitOffsetClause = `LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const query = `
  SELECT * FROM (
    SELECT DISTINCT ON (p.component_id)
      p.component_id,
	    cm.name_model,
    	cm.type_id,
    	cm.brand_id,
    	cm.synced_at,
    	p.vendor_id,
    	LEAST(p.price, p.discount_price) AS final_price
    FROM public.prices p
    INNER JOIN public.components_mirror cm
      ON p.component_id = cm.component_id
    ${whereClause}
    ORDER BY p.component_id ASC, ${orderByClause}
  ) sub
  ORDER BY ${orderByClause}, component_id ASC
  ${limitOffsetClause}  
  `;

  try {
    const result = await pool.query(query, params);
    log.debug('Consulta de IDs completada', { rowCount: result.rowCount });
    return result.rows.map((row) => row.component_id);
  } catch (error) {
    log.error('Error ejecutando consulta de componentes', { error: (error as Error).message, search, typeId, brandId });
    throw error;
  }
}

export async function getPricesByComponentId(componentId: string) {
  try {
    const result = await pool.query(
      `SELECT id, vendor_id, vendor_name, price, discount_price, recorded_at
       FROM public.prices
       WHERE component_id = $1
       ORDER BY price ASC`,
      [componentId],
    );

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
      recorded_at: row.recorded_at.toISOString().split('T')[0],
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

  let query = `
    SELECT COUNT(DISTINCT cm.component_id) as count
    FROM public.components_mirror cm
    LEFT JOIN public.prices p ON cm.component_id = p.component_id
    WHERE 1=1
  `;

  const params: any[] = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND cm.name_model ILIKE $${paramIndex}`;
    params.push(`%${search}%`);
    paramIndex++;
  }
  if (typeId) {
    query += ` AND cm.type_id = $${paramIndex}`;
    params.push(typeId);
    paramIndex++;
  }
  if (brandId) {
    query += ` AND cm.brand_id = $${paramIndex}`;
    params.push(brandId);
    paramIndex++;
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    query += ` AND COALESCE(p.discount_price, p.price) BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
    params.push(min, max);
    paramIndex += 2;
  }

  try {
    const result = await pool.query(query, params);
    const count = parseInt(result.rows[0].count) || 0;
    log.debug('Conteo de componentes completado', { count, search, typeId, brandId });
    return count;
  } catch (error) {
    log.error('Error al contar componentes', { error: (error as Error).message });
    throw error;
  }
}
