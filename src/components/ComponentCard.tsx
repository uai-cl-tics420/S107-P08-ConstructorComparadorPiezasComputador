import { motion } from 'framer-motion';
import { Plus, ArrowLeftRight, Zap } from 'lucide-react';
import type { Component } from "../types";

const SPEC_LABELS: Record<string, string> = {
  core_count: 'Cores', thread_count: 'Threads', tdp: 'TDP',
  base_clock: 'Base Clock', boost_clock: 'Boost Clock',
  socket: 'Socket', gpu: 'GPU Integrada',
  cinebench_r20_single_score: 'CB R20 (1T)',
  cinebench_r20_multi_score: 'CB R20 (nT)',
  gpu_boost_clock: 'Boost Clock', vram_quantity: 'VRAM',
  gpu_tdp: 'TDP', bus_width: 'Bus',
  capacity: 'Capacidad', bus_speed: 'Velocidad',
  ram_type: 'Tipo', module_count: 'Modulos',
  chipset: 'Chipset', memory_slots_quantity: 'Slots RAM',
  capacity_value: 'Capacidad', bus_type: 'Interface',
  read_speed: 'Lectura', write_speed: 'Escritura',
  wattage: 'Watts', certification: 'Certificacion',
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

const TYPE_CONFIG: Record<string, { color: string; accentLight: string; accentDark: string }> = {
  CPU:          { color: '#7B61FF', accentLight: 'bg-violet-500/20 border-violet-500/40', accentDark: 'text-violet-300' },
  GPU:          { color: '#00FFA3', accentLight: 'bg-emerald-500/20 border-emerald-500/40', accentDark: 'text-emerald-300' },
  RAM:          { color: '#60A5FA', accentLight: 'bg-blue-500/20 border-blue-500/40', accentDark: 'text-blue-300' },
  Motherboard:  { color: '#FB923C', accentLight: 'bg-orange-500/20 border-orange-500/40', accentDark: 'text-orange-300' },
  Storage:      { color: '#FBBF24', accentLight: 'bg-amber-500/20 border-amber-500/40', accentDark: 'text-amber-300' },
  PSU:          { color: '#EF4444', accentLight: 'bg-red-500/20 border-red-500/40', accentDark: 'text-red-300' },
  Case:         { color: '#78716C', accentLight: 'bg-slate-500/20 border-slate-500/40', accentDark: 'text-slate-300' },
  "CPU Cooler": { color: '#06B6D4', accentLight: 'bg-cyan-500/20 border-cyan-500/40', accentDark: 'text-cyan-300' },
};

function formatSpecValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Si' : 'No';
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
  const config = TYPE_CONFIG[component.type_name] ?? { color: '#9CA3AF', accentLight: 'bg-gray-500/20 border-gray-500/40', accentDark: 'text-gray-300' };

  const priorityKeys = PRIORITY_SPECS[component.type_name] ?? [];
  const specsToShow = priorityKeys.filter(k => component.specs?.[k] != null).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -6, borderColor: 'rgba(0, 255, 163, 0.2)' }}
      className={`group relative h-full bg-[#0F0F0F] backdrop-blur-sm border border-[#2A2A2A] rounded-2xl p-6 flex flex-col gap-5 transition-all duration-300 ${
        isSelectedForCompare ? 'border-[#00FFA3]/50 shadow-lg shadow-[#00FFA3]/10' : 'hover:shadow-lg hover:shadow-[#2A2A2A]/50'
      }`}>

      {/* Header: Badge + Title (2/3 width) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: config.color }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-xs font-black uppercase tracking-widest text-[#FAFAFA]/60">
            {component.type_name}
          </span>
        </div>
        <h3 className="text-lg font-black text-[#FAFAFA] leading-tight group-hover:text-[#00FFA3]/80 transition-colors line-clamp-3">
          {component.name}
        </h3>
        <p className="text-[10px] font-medium text-[#6B7280] uppercase tracking-widest">
          {component.brand_name}
        </p>
      </div>

      {/* Specs Grid - Asimétrico */}
      {specsToShow.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-2.5 bg-[#1A1A1A]/40 rounded-lg p-3.5 border border-[#2A2A2A]/60"
        >
          {specsToShow.map((key, idx) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + idx * 0.05 }}
              className="flex items-center justify-between gap-3"
            >
              <span className="text-[9px] font-semibold uppercase tracking-widest text-[#6B7280]">
                {SPEC_LABELS[key] ?? key}
              </span>
              <span className="text-xs font-bold text-[#FAFAFA] tabular-nums">
                {formatSpecValue(key, component.specs![key])}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Price Section - Extremo contraste */}
      <div className="space-y-3 mt-auto">
        <div className="flex items-baseline justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-[#6B7280]">Mejor precio</span>
          <motion.span
            key={minPrice}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-2xl font-black text-[#00FFA3] tabular-nums"
          >
            ${minPrice.toLocaleString("es-CL")}
          </motion.span>
        </div>

        {savings > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 bg-[#00FFA3]/10 border border-[#00FFA3]/30 rounded-lg px-3 py-2"
          >
            <Zap className="w-3.5 h-3.5 text-[#00FFA3]" />
            <span className="text-xs font-bold text-[#00FFA3]">
              Ahorra ${savings.toLocaleString("es-CL")}
            </span>
          </motion.div>
        )}
      </div>

      {/* Vendors List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-1.5 text-[11px]"
      >
        {component.prices.slice(0, 2).map((p) => (
          <div key={p.id} className="flex items-center justify-between px-2 py-1 rounded-md bg-[#1A1A1A]/30">
            <span className={p.price === minPrice ? 'text-[#FAFAFA] font-semibold' : 'text-[#6B7280]'}>
              {p.vendor_name}
            </span>
            <span className={p.price === minPrice ? 'text-[#00FFA3] font-bold' : 'text-[#6B7280]'}>
              ${p.price.toLocaleString("es-CL")}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Buttons - Staggered */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex gap-2 pt-2"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAdd(component)}
          className="flex-1 flex items-center justify-center gap-2 bg-[#00FFA3] hover:bg-[#00FFA3]/90 text-[#050505] text-xs font-black py-2.5 rounded-lg transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar
        </motion.button>
        {onCompare && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCompare(component)}
            className={`px-3 py-2.5 border rounded-lg transition-all duration-200 cursor-pointer ${
              isSelectedForCompare
                ? `${config.accentLight} ${config.accentDark} text-xs font-bold`
                : 'bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#00FFA3]/30 text-[#6B7280] hover:text-[#FAFAFA] text-xs font-bold'
            }`}
            title={isSelectedForCompare ? "Quitar de comparación" : "Comparar"}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
