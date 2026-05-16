import { useState, useEffect } from 'react';
import type { BuildComponent } from '../types/Frontend_types';
import type { BuildRecommendations, ComponentRecommendations } from '../utils/recommendations';

export function useRecommendations(buildComponents: BuildComponent[]) {
  const [recommendations, setRecommendations] = useState<BuildRecommendations | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (buildComponents.length === 0) {
      setRecommendations(null);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/recommendations/build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ components: buildComponents }),
        });
        if (!res.ok) throw new Error('API error');
        const data: BuildRecommendations = await res.json();
        setRecommendations(data);
      } catch {
        setRecommendations(null);
      } finally {
        setLoading(false);
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [buildComponents]);

  return { recommendations, loading };
}

export function useComponentRecommendations(componentId: string | null) {
  const [recommendations, setRecommendations] = useState<ComponentRecommendations | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!componentId) {
      setRecommendations(null);
      return;
    }

    setLoading(true);

    fetch(`/api/recommendations/component/${componentId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setRecommendations(data))
      .catch(() => setRecommendations(null))
      .finally(() => setLoading(false));
  }, [componentId]);

  return { recommendations, loading };
}
