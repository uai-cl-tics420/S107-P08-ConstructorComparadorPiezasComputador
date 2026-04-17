import { motion } from 'framer-motion';
import { X, Plus, TrendingDown } from 'lucide-react';
import type { BuildComponent } from "../types";

const ALL_TYPES = ["CPU", "Motherboard", "RAM", "GPU", "Storage", "CPU Cooler", "PSU", "Case"];

const TYPE_CONFIG: Record<string, { color: string; dot: string }> = {
  CPU:          { color: '#7B61FF', dot: 'bg-violet-400' },
  Motherboard:  { color: '#FB923C', dot: 'bg-orange-400' },
  RAM:          { color: '#60A5FA', dot: 'bg-blue-400' },
  GPU:          { color: '#00FFA3', dot: 'bg-emerald-400' },
  Storage:      { color: '#FBBF24', dot: 'bg-amber-400' },
  "CPU Cooler": { color: '#06B6D4', dot: 'bg-cyan-400' },
  PSU:          { color: '#EF4444', dot: 'bg-red-400' },
  Case:         { color: '#78716C', dot: 'bg-slate-400' },
};

interface Props {
  buildComponents: BuildComponent[];
  onRemove: (componentId: number) => void;
  onSearchType?: (typeName: string) => void;
}

export function BuildList({ buildComponents, onRemove, onSearchType }: Props) {
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

  const addedCount = buildComponents.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header con contador */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-[#6B7280] mb-1">Tu Build</h2>
          <p className="text-3xl font-black text-[#FAFAFA]">
            {addedCount}/8 componentes
          </p>
        </div>
        {addedCount > 0 && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-right"
          >
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#6B7280] mb-2">Completitud</div>
            <div className="w-12 h-12 rounded-full border-2 border-[#2A2A2A] flex items-center justify-center bg-[#1A1A1A]">
              <span className="text-lg font-black text-[#00FFA3]">{Math.round((addedCount / 8) * 100)}%</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 gap-3">
        {ALL_TYPES.map((typeName, idx) => {
          const entry = byType.get(typeName);
          const config = TYPE_CONFIG[typeName] ?? { color: '#9CA3AF', dot: 'bg-gray-400' };

          if (entry) {
            const { component, quantity } = entry;
            const minPrice = Math.min(...component.prices.map((p) => p.price));
            const subtotal = minPrice * quantity;
            const bestVendor = component.prices.find((p) => p.price === minPrice);

            return (
              <motion.div
                key={typeName}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="group relative bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4 hover:border-[#00FFA3]/40 hover:shadow-md hover:shadow-[#00FFA3]/10 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Type + Name (flex-grow) */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <motion.div
                        className={`w-2 h-2 rounded-full ${config.dot}`}
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#6B7280]">
                        {typeName}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#FAFAFA] truncate group-hover:text-[#00FFA3] transition-colors">
                      {component.name}
                    </h4>
                    <p className="text-[10px] text-[#6B7280] mt-1">
                      {bestVendor?.vendor_name}
                    </p>
                  </div>

                  {/* Right: Price + Quantity + Actions */}
                  <div className="text-right space-y-2">
                    <div className="flex items-center gap-2">
                      {quantity > 1 && (
                        <span className="text-[10px] font-bold bg-[#1A1A1A] text-[#6B7280] px-2 py-1 rounded">
                          x{quantity}
                        </span>
                      )}
                      <div className="text-right">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Subtotal</div>
                        <div className="text-lg font-black text-[#00FFA3]">
                          ${subtotal.toLocaleString("es-CL")}
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onRemove(component.id)}
                      className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 bg-[#1A1A1A] hover:bg-red-500/20 border border-[#2A2A2A] hover:border-red-500/50 rounded-md text-[10px] font-bold text-[#6B7280] hover:text-red-400 transition-all"
                    >
                      <X className="w-3 h-3" />
                      Quitar
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          } else {
            // Placeholder
            return (
              <motion.div
                key={typeName}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="group relative bg-[#0F0F0F]/40 border border-dashed border-[#2A2A2A] rounded-lg p-4 opacity-50 hover:opacity-75 hover:border-[#00FFA3]/30 transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${config.dot}/40`} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#6B7280]/60">
                        {typeName}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280]/60 italic">Sin agregar</p>
                  </div>
                  {onSearchType && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onSearchType(typeName)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] border border-[#00FFA3]/30 hover:border-[#00FFA3] rounded-md text-[10px] font-bold text-[#00FFA3] hover:bg-[#00FFA3]/10 transition-all whitespace-nowrap"
                    >
                      <Plus className="w-3 h-3" />
                      Buscar
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          }
        })}
      </div>

      {/* Summary Card - Premium */}
      {addedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#00FFA3]/20 rounded-xl p-6 space-y-4"
        >
          {/* Total Mínimo - Destacado */}
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#6B7280]">Total con mejores precios</p>
            <motion.p
              key={totalMin}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-5xl font-black text-[#00FFA3] tabular-nums"
            >
              ${totalMin.toLocaleString("es-CL")}
            </motion.p>
          </div>

          {/* Savings Badge */}
          {totalMin !== totalMax && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-[#00FFA3]/10 border border-[#00FFA3]/40 rounded-lg px-4 py-3"
            >
              <TrendingDown className="w-4 h-4 text-[#00FFA3]" />
              <div className="flex-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#6B7280]">Puedes ahorrar</p>
                <p className="text-lg font-black text-[#00FFA3]">
                  ${(totalMax - totalMin).toLocaleString("es-CL")}
                </p>
              </div>
            </motion.div>
          )}

          {/* Secondary Info */}
          {totalMin !== totalMax && (
            <p className="text-[10px] text-[#6B7280] border-t border-[#2A2A2A] pt-3">
              Máximo posible: ${totalMax.toLocaleString("es-CL")} eligiendo peores tiendas
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
