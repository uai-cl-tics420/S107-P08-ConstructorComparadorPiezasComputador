import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth/auth-client';
import type { SavedBuild, BuildComponent } from '../types/Frontend_types';

const STORAGE_KEY = 'pc-builder-saved-builds';

export function useSavedBuilds() {
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([]);
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  // Cargar builds según si el usuario está logueado o no
  useEffect(() => {
    if (isLoggedIn) {
      // Usuario logueado: cargar desde la base de datos
      fetch('/api/builds')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setSavedBuilds(data);
        })
        .catch(console.error);
    } else {
      // Sin sesión: cargar desde localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setSavedBuilds(JSON.parse(stored));
        } catch {
          setSavedBuilds([]);
        }
      }
    }
  }, [isLoggedIn]);

  const saveBuild = async (name: string, components: BuildComponent[]): Promise<SavedBuild> => {
    if (isLoggedIn) {
      // Guardar en la base de datos
      const res = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, components }),
      });
      const newBuild: SavedBuild = await res.json();
      setSavedBuilds((prev) => [newBuild, ...prev]);
      return newBuild;
    } else {
      // Guardar en localStorage
      const newBuild: SavedBuild = {
        id: Math.random().toString(36).slice(2),
        name,
        components,
        created_at: new Date().toISOString(),
      };
      const updated = [newBuild, ...savedBuilds];
      setSavedBuilds(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return newBuild;
    }
  };

  const deleteBuild = async (id: string) => {
    if (isLoggedIn) {
      // Eliminar de la base de datos
      await fetch(`/api/builds/${id}`, { method: 'DELETE' });
      setSavedBuilds((prev) => prev.filter((b) => b.id !== id));
    } else {
      // Eliminar de localStorage
      const updated = savedBuilds.filter((b) => b.id !== id);
      setSavedBuilds(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  return { savedBuilds, saveBuild, deleteBuild, isLoggedIn };
}
