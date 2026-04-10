import type { Component } from "../types";

interface Props {
  component: Component;
  onAdd: (component: Component) => void;
}

export function ComponentCard({ component, onAdd }: Props) {
  const minPrice = Math.min(...component.prices.map((p) => p.price));
  const maxPrice = Math.max(...component.prices.map((p) => p.price));

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col gap-3 hover:border-blue-500 transition-colors">
      <div className="flex justify-between items-start gap-2">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
            {component.type_name}
          </span>
          <h3 className="text-white font-semibold text-sm mt-1 leading-tight">
            {component.name}
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">{component.brand_name}</p>
        </div>
        <button
          onClick={() => onAdd(component)}
          className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          + Add
        </button>
      </div>

      <div className="border-t border-gray-700 pt-3">
        <p className="text-xs text-gray-400 mb-2">Prices:</p>
        <div className="flex flex-col gap-1">
          {component.prices.map((p) => (
            <div key={p.id} className="flex justify-between items-center">
              <span className="text-xs text-gray-300">{p.vendor_name}</span>
              <span
                className={`text-xs font-bold ${
                  p.price === minPrice ? "text-green-400" : "text-gray-300"
                }`}
              >
                ${p.price.toLocaleString("es-CL")}
              </span>
            </div>
          ))}
        </div>
        {component.prices.length > 1 && (
          <p className="text-xs text-gray-500 mt-2">
            Range: ${minPrice.toLocaleString("es-CL")} – ${maxPrice.toLocaleString("es-CL")}
          </p>
        )}
      </div>
    </div>
  );
}
