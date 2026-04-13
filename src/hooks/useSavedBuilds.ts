import { useState, useEffect } from "react";
import type { SavedBuild, BuildComponent } from "../types";

const STORAGE_KEY = "pc-builder-saved-builds";

export function useSavedBuilds() {
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setSavedBuilds(JSON.parse(stored));
  }, []);

  const saveBuild = (name: string, components: BuildComponent[]) => {
    const newBuild: SavedBuild = {
      id: Math.random().toString(36).slice(2),
      name,
      components,
      created_at: new Date().toISOString(),
    };
    const updated = [...savedBuilds, newBuild];
    setSavedBuilds(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newBuild;
  };

  const deleteBuild = (id: string) => {
    const updated = savedBuilds.filter(b => b.id !== id);
    setSavedBuilds(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return { savedBuilds, saveBuild, deleteBuild };
}
