import { bigint, index, numeric, pgTable, timestamp, uniqueIndex, uuid, varchar, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import { number } from 'better-auth';

export const componentsMirror = pgTable(
  'components_mirror',
  {
    component_id: uuid('component_id').primaryKey(),
    name_model: varchar('name_model', { length: 160 }).notNull(),
    type_id: uuid('type_id').notNull(),
    brand_id: uuid('brand_id'),
    synced_at: timestamp('synced_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => [
    index('idx_components_mirror_type_component').on(table.type_id, table.component_id),
    index('idx_components_mirror_name_model').on(table.name_model),
  ],
);

export const componentsMirrorRelations = relations(componentsMirror, ({ many }) => ({
  prices: many(prices),
}));

export const prices = pgTable(
  'prices',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    component_id: uuid('component_id')
      .notNull()
      .references(() => componentsMirror.component_id),
    vendor_id: uuid('vendor_id').notNull(),
    price: numeric('price', { precision: 12, scale: 2, mode: 'number' }).notNull(),
    discount_price: numeric('discount_price', { precision: 12, scale: 2, mode: 'number' }),
    recorded_at: timestamp('recorded_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    check('prices_price_positive', sql`${table.price} > 0`),
    check('prices_discount_positive', sql`${table.discount_price} > 0`),
    index('idx_prices_component_time').on(table.component_id, table.recorded_at.desc()),
    index('idx_prices_vendor_time').on(table.vendor_id, table.recorded_at.desc()),
    index('idx_prices_recorded_brin').using('brin', table.recorded_at),
    uniqueIndex('prices_component_vendor_recorded_key').on(table.component_id, table.vendor_id, table.recorded_at),
  ],
);

export const pricesRelations = relations(prices, ({ one }) => ({
  component: one(componentsMirror, {
    fields: [prices.component_id],
    references: [componentsMirror.component_id],
  }),
}));
