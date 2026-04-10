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
      <div className="bg-gray-800 border border-dashed border-gray-600 rounded-xl p-8 text-center">
        <p className="text-gray-500 text-sm">No components added yet.</p>
        <p className="text-gray-600 text-xs mt-1">Search and add components to your build.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-900">
              <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">Type</th>
              <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">Component</th>
              <th className="text-center text-xs text-gray-400 font-semibold px-4 py-3">Qty</th>
              <th className="text-right text-xs text-gray-400 font-semibold px-4 py-3">Best Price</th>
              <th className="text-right text-xs text-gray-400 font-semibold px-4 py-3">Subtotal</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {buildComponents.map(({ component, quantity }) => {
              const minPrice = Math.min(...component.prices.map((p) => p.price));
              const bestVendor = component.prices.find((p) => p.price === minPrice);
              return (
                <tr key={component.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <span className="text-xs text-blue-400 font-medium">{component.type_name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white text-xs font-medium">{component.name}</p>
                    <p className="text-gray-400 text-xs">{bestVendor?.vendor_name}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-300 text-xs">{quantity}</td>
                  <td className="px-4 py-3 text-right text-green-400 text-xs font-bold">
                    ${minPrice.toLocaleString("es-CL")}
                  </td>
                  <td className="px-4 py-3 text-right text-white text-xs font-bold">
                    ${(minPrice * quantity).toLocaleString("es-CL")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onRemove(component.id)}
                      className="text-red-400 hover:text-red-300 text-xs font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-900">
              <td colSpan={4} className="px-4 py-3 text-right text-gray-400 text-xs font-semibold">
                Total (best prices):
              </td>
              <td className="px-4 py-3 text-right text-green-400 font-bold text-sm">
                ${totalMin.toLocaleString("es-CL")}
              </td>
              <td></td>
            </tr>
            {totalMin !== totalMax && (
              <tr className="bg-gray-900">
                <td colSpan={4} className="px-4 py-3 text-right text-gray-400 text-xs font-semibold">
                  Total (max prices):
                </td>
                <td className="px-4 py-3 text-right text-gray-400 font-bold text-sm">
                  ${totalMax.toLocaleString("es-CL")}
                </td>
                <td></td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </div>
  );
}
