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
import { createLogger } from '@/lib/logger';

const log = createLogger('recommendations');

export async function getRecommendationsForBuild(buildComponents: BuildComponent[]): Promise<BuildRecommendations> {
  log.info('Generando recomendaciones para build', { componentCount: buildComponents.length });

  const missingTypeNames = getMissingTypes(buildComponents);
  log.debug('Tipos faltantes detectados', { missingTypes: missingTypeNames });

  if (missingTypeNames.length === 0) {
    log.info('Build completo, sin tipos de componentes faltantes');
  }

  const missingResults = await Promise.all(
    missingTypeNames.map(async (typeName) => {
      const candidates = (await getComponentsByTypeName(typeName, 20)) as Component[];
      if (candidates.length === 0) {
        log.warn('No se encontraron candidatos para tipo faltante', { typeName });
        return null;
      }

      const scored = scoreCandidates(candidates, buildComponents);
      const suggestions = scored.slice(0, 5);
      const reason = getMissingTypeReason(typeName, buildComponents);
      log.debug('Sugerencias generadas para tipo', { typeName, suggestionsCount: suggestions.length });
      return { type_name: typeName, reason, suggestions };
    }),
  );
  const missing = missingResults.filter((r) => r !== null);

  log.info('Recomendaciones de build generadas', { missingTypesWithSuggestions: missing.length });
  return { missing, upgrades: [] };
}

export async function getRecommendationsForComponent(componentId: string): Promise<ComponentRecommendations | null> {
  log.info('Generando recomendaciones para componente', { componentId });

  const component = await getComponentByStringId(componentId);
  if (!component) {
    log.warn('Componente no encontrado al generar recomendaciones', { componentId });
    return null;
  }

  const candidates = await getComponentsByTypeName(component.type_name, 20);
  log.debug('Candidatos similares encontrados', { componentId, typeName: component.type_name, count: candidates.length });

  const similar = candidates
    .filter((c) => c.id !== component.id)
    .map((c) => ({
      component: c,
      performanceScore: scorePerformance(c),
      valueScore: scoreValue(c),
      compatibilityScore: 1,
      totalScore: 0.5 * scorePerformance(c) + 0.5 * scoreValue(c),
      reasons: [`${Math.round(scorePerformance(c) * 100)}% performance`, `$${bestPrice(c).toLocaleString('es-CL')}`],
      isCompatible: true,
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5);

  log.info('Recomendaciones para componente generadas', { componentId, similarCount: similar.length });

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
