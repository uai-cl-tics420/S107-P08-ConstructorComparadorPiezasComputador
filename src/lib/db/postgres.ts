import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './PostgreSQL_schema';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT!),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
});

export const db = drizzle(pool, { schema });

export async function getComponentIdsByFilters( // Retrieves a list of Mongo component IDs to match search parameters
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
  // Obtain implicit parameters
  const offset = (page - 1) * limit;
  const direction = sortOrder === 1 ? 'ASC' : 'DESC';

  // Build dynamic query sections
  const params: any[] = []; // Array to hold parameter values to be passed to the final query

  // Filters
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

  // Construct query clauses
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

  const result = await pool.query(query, params);
  return result.rows.map((row) => row.component_id);
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

    return result.rows.map((row: any) => ({
      id: row.id,
      component_id: componentId,
      vendor_id: row.vendor_id,
      vendor_name: row.vendor_name || 'SoloTodo',
      price: parseInt(row.discount_price) || parseInt(row.price),
      recorded_at: row.recorded_at.toISOString().split('T')[0],
    }));
  } catch (error) {
    console.error('Error fetching prices for component', componentId, ':', error);
    return [];
  }
}

export async function getComponentCountByFilters( // Obtains the total count of components matching the search filters
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
  `; // Base query

  const params: any[] = [];
  let paramIndex = 1;

  // Add filters
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

  const result = await pool.query(query, params);
  return parseInt(result.rows[0].count) || 0;
}
