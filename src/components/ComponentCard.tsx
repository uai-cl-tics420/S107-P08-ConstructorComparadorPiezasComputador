import type { Component } from "../types";

// Colores y gradientes por tipo de componente
const TYPE_CONFIG: Record<string, { badge: string; glow: string; dot: string }> = {
  CPU:          { badge: "bg-violet-500/15 text-violet-300 border-violet-400/25", glow: "hover:shadow-violet-500/10", dot: "bg-violet-400" },
  GPU:          { badge: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25", glow: "hover:shadow-emerald-500/10", dot: "bg-emerald-400" },
  RAM:          { badge: "bg-blue-500/15 text-blue-300 border-blue-400/25", glow: "hover:shadow-blue-500/10", dot: "bg-blue-400" },
  Motherboard:  { badge: "bg-orange-500/15 text-orange-300 border-orange-400/25", glow: "hover:shadow-orange-500/10", dot: "bg-orange-400" },
  Storage:      { badge: "bg-amber-500/15 text-amber-300 border-amber-400/25", glow: "hover:shadow-amber-500/10", dot: "bg-amber-400" },
  PSU:          { badge: "bg-red-500/15 text-red-300 border-red-400/25", glow: "hover:shadow-red-500/10", dot: "bg-red-400" },
  Case:         { badge: "bg-slate-500/15 text-slate-300 border-slate-400/25", glow: "hover:shadow-slate-500/10", dot: "bg-slate-400" },
  "CPU Cooler": { badge: "bg-cyan-500/15 text-cyan-300 border-cyan-400/25", glow: "hover:shadow-cyan-500/10", dot: "bg-cyan-400" },
};

interface Props {
  component: Component;
  onAdd: (component: Component) => void;
}

export function ComponentCard({ component, onAdd }: Props) {
  const minPrice = Math.min(...component.prices.map((p) => p.price));
  const maxPrice = Math.max(...component.prices.map((p) => p.price));
  const savings = maxPrice - minPrice;
  const config = TYPE_CONFIG[component.type_name] ?? { badge: "bg-gray-500/15 text-gray-300 border-gray-400/25", glow: "hover:shadow-gray-500/10", dot: "bg-gray-400" };

  return (
    <div className={`group relative bg-neutral-900/60 backdrop-blur-sm border border-white/5 rounded-2xl p-5 flex flex-col gap-4 hover:border-white/10 hover:shadow-xl ${config.glow} transition-all duration-300 transform hover:-translate-y-0.5`}>

      {/* Badge tipo + nombre */}
      <div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
          {component.type_name}
        </span>
        <h3 className="text-white font-semibold text-sm mt-3 leading-snug line-clamp-2 group-hover:text-white/90">
          {component.name}
        </h3>
        <p className="text-neutral-500 text-xs mt-1 font-medium">{component.brand_name}</p>
      </div>

      {/* Separador */}
      <div className="h-px bg-white/5" />

      {/* Precios */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-neutral-400 text-xs">Mejor precio</span>
          <span className="text-green-400 font-bold text-base tabular-nums">
            ${minPrice.toLocaleString("es-CL")}
          </span>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3 flex flex-col gap-2 border border-white/5">
          {component.prices.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <span className={`text-xs flex items-center gap-1.5 ${p.price === minPrice ? "text-neutral-300" : "text-neutral-500"}`}>
                {p.price === minPrice
                  ? <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                  : <span className="w-1.5 h-1.5 rounded-full bg-neutral-700 shrink-0" />
                }
                {p.vendor_name}
              </span>
              <span className={`text-xs tabular-nums font-medium ${p.price === minPrice ? "text-green-400" : "text-neutral-500"}`}>
                ${p.price.toLocaleString("es-CL")}
              </span>
            </div>
          ))}
        </div>
        {savings > 0 && (
          <p className="text-xs text-neutral-600 text-center">
            Ahorra hasta <span className="text-green-500 font-semibold">${savings.toLocaleString("es-CL")}</span> eligiendo bien
          </p>
        )}
      </div>

      {/* Botón */}
      <button
        onClick={() => onAdd(component)}
        className="w-full bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 active:scale-[0.98] text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-150 cursor-pointer"
      >
        + Agregar al build
      </button>
    </div>
  );
}
