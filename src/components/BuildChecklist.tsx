import type { BuildComponent } from "../types";

interface Props {
  build: BuildComponent[];
}

const REQUIRED_TYPES = ["CPU", "GPU", "RAM", "Motherboard", "Storage", "PSU"];
const OPTIONAL_TYPES = ["Case", "CPU Cooler"];

const TYPE_DOT_COLOR: Record<string, string> = {
  CPU:         "bg-violet-400",
  GPU:         "bg-emerald-400",
  RAM:         "bg-blue-400",
  Motherboard: "bg-orange-400",
  Storage:     "bg-amber-400",
  PSU:         "bg-red-400",
  Case:        "bg-slate-400",
  "CPU Cooler": "bg-cyan-400",
};

export function BuildChecklist({ build }: Props) {
  const presentTypes = new Set(build.map(b => b.component.type_name));
  const completedRequired = REQUIRED_TYPES.filter(t => presentTypes.has(t)).length;
  const percentage = Math.round((completedRequired / REQUIRED_TYPES.length) * 100);

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

      {/* Required */}
      <div className="flex flex-col gap-1">
        <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider mb-0.5">Requeridos</p>
        {REQUIRED_TYPES.map(type => {
          const present = presentTypes.has(type);
          return (
            <div key={type} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
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

      {/* Optional */}
      <div className="flex flex-col gap-1 pt-1 border-t border-white/5">
        <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider mb-0.5">Opcionales</p>
        {OPTIONAL_TYPES.map(type => {
          const present = presentTypes.has(type);
          return (
            <div key={type} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${TYPE_DOT_COLOR[type] ?? "bg-gray-400"}`} />
                <span className="text-neutral-400 text-xs">{type}</span>
              </div>
              {present
                ? <span className="text-green-400 text-xs font-medium">✓ Agregado</span>
                : <span className="text-neutral-700 text-xs">— Opcional</span>
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
