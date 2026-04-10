import type { Component } from "../types";

// Colores por tipo de componente
const TYPE_COLORS: Record<string, string> = {
  CPU:         "bg-violet-500/20 text-violet-300 border-violet-500/30",
  GPU:         "bg-green-500/20 text-green-300 border-green-500/30",
  RAM:         "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Motherboard: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Storage:     "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  PSU:         "bg-red-500/20 text-red-300 border-red-500/30",
  Case:        "bg-gray-500/20 text-gray-300 border-gray-500/30",
  "CPU Cooler":"bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};

interface Props {
  component: Component;
  onAdd: (component: Component) => void;
}

export function ComponentCard({ component, onAdd }: Props) {
  const minPrice = Math.min(...component.prices.map((p) => p.price));
  const maxPrice = Math.max(...component.prices.map((p) => p.price));
  const badgeClass = TYPE_COLORS[component.type_name] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30";

  return (
    <div className="group bg-gray-900 border border-gray-700/60 rounded-2xl p-4 flex flex-col gap-4 hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200">

      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}>
            {component.type_name}
          </span>
          <h3 className="text-white font-semibold text-sm mt-2 leading-tight line-clamp-2">
            {component.name}
          </h3>
          <p className="text-gray-500 text-xs mt-1">{component.brand_name}</p>
        </div>
      </div>

      {/* Precio destacado */}
      <div className="bg-gray-800/60 rounded-xl p-3">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs text-gray-400">Mejor precio</span>
          <span className="text-lg font-bold text-green-400">
            ${minPrice.toLocaleString("es-CL")}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {component.prices.map((p) => (
            <div key={p.id} className="flex justify-between items-center">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                {p.price === minPrice && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
                )}
                {p.vendor_name}
              </span>
              <span className={`text-xs font-semibold ${p.price === minPrice ? "text-green-400" : "text-gray-400"}`}>
                ${p.price.toLocaleString("es-CL")}
              </span>
            </div>
          ))}
        </div>
        {component.prices.length > 1 && (
          <p className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-700/50">
            Diferencia: ${(maxPrice - minPrice).toLocaleString("es-CL")}
          </p>
        )}
      </div>

      {/* Botón */}
      <button
        onClick={() => onAdd(component)}
        className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-semibold py-2 rounded-xl transition-all duration-150 cursor-pointer"
      >
        + Agregar al build
      </button>
    </div>
  );
}
