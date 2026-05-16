import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ArrowLeftRight, ChevronDown } from 'lucide-react';
import type { Component } from '../types/Frontend_types';

const SPEC_LABELS: Record<string, string> = {
  core_count: 'Cores',
  thread_count: 'Threads',
  tdp: 'TDP',
  base_clock: 'Base Clk',
  boost_clock: 'Boost Clk',
  socket: 'Socket',
  gpu: 'GPU Int.',
  cinebench_r20_single_score: 'CB R20 (1T)',
  cinebench_r20_multi_score: 'CB R20 (nT)',
  gpu_boost_clock: 'Boost Clk',
  vram_quantity: 'VRAM',
  gpu_tdp: 'TDP',
  bus_width: 'Bus',
  capacity: 'Capacidad',
  bus_speed: 'Bus Spd',
  ram_type: 'Tipo',
  module_count: 'Módulos',
  chipset: 'Chipset',
  memory_slots_quantity: 'Slots RAM',
  capacity_value: 'Capacidad',
  bus_type: 'Interface',
  read_speed: 'Lectura',
  write_speed: 'Escritura',
  wattage: 'Watts',
  certification: 'Cert.',
  is_modular: 'Modular',
  form_factor: 'Form Factor',
  max_motherboard_form_factor: 'Form Factor',
};

const PRIORITY_SPECS: Record<string, string[]> = {
  CPU: ['core_count', 'thread_count', 'socket', 'tdp', 'boost_clock'],
  GPU: ['vram_quantity', 'gpu_boost_clock', 'gpu_tdp', 'bus_width'],
  RAM: ['capacity', 'bus_speed', 'ram_type', 'module_count'],
  Motherboard: ['chipset', 'socket', 'form_factor', 'memory_slots_quantity'],
  Storage: ['capacity_value', 'bus_type', 'read_speed', 'write_speed'],
  PSU: ['wattage', 'certification', 'is_modular'],
  Case: ['max_motherboard_form_factor', 'form_factor'],
  'CPU Cooler': ['tdp', 'form_factor'],
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

function formatSpecValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (key === 'tdp' || key === 'gpu_tdp') return `${value}W`;
  if (key === 'wattage') return `${value}W`;
  if (key === 'vram_quantity') return `${value} GB`;
  if (key === 'capacity') return `${value}`;
  return String(value);
}

interface BuildCompatibility {
  isCompatible: boolean;
  reasons: string[];
}

interface Props {
  component: Component;
  onAdd: (component: Component) => void;
  onCompare?: (component: Component) => void;
  isSelectedForCompare?: boolean;
  buildCompatibility?: BuildCompatibility | null;
}

export function ComponentCard({ component, onAdd, onCompare, isSelectedForCompare, buildCompatibility }: Props) {
  const [showAllPrices, setShowAllPrices] = useState(false);

  const minPrice = Math.min(...component.prices.map((p) => p.price));
  const maxPrice = Math.max(...component.prices.map((p) => p.price));
  const savings = maxPrice - minPrice;
  const accent = TYPE_ACCENT[component.type_name] ?? 'tw-case';

  const priorityKeys = PRIORITY_SPECS[component.type_name] ?? [];
  const specsToShow = priorityKeys.filter((k) => component.specs?.[k] != null).slice(0, 3);

  const visiblePrices = showAllPrices ? component.prices : component.prices.slice(0, 2);
  const hasMorePrices = component.prices.length > 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className='relative group h-full'>
      {/* GlassCard: gradient border — intensificado en hover */}
      <div className='absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 bg-linear-to-br from-tw-glass/28 via-tw-glass/8 to-transparent pointer-events-none' />

      <div
        className={`relative h-full rounded-xl border bg-tw-surface-deep hover:bg-tw-surface backdrop-blur-xl p-5 z-10 flex flex-col gap-4 transition-[border-color] duration-300 ${
          isSelectedForCompare ? 'border-tw-alt/40 bg-tw-alt/5' : 'border-tw-border group-hover:border-tw-glass/35'
        }`}>
        {/* Top shimmer line — Apple-style */}
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-linear-to-r from-transparent via-tw-glass/8 to-transparent' />

        {/* Type badge + accent dot + compatibility badge */}
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 group-hover:scale-125 bg-${accent} shadow-[0_0_8px_var(--color-${accent})]`}
            />
            <span className='font-mono text-[9px] uppercase tracking-[0.18em] text-tw-muted group-hover:text-tw-muted-highlight transition-colors duration-300'>
              {component.type_name}
            </span>
          </div>
          {buildCompatibility != null && (
            <div className='relative group/badge shrink-0'>
              <span
                className={`font-mono text-[8px] px-1.5 py-0.5 rounded border ${
                  buildCompatibility.isCompatible
                    ? 'text-green-400/80 border-green-500/20 bg-green-500/5'
                    : 'text-tw-alert/70 border-tw-alert/15 bg-tw-alert/5'
                }`}>
                {buildCompatibility.isCompatible ? '✓ Compat.' : '✕ Incompat.'}
              </span>
              {/* Tooltip with reasons */}
              {buildCompatibility.reasons.length > 0 && (
                <div className='absolute right-0 top-full mt-1 z-20 hidden group-hover/badge:flex flex-col gap-1 w-48 bg-tw-surface/98 backdrop-blur-xl border border-tw-border rounded-lg p-2 shadow-xl shadow-black/40'>
                  {buildCompatibility.reasons.slice(0, 3).map((r, i) => (
                    <span key={i} className='font-mono text-[8px] text-tw-muted leading-tight'>
                      {r}
                    </span>
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
          <p className='font-mono text-[9px] text-tw-muted-deep uppercase tracking-[0.15em]'>{component.brand_name}</p>
        </div>

        {/* Specs — TIPOGRAFÍA MONOESPACIADA ENGINEERING */}
        {specsToShow.length > 0 && (
          <div className='border-t border-tw-border-deep pt-3.5 space-y-2.5'>
            {specsToShow.map((key) => (
              <div key={key} className='flex items-baseline justify-between gap-3'>
                <span className='font-mono text-[9px] text-tw-muted-deep uppercase tracking-[0.15em] shrink-0'>
                  {SPEC_LABELS[key] ?? key}
                </span>
                <span className='font-mono text-[11px] text-tw-primary-deep font-medium tabular-nums'>
                  {formatSpecValue(key, component.specs![key])}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Price section */}
        <div className='mt-auto space-y-3'>
          <div className='flex items-baseline justify-between'>
            <span className='font-mono text-[9px] text-tw-muted-deep uppercase tracking-[0.15em]'>Mejor precio</span>
            {/* Precio: máximo brillo y contraste */}
            <span className='text-2xl font-black text-tw-primary tabular-nums drop-shadow-[0_0_12px_rgba(255,255,255,0.25)] group-hover:drop-shadow-[0_0_16px_rgba(255,255,255,0.4)] transition-all duration-300'>
              ${minPrice.toLocaleString('es-CL')}
            </span>
          </div>

          {/* Vendor list */}
          <div className='bg-tw-base border border-tw-border-deep rounded-lg p-2.5 space-y-1.5'>
            {visiblePrices.map((p) => (
              <div key={p.id} className='flex items-center justify-between gap-2'>
                <span
                  className={`font-mono text-[10px] truncate ${
                    p.price === minPrice ? 'text-tw-muted-highlight' : 'text-tw-muted-deep'
                  }`}>
                  {p.vendor_name}
                </span>
                {/* Mejor precio: texto blanco puro */}
                <span
                  className={`font-mono text-[10px] tabular-nums shrink-0 ${
                    p.price === minPrice ? 'text-tw-primary font-bold' : 'text-tw-muted-deep'
                  }`}>
                  ${p.price.toLocaleString('es-CL')}
                </span>
              </div>
            ))}

            {/* Botón para expandir/contraer */}
            {hasMorePrices && (
              <motion.button
                onClick={() => setShowAllPrices(!showAllPrices)}
                className='w-full mt-2 pt-2 border-t border-tw-border-deep flex items-center justify-center gap-1.5 py-2 text-tw-muted hover:text-tw-muted-highlight transition-colors duration-200'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                <span className='font-mono text-[9px] uppercase tracking-[0.15em]'>
                  {showAllPrices ? 'Ver menos' : `Ver ${component.prices.length - 2} más`}
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${showAllPrices ? 'rotate-180' : ''}`}
                />
              </motion.button>
            )}
          </div>

          {savings > 0 && (
            <p className='font-mono text-[9px] text-tw-muted-deep text-center tracking-wider'>
              Ahorra <span className='text-tw-muted'>${savings.toLocaleString('es-CL')}</span>
            </p>
          )}
        </div>

        {/* Botones: CTA primario alto contraste + secundario stealth */}
        <div className='flex gap-2 pt-3 border-t border-tw-border-deep'>
          {/* BOTÓN PRIMARIO — Fondo blanco, texto negro, glow en hover */}
          <motion.button
            whileHover={{
              scale: 1.02,
              boxShadow: '0 0 18px rgba(255,255,255,0.22), 0 4px 14px rgba(0,0,0,0.5)',
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={() => onAdd(component)}
            className='flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-tw-glass hover:bg-tw-glass/90 text-tw-base font-bold font-mono text-[11px] rounded-lg transition-colors duration-150 cursor-pointer'>
            <Plus className='w-3.5 h-3.5 transition-transform duration-150 group-hover:scale-110' />
            Agregar
          </motion.button>
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
              title={isSelectedForCompare ? 'Quitar de comparación' : 'Comparar'}>
              <ArrowLeftRight className='w-3.5 h-3.5' />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
