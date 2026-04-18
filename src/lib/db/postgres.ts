import { Client } from 'pg';
import { getVendorById } from './mongo';

const client = new Client({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT!),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

// Initialize connection
await client.connect();

export async function getPricesByComponentId(componentId: string) {
  try {
    const result = await client.query(
      `SELECT id, vendor_id, vendor_name, price, discount_price, recorded_at
       FROM public.prices
       WHERE component_id = $1
       ORDER BY price ASC
       LIMIT 5`,
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
