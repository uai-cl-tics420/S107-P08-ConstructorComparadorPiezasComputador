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
};

export function CompareModal({ components, onClose }: Props) {
  if (components.length < 2) return null;

  const [a, b] = components;

  const minPriceA = Math.min(...a.prices.map(p => p.price));
  const minPriceB = Math.min(...b.prices.map(p => p.price));

  // Collect all vendor names across both components
  const allVendors = Array.from(
    new Set([...a.prices.map(p => p.vendor_name), ...b.prices.map(p => p.vendor_name)])
  );

  const badgeA = TYPE_BADGE[a.type_name] ?? "bg-gray-500/15 text-gray-300 border-gray-400/25";
  const badgeB = TYPE_BADGE[b.type_name] ?? "bg-gray-500/15 text-gray-300 border-gray-400/25";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-white font-semibold text-base">Comparar componentes</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors duration-150 text-2xl leading-none cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Component headers */}
        <div className="grid grid-cols-2 gap-px bg-white/5">
          {[{ comp: a, badge: badgeA }, { comp: b, badge: badgeB }].map(({ comp, badge }) => (
            <div key={comp.id} className="bg-neutral-900 px-6 py-4 flex flex-col gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border w-fit ${badge}`}>
                {comp.type_name}
              </span>
              <h3 className="text-white font-semibold text-sm leading-snug">{comp.name}</h3>
              <p className="text-neutral-500 text-xs">{comp.brand_name}</p>
            </div>
          ))}
        </div>

        {/* Price comparison per vendor */}
        <div className="flex flex-col divide-y divide-white/5">
          {allVendors.map(vendor => {
            const priceA = a.prices.find(p => p.vendor_name === vendor)?.price;
            const priceB = b.prices.find(p => p.vendor_name === vendor)?.price;
            const cheaperIsA = priceA !== undefined && priceB !== undefined && priceA < priceB;
            const cheaperIsB = priceA !== undefined && priceB !== undefined && priceB < priceA;

            return (
              <div key={vendor} className="grid grid-cols-[1fr_1fr] gap-px bg-white/5">
                {/* Vendor label spans both — render as two cells */}
                <div className="bg-neutral-900 px-6 py-3 flex items-center justify-between">
                  <span className="text-neutral-500 text-xs">{vendor}</span>
                  <span className={`text-sm tabular-nums font-semibold ${priceA === undefined ? "text-neutral-700" : cheaperIsA ? "text-green-400" : "text-neutral-300"}`}>
                    {priceA !== undefined ? `$${priceA.toLocaleString("es-CL")}` : "—"}
                  </span>
                </div>
                <div className="bg-neutral-900 px-6 py-3 flex items-center justify-between">
                  <span className="text-neutral-500 text-xs">{vendor}</span>
                  <span className={`text-sm tabular-nums font-semibold ${priceB === undefined ? "text-neutral-700" : cheaperIsB ? "text-green-400" : "text-neutral-300"}`}>
                    {priceB !== undefined ? `$${priceB.toLocaleString("es-CL")}` : "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Best price summary */}
        <div className="grid grid-cols-2 gap-px bg-white/5 border-t border-white/5">
          {[
            { comp: a, minPrice: minPriceA, other: minPriceB },
            { comp: b, minPrice: minPriceB, other: minPriceA },
          ].map(({ comp, minPrice, other }) => (
            <div key={comp.id} className="bg-neutral-950 px-6 py-4 flex flex-col gap-0.5">
              <span className="text-neutral-500 text-xs">Mejor precio</span>
              <span className={`text-lg font-bold tabular-nums ${minPrice <= other ? "text-green-400" : "text-neutral-300"}`}>
                ${minPrice.toLocaleString("es-CL")}
              </span>
              {minPrice <= other && (
                <span className="text-green-500 text-xs font-medium">Mas barato</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
