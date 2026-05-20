import { getComponentsByTypeName, getComponentByStringId } from './mongo';
import {
  scorePerformance,
  scoreValue,
  scoreCandidates,
  getMissingTypes,
  getMissingTypeReason,
} from '@/utils/recommendations';
import type { BuildComponent, Component } from '@/types/Frontend_types';
import type { BuildRecommendations, ComponentRecommendations } from '@/utils/recommendations';

export async function getRecommendationsForBuild(
  buildComponents: BuildComponent[],
): Promise<BuildRecommendations> {
  // Usar directamente los buildComponents del frontend — ya tienen type_name correcto
  const missingTypeNames = getMissingTypes(buildComponents);

  const missingResults = await Promise.all(
    missingTypeNames.map(async (typeName) => {
      const candidates = await getComponentsByTypeName(typeName, 20);
      if (candidates.length === 0) return null;
      const scored = scoreCandidates(candidates, buildComponents);
      const suggestions = scored.slice(0, 5);
      const reason = getMissingTypeReason(typeName, buildComponents);
      return { type_name: typeName, reason, suggestions };
    }),
  );
  const missing = missingResults.filter((r) => r !== null);

  return { missing, upgrades: [] };
}

export async function getRecommendationsForComponent(
  componentId: string,
): Promise<ComponentRecommendations | null> {
  const component = await getComponentByStringId(componentId);
  if (!component) return null;

  const candidates = await getComponentsByTypeName(component.type_name, 20);

  const similar = candidates
    .filter((c) => c.id !== component.id)
    .map((c) => ({
      component: c,
      performanceScore: scorePerformance(c),
      valueScore: scoreValue(c),
      compatibilityScore: 1,
      totalScore: 0.5 * scorePerformance(c) + 0.5 * scoreValue(c),
      reasons: [
        `${Math.round(scorePerformance(c) * 100)}% performance`,
        `$${bestPrice(c).toLocaleString('es-CL')}`,
      ],
      isCompatible: true,
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5);

  return {
    component,
    complementary: [
      {
        type_name: 'Similar Models',
        reason: 'Alternatives with similar specs and price',
        suggestions: similar,
      },
    ],
  };
}
