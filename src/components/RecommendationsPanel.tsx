import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, ChevronDown, ChevronRight, Loader2, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Component } from '../types/Frontend_types';
import type { BuildRecommendations, ScoredComponent } from '../utils/recommendations';
import { bestPrice } from '../utils/recommendations';

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className='h-0.5 w-full bg-tw-border-deep rounded-full overflow-hidden'>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(value * 100)}%` }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
}

const TYPE_ACCENT: Record<string, string> = {
  CPU: 'tw-cpu',
  GPU: 'tw-gpu',
  RAM: 'tw-ram',
  Motherboard: 'tw-motherboard',
  Storage: 'tw-storage',
  PSU: 'tw-psu',
  Case: 'tw-case',
  'CPU Cooler': 'tw-cooler',
};

interface RecommendationCardProps {
  scored: ScoredComponent;
  onAdd: (component: Component) => void;
  rank: number;
}

function RecommendationCard({ scored, onAdd, rank }: RecommendationCardProps) {
  const { t } = useTranslation();
  const { component, totalScore, compatibilityScore, performanceScore, valueScore, reasons } = scored;
  const price = bestPrice(component);
  const accent = TYPE_ACCENT[component.type_name] ?? 'tw-case';
  const topReasons = reasons.slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      className='group relative rounded-lg border border-tw-border-deep bg-tw-base hover:bg-tw-surface hover:border-tw-glass/25 transition-all duration-250 p-3 flex flex-col gap-2.5'>
      <div className='absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-linear-to-r from-transparent via-tw-glass/6 to-transparent' />

      <div className='flex items-start justify-between gap-2'>
        <div className='flex items-center gap-1.5 min-w-0'>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 bg-${accent}`} />
          <p className='font-semibold text-xs text-tw-primary leading-tight line-clamp-2'>{component.name}</p>
        </div>
        <span className='font-mono text-[0.6rem] text-tw-muted-deep border border-tw-glass/8 px-1.5 py-0.5 rounded shrink-0'>
          #{rank + 1}
        </span>
      </div>

      <p className='font-mono text-[0.6rem] text-tw-muted-deep uppercase tracking-widest -mt-1'>
        {component.brand_name}
      </p>

      {topReasons.length > 0 && (
        <div className='flex flex-col gap-1'>
          {topReasons.map((r, i) => (
            <div key={i} className='flex items-start gap-1.5'>
              <span className='text-tw-muted-deep mt-px shrink-0 text-[0.6rem]'>›</span>
              <span className='font-mono text-[0.6rem] text-tw-muted leading-tight'>{r}</span>
            </div>
          ))}
        </div>
      )}

      <div className='space-y-1.5 pt-1'>
        <div className='flex items-center gap-2'>
          <span className='font-mono text-[0.5rem] text-tw-muted-deep w-14 shrink-0'>
            {t('recommendations.compat')}
          </span>
          <ScoreBar value={compatibilityScore} color='bg-tw-cpu' />
          <span className='font-mono text-[0.5rem] text-tw-muted-deep tabular-nums w-6 text-right'>
            {Math.round(compatibilityScore * 100)}
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='font-mono text-[0.5rem] text-tw-muted-deep w-14 shrink-0'>{t('recommendations.perf')}</span>
          <ScoreBar value={performanceScore} color='bg-tw-gpu' />
          <span className='font-mono text-[0.5rem] text-tw-muted-deep tabular-nums w-6 text-right'>
            {Math.round(performanceScore * 100)}
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='font-mono text-[0.5rem] text-tw-muted-deep w-14 shrink-0'>{t('recommendations.value')}</span>
          <ScoreBar value={valueScore} color='bg-tw-ram' />
          <span className='font-mono text-[0.5rem] text-tw-muted-deep tabular-nums w-6 text-right'>
            {Math.round(valueScore * 100)}
          </span>
        </div>
      </div>

      <div className='flex items-center justify-between pt-1 border-t border-tw-border-deep gap-2'>
        <div className='min-w-0'>
          <p className='font-mono text-[0.5rem] text-tw-muted-deep'>{t('recommendations.bestPrice')}</p>
          <p className='font-bold text-sm text-tw-primary tabular-nums'>${price.toLocaleString('es-CL')}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: '0 0 12px rgba(255,255,255,0.15)' }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onAdd(component)}
          className='flex items-center gap-1 px-2.5 py-1.5 bg-tw-glass text-tw-base font-bold font-mono text-[0.6rem] rounded-md transition-colors cursor-pointer shrink-0'>
          <Plus className='w-2.5 h-2.5' />
          {t('recommendations.add')}
        </motion.button>
      </div>

      <div className='absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
        <span className='font-mono text-[0.5rem] text-tw-muted-deep border border-tw-glass/8 bg-tw-surface px-1 py-0.5 rounded'>
          {Math.round(totalScore * 100)}%
        </span>
      </div>
    </motion.div>
  );
}

interface SectionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, subtitle, icon, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className='flex flex-col gap-3'>
      <button
        onClick={() => setOpen(!open)}
        className='flex items-center justify-between w-full text-left cursor-pointer group'>
        <div className='flex items-center gap-2'>
          <span className='text-tw-muted-deep group-hover:text-tw-muted transition-colors'>{icon}</span>
          <div>
            <p className='font-mono text-[0.6rem] uppercase tracking-widest text-tw-muted group-hover:text-tw-muted-highlight transition-colors'>
              {title}
            </p>
            <p className='font-mono text-[0.5rem] text-tw-muted-deep'>{subtitle}</p>
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-tw-muted-deep transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TypeGroupProps {
  typeName: string;
  reason: string;
  suggestions: ScoredComponent[];
  onAdd: (c: Component) => void;
}

function TypeGroup({ typeName, reason, suggestions, onAdd }: TypeGroupProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const accent = TYPE_ACCENT[typeName] ?? 'tw-case';
  const visible = expanded ? suggestions : suggestions.slice(0, 2);
  const hiddenCount = suggestions.length - 2;

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center gap-2'>
        <span className={`w-1.5 h-1.5 rounded-full bg-${accent} shrink-0`} />
        <div className='flex-1 min-w-0'>
          <span className='font-mono text-[0.6rem] uppercase tracking-widest text-tw-muted-highlight'>{typeName}</span>
          <span className='font-mono text-[0.5rem] text-tw-muted-deep ml-2'>— {reason}</span>
        </div>
      </div>
      <div className='grid grid-cols-1 gap-2'>
        {visible.map((s, i) => (
          <RecommendationCard key={s.component.id} scored={s} onAdd={onAdd} rank={i} />
        ))}
      </div>
      {suggestions.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className='flex items-center gap-1 font-mono text-[0.6rem] text-tw-muted-deep hover:text-tw-muted transition-colors cursor-pointer self-start'>
          <ChevronRight className={`w-3 h-3 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`} />
          {expanded ? t('recommendations.seeLess') : t('recommendations.seeMore', { count: hiddenCount })}
        </button>
      )}
    </div>
  );
}

interface Props {
  recommendations: BuildRecommendations | null;
  loading: boolean;
  onAdd: (component: Component) => void;
}

export function RecommendationsPanel({ recommendations, loading, onAdd }: Props) {
  const { t } = useTranslation();
  const hasMissing = (recommendations?.missing.length ?? 0) > 0;
  const isEmpty = !loading && !hasMissing;
  const missingCount = recommendations?.missing.length ?? 0;

  return (
    <div className='relative rounded-xl border border-tw-border-deep bg-tw-surface-deep/80 backdrop-blur-xl p-4 flex flex-col gap-4'>
      <div className='absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-linear-to-r from-transparent via-tw-glass/8 to-transparent' />

      <div className='flex items-center gap-2'>
        <Sparkles className='w-3.5 h-3.5 text-tw-muted-deep' />
        <div>
          <p className='font-mono text-[0.6rem] uppercase tracking-widest text-tw-muted'>
            {t('recommendations.title')}
          </p>
          <p className='font-mono text-[0.5rem] text-tw-muted-deep'>{t('recommendations.subtitle')}</p>
        </div>
        {loading && <Loader2 className='w-3 h-3 text-tw-muted-deep animate-spin ml-auto' />}
      </div>

      {loading && (
        <div className='flex flex-col gap-2'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='h-20 rounded-lg bg-tw-surface border border-tw-border-deep animate-pulse' />
          ))}
        </div>
      )}

      {isEmpty && (
        <div className='flex flex-col items-center justify-center py-6 gap-2 text-center'>
          <Sparkles className='w-5 h-5 text-tw-muted-deep/50' />
          <p className='font-mono text-[0.6rem] text-tw-muted-deep uppercase tracking-widest'>
            {t('recommendations.buildComplete')}
          </p>
          <p className='font-mono text-[0.5rem] text-tw-muted-deep'>{t('recommendations.noAdditional')}</p>
        </div>
      )}

      {!loading && hasMissing && (
        <CollapsibleSection
          title={t('recommendations.completeYourBuild')}
          subtitle={t(missingCount === 1 ? 'recommendations.missing_one' : 'recommendations.missing_other', {
            count: missingCount,
          })}
          icon={<Zap className='w-3.5 h-3.5' />}
          defaultOpen>
          <div className='flex flex-col gap-4'>
            {recommendations!.missing.map((group) => (
              <TypeGroup
                key={group.type_name}
                typeName={group.type_name}
                reason={group.reason}
                suggestions={group.suggestions}
                onAdd={onAdd}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {!loading && hasMissing && (
        <div className='flex items-center gap-3 pt-1 border-t border-tw-border-deep'>
          <div className='flex items-center gap-1'>
            <div className='w-2 h-0.5 bg-tw-cpu rounded' />
            <span className='font-mono text-[0.4rem] text-tw-muted-deep'>{t('recommendations.compat')}</span>
          </div>
          <div className='flex items-center gap-1'>
            <div className='w-2 h-0.5 bg-tw-gpu rounded' />
            <span className='font-mono text-[0.4rem] text-tw-muted-deep'>{t('recommendations.perf')}</span>
          </div>
          <div className='flex items-center gap-1'>
            <div className='w-2 h-0.5 bg-tw-ram rounded' />
            <span className='font-mono text-[0.4rem] text-tw-muted-deep'>{t('recommendations.value')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
