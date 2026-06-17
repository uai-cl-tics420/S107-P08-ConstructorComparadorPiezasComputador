import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ArrowLeftRight, ChevronDown, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Component } from '../types/Frontend_types';

const PRIORITY_SPECS: Record<string, string[]> = {
  CPU: ['core_count', 'thread_count', 'socket', 'tdp', 'boost_clock'],
  GPU: ['vram_quantity', 'gpu_tdp', 'length', 'bus_width'],
  RAM: ['capacity', 'ram_type', 'module_count', 'bus_speed'],
  Motherboard: ['chipset', 'socket', 'ram_type', 'memory_slots_quantity', 'm2_slots'],
  Storage: ['capacity_value', 'bus_type', 'read_speed', 'write_speed'],
  PSU: ['wattage', 'certification', 'is_modular'],
  Case: ['max_motherboard_form_factor', 'max_cpu_cooler_height', 'max_video_card_length'],
  'CPU Cooler': ['cooler_sockets', 'height'],
};

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

interface BuildCompatibility {
  isCompatible: boolean;
  reasons: string[];
}

interface Props {
  component: Component;
  onAdd: (component: Component) => void;
  onCompare?: (component: Component) => void;
  onViewSpecs?: (component: Component) => void;
  isSelectedForCompare?: boolean;
  buildCompatibility?: BuildCompatibility | null;
}

export function ComponentCard({ component, onAdd, onCompare, onViewSpecs, isSelectedForCompare, buildCompatibility }: Props) {
  const { t } = useTranslation();
  const [showAllPrices, setShowAllPrices] = useState(false);

  const minPrice = Math.min(...component.prices.map((p) => p.price));
  const maxPrice = Math.max(...component.prices.map((p) => p.price));
  const savings = maxPrice - minPrice;
  const accent = TYPE_ACCENT[component.type_name] ?? 'tw-case';

  const priorityKeys = PRIORITY_SPECS[component.type_name] ?? [];
  const specsToShow = priorityKeys.filter((k) => component.specs?.[k] != null).slice(0, 3);

  const visiblePrices = showAllPrices ? component.prices : component.prices.slice(0, 2);
  const hasMorePrices = component.prices.length > 2;
  const hiddenCount = component.prices.length - 2;

// Fallback map: SoloTodo numeric certification IDs → readable labels (for legacy DB data)
const CERTIFICATION_MAP: Record<number, string> = {
  2: '80 Plus',
  4: '80 Plus Bronze',
  5: '80 Plus Silver',
  80: '80 Plus Gold',
  6: '80 Plus Platinum',
  7: '80 Plus Titanium',
};

  function formatSpecValue(key: string, value: unknown): string {
    if (value === null || value === undefined) return '—';
    // Cinebench 0 = absent data from SoloTodo, not a real score
    if ((key === 'cinebench_r20_single_score' || key === 'cinebench_r20_multi_score') && value === 0) return '—';
    // PSU certification: translate numeric ID to readable text (legacy data fallback)
    if (key === 'certification' && typeof value === 'number') {
      return CERTIFICATION_MAP[value] ?? `80 Plus (${value})`;
    }
    if (Array.isArray(value)) return value.join(' / ');
    if (typeof value === 'boolean') return value ? t('card.yes') : t('card.no');
    if (key === 'tdp' || key === 'gpu_tdp') return `${value}W`;
    if (key === 'wattage') return `${value}W`;
    if (key === 'vram_quantity') return `${value} GB`;
    if (key === 'capacity') return `${value}`;
    if (key === 'length' || key === 'height' || key === 'max_cpu_cooler_height' || key === 'max_video_card_length') return `${value}mm`;
    return String(value);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className='relative group h-full'>
      <div className='absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 bg-linear-to-br from-tw-glass/28 via-tw-glass/8 to-transparent pointer-events-none' />

      <div className={`relative h-full rounded-xl border bg-tw-surface-deep hover:bg-tw-surface backdrop-blur-xl p-5 z-10 flex flex-col gap-4 transition-[border-color] duration-300 ${
        isSelectedForCompare ? 'border-tw-alt/40 bg-tw-alt/5' : 'border-tw-border group-hover:border-tw-glass/35'
      }`}>
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-linear-to-r from-transparent via-tw-glass/8 to-transparent' />

        {/* Type badge + compatibility */}
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 group-hover:scale-125 bg-${accent} shadow-[0_0_8px_var(--color-${accent})]`} />
            <span className='font-mono text-[0.6rem] uppercase tracking-[0.18em] text-tw-muted group-hover:text-tw-muted-highlight transition-colors duration-300'>
              {component.type_name}
            </span>
          </div>
          {buildCompatibility != null && (
            <div className='relative group/badge shrink-0'>
              <span className={`font-mono text-[0.5rem] px-1.5 py-0.5 rounded border ${
                buildCompatibility.isCompatible
                  ? 'text-green-400/80 border-green-500/20 bg-green-500/5'
                  : 'text-tw-alert/70 border-tw-alert/15 bg-tw-alert/5'
              }`}>
                {buildCompatibility.isCompatible ? t('card.compatible') : t('card.incompatible')}
              </span>
              {buildCompatibility.reasons.length > 0 && (
                <div className='absolute right-0 top-full mt-1 z-20 hidden group-hover/badge:flex flex-col gap-1 w-48 bg-tw-surface/98 backdrop-blur-xl border border-tw-border rounded-lg p-2 shadow-xl shadow-black/40'>
                  {buildCompatibility.reasons.slice(0, 3).map((r, i) => (
                    <span key={i} className='font-mono text-[0.5rem] text-tw-muted leading-tight'>{r}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Name + brand */}
        <div className='space-y-1.5'>
          <h3 className='text-tw-primary font-semibold text-sm leading-snug line-clamp-2 group-hover:text-tw-primary transition-colors'>
            {component.name}
          </h3>
          <p className='font-mono text-[0.6rem] text-tw-muted-deep uppercase tracking-[0.15em]'>{component.brand_name}</p>
        </div>

        {/* Specs */}
        {specsToShow.length > 0 && (
          <div className='border-t border-tw-border-deep pt-3.5 space-y-2.5'>
            {specsToShow.map((key) => (
              <div key={key} className='flex items-baseline justify-between gap-3'>
                <span className='font-mono text-[0.6rem] text-tw-muted-deep uppercase tracking-[0.15em] shrink-0'>
                  {t(`spec.${key}`, { defaultValue: key })}
                </span>
                <span className='font-mono text-xs text-tw-primary-deep font-medium tabular-nums'>
                  {formatSpecValue(key, component.specs![key])}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Price section */}
        <div className='mt-auto space-y-3'>
          <div className='flex items-baseline justify-between'>
            <span className='font-mono text-[0.6rem] text-tw-muted-deep uppercase tracking-[0.15em]'>{t('card.bestPrice')}</span>
            <span className='text-2xl font-black text-tw-primary tabular-nums drop-shadow-[0_0_12px_rgba(255,255,255,0.25)] group-hover:drop-shadow-[0_0_16px_rgba(255,255,255,0.4)] transition-all duration-300'>
              ${minPrice.toLocaleString('es-CL')}
            </span>
          </div>

          {/* Vendor list */}
          <div className='bg-tw-base border border-tw-border-deep rounded-lg p-2.5 space-y-1.5'>
            {visiblePrices.map((p) => (
              <div key={p.id} className='flex items-center justify-between gap-2'>
                <span className={`font-mono text-[0.6rem] truncate ${p.price === minPrice ? 'text-tw-muted-highlight' : 'text-tw-muted-deep'}`}>
                  {p.vendor_name}
                </span>
                <span className={`font-mono text-[0.6rem] tabular-nums shrink-0 ${p.price === minPrice ? 'text-tw-primary font-bold' : 'text-tw-muted-deep'}`}>
                  ${p.price.toLocaleString('es-CL')}
                </span>
              </div>
            ))}

            {hasMorePrices && (
              <motion.button
                onClick={() => setShowAllPrices(!showAllPrices)}
                className='w-full mt-2 pt-2 border-t border-tw-border-deep flex items-center justify-center gap-1.5 py-2 text-tw-muted hover:text-tw-muted-highlight transition-colors duration-200'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                <span className='font-mono text-[0.6rem] uppercase tracking-[0.15em]'>
                  {showAllPrices ? t('card.seeLess') : t('card.seeMore', { count: hiddenCount })}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showAllPrices ? 'rotate-180' : ''}`} />
              </motion.button>
            )}
          </div>

          {savings > 0 && (
            <p className='font-mono text-[0.6rem] text-tw-muted-deep text-center tracking-wider'>
              {t('card.save', { amount: savings.toLocaleString('es-CL') })}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className='flex gap-2 pt-3 border-t border-tw-border-deep'>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 18px rgba(255,255,255,0.22), 0 4px 14px rgba(0,0,0,0.5)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={() => onAdd(component)}
            className='flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-tw-glass hover:bg-tw-glass/90 text-tw-base font-bold font-mono text-xs rounded-lg transition-colors duration-150 cursor-pointer'>
            <Plus className='w-3.5 h-3.5' />
            {t('card.add')}
          </motion.button>
          {onViewSpecs && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.15 }}
              onClick={() => onViewSpecs(component)}
              className='px-3 py-2.5 border border-tw-glass/10 hover:border-tw-glass/40 hover:bg-tw-glass/6 text-tw-muted hover:text-tw-muted-highlight rounded-lg transition-all duration-200 cursor-pointer'
              title={t('card.viewSpecs')}>
              <FileText className='w-3.5 h-3.5' />
            </motion.button>
          )}
          {onCompare && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.15 }}
              onClick={() => onCompare(component)}
              className={`px-3 py-2.5 border rounded-lg transition-all duration-200 cursor-pointer ${
                isSelectedForCompare
                  ? 'border-tw-alt/50 bg-tw-alt/10 text-tw-alt'
                  : 'border-tw-glass/10 hover:border-tw-glass/40 hover:bg-tw-glass/6 text-tw-muted hover:text-tw-muted-highlight'
              }`}
              title={isSelectedForCompare ? t('card.removeFromCompare') : t('card.compare')}>
              <ArrowLeftRight className='w-3.5 h-3.5' />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
