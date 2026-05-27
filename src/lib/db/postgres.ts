import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT!),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
});

export async function getComponentIdsByFilters(
  search?: string,
  typeId?: string,
  brandId?: string,
  minPrice?: number,
  maxPrice?: number,
  page: number = 1,
  limit: number = 16,
  sortBy: string = 'updated_at',
  sortOrder: -1 | 1 = -1,
) {
  const offset = (page - 1) * limit;
  const min = minPrice ?? 0;
  const max = maxPrice ?? Number.MAX_SAFE_INTEGER;
  const direction = sortOrder === 1 ? 'ASC' : 'DESC';

  let subquery = `
    SELECT DISTINCT ON (cm.component_id) 
      cm.component_id, 
      cm.synced_at, 
      cm.name_model, 
      COALESCE(p.discount_price, p.price) as price
    FROM public.components_mirror cm
    LEFT JOIN public.prices p ON cm.component_id = p.component_id
    WHERE 1=1
  `;

  const params: any[] = [];
  let paramIndex = 1;

  // Aplicar todos los filtros en la subconsulta
  if (search) {
    subquery += ` AND cm.name_model ILIKE $${paramIndex}`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (typeId) {
    subquery += ` AND cm.type_id = $${paramIndex}`;
    params.push(typeId);
    paramIndex++;
  }

  if (brandId) {
    subquery += ` AND cm.brand_id = $${paramIndex}`;
    params.push(brandId);
    paramIndex++;
  }

  // Filtro de precio
  if (minPrice !== undefined || maxPrice !== undefined) {
    subquery += ` AND COALESCE(p.discount_price, p.price) BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
    params.push(min, max);
    paramIndex += 2;
  }

  // DISTINCT ON requiere ORDER BY con el mismo campo primero
  subquery += ` ORDER BY cm.component_id, p.recorded_at DESC NULLS LAST`;

  // Query principal: ORDER BY y LIMIT/OFFSET finales
  let query = `SELECT component_id FROM (${subquery}) sub ORDER BY `;

  if (sortBy === 'name') {
    query += `sub.name_model ${direction}`;
  } else if (sortBy === 'price') {
    query += `sub.price ${direction}`;
  } else {
    // Default: updated_at (synced_at)
    query += `sub.synced_at ${direction}`;
  }

  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

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
