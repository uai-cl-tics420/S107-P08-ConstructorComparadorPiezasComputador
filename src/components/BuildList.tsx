import { motion } from 'framer-motion';
import { X, Plus, TrendingDown } from 'lucide-react';
import type { BuildComponent } from '../types/Frontend_types';

const ALL_TYPES = ['CPU', 'Motherboard', 'RAM', 'GPU', 'Storage', 'CPU Cooler', 'PSU', 'Case'];

const TYPE_CONFIG: Record<string, { color: string; dot: string }> = {
  CPU: { color: 'bg-tw-cpu-deep', dot: 'bg-tw-cpu' },
  Motherboard: { color: 'bg-tw-motherboard-deep', dot: 'bg-tw-motherboard' },
  RAM: { color: 'bg-tw-ram-deep', dot: 'bg-tw-ram' },
  GPU: { color: 'bg-tw-gpu-deep', dot: 'bg-tw-gpu' },
  Storage: { color: 'bg-tw-storage-deep', dot: 'bg-tw-storage' },
  'CPU Cooler': { color: 'bg-tw-cooler-deep', dot: 'bg-tw-cooler' },
  PSU: { color: 'bg-tw-psu-deep', dot: 'bg-tw-psu' },
  Case: { color: 'bg-tw-case-deep', dot: 'bg-tw-case' },
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
    <div className='flex flex-col gap-6'>
      {/* Header con contador */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className='flex items-center justify-between'>
        <div>
          <h2 className='text-sm font-black uppercase tracking-widest text-tw-muted mb-1'>Tu Build</h2>
          <p className='text-3xl font-black text-tw-primary'>{addedCount}/8 componentes</p>
        </div>
        {addedCount > 0 && (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className='text-right'>
            <div className='text-[11px] font-bold uppercase tracking-widest text-tw-muted mb-2'>Completitud</div>
            <div className='w-12 h-12 rounded-full border-2 border-tw-border flex items-center justify-center bg-tw-base-highlight'>
              <span className='text-lg font-black text-tw-success-highlight'>
                {Math.round((addedCount / 8) * 100)}%
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Items Grid */}
      <div className='grid grid-cols-1 gap-3'>
        {ALL_TYPES.map((typeName, idx) => {
          const entry = byType.get(typeName);
          const config = TYPE_CONFIG[typeName] ?? { color: 'bg-tw-case-deep', dot: 'bg-tw-case' };

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
                className='group relative bg-tw-base border border-tw-border rounded-lg p-4 hover:border-tw-success-highlight/40 hover:shadow-md hover:shadow-tw-success-highlight/10 transition-all duration-300'>
                <div className='flex items-start justify-between gap-4'>
                  {/* Left: Type + Name (flex-grow) */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-2'>
                      <motion.div
                        className={`w-2 h-2 rounded-full ${config.dot}`}
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className='text-[9px] font-black uppercase tracking-widest text-tw-muted'>{typeName}</span>
                    </div>
                    <h4 className='text-sm font-bold text-tw-primary truncate group-hover:text-tw-success-highlight transition-colors'>
                      {component.name}
                    </h4>
                    <p className='text-[10px] text-tw-muted mt-1'>{bestVendor?.vendor_name}</p>
                  </div>

                  {/* Right: Price + Quantity + Actions */}
                  <div className='text-right space-y-2'>
                    <div className='flex items-center gap-2'>
                      {quantity > 1 && (
                        <span className='text-[10px] font-bold bg-tw-base-highlight text-tw-muted px-2 py-1 rounded'>
                          x{quantity}
                        </span>
                      )}
                      <div className='text-right'>
                        <div className='text-[10px] font-bold uppercase tracking-widest text-tw-muted'>Subtotal</div>
                        <div className='text-lg font-black text-tw-success-highlight'>
                          ${subtotal.toLocaleString('es-CL')}
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onRemove(component.id)}
                      className='w-full flex items-center justify-center gap-1 px-2.5 py-1.5 bg-tw-base-highlight hover:bg-tw-alert/20 border border-tw-border hover:border-tw-alert/50 rounded-md text-[10px] font-bold text-tw-muted hover:text-tw-alert-highlight transition-all'>
                      <X className='w-3 h-3' />
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
                className='group relative bg-tw-base/40 border border-dashed border-tw-border rounded-lg p-4 opacity-50 hover:opacity-75 hover:border-tw-success-highlight/30 transition-all'>
                <div className='flex items-center justify-between gap-4'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-2'>
                      <div className={`w-2 h-2 rounded-full ${config.dot}/40`} />
                      <span className='text-[9px] font-black uppercase tracking-widest text-tw-muted/60'>
                        {typeName}
                      </span>
                    </div>
                    <p className='text-xs text-tw-muted/60 italic'>Sin agregar</p>
                  </div>
                  {onSearchType && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onSearchType(typeName)}
                      className='flex items-center gap-1.5 px-3 py-1.5 bg-tw-base-highlight border border-tw-success-highlight/30 hover:border-tw-success-highlight rounded-md text-[10px] font-bold text-tw-success-highlight hover:bg-tw-success-highlight/10 transition-all whitespace-nowrap'>
                      <Plus className='w-3 h-3' />
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
          className='mt-4 bg-linear-to-br from-tw-surface-highlight to-tw-surface border-tw-success-highlight/20 rounded-xl p-6 space-y-4'>
          {/* Total Mínimo - Destacado */}
          <div className='space-y-2'>
            <p className='text-[9px] font-black uppercase tracking-widest text-tw-muted'>Total con mejores precios</p>
            <motion.p
              key={totalMin}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className='text-5xl font-black text-tw-success-highlight tabular-nums'>
              ${totalMin.toLocaleString('es-CL')}
            </motion.p>
          </div>

          {/* Savings Badge */}
          {totalMin !== totalMax && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className='flex items-center gap-2 bg-tw-success-highlight/10 border border-tw-success-highlight/40 rounded-lg px-4 py-3'>
              <TrendingDown className='w-4 h-4 text-tw-success-highlight' />
              <div className='flex-1'>
                <p className='text-[9px] font-bold uppercase tracking-widest text-tw-muted'>Puedes ahorrar</p>
                <p className='text-lg font-black text-tw-success-highlight'>
                  ${(totalMax - totalMin).toLocaleString('es-CL')}
                </p>
              </div>
            </motion.div>
          )}

          {/* Secondary Info */}
          {totalMin !== totalMax && (
            <p className='text-[10px] text-tw-muted border-t border-tw-border pt-3'>
              Máximo posible: ${totalMax.toLocaleString('es-CL')} eligiendo peores tiendas
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
