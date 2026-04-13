import { useState, useEffect, useMemo } from "react";
import { ComponentCard } from "./components/ComponentCard";
import { BuildList } from "./components/BuildList";
import { ToastContainer } from "./components/ToastContainer";
import { SkeletonCard } from "./components/SkeletonCard";
import { BuildChecklist } from "./components/BuildChecklist";
import { CompareModal } from "./components/CompareModal";
import { SavedBuildsPanel } from "./components/SavedBuildsPanel";
import { useToast } from "./hooks/useToast";
import { useSavedBuilds } from "./hooks/useSavedBuilds";
import { checkCompatibility } from "./utils/compatibility";
import type { Component, ComponentType, Brand, BuildComponent, SavedBuild } from "./types";
import "./index.css";

export function App() {
  const [components, setComponents] = useState<Component[]>([]);
  const [componentTypes, setComponentTypes] = useState<ComponentType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [buildComponents, setBuildComponents] = useState<BuildComponent[]>([]);

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "build">("search");

  // Compare mode
  const [compareList, setCompareList] = useState<Component[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Save build dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");

  const { toasts, addToast, removeToast } = useToast();
  const { savedBuilds, saveBuild, deleteBuild } = useSavedBuilds();
  const compatibilityIssues = checkCompatibility(buildComponents);

  // Load filter options on mount
  useEffect(() => {
    fetch("/api/component-types").then((r) => r.json()).then(setComponentTypes);
    fetch("/api/brands").then((r) => r.json()).then(setBrands);
  }, []);

  // Fetch components when search/type/brand changes
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

  // Client-side price filter + sort
  const displayedComponents = useMemo(() => {
    let result = [...components];
    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : Infinity;
    if (min > 0 || max < Infinity) {
      result = result.filter((c) => {
        const best = Math.min(...c.prices.map((p) => p.price));
        return best >= min && best <= max;
      });
    }
    if (sortBy === "price_asc") {
      result.sort((a, b) => Math.min(...a.prices.map((p) => p.price)) - Math.min(...b.prices.map((p) => p.price)));
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => Math.min(...b.prices.map((p) => p.price)) - Math.min(...a.prices.map((p) => p.price)));
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [components, minPrice, maxPrice, sortBy]);

  const handleAdd = (component: Component) => {
    setBuildComponents((prev) => {
      const existing = prev.find((b) => b.component.id === component.id);
      if (existing) {
        const type = componentTypes.find((t) => t.id === component.type_id);
        if (type && existing.quantity >= type.max_quantity) {
          addToast(`Límite máximo alcanzado para ${component.type_name}`, "warning");
          return prev;
        }
        addToast(`${component.name} actualizado`, "success");
        return prev.map((b) =>
          b.component.id === component.id ? { ...b, quantity: b.quantity + 1 } : b
        );
      }
      addToast(`${component.name} agregado al build`, "success");
      return [...prev, { component, quantity: 1 }];
    });
    setActiveTab("build");
  };

  const handleRemove = (componentId: number) => {
    const found = buildComponents.find((b) => b.component.id === componentId);
    setBuildComponents((prev) => prev.filter((b) => b.component.id !== componentId));
    if (found) addToast(`${found.component.name} eliminado`, "warning");
  };

  const handleCompare = (component: Component) => {
    setCompareList((prev) => {
      if (prev.find((c) => c.id === component.id)) {
        return prev.filter((c) => c.id !== component.id);
      }
      if (prev.length >= 2) {
        addToast("Solo puedes comparar 2 componentes a la vez", "warning");
        return prev;
      }
      const next = [...prev, component];
      if (next.length === 2) setShowCompareModal(true);
      return next;
    });
  };

  const handleSaveBuild = () => {
    if (!saveName.trim()) return;
    saveBuild(saveName.trim(), buildComponents);
    addToast(`Build "${saveName.trim()}" guardado`, "success");
    setSaveName("");
    setShowSaveDialog(false);
  };

  const handleLoadBuild = (build: SavedBuild) => {
    setBuildComponents(build.components);
    addToast(`Build "${build.name}" cargado`, "success");
    setActiveTab("build");
  };

  const handleClearBuild = () => {
    setBuildComponents([]);
    addToast("Build limpiado", "warning");
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedType("");
    setSelectedBrand("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("default");
  };

  const hasActiveFilters = search || selectedType || selectedBrand || minPrice || maxPrice;

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">

      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0f1117]/80 backdrop-blur-md border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
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
            Mi Build{buildComponents.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-blue-400/30 rounded-full text-xs">
                {buildComponents.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab: Buscar */}
        {activeTab === "search" && (
          <div>
            {/* Compare bar */}
            {compareList.length > 0 && (
              <div className="flex items-center justify-between bg-violet-500/10 border border-violet-500/25 rounded-xl px-4 py-3 mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-violet-300 text-sm font-semibold">
                    Comparando {compareList.length}/2:
                  </span>
                  {compareList.map((c) => (
                    <span key={c.id} className="text-white text-xs bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg">
                      {c.name}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 shrink-0">
                  {compareList.length === 2 && (
                    <button
                      onClick={() => setShowCompareModal(true)}
                      className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Ver comparación
                    </button>
                  )}
                  <button
                    onClick={() => setCompareList([])}
                    className="text-violet-400 hover:text-violet-300 text-xs px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Filtros */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
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

              {/* Price range + sort */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-gray-500 text-xs shrink-0">Precio:</span>
                  <input
                    type="number"
                    placeholder="Mín"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  />
                  <span className="text-gray-600 text-xs">–</span>
                  <input
                    type="number"
                    placeholder="Máx"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  />
                  {(minPrice || maxPrice) && (
                    <button
                      onClick={() => { setMinPrice(""); setMaxPrice(""); }}
                      className="text-gray-500 hover:text-white transition-colors text-sm shrink-0 cursor-pointer"
                      title="Limpiar rango"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500/60 cursor-pointer appearance-none"
                >
                  <option value="default">Ordenar por defecto</option>
                  <option value="price_asc">Precio: menor a mayor</option>
                  <option value="price_desc">Precio: mayor a menor</option>
                  <option value="name">Nombre A–Z</option>
                </select>
              </div>
            </div>

            {/* Resultados */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : displayedComponents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 bg-neutral-900 border border-white/5 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-neutral-300 text-sm font-medium">No se encontraron componentes</p>
                  <p className="text-neutral-600 text-xs mt-1">
                    {hasActiveFilters
                      ? "Prueba con otros filtros o amplía el rango de precios"
                      : "No hay componentes disponibles por ahora"}
                  </p>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-blue-400 hover:text-blue-300 border border-blue-400/20 hover:border-blue-400/40 px-4 py-2 rounded-lg transition-all cursor-pointer"
                  >
                    Limpiar todos los filtros
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className="text-gray-600 text-xs mb-4">{displayedComponents.length} componentes encontrados</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayedComponents.map((c, i) => (
                    <div
                      key={c.id}
                      className="animate-card-in"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <ComponentCard
                        component={c}
                        onAdd={handleAdd}
                        onCompare={handleCompare}
                        isSelectedForCompare={compareList.some((x) => x.id === c.id)}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab: Mi Build */}
        {activeTab === "build" && (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Main build area */}
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Mi Build</h2>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {buildComponents.length === 0
                      ? "Agrega componentes desde la búsqueda"
                      : `${buildComponents.length} componente${buildComponents.length > 1 ? "s" : ""} agregado${buildComponents.length > 1 ? "s" : ""}`}
                  </p>
                </div>
                {buildComponents.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSaveDialog(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 border border-blue-400/20 hover:border-blue-400/40 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      Guardar build
                    </button>
                    <button
                      onClick={handleClearBuild}
                      className="text-xs text-red-400 hover:text-red-300 border border-red-400/20 hover:border-red-400/40 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      Limpiar todo
                    </button>
                  </div>
                )}
              </div>

              {/* Compatibility issues */}
              {compatibilityIssues.length > 0 && (
                <div className="flex flex-col gap-2">
                  {compatibilityIssues.map((issue, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
                        issue.type === "error"
                          ? "bg-red-500/10 border-red-500/25 text-red-300"
                          : "bg-amber-500/10 border-amber-500/25 text-amber-300"
                      }`}
                    >
                      <span className="font-bold shrink-0">{issue.type === "error" ? "✕" : "⚠"}</span>
                      <span>{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}

              <BuildList buildComponents={buildComponents} onRemove={handleRemove} />
            </div>

            {/* Right sidebar */}
            <div className="lg:w-72 flex flex-col gap-4">
              <BuildChecklist build={buildComponents} />
              <SavedBuildsPanel
                savedBuilds={savedBuilds}
                onLoad={handleLoadBuild}
                onDelete={(id) => {
                  deleteBuild(id);
                  addToast("Build eliminado", "warning");
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Save build dialog */}
      {showSaveDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSaveDialog(false); }}
        >
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4">
            <h3 className="text-white font-semibold">Guardar build</h3>
            <input
              type="text"
              placeholder="Nombre del build..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveBuild(); }}
              autoFocus
              className="bg-neutral-800 border border-white/10 text-white placeholder-neutral-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/60 transition-all"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveBuild}
                disabled={!saveName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Guardar
              </button>
              <button
                onClick={() => { setShowSaveDialog(false); setSaveName(""); }}
                className="px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare modal */}
      {showCompareModal && compareList.length === 2 && (
        <CompareModal
          components={compareList}
          onClose={() => { setShowCompareModal(false); setCompareList([]); }}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
