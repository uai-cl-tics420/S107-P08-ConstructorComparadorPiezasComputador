import type { BuildComponent } from "../types";

interface Props {
  buildComponents: BuildComponent[];
  onRemove: (componentId: number) => void;
}

export function BuildList({ buildComponents, onRemove }: Props) {
  const totalMin = buildComponents.reduce((sum, { component, quantity }) => {
    const minPrice = Math.min(...component.prices.map((p) => p.price));
    return sum + minPrice * quantity;
  }, 0);

  const totalMax = buildComponents.reduce((sum, { component, quantity }) => {
    const maxPrice = Math.max(...component.prices.map((p) => p.price));
    return sum + maxPrice * quantity;
  }, 0);

  if (buildComponents.length === 0) {
    return (
      <div className="border border-dashed border-gray-800 rounded-2xl p-12 text-center">
        <div className="w-12 h-12 bg-gray-800 rounded-xl mx-auto mb-3 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm font-medium">Tu build está vacío</p>
        <p className="text-gray-600 text-xs mt-1">Busca y agrega componentes para comenzar.</p>
      </div>
    );
  }

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
              {buildComponents.map(({ component, quantity }) => {
                const minPrice = Math.min(...component.prices.map((p) => p.price));
                const bestVendor = component.prices.find((p) => p.price === minPrice);
                return (
                  <tr key={component.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <span className="text-xs text-blue-400 font-medium bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                        {component.type_name}
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
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen de precios */}
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
    </div>
  );
}
