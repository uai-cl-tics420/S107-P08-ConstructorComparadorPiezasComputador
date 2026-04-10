import type { SavedBuild } from "../types";

interface Props {
  savedBuilds: SavedBuild[];
  onLoad: (build: SavedBuild) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function totalPrice(build: SavedBuild): number {
  return build.components.reduce((sum, bc) => {
    const minPrice = Math.min(...bc.component.prices.map(p => p.price));
    return sum + minPrice * bc.quantity;
  }, 0);
}

export function SavedBuildsPanel({ savedBuilds, onLoad, onDelete }: Props) {
  return (
    <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
      <h3 className="text-white text-sm font-semibold">Builds guardados</h3>

      {savedBuilds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <span className="text-3xl">💾</span>
          <p className="text-neutral-500 text-sm text-center">No hay builds guardados aun</p>
          <p className="text-neutral-700 text-xs text-center">Guarda tu build actual para acceder despues</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {savedBuilds.map(build => (
            <div
              key={build.id}
              className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col gap-2 hover:border-white/10 transition-colors duration-200"
            >
              {/* Build info */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{build.name}</p>
                  <p className="text-neutral-500 text-xs">{formatDate(build.created_at)}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className="text-green-400 text-sm font-bold tabular-nums">
                    ${totalPrice(build).toLocaleString("es-CL")}
                  </span>
                  <span className="text-neutral-600 text-xs">
                    {build.components.length} componente{build.components.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Component type pills */}
              <div className="flex flex-wrap gap-1">
                {build.components.map(bc => (
                  <span
                    key={bc.component.id}
                    className="px-1.5 py-0.5 bg-white/5 border border-white/5 rounded-md text-neutral-400 text-xs"
                  >
                    {bc.component.type_name}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onLoad(build)}
                  className="flex-1 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-white text-xs font-semibold py-2 rounded-lg transition-all duration-150 cursor-pointer"
                >
                  Cargar build
                </button>
                <button
                  onClick={() => onDelete(build.id)}
                  className="px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 text-xs font-semibold py-2 rounded-lg transition-all duration-150 cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
