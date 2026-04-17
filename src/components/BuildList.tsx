import type { BuildComponent } from "../types";

// Mismo orden que BuildChecklist — el orden lógico de selección de piezas
const ALL_TYPES = ["CPU", "Motherboard", "RAM", "GPU", "Storage", "CPU Cooler", "PSU", "Case"];

const TYPE_DOT_COLOR: Record<string, string> = {
  CPU:          "text-violet-400 bg-violet-500/10 border-violet-400/20",
  Motherboard:  "text-orange-400 bg-orange-500/10 border-orange-400/20",
  RAM:          "text-blue-400 bg-blue-500/10 border-blue-400/20",
  GPU:          "text-emerald-400 bg-emerald-500/10 border-emerald-400/20",
  Storage:      "text-amber-400 bg-amber-500/10 border-amber-400/20",
  "CPU Cooler": "text-cyan-400 bg-cyan-500/10 border-cyan-400/20",
  PSU:          "text-red-400 bg-red-500/10 border-red-400/20",
  Case:         "text-slate-400 bg-slate-500/10 border-slate-400/20",
};

interface Props {
  buildComponents: BuildComponent[];
  onRemove: (componentId: number) => void;
  onSearchType?: (typeName: string) => void;
}

export function BuildList({ buildComponents, onRemove, onSearchType }: Props) {
  // Construir un mapa rápido de tipo → componente
  const byType = new Map<string, BuildComponent>();
  for (const entry of buildComponents) {
    byType.set(entry.component.type_name, entry);
  }

  const totalMin = buildComponents.reduce((sum, { component, quantity }) => {
    const minPrice = Math.min(...component.prices.map((p) => p.price));
    return sum + minPrice * quantity;
  }, 0);

  const totalMax = buildComponents.reduce((sum, { component, quantity }) => {
    const maxPrice = Math.max(...component.prices.map((p) => p.price));
    return sum + maxPrice * quantity;
  }, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Tabla */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3.5">Tipo</th>
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3.5">Componente</th>
                <th className="text-center text-xs text-gray-500 font-medium px-5 py-3.5">Cant.</th>
                <th className="text-right text-xs text-gray-500 font-medium px-5 py-3.5">Mejor precio</th>
                <th className="text-right text-xs text-gray-500 font-medium px-5 py-3.5">Subtotal</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {ALL_TYPES.map((typeName) => {
                const entry = byType.get(typeName);
                const badge = TYPE_DOT_COLOR[typeName] ?? "text-gray-400 bg-gray-500/10 border-gray-400/20";

                if (entry) {
                  // ── Fila con componente ──────────────────────────
                  const { component, quantity } = entry;
                  const minPrice = Math.min(...component.prices.map((p) => p.price));
                  const bestVendor = component.prices.find((p) => p.price === minPrice);
                  return (
                    <tr key={typeName} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badge}`}>
                          {typeName}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white text-sm font-medium">{component.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{bestVendor?.vendor_name}</p>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-gray-300 text-sm bg-gray-800 px-2.5 py-0.5 rounded-lg">
                          {quantity}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-green-400 text-sm font-semibold">
                        ${minPrice.toLocaleString("es-CL")}
                      </td>
                      <td className="px-5 py-4 text-right text-white text-sm font-bold">
                        ${(minPrice * quantity).toLocaleString("es-CL")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => onRemove(component.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                } else {
                  // ── Fila placeholder ──────────────────────────────
                  return (
                    <tr key={typeName} className="opacity-40 hover:opacity-60 transition-opacity">
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badge}`}>
                          {typeName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-gray-600 text-sm italic">— Sin agregar</p>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-gray-700 text-sm">—</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-gray-700 text-sm">—</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-gray-700 text-sm">—</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {onSearchType && (
                          <button
                            onClick={() => onSearchType(typeName)}
                            className="text-xs text-blue-500 hover:text-blue-300 border border-blue-500/20 hover:border-blue-400/40 px-2 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                          >
                            + Buscar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen de precios — solo si hay al menos un componente */}
      {buildComponents.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-gray-400 text-xs mb-1">Total con mejores precios</p>
            <p className="text-3xl font-bold text-green-400">${totalMin.toLocaleString("es-CL")}</p>
            {totalMin !== totalMax && (
              <p className="text-gray-600 text-xs mt-1">
                Máximo posible: ${totalMax.toLocaleString("es-CL")}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs">
              Ahorras hasta{" "}
              <span className="text-green-400 font-semibold">
                ${(totalMax - totalMin).toLocaleString("es-CL")}
              </span>{" "}
              eligiendo las mejores tiendas
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
