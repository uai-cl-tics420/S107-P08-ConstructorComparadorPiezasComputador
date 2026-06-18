import { z } from 'zod';
import validator from 'validator';

// Generic schemas
export const textSchema = z
  .string({
    error: 'String no válido',
  })
  .min(1, 'El campo no puede estar vacío')
  .max(255, 'El texto supera el largo máximo permitido para la base de datos')
  .trim()
  .transform((val) => validator.escape(val));

export const numericSchema = z
  .number({
    error: 'Número no valido',
  })
  .min(-999999999.99, 'El valor es demasiado bajo para ser procesado')
  .max(999999999.99, 'El valor es demasiado alto para ser procesado');

export const uuidSchema = z.uuid('UUID no válido');

export const numericIdSchema = z.coerce.number('ID numérico no válido').int('ID no entero').positive('ID no positivo');

// Frontent_types schemas
export const priceSchema = z.object({
  id: numericIdSchema,
  component_id: uuidSchema,
  vendor_id: uuidSchema,
  vendor_name: textSchema,
  price: numericSchema,
  recorded_at: z.iso.date('Date format mismatch, expected: YY-MM-DD'),
});

export const specsSchema = z
  .object({
    socket: textSchema.optional(),
    ram_type: textSchema.optional(),
    tdp: numericSchema.optional(),
    form_factor: textSchema.optional(),
    storage_type: textSchema.optional(),
    wattage: numericSchema.optional(),
  })
  .catchall(z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.string())]).optional());
export const componentSchema = z.object({
  id: uuidSchema,
  type_id: uuidSchema,
  type_name: textSchema,
  brand_id: uuidSchema,
  brand_name: textSchema,
  name: textSchema,
  model: textSchema,
  prices: z.array(priceSchema),
  specs: specsSchema.optional(),
});

export const buildComponentSchema = z.object({
  component: componentSchema,
  quantity: numericSchema.positive('La cantidad debe ser positiva'),
});
