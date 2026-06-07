import { useTranslation } from 'react-i18next';
import type { Component } from '../types/Frontend_types';

interface Props {
  components: Component[];
  onClose: () => void;
}

const TYPE_BADGE: Record<string, string> = {
  CPU: 'bg-tw-cpu-deep/15 text-tw-cpu-highlight border-tw-cpu/25',
  GPU: 'bg-tw-gpu-deep/15 text-tw-gpu-highlight border-tw-gpu/25',
  RAM: 'bg-tw-ram-deep/15 text-tw-ram-highlight border-tw-ram/25',
  Motherboard: 'bg-tw-motherboard-deep/15 text-tw-motherboard-highlight border-tw-motherboard/25',
  Storage: 'bg-tw-storage-deep/15 text-tw-storage-highlight border-tw-storage/25',
  PSU: 'bg-tw-psu-deep/15 text-tw-psu-highlight border-tw-psu/25',
  Case: 'bg-tw-case-deep/15 text-tw-case-highlight border-tw-case/25',
  'CPU Cooler': 'bg-tw-cooler-deep/15 text-tw-cooler-highlight border-tw-cooler/25',
};

// Claves de specs con label conocido en i18n (spec.*). Los labels salen de t('spec.<clave>').
const KNOWN_SPECS = new Set([
  'core_count',
  'thread_count',
  'tdp',
  'base_clock',
  'boost_clock',
  'socket',
  'gpu',
  'cinebench_r20_single_score',
  'cinebench_r20_multi_score',
  'gpu_boost_clock',
  'vram_quantity',
  'gpu_tdp',
  'bus_width',
  'capacity',
  'bus_speed',
  'ram_type',
  'module_count',
  'chipset',
  'memory_slots_quantity',
  'capacity_value',
  'bus_type',
  'read_speed',
  'write_speed',
  'wattage',
  'certification',
  'is_modular',
  'form_factor',
  'max_motherboard_form_factor',
  'cooler_sockets',
  'height',
  'length',
  'max_cpu_cooler_height',
  'max_video_card_length',
  'm2_slots',
  'is_nvme',
]);

const LOWER_IS_BETTER = new Set(['tdp', 'gpu_tdp']);

export function CompareModal({ components, onClose }: Props) {
  const { t } = useTranslation();
  if (components.length < 2) return null;

  const [a, b] = components;
  const specsA = a!.specs ?? {};
  const specsB = b!.specs ?? {};
  const allKeys = Array.from(new Set([...Object.keys(specsA), ...Object.keys(specsB)]));
  const displayKeys = allKeys.filter((k) => KNOWN_SPECS.has(k) && (specsA[k] != null || specsB[k] != null));
  const minPriceA = a!.prices.length > 0 ? Math.min(...a!.prices.map((p) => p.price)) : null;
  const minPriceB = b!.prices.length > 0 ? Math.min(...b!.prices.map((p) => p.price)) : null;
  const badgeA = TYPE_BADGE[a!.type_name] ?? 'bg-tw-case-deep/15 text-tw-case-highlight border-tw-case/25';
  const badgeB = TYPE_BADGE[b!.type_name] ?? 'bg-tw-case-deep/15 text-tw-case-highlight border-tw-case/25';

  function formatValue(key: string, value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (Array.isArray(value)) return value.join(' / ');
    if (typeof value === 'boolean') return value ? t('compare.yes') : t('compare.no');
    if (key === 'tdp' || key === 'gpu_tdp') return `${value}W`;
    if (key === 'wattage') return `${value}W`;
    if (key === 'vram_quantity') return `${value} GB`;
    if (key === 'length' || key === 'height' || key === 'max_cpu_cooler_height' || key === 'max_video_card_length')
      return `${value}mm`;
    return String(value);
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-tw-base-deep/70 backdrop-blur-sm'
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}>
      <div className='bg-tw-base-highlight border border-tw-glass/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-auto max-h-[90vh]'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 shrink-0'>
          <h2 className='text-tw-primary font-semibold text-base'>{t('compare.title', { type: a!.type_name })}</h2>
          <button
            onClick={onClose}
            className='text-tw-muted hover:text-tw-primary transition-colors duration-150 text-2xl leading-none cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-tw-glass/5'
            aria-label={t('compare.close')}>
            ×
          </button>
        </div>

        {/* Component headers */}
        <div className='grid grid-cols-[140px_1fr_1fr] shrink-0'>
          <div className='bg-tw-base px-4 py-4' />
          {[
            { comp: a!, badge: badgeA },
            { comp: b!, badge: badgeB },
          ].map(({ comp, badge }) => (
            <div
              key={comp.id}
              className='min-w-34 border-b border-t border-l border-tw-glass/5 bg-tw-base-highlight px-5 py-4 flex flex-col gap-1.5'>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border w-fit ${badge}`}>
                {comp.type_name}
              </span>
              <h3 className='text-tw-primary font-semibold text-sm leading-snug'>{comp.name}</h3>
              <p className='text-tw-muted text-xs'>{comp.brand_name}</p>
            </div>
          ))}
        </div>

        {/* Specs table */}
        {displayKeys.length === 0 ? (
          <div className='flex items-center justify-center py-12 text-tw-muted text-sm'>{t('compare.noSpecs')}</div>
        ) : (
          <div>
            {displayKeys.map((key, i) => {
              const valA = specsA[key];
              const valB = specsB[key];
              const numA = typeof valA === 'number' ? valA : null;
              const numB = typeof valB === 'number' ? valB : null;
              const lowerBetter = LOWER_IS_BETTER.has(key);
              let aWins = false;
              let bWins = false;
              if (numA !== null && numB !== null) {
                aWins = lowerBetter ? numA < numB : numA > numB;
                bWins = lowerBetter ? numB < numA : numB > numA;
              }

              return (
                <div key={key} className='grid grid-cols-[140px_1fr_1fr] shrink-0'>
                  <div
                    className={`px-4 py-3 flex items-center border-b border-tw-glass/5 ${i % 2 === 0 ? 'bg-tw-base-highlight' : 'bg-tw-base'}`}>
                    <span className='text-tw-muted text-xs uppercase tracking-wide font-medium'>
                      {t(`spec.${key}`, { defaultValue: key })}
                    </span>
                  </div>
                  <div
                    className={`min-w-34 px-5 py-3 flex items-center border-b border-l border-tw-glass/5 ${i % 2 === 0 ? 'bg-tw-base-highlight' : 'bg-tw-base'}`}>
                    <span
                      className={`text-sm font-semibold tabular-nums ${valA == null ? 'text-tw-muted-deep' : aWins ? 'text-tw-success' : 'text-tw-primary-deep'}`}>
                      {formatValue(key, valA)}
                    </span>
                  </div>
                  <div
                    className={`min-w-34 px-5 py-3 flex items-center border-b border-l border-tw-glass/5 ${i % 2 === 0 ? 'bg-tw-base-highlight' : 'bg-tw-base'}`}>
                    <span
                      className={`text-sm font-semibold tabular-nums ${valB == null ? 'text-tw-muted-deep' : bWins ? 'text-tw-success' : 'text-tw-primary-deep'}`}>
                      {formatValue(key, valB)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer: best price */}
        <div className='grid grid-cols-[140px_1fr_1fr] border-t border-tw-glass/5 shrink-0'>
          <div className='bg-tw-base px-4 py-3 flex items-center'>
            <span className='text-tw-muted text-xs uppercase tracking-wide font-medium'>{t('compare.bestPrice')}</span>
          </div>
          {[
            { comp: a!, minPrice: minPriceA },
            { comp: b!, minPrice: minPriceB },
          ].map(({ comp, minPrice }) => (
            <div key={comp.id} className='min-w-34 bg-tw-base px-5 py-3 flex items-center border-l border-tw-glass/5'>
              <span className='text-tw-primary-deep text-sm font-bold tabular-nums'>
                {minPrice != null ? `$${minPrice.toLocaleString('es-CL')}` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
