import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import type { Component } from '../types/Frontend_types';

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

const SPEC_LABELS: Record<string, string> = {
  core_count: 'Núcleos',
  thread_count: 'Hilos',
  tdp: 'TDP',
  base_clock: 'Clock Base',
  boost_clock: 'Clock Boost',
  socket: 'Socket',
  gpu: 'GPU Integrada',
  cinebench_r20_single_score: 'Cinebench R20 (1T)',
  cinebench_r20_multi_score: 'Cinebench R20 (nT)',
  gpu_boost_clock: 'Clock Boost GPU',
  vram_quantity: 'VRAM',
  gpu_tdp: 'TDP GPU',
  bus_width: 'Ancho de Bus',
  capacity: 'Capacidad',
  bus_speed: 'Velocidad Bus',
  ram_type: 'Tipo RAM',
  module_count: 'Módulos',
  chipset: 'Chipset',
  memory_slots_quantity: 'Slots RAM',
  capacity_value: 'Capacidad',
  bus_type: 'Interface',
  read_speed: 'Lectura',
  write_speed: 'Escritura',
  wattage: 'Potencia',
  certification: 'Certificación',
  is_modular: 'Modular',
  form_factor: 'Factor de Forma',
  max_motherboard_form_factor: 'Factor de Forma Máx.',
};

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (key === 'tdp' || key === 'gpu_tdp') return `${value} W`;
  if (key === 'wattage') return `${value} W`;
  if (key === 'vram_quantity') return `${value} GB`;
  if (key === 'read_speed' || key === 'write_speed') return `${value} MB/s`;
  if (key === 'bus_speed') return `${value} MHz`;
  if (key === 'cinebench_r20_single_score' || key === 'cinebench_r20_multi_score') return `${value} pts`;
  return String(value);
}

interface Props {
  component: Component | null;
  onClose: () => void;
  onAdd: (component: Component) => void;
}

export function ComponentDetailModal({ component, onClose, onAdd }: Props) {
  const specs = component?.specs ?? {};
  const displayKeys = Object.keys(specs).filter(
    (k) => SPEC_LABELS[k] !== undefined && specs[k] != null,
  );

  const unknownKeys = Object.keys(specs).filter(
    (k) => SPEC_LABELS[k] === undefined && specs[k] != null,
  );

  const minPrice = component && component.prices.length > 0
    ? Math.min(...component.prices.map((p) => p.price))
    : null;

  const badge = component ? (TYPE_BADGE[component.type_name] ?? 'bg-tw-case-deep/15 text-tw-case-highlight border-tw-case/25') : '';
  const accent = component ? (TYPE_ACCENT[component.type_name] ?? 'tw-case') : 'tw-case';

  return (
    <AnimatePresence>
      {component && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-tw-base/80 backdrop-blur-2xl'
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className='relative w-full max-w-lg max-h-[90vh] flex flex-col'>
            {/* Gradient border */}
            <div className='absolute -inset-px rounded-2xl bg-linear-to-br from-tw-glass/16 via-tw-glass/4 to-transparent pointer-events-none' />

            <div className='relative bg-tw-surface/95 backdrop-blur-2xl border border-tw-glass/12 rounded-2xl flex flex-col overflow-hidden'>
              {/* Top shimmer */}
              <div className='absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-linear-to-r from-transparent via-tw-glass/10 to-transparent' />

              {/* Header */}
              <div className='flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-tw-border-deep shrink-0'>
                <div className='flex flex-col gap-2 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 bg-${accent}`} />
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold border font-mono uppercase tracking-widest ${badge}`}>
                      {component.type_name}
                    </span>
                  </div>
                  <h2 className='text-tw-primary font-semibold text-base leading-snug'>{component.name}</h2>
                  <p className='font-mono text-[9px] text-tw-muted-deep uppercase tracking-[0.15em]'>
                    {component.brand_name}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className='p-1.5 text-tw-muted hover:text-tw-primary hover:bg-tw-glass/8 rounded-lg transition-all cursor-pointer shrink-0 mt-0.5'>
                  <X className='w-4 h-4' />
                </button>
              </div>

              {/* Scrollable body */}
              <div className='overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-5'>
                {/* Specs conocidos */}
                {displayKeys.length > 0 && (
                  <div className='flex flex-col gap-1'>
                    <p className='font-mono text-[8px] uppercase tracking-widest text-tw-muted-deep mb-2'>
                      Especificaciones
                    </p>
                    <div className='rounded-xl border border-tw-border-deep overflow-hidden'>
                      {displayKeys.map((key, i) => (
                        <div
                          key={key}
                          className={`flex items-center justify-between gap-4 px-4 py-2.5 ${
                            i % 2 === 0 ? 'bg-tw-base' : 'bg-tw-surface'
                          } ${i < displayKeys.length - 1 ? 'border-b border-tw-border-deep' : ''}`}>
                          <span className='font-mono text-[9px] uppercase tracking-[0.15em] text-tw-muted-deep shrink-0'>
                            {SPEC_LABELS[key]}
                          </span>
                          <span className='font-mono text-[11px] text-tw-primary font-medium tabular-nums text-right'>
                            {formatValue(key, specs[key])}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specs sin label conocido */}
                {unknownKeys.length > 0 && (
                  <div className='flex flex-col gap-1'>
                    <p className='font-mono text-[8px] uppercase tracking-widest text-tw-muted-deep mb-2'>
                      Otros datos
                    </p>
                    <div className='rounded-xl border border-tw-border-deep overflow-hidden'>
                      {unknownKeys.map((key, i) => (
                        <div
                          key={key}
                          className={`flex items-center justify-between gap-4 px-4 py-2.5 ${
                            i % 2 === 0 ? 'bg-tw-base' : 'bg-tw-surface'
                          } ${i < unknownKeys.length - 1 ? 'border-b border-tw-border-deep' : ''}`}>
                          <span className='font-mono text-[9px] uppercase tracking-[0.12em] text-tw-muted-deep shrink-0'>
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className='font-mono text-[11px] text-tw-primary-deep tabular-nums text-right'>
                            {formatValue(key, specs[key])}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {displayKeys.length === 0 && unknownKeys.length === 0 && (
                  <p className='font-mono text-[9px] text-tw-muted-deep text-center py-4'>
                    Sin especificaciones disponibles
                  </p>
                )}

                {/* Precios */}
                {component.prices.length > 0 && (
                  <div className='flex flex-col gap-1'>
                    <p className='font-mono text-[8px] uppercase tracking-widest text-tw-muted-deep mb-2'>
                      Precios por vendedor
                    </p>
                    <div className='rounded-xl border border-tw-border-deep overflow-hidden'>
                      {[...component.prices]
                        .sort((a, b) => a.price - b.price)
                        .map((p, i) => (
                          <div
                            key={p.id}
                            className={`flex items-center justify-between gap-4 px-4 py-2.5 ${
                              i % 2 === 0 ? 'bg-tw-base' : 'bg-tw-surface'
                            } ${i < component.prices.length - 1 ? 'border-b border-tw-border-deep' : ''}`}>
                            <span
                              className={`font-mono text-[10px] truncate ${
                                p.price === minPrice ? 'text-tw-muted-highlight' : 'text-tw-muted-deep'
                              }`}>
                              {p.vendor_name}
                              {p.price === minPrice && (
                                <span className='ml-1.5 text-[8px] opacity-60'>· mejor precio</span>
                              )}
                            </span>
                            <span
                              className={`font-mono text-[11px] tabular-nums shrink-0 ${
                                p.price === minPrice ? 'text-tw-primary font-bold' : 'text-tw-muted-deep'
                              }`}>
                              ${p.price.toLocaleString('es-CL')}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className='flex items-center justify-between gap-3 px-6 py-4 border-t border-tw-border-deep shrink-0'>
                <div>
                  <p className='font-mono text-[8px] text-tw-muted-deep uppercase tracking-widest'>Mejor precio</p>
                  <p className='text-xl font-black text-tw-primary tabular-nums'>
                    {minPrice != null ? `$${minPrice.toLocaleString('es-CL')}` : '—'}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 18px rgba(255,255,255,0.18)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onAdd(component);
                    onClose();
                  }}
                  className='flex items-center gap-2 px-5 py-2.5 bg-tw-glass text-tw-base font-bold font-mono text-[11px] rounded-xl transition-colors cursor-pointer'>
                  <Plus className='w-3.5 h-3.5' />
                  Agregar al build
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
