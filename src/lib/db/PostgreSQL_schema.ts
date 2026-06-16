import { bigint, index, numeric, pgTable, timestamp, uniqueIndex, uuid, varchar, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const componentsMirror = pgTable(
  'components_mirror',
  {
    componentId: uuid('component_id').primaryKey(),
    name: varchar('name_model', { length: 160 }).notNull(),
    typeId: uuid('type_id').notNull(),
    brandId: uuid('brand_id'),
    syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_components_mirror_type_component').on(table.typeId, table.componentId),
    index('idx_components_mirror_name_model').on(table.name),
  ],
);

export const prices = pgTable(
  'prices',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    componentId: uuid('component_id')
      .notNull()
      .references(() => componentsMirror.componentId),
    vendorId: uuid('vendor_id').notNull(),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    discountPrice: numeric('discount_price', { precision: 12, scale: 2 }),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check('prices_price_positive', sql`${table.price} > 0`),
    check('prices_discount_positive', sql`${table.discountPrice} > 0`),
    index('idx_prices_component_time').on(table.componentId, table.recordedAt.desc()),
    index('idx_prices_vendor_time').on(table.vendorId, table.recordedAt.desc()),
    index('idx_prices_recorded_brin').using('brin', table.recordedAt),
    uniqueIndex('prices_component_vendor_recorded_key').on(table.componentId, table.vendorId, table.recordedAt),
  ],
);
