import { useState, useEffect } from "react";
import { ComponentCard } from "./components/ComponentCard";
import { BuildList } from "./components/BuildList";
import type { Component, ComponentType, Brand, BuildComponent } from "./types";
import "./index.css";

export function App() {
  const [components, setComponents] = useState<Component[]>([]);
  const [componentTypes, setComponentTypes] = useState<ComponentType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [buildComponents, setBuildComponents] = useState<BuildComponent[]>([]);

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "build">("search");

  // Load filters on mount
  useEffect(() => {
    fetch("/api/component-types").then((r) => r.json()).then(setComponentTypes);
    fetch("/api/brands").then((r) => r.json()).then(setBrands);
  }, []);

  // Search components
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedType) params.set("type_id", selectedType);
    if (selectedBrand) params.set("brand_id", selectedBrand);

    fetch(`/api/components?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setComponents(data);
        setLoading(false);
      });
  }, [search, selectedType, selectedBrand]);

  const handleAdd = (component: Component) => {
    setBuildComponents((prev) => {
      const existing = prev.find((b) => b.component.id === component.id);
      if (existing) {
        const type = componentTypes.find((t) => t.id === component.type_id);
        if (type && existing.quantity >= type.max_quantity) return prev;
        return prev.map((b) =>
          b.component.id === component.id ? { ...b, quantity: b.quantity + 1 } : b
        );
      }
      return [...prev, { component, quantity: 1 }];
    });
    setActiveTab("build");
  };

  const handleRemove = (componentId: number) => {
    setBuildComponents((prev) => prev.filter((b) => b.component.id !== componentId));
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">

      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0f1117]/80 backdrop-blur-md border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              PC
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">PC Builder</h1>
              <p className="text-gray-500 text-xs mt-0.5">Compara precios y arma tu PC</p>
            </div>
          </div>

          {buildComponents.length > 0 && (
            <button
              onClick={() => setActiveTab("build")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center justify-center w-5 h-5 bg-white/20 rounded-full text-xs font-bold">
                {buildComponents.length}
              </span>
              Mi Build
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === "search"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Buscar componentes
          </button>
          <button
            onClick={() => setActiveTab("build")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === "build"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Mi Build {buildComponents.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-blue-400/30 rounded-full text-xs">
                {buildComponents.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab: Buscar */}
        {activeTab === "search" && (
          <div>
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar componentes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/60 cursor-pointer appearance-none"
              >
                <option value="">Todos los tipos</option>
                {componentTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/60 cursor-pointer appearance-none"
              >
                <option value="">Todas las marcas</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Resultados */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : components.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-sm">No se encontraron componentes.</p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 text-xs mb-4">{components.length} componentes encontrados</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {components.map((c) => (
                    <ComponentCard key={c.id} component={c} onAdd={handleAdd} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab: Mi Build */}
        {activeTab === "build" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold">Mi Build</h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  {buildComponents.length === 0
                    ? "Agrega componentes desde la búsqueda"
                    : `${buildComponents.length} componente${buildComponents.length > 1 ? "s" : ""} agregado${buildComponents.length > 1 ? "s" : ""}`}
                </p>
              </div>
              {buildComponents.length > 0 && (
                <button
                  onClick={() => setBuildComponents([])}
                  className="text-xs text-red-400 hover:text-red-300 border border-red-400/20 hover:border-red-400/40 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  Limpiar todo
                </button>
              )}
            </div>
            <BuildList buildComponents={buildComponents} onRemove={handleRemove} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
