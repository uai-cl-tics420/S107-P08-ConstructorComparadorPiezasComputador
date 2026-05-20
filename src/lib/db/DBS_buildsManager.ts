import { Db } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import type { BuildComponent } from '@/types/Frontend_types';

export interface SavedBuildDB {
  _id: string;
  user_id: string;
  name: string;
  components: BuildComponent[];
  created_at: Date;
}

// Obtener todos los builds guardados de un usuario
export async function getUserBuilds(db: Db, userId: string): Promise<SavedBuildDB[]> {
  return db
    .collection<SavedBuildDB>('saved_builds')
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .toArray();
}

// Crear un nuevo build para un usuario
export async function createUserBuild(
  db: Db,
  userId: string,
  name: string,
  components: BuildComponent[],
): Promise<SavedBuildDB> {
  const build: SavedBuildDB = {
    _id: uuidv4(),
    user_id: userId,
    name,
    components,
    created_at: new Date(),
  };
  await db.collection<SavedBuildDB>('saved_builds').insertOne(build);
  return build;
}

// Eliminar un build de un usuario (solo puede eliminar los suyos)
export async function deleteUserBuild(db: Db, buildId: string, userId: string): Promise<boolean> {
  const result = await db
    .collection<SavedBuildDB>('saved_builds')
    .deleteOne({ _id: buildId, user_id: userId });
  return result.deletedCount > 0;
}

// Obtener un build (por share id, o normal id, es publico para leer)
export async function getSharedBuild(db: Db, buildId: string): Promise<SavedBuildDB | null> {
  return db.collection<SavedBuildDB>('saved_builds').findOne({ _id: buildId });
}

// Crear un build compartido (sin user_id)
export async function createSharedBuild(
  db: Db,
  name: string,
  components: BuildComponent[],
): Promise<SavedBuildDB> {
  const build: SavedBuildDB = {
    _id: Math.random().toString(36).slice(2, 12),
    user_id: 'shared',
    name,
    components,
    created_at: new Date(),
  };
  await db.collection<SavedBuildDB>('saved_builds').insertOne(build);
  return build;
}
