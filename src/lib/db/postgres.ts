import { Client } from 'pg';

const client = new Client({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'pc_builder',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres123',
});

// Initialize connection
await client.connect();

export async function getPricesByComponentId(componentId: string) {
  try {
    const result = await client.query(
      `SELECT id, vendor_id, price, recorded_at
       FROM public.prices
       WHERE component_id = $1
       ORDER BY recorded_at DESC
       LIMIT 10`,
      [componentId]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      component_id: componentId,
      vendor_id: row.vendor_id,
      vendor_name: 'SoloTodo',
      price: parseInt(row.price),
      recorded_at: row.recorded_at.toISOString().split('T')[0],
    }));
  } catch (error) {
    console.error('Error fetching prices for component', componentId, ':', error);
    return [];
  }
}
