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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">PC Builder</h1>
            <p className="text-gray-400 text-xs">Compare prices & build your PC</p>
          </div>
          {buildComponents.length > 0 && (
            <button
              onClick={() => setActiveTab("build")}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              My Build ({buildComponents.length})
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-800 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "search"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Search Components
          </button>
          <button
            onClick={() => setActiveTab("build")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "build"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            My Build {buildComponents.length > 0 && `(${buildComponents.length})`}
          </button>
        </div>

        {/* Search Tab */}
        {activeTab === "search" && (
          <div>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                placeholder="Search components..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">All Types</option>
                {componentTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Results */}
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : components.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No components found.</div>
            ) : (
              <>
                <p className="text-gray-400 text-xs mb-4">{components.length} components found</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {components.map((c) => (
                    <ComponentCard key={c.id} component={c} onAdd={handleAdd} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Build Tab */}
        {activeTab === "build" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">My Build</h2>
              {buildComponents.length > 0 && (
                <button
                  onClick={() => setBuildComponents([])}
                  className="text-red-400 hover:text-red-300 text-sm cursor-pointer"
                >
                  Clear all
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
