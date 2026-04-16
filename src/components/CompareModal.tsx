import type { Component } from "../types";

interface Props {
  components: Component[];
  onClose: () => void;
}

const TYPE_BADGE: Record<string, string> = {
  CPU:         "bg-violet-500/15 text-violet-300 border-violet-400/25",
  GPU:         "bg-emerald-500/15 text-emerald-300 border-emerald-400/25",
  RAM:         "bg-blue-500/15 text-blue-300 border-blue-400/25",
  Motherboard: "bg-orange-500/15 text-orange-300 border-orange-400/25",
  Storage:     "bg-amber-500/15 text-amber-300 border-amber-400/25",
  PSU:         "bg-red-500/15 text-red-300 border-red-400/25",
  Case:        "bg-slate-500/15 text-slate-300 border-slate-400/25",
  "CPU Cooler":"bg-cyan-500/15 text-cyan-300 border-cyan-400/25",
};

const SPEC_LABELS: Record<string, string> = {
  core_count: 'Cores',
  thread_count: 'Threads',
  tdp: 'TDP (W)',
  base_clock: 'Base Clock',
  boost_clock: 'Boost Clock',
  socket: 'Socket',
  gpu: 'GPU Integrada',
  cinebench_r20_single_score: 'CB R20 (1T)',
  cinebench_r20_multi_score: 'CB R20 (nT)',
  gpu_boost_clock: 'Boost Clock',
  vram_quantity: 'VRAM',
  gpu_tdp: 'TDP (W)',
  bus_width: 'Bus',
  capacity: 'Capacidad',
  bus_speed: 'Velocidad',
  ram_type: 'Tipo',
  module_count: 'Modulos',
  chipset: 'Chipset',
  memory_slots_quantity: 'Slots RAM',
  capacity_value: 'Capacidad',
  bus_type: 'Interface',
  read_speed: 'Lectura',
  write_speed: 'Escritura',
  wattage: 'Watts',
  certification: 'Certificacion',
  is_modular: 'Modular',
  form_factor: 'Form Factor',
  max_motherboard_form_factor: 'Form Factor',
};

// Specs donde menor valor es mejor (para destacar con verde al menor)
const LOWER_IS_BETTER = new Set(['tdp', 'gpu_tdp']);

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Si' : 'No';
  if (key === 'tdp' || key === 'gpu_tdp') return `${value}W`;
  if (key === 'wattage') return `${value}W`;
  if (key === 'vram_quantity') return `${value} GB`;
  return String(value);
}

export function CompareModal({ components, onClose }: Props) {
  if (components.length < 2) return null;

  const [a, b] = components;

  const specsA = a!.specs ?? {};
  const specsB = b!.specs ?? {};

  // Union de todas las claves con label conocido y al menos un valor
  const allKeys = Array.from(new Set([...Object.keys(specsA), ...Object.keys(specsB)]));
  const displayKeys = allKeys.filter(
    (k) => SPEC_LABELS[k] !== undefined && (specsA[k] != null || specsB[k] != null)
  );

  const minPriceA = a!.prices.length > 0 ? Math.min(...a!.prices.map((p) => p.price)) : null;
  const minPriceB = b!.prices.length > 0 ? Math.min(...b!.prices.map((p) => p.price)) : null;

  const badgeA = TYPE_BADGE[a!.type_name] ?? "bg-gray-500/15 text-gray-300 border-gray-400/25";
  const badgeB = TYPE_BADGE[b!.type_name] ?? "bg-gray-500/15 text-gray-300 border-gray-400/25";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <h2 className="text-white font-semibold text-base">Comparar {a!.type_name}</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors duration-150 text-2xl leading-none cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Component headers — 3 cols: label | A | B */}
        <div className="grid grid-cols-[140px_1fr_1fr] shrink-0 border-b border-white/5">
          <div className="bg-neutral-950 px-4 py-4" />
          {[{ comp: a!, badge: badgeA }, { comp: b!, badge: badgeB }].map(({ comp, badge }) => (
            <div key={comp.id} className="bg-neutral-900 px-5 py-4 flex flex-col gap-1.5 border-l border-white/5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border w-fit ${badge}`}>
                {comp.type_name}
              </span>
              <h3 className="text-white font-semibold text-sm leading-snug">{comp.name}</h3>
              <p className="text-neutral-500 text-xs">{comp.brand_name}</p>
            </div>
          ))}
        </div>

        {/* Specs table */}
        <div className="overflow-y-auto flex-1">
          {displayKeys.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-neutral-500 text-sm">
              No hay especificaciones disponibles para comparar
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-white/5">
              {displayKeys.map((key, i) => {
                const valA = specsA[key];
                const valB = specsB[key];
                const numA = typeof valA === 'number' ? valA : null;
                const numB = typeof valB === 'number' ? valB : null;
                const lowerBetter = LOWER_IS_BETTER.has(key);

                // Determinar cuál valor es "mejor"
                let aWins = false;
                let bWins = false;
                if (numA !== null && numB !== null) {
                  if (lowerBetter) {
                    aWins = numA < numB;
                    bWins = numB < numA;
                  } else {
                    aWins = numA > numB;
                    bWins = numB > numA;
                  }
                }

                return (
                  <div
                    key={key}
                    className={`grid grid-cols-[140px_1fr_1fr] ${i % 2 === 0 ? 'bg-neutral-900' : 'bg-neutral-950'}`}
                  >
                    {/* Nombre del spec */}
                    <div className="px-4 py-3 flex items-center">
                      <span className="text-neutral-500 text-xs uppercase tracking-wide font-medium">
                        {SPEC_LABELS[key]}
                      </span>
                    </div>
                    {/* Valor A */}
                    <div className="px-5 py-3 flex items-center border-l border-white/5">
                      <span className={`text-sm font-semibold tabular-nums ${
                        valA == null ? 'text-neutral-700' : aWins ? 'text-green-400' : 'text-neutral-300'
                      }`}>
                        {formatValue(key, valA)}
                      </span>
                    </div>
                    {/* Valor B */}
                    <div className="px-5 py-3 flex items-center border-l border-white/5">
                      <span className={`text-sm font-semibold tabular-nums ${
                        valB == null ? 'text-neutral-700' : bWins ? 'text-green-400' : 'text-neutral-300'
                      }`}>
                        {formatValue(key, valB)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer: mejor precio de referencia */}
        <div className="grid grid-cols-[140px_1fr_1fr] border-t border-white/5 shrink-0">
          <div className="bg-neutral-950 px-4 py-3 flex items-center">
            <span className="text-neutral-500 text-xs uppercase tracking-wide font-medium">Mejor precio</span>
          </div>
          {[{ comp: a!, minPrice: minPriceA }, { comp: b!, minPrice: minPriceB }].map(({ comp, minPrice }) => (
            <div key={comp.id} className="bg-neutral-950 px-5 py-3 flex items-center border-l border-white/5">
              <span className="text-neutral-300 text-sm font-bold tabular-nums">
                {minPrice != null ? `$${minPrice.toLocaleString('es-CL')}` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
