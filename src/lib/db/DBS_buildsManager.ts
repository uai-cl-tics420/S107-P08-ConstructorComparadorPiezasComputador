import { Db } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import type { BuildComponent } from '@/types/Frontend_types';
import { createLogger } from '@/lib/logger';

const log = createLogger('builds');

export interface SavedBuildDB {
  _id: string;
  user_id: string;
  name: string;
  components: BuildComponent[];
  created_at: Date;
}

// Obtener todos los builds guardados de un usuario
export async function getUserBuilds(db: Db, userId: string): Promise<SavedBuildDB[]> {
  log.debug('Obteniendo builds del usuario', { userId });
  const builds = await db
    .collection<SavedBuildDB>('saved_builds')
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .toArray();
  log.info('Builds obtenidos', { userId, count: builds.length });
  return builds;
}

// Crear un nuevo build para un usuario
export async function createUserBuild(
  db: Db,
  userId: string,
  name: string,
  components: BuildComponent[],
): Promise<SavedBuildDB> {
  log.info('Creando nuevo build', { userId, name, componentCount: components.length });

  const build: SavedBuildDB = {
    _id: uuidv4(),
    user_id: userId,
    name,
    components,
    created_at: new Date(),
  };

  try {
    await db.collection<SavedBuildDB>('saved_builds').insertOne(build);
    log.info('Build creado exitosamente', { buildId: build._id, userId });
    return build;
  } catch (error) {
    log.error('Error al crear build', { userId, name, error: (error as Error).message });
    throw error;
  }
}

// Eliminar un build de un usuario (solo puede eliminar los suyos)
export async function deleteUserBuild(db: Db, buildId: string, userId: string): Promise<boolean> {
  log.info('Eliminando build', { buildId, userId });

  try {
    const result = await db
      .collection<SavedBuildDB>('saved_builds')
      .deleteOne({ _id: buildId, user_id: userId });

    if (result.deletedCount === 0) {
      log.warn('Build no encontrado o no pertenece al usuario', { buildId, userId });
      return false;
    }

    log.info('Build eliminado exitosamente', { buildId, userId });
    return true;
  } catch (error) {
    log.error('Error al eliminar build', { buildId, userId, error: (error as Error).message });
    throw error;
  }
}

// Obtener un build (por share id, o normal id, es publico para leer)
export async function getSharedBuild(db: Db, buildId: string): Promise<SavedBuildDB | null> {
  log.debug('Buscando build compartido', { buildId });
  const build = await db.collection<SavedBuildDB>('saved_builds').findOne({ _id: buildId });
  if (!build) {
    log.warn('Build compartido no encontrado', { buildId });
  }
  return build;
}

// Crear un build compartido (sin user_id)
export async function createSharedBuild(
  db: Db,
  name: string,
  components: BuildComponent[],
): Promise<SavedBuildDB> {
  log.info('Creando build compartido', { name, componentCount: components.length });

  const build: SavedBuildDB = {
    _id: Math.random().toString(36).slice(2, 12),
    user_id: 'shared',
    name,
    components,
    created_at: new Date(),
  };

  try {
    await db.collection<SavedBuildDB>('saved_builds').insertOne(build);
    log.info('Build compartido creado', { buildId: build._id });
    return build;
  } catch (error) {
    log.error('Error al crear build compartido', { name, error: (error as Error).message });
    throw error;
  }
}
