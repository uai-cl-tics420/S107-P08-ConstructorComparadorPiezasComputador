import { getComponentsByTypeName, getComponentByStringId } from './mongo';
import {
  scorePerformance,
  scoreValue,
  scoreCandidates,
  getMissingTypes,
  getMissingTypeReason,
  bestPrice,
} from '@/utils/recommendations';
import type { BuildComponent, Component } from '@/types/Frontend_types';
import type { BuildRecommendations, ComponentRecommendations } from '@/utils/recommendations';

export async function getRecommendationsForBuild(
  buildComponents: BuildComponent[],
): Promise<BuildRecommendations> {
  const buildComps: BuildComponent[] = [];
  const componentMap = new Map<string, Component>();

  for (const bc of buildComponents) {
    const comp = await getComponentByStringId(String(bc.component.id));
    if (comp) {
      buildComps.push(bc);
      componentMap.set(String(bc.component.id), comp);
    }
  }

  const missingTypeNames = getMissingTypes(buildComps);
  const missing = [];

  for (const typeName of missingTypeNames) {
    const candidates = await getComponentsByTypeName(typeName, 60);
    if (candidates.length === 0) continue;

    const scored = scoreCandidates(candidates, buildComps);
    const suggestions = scored.slice(0, 5);
    const reason = getMissingTypeReason(typeName, buildComps);

    missing.push({
      type_name: typeName,
      reason,
      suggestions,
    });
  }

  const upgrades = [];
  for (const bc of buildComps) {
    const comp = componentMap.get(String(bc.component.id));
    if (!comp) continue;

    const candidates = await getComponentsByTypeName(comp.type_name, 60);
    if (candidates.length <= 1) continue;

    const currentPrice = bestPrice(comp);
    const scored = scoreCandidates(candidates, buildComps, currentPrice);
    const filtered = scored
      .filter((s) => s.component.id !== comp.id)
      .filter(
        (s) =>
          (s.performanceScore - scorePerformance(comp) >= 0.05) ||
          (bestPrice(s.component) < currentPrice * 0.8),
      )
      .slice(0, 3);

    if (filtered.length > 0) {
      upgrades.push({
        current: comp,
        type_name: comp.type_name,
        alternatives: filtered,
      });
    }
  }

  return { missing, upgrades };
}

export async function getRecommendationsForComponent(
  componentId: string,
): Promise<ComponentRecommendations | null> {
  const component = await getComponentByStringId(componentId);
  if (!component) return null;

  const candidates = await getComponentsByTypeName(component.type_name, 60);

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
