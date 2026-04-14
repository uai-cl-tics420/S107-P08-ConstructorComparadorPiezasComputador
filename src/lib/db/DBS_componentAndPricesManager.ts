import { Db } from 'mongodb';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import {
  type Component,
  type ComponentMirror,
  type Brand,
  type ComponentType,
  type Vendor,
} from '@/types/Database_types';

// Interface types for CRUD operations

interface ComponentData {
  type_id: string; // UUID
  brand_id?: string | null; // UUID opcional
  name_model: string;
  specs: Record<string, any>;
  requirements: Record<string, any>;
}

interface CreateComponentResponse {
  success: boolean;
  component_id?: string;
  error?: string;
}

interface UpdateComponentData {
  _id: string; // Component ID is required
  type_id?: string;
  brand_id?: string | null;
  name_model?: string;
  specs?: Record<string, any>;
  requirements?: Record<string, any>;
}

interface UpdateComponentResponse {
  success: boolean;
  component_id?: string;
  error?: string;
}
interface PriceData {
  component_id: string; // UUID
  vendor_id: string; // UUID
  price: number;
  discount_price?: number;
}

interface CreatePriceResponse {
  success: boolean;
  price_id?: number;
  error?: string;
}

interface CreateBrandResponse {
  success: boolean;
  brand_id?: string;
  error?: string;
}

interface UpdateBrandResponse {
  success: boolean;
  brand?: Brand;
  error?: string;
}

interface CreateTypeResponse {
  success: boolean;
  type_id?: string;
  error?: string;
}

interface UpdateTypeResponse {
  success: boolean;
  type?: ComponentType;
  error?: string;
}

interface CreateVendorResponse {
  success: boolean;
  vendor_id?: string;
  error?: string;
}

interface UpdateVendorResponse {
  success: boolean;
  vendor?: Vendor;
  error?: string;
}

interface GetIDResponse {
  success: boolean;
  id?: string;
  error?: string;
}

interface DeleteResponse {
  success: boolean;
  error?: string;
}

// Component CRUD operations

export async function createComponent(
  mongoDb: Db,
  pgPool: Pool,
  componentData: ComponentData,
): Promise<CreateComponentResponse> {
  const componentId = uuidv4(); // Generate a new UUID
  const now = new Date(); // Get current timestamp for registry creation

  try {
    await mongoDb.collection<Component>('components').insertOne({
      // Insert into MongoDB collection
      _id: componentId,
      type_id: componentData.type_id,
      brand_id: componentData.brand_id || null,
      name_model: componentData.name_model,
      specs: componentData.specs,
      requirements: componentData.requirements,
      created_at: now,
      updated_at: now,
    });

    const mirrorData: ComponentMirror = {
      // Cast data into mirror type
      component_id: componentId,
      type_id: componentData.type_id,
      brand_id: componentData.brand_id || null,
      synced_at: now,
    };

    await pgPool.query(
      // Insert into PostgreSQL mirror table
      `INSERT INTO public.components_mirror (component_id, type_id, brand_id, synced_at)
       VALUES ($1, $2, $3, $4)`,
      Object.values(mirrorData),
    );

    return {
      success: true,
      component_id: componentId,
    };
  } catch (error) {
    console.error('Error creating component:', error);

    try {
      // attempt to erase MongoDB record
      await mongoDb.collection<Component>('components').deleteOne({ _id: componentId });
    } catch (cleanupError) {
      console.error('Error cleaning up MongoDB:', cleanupError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error creando componente',
    };
  }
}

export async function updateComponent(
  mongoDb: Db,
  pgPool: Pool,
  updateData: UpdateComponentData,
): Promise<UpdateComponentResponse> {
  const { _id: componentId, ...updateFields } = updateData;
  const now = new Date();

  // Save current state of target component
  const currentComponent = await mongoDb.collection<Component>('components').findOne({ _id: componentId });

  if (!currentComponent) {
    return {
      success: false,
      error: 'Component not found in MongoDB',
    };
  }

  const mongoUpdateFields = {
    // Create obect for field recognition
    ...updateFields,
    updated_at: now,
  };

  try {
    await mongoDb.collection<Component>('components').updateOne({ _id: componentId }, { $set: mongoUpdateFields }); // Update MongoDB

    const pgUpdateFields: Record<string, any> = {}; // Object for field recognition
    if (updateFields.type_id) pgUpdateFields.type_id = updateFields.type_id; // only allows non null value update
    if ('brand_id' in updateFields) pgUpdateFields.brand_id = updateFields.brand_id; // allows null update
    pgUpdateFields.synced_at = now;

    const setClause = Object.keys(pgUpdateFields) // set of fields to be updated and their position in the array
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');

    const values = [...Object.values(pgUpdateFields), componentId]; // array of values for to be updated fields

    await pgPool.query(
      // update PostgreSQL mirror table
      `UPDATE public.components_mirror SET ${setClause} WHERE component_id = $${values.length}`,
      values,
    );

    return {
      success: true,
      component_id: componentId,
    };
  } catch (error) {
    console.error('Error updating component:', error);

    try {
      // attempt to rollback MongoDB update
      await mongoDb.collection<Component>('components').updateOne(
        { _id: componentId },
        {
          $set: {
            type_id: currentComponent.type_id,
            brand_id: currentComponent.brand_id,
            name_model: currentComponent.name_model,
            specs: currentComponent.specs,
            requirements: currentComponent.requirements,
            updated_at: currentComponent.updated_at,
          },
        },
      );
    } catch (rollbackError) {
      console.error('Error rolling back MongoDB:', rollbackError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error actualizando componente',
    };
  }
}

export async function getComponentID(mongoDb: Db, name_model: string): Promise<GetIDResponse> {
  try {
    const component = await mongoDb.collection<Component>('components').findOne({ name_model }); // search component by name model

    if (!component) {
      return {
        success: false,
        error: 'Componente no encontrado',
      };
    }

    return {
      // on success return component ID
      success: true,
      id: component._id,
    };
  } catch (error) {
    console.error('Error getting component ID:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo ID del componente',
    };
  }
}

export async function deleteComponent(mongoDb: Db, pgPool: Pool, componentId: string): Promise<DeleteResponse> {
  // 1. Buscamos el componente antes de borrarlo para tener una copia de respaldo
  const componentToRestore = await mongoDb.collection<Component>('components').findOne({ _id: componentId });

  if (!componentToRestore) {
    return { success: false, error: 'Componente no encontrado en MongoDB' };
  }

  try {
    // Attempt to delete MongoDB document first
    await mongoDb.collection<Component>('components').deleteOne({ _id: componentId });

    try {
      // Attempt to delete PostgreSQL mirror record
      await pgPool.query('DELETE FROM public.components_mirror WHERE component_id = $1', [componentId]);
      return { success: true };
    } catch (pgError) {
      // On fail attempt to rollback MongoDB deletion
      console.error('Error deleting from PG, rolling back Mongo:', pgError);

      await mongoDb.collection<Component>('components').insertOne(componentToRestore); // Insert the document back

      return {
        success: false,
        error: `Error en base de datos relacional. La eliminación ha sido revertida: ${pgError instanceof Error ? pgError.message : 'Error desconocido'}`,
      };
    }
  } catch (error) {
    // on fail end early
    console.error('Error deleting component:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error eliminando componente' };
  }
}

// Price operations
/* 
Under no circumstance a price should be updated or deleted, only cerated.
These represent a history record, not malleable objects.
Price records are also not to be accesed by id directly, but only through queries by component_id
*/

export async function createPrice(pgPool: Pool, priceData: PriceData): Promise<CreatePriceResponse> {
  try {
    const recordedAt = new Date();

    const result = await pgPool.query(
      `INSERT INTO public.prices (component_id, vendor_id, price, discount_price, recorded_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [priceData.component_id, priceData.vendor_id, priceData.price, priceData.discount_price || null, recordedAt],
    );

    const priceId = result.rows[0].id;

    return {
      success: true,
      price_id: priceId,
    };
  } catch (error) {
    console.error('Error creating price:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error creando precio',
    };
  }
}

// Brand CRUD operations

export async function createBrand(mongoDb: Db, name: string): Promise<CreateBrandResponse> {
  const brandId = uuidv4();
  try {
    await mongoDb.collection<Brand>('brands').insertOne({ _id: brandId, name });
    return { success: true, brand_id: brandId };
  } catch (error) {
    console.error('Error creating brand:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error creando marca' };
  }
}

export async function updateBrand(mongoDb: Db, brandId: string, name: string): Promise<UpdateBrandResponse> {
  try {
    const result = await mongoDb
      .collection<Brand>('brands')
      .findOneAndUpdate({ _id: brandId }, { $set: { name } }, { returnDocument: 'after' }); // Updates document and returns it

    if (!result) return { success: false, error: 'Marca no encontrada' };

    return {
      success: true,
      brand: result,
    };
  } catch (error) {
    console.error('Error updating brand:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error actualizando marca' };
  }
}

export async function getBrandID(mongoDb: Db, name: string): Promise<GetIDResponse> {
  try {
    const brand = await mongoDb.collection<Brand>('brands').findOne({ name });
    if (!brand) return { success: false, error: 'Marca no encontrada' };
    return { success: true, id: brand._id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error obteniendo ID de marca' };
  }
}

export async function deleteBrand(mongoDb: Db, brandId: string): Promise<DeleteResponse> {
  try {
    const result = await mongoDb.collection<Brand>('brands').deleteOne({ _id: brandId });
    if (result.deletedCount === 0) return { success: false, error: 'Marca no encontrada' };
    return { success: true };
  } catch (error) {
    console.error('Error deleting brand:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error eliminando marca' };
  }
}

// Component Type CRUD operations

export async function createComponentType(mongoDb: Db, name: string): Promise<CreateTypeResponse> {
  const typeId = uuidv4();
  try {
    await mongoDb.collection<ComponentType>('component_types').insertOne({ _id: typeId, name });
    return { success: true, type_id: typeId };
  } catch (error) {
    console.error('Error creating component type:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error creando tipo de componente' };
  }
}

export async function updateComponentType(mongoDb: Db, typeId: string, name: string): Promise<UpdateTypeResponse> {
  try {
    const result = await mongoDb
      .collection<ComponentType>('component_types')
      .findOneAndUpdate({ _id: typeId }, { $set: { name } }, { returnDocument: 'after' }); // Updates document and returns it

    if (!result) return { success: false, error: 'Tipo de componente no encontrado' };

    return {
      success: true,
      type: result,
    };
  } catch (error) {
    console.error('Error updating type:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error actualizando tipo' };
  }
}

export async function getComponentTypeID(mongoDb: Db, name: string): Promise<GetIDResponse> {
  try {
    const type = await mongoDb.collection<ComponentType>('component_types').findOne({ name });
    if (!type) return { success: false, error: 'Tipo no encontrado' };
    return { success: true, id: type._id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error obteniendo ID de tipo' };
  }
}

export async function deleteComponentType(mongoDb: Db, typeId: string): Promise<DeleteResponse> {
  try {
    const result = await mongoDb.collection<ComponentType>('component_types').deleteOne({ _id: typeId });
    if (result.deletedCount === 0) return { success: false, error: 'Tipo no encontrado' };
    return { success: true };
  } catch (error) {
    console.error('Error deleting type:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error eliminando tipo' };
  }
}

// Vendor CRUD operations

export async function createVendor(mongoDb: Db, name: string): Promise<CreateVendorResponse> {
  const vendorId = uuidv4();
  try {
    await mongoDb.collection<Vendor>('vendors').insertOne({ _id: vendorId, name });
    return { success: true, vendor_id: vendorId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error creando vendedor' };
  }
}

export async function updateVendor(mongoDb: Db, vendorId: string, name: string): Promise<UpdateVendorResponse> {
  try {
    const result = await mongoDb
      .collection<Vendor>('vendors')
      .findOneAndUpdate({ _id: vendorId }, { $set: { name } }, { returnDocument: 'after' }); // Updates document and returns it

    if (!result) return { success: false, error: 'Vendedor no encontrado' };

    return {
      success: true,
      vendor: result,
    };
  } catch (error) {
    console.error('Error updating vendor:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error actualizando vendedor' };
  }
}

export async function getVendorID(mongoDb: Db, name: string): Promise<GetIDResponse> {
  try {
    const vendor = await mongoDb.collection<Vendor>('vendors').findOne({ name });
    if (!vendor) return { success: false, error: 'Vendedor no encontrado' };
    return { success: true, id: vendor._id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error obteniendo ID de vendedor' };
  }
}

export async function deleteVendor(mongoDb: Db, vendorId: string): Promise<DeleteResponse> {
  try {
    const result = await mongoDb.collection<Vendor>('vendors').deleteOne({ _id: vendorId });
    if (result.deletedCount === 0) return { success: false, error: 'Vendedor no encontrado' };
    return { success: true };
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error eliminando vendedor' };
  }
}
