import type { BuildComponent } from "../types";

interface Props {
  build: BuildComponent[];
}

// Orden lógico de selección de piezas al armar una PC:
// CPU define socket y DDR → Motherboard se elige según CPU → RAM según motherboard →
// GPU independiente → Storage independiente → Cooler depende del CPU →
// PSU depende del consumo total → Case depende del form factor de la motherboard
const ALL_TYPES = [
  "CPU",
  "Motherboard",
  "RAM",
  "GPU",
  "Storage",
  "CPU Cooler",
  "PSU",
  "Case",
];

const TYPE_DOT_COLOR: Record<string, string> = {
  CPU:          "bg-violet-400",
  Motherboard:  "bg-orange-400",
  RAM:          "bg-blue-400",
  GPU:          "bg-emerald-400",
  Storage:      "bg-amber-400",
  "CPU Cooler": "bg-cyan-400",
  PSU:          "bg-red-400",
  Case:         "bg-slate-400",
};

export function BuildChecklist({ build }: Props) {
  const presentTypes = new Set(build.map(b => b.component.type_name));
  const completed = ALL_TYPES.filter(t => presentTypes.has(t)).length;
  const percentage = Math.round((completed / ALL_TYPES.length) * 100);

  return (
    <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white text-sm font-semibold">Checklist del Build</h3>
        <span className="text-xs font-bold text-neutral-400 tabular-nums">{percentage}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Lista única */}
      <div className="flex flex-col gap-1">
        {ALL_TYPES.map((type, i) => {
          const present = presentTypes.has(type);
          return (
            <div key={type} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="text-neutral-700 text-[10px] tabular-nums w-3 shrink-0">{i + 1}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${TYPE_DOT_COLOR[type] ?? "bg-gray-400"}`} />
                <span className="text-neutral-300 text-xs">{type}</span>
              </div>
              {present
                ? <span className="text-green-400 text-xs font-medium">✓ Agregado</span>
                : <span className="text-neutral-600 text-xs">— Faltante</span>
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
