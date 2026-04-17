import { motion } from 'framer-motion';
import { Plus, ArrowLeftRight } from 'lucide-react';
import type { Component } from "../types";

const SPEC_LABELS: Record<string, string> = {
  core_count: 'Cores', thread_count: 'Threads', tdp: 'TDP',
  base_clock: 'Base Clk', boost_clock: 'Boost Clk',
  socket: 'Socket', gpu: 'GPU Int.',
  cinebench_r20_single_score: 'CB R20 (1T)',
  cinebench_r20_multi_score: 'CB R20 (nT)',
  gpu_boost_clock: 'Boost Clk', vram_quantity: 'VRAM',
  gpu_tdp: 'TDP', bus_width: 'Bus',
  capacity: 'Capacidad', bus_speed: 'Bus Spd',
  ram_type: 'Tipo', module_count: 'Módulos',
  chipset: 'Chipset', memory_slots_quantity: 'Slots RAM',
  capacity_value: 'Capacidad', bus_type: 'Interface',
  read_speed: 'Lectura', write_speed: 'Escritura',
  wattage: 'Watts', certification: 'Cert.',
  is_modular: 'Modular', form_factor: 'Form Factor',
  max_motherboard_form_factor: 'Form Factor',
};

const PRIORITY_SPECS: Record<string, string[]> = {
  CPU:          ['core_count', 'thread_count', 'socket', 'tdp', 'boost_clock'],
  GPU:          ['vram_quantity', 'gpu_boost_clock', 'gpu_tdp', 'bus_width'],
  RAM:          ['capacity', 'bus_speed', 'ram_type', 'module_count'],
  Motherboard:  ['chipset', 'socket', 'form_factor', 'memory_slots_quantity'],
  Storage:      ['capacity_value', 'bus_type', 'read_speed', 'write_speed'],
  PSU:          ['wattage', 'certification', 'is_modular'],
  Case:         ['max_motherboard_form_factor', 'form_factor'],
  'CPU Cooler': ['tdp', 'form_factor'],
};

const TYPE_ACCENT: Record<string, string> = {
  CPU:          '#A78BFA',
  GPU:          '#34D399',
  RAM:          '#60A5FA',
  Motherboard:  '#FB923C',
  Storage:      '#FBBF24',
  PSU:          '#F87171',
  Case:         '#94A3B8',
  'CPU Cooler': '#22D3EE',
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

interface Props {
  component: Component;
  onAdd: (component: Component) => void;
  onCompare?: (component: Component) => void;
  isSelectedForCompare?: boolean;
}

export function ComponentCard({ component, onAdd, onCompare, isSelectedForCompare }: Props) {
  const minPrice = Math.min(...component.prices.map((p) => p.price));
  const maxPrice = Math.max(...component.prices.map((p) => p.price));
  const savings = maxPrice - minPrice;
  const accent = TYPE_ACCENT[component.type_name] ?? '#9CA3AF';

  const priorityKeys = PRIORITY_SPECS[component.type_name] ?? [];
  const specsToShow = priorityKeys.filter(k => component.specs?.[k] != null).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative group h-full"
    >
      {/* GlassCard: gradient border — intensificado en hover */}
      <div className="absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 bg-gradient-to-br from-white/28 via-white/8 to-transparent pointer-events-none" />

      <div className={`relative h-full rounded-xl border bg-[#0A0A0A]/90 backdrop-blur-xl p-5 z-10 flex flex-col gap-4 transition-[border-color] duration-300 ${
        isSelectedForCompare ? 'border-violet-500/40 bg-violet-500/5' : 'border-[#242424] group-hover:border-white/35'
      }`}>

        {/* Top shimmer line — Apple-style */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        {/* Type badge + accent dot */}
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 group-hover:scale-125"
            style={{ backgroundColor: accent, boxShadow: `0 0 0 0 ${accent}` }}
          />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600 group-hover:text-zinc-500 transition-colors duration-300">
            {component.type_name}
          </span>
        </div>

        {/* Name + brand */}
        <div className="space-y-1.5">
          <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 group-hover:text-white transition-colors">
            {component.name}
          </h3>
          <p className="font-mono text-[9px] text-zinc-700 uppercase tracking-[0.15em]">
            {component.brand_name}
          </p>
        </div>

        {/* Specs — TIPOGRAFÍA MONOESPACIADA ENGINEERING */}
        {specsToShow.length > 0 && (
          <div className="border-t border-[#1C1C1C] pt-3.5 space-y-2.5">
            {specsToShow.map(key => (
              <div key={key} className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[9px] text-zinc-700 uppercase tracking-[0.15em] shrink-0">
                  {SPEC_LABELS[key] ?? key}
                </span>
                <span className="font-mono text-[11px] text-zinc-300 font-medium tabular-nums">
                  {formatSpecValue(key, component.specs![key])}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Price section */}
        <div className="mt-auto space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[9px] text-zinc-700 uppercase tracking-[0.15em]">Mejor precio</span>
            {/* Precio: máximo brillo y contraste */}
            <span className="text-2xl font-black text-white tabular-nums drop-shadow-[0_0_12px_rgba(255,255,255,0.25)] group-hover:drop-shadow-[0_0_16px_rgba(255,255,255,0.4)] transition-all duration-300">
              ${minPrice.toLocaleString("es-CL")}
            </span>
          </div>

          {/* Vendor list */}
          <div className="bg-[#0F0F0F] border border-[#1C1C1C] rounded-lg p-2.5 space-y-1.5">
            {component.prices.slice(0, 2).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <span className={`font-mono text-[10px] truncate ${
                  p.price === minPrice ? 'text-zinc-400' : 'text-zinc-700'
                }`}>
                  {p.vendor_name}
                </span>
                {/* Mejor precio: texto blanco puro */}
                <span className={`font-mono text-[10px] tabular-nums shrink-0 ${
                  p.price === minPrice ? 'text-white font-bold' : 'text-zinc-700'
                }`}>
                  ${p.price.toLocaleString("es-CL")}
                </span>
              </div>
            ))}
          </div>

          {savings > 0 && (
            <p className="font-mono text-[9px] text-zinc-700 text-center tracking-wider">
              Ahorra <span className="text-zinc-500">${savings.toLocaleString("es-CL")}</span>
            </p>
          )}
        </div>

        {/* Botones: CTA primario alto contraste + secundario stealth */}
        <div className="flex gap-2 pt-3 border-t border-[#1C1C1C]">
          {/* BOTÓN PRIMARIO — Fondo blanco, texto negro, glow en hover */}
          <motion.button
            whileHover={{
              scale: 1.02,
              boxShadow: '0 0 18px rgba(255,255,255,0.22), 0 4px 14px rgba(0,0,0,0.5)',
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={() => onAdd(component)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white hover:bg-zinc-50 text-black font-bold font-mono text-[11px] rounded-lg transition-colors duration-150 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 transition-transform duration-150 group-hover:scale-110" />
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
                  ? 'border-violet-500/50 bg-violet-500/10 text-violet-400'
                  : 'border-white/10 hover:border-white/40 hover:bg-white/6 text-zinc-600 hover:text-zinc-200'
              }`}
              title={isSelectedForCompare ? "Quitar de comparación" : "Comparar"}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
