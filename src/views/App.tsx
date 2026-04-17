import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, User, LogOut, Loader2 } from 'lucide-react';
import { useSession, signOut } from '@/lib/auth/auth-client';
import { ComponentCard } from '@/components/ComponentCard';
import { BuildList } from '@/components/BuildList';
import { ToastContainer } from '@/components/ToastContainer';
import { SkeletonCard } from '@/components/SkeletonCard';
import { BuildChecklist } from '@/components/BuildChecklist';
import { CompareModal } from '@/components/CompareModal';
import { SavedBuildsPanel } from '@/components/SavedBuildsPanel';
import { useToast } from '@/hooks/useToast';
import { useSavedBuilds } from '@/hooks/useSavedBuilds';
import { checkCompatibility } from '@/utils/compatibility';
import type { Component, ComponentType, Brand, BuildComponent, SavedBuild } from '@/types';
import '@/index.css';

export function App() {
  const [components, setComponents] = useState<Component[]>([]);
  const [componentTypes, setComponentTypes] = useState<ComponentType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [buildComponents, setBuildComponents] = useState<BuildComponent[]>([]);

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'build'>('search');

  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();

  // Compare mode
  const [compareList, setCompareList] = useState<Component[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Save build dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');

  const { toasts, addToast, removeToast } = useToast();
  const { savedBuilds, saveBuild, deleteBuild } = useSavedBuilds();
  const compatibilityIssues = checkCompatibility(buildComponents);

  // Load filter options on mount
  useEffect(() => {
    fetch('/api/component-types')
      .then((r) => r.json())
      .then(setComponentTypes);
    fetch('/api/brands')
      .then((r) => r.json())
      .then(setBrands);
  }, []);

  // Fetch components when search/type/brand changes
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedType) params.set('type_id', selectedType);
    if (selectedBrand) params.set('brand_id', selectedBrand);

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
    if (sortBy === 'price_asc') {
      result.sort((a, b) => Math.min(...a.prices.map((p) => p.price)) - Math.min(...b.prices.map((p) => p.price)));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => Math.min(...b.prices.map((p) => p.price)) - Math.min(...a.prices.map((p) => p.price)));
    } else if (sortBy === 'name') {
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
          addToast(`Límite máximo alcanzado para ${component.type_name}`, 'warning');
          return prev;
        }
        addToast(`${component.name} actualizado`, 'success');
        return prev.map((b) => (b.component.id === component.id ? { ...b, quantity: b.quantity + 1 } : b));
      }
      addToast(`${component.name} agregado al build`, 'success');
      return [...prev, { component, quantity: 1 }];
    });
    setActiveTab('build');
  };

  const handleRemove = (componentId: number) => {
    const found = buildComponents.find((b) => b.component.id === componentId);
    setBuildComponents((prev) => prev.filter((b) => b.component.id !== componentId));
    if (found) addToast(`${found.component.name} eliminado`, 'warning');
  };

  const handleCompare = (component: Component) => {
    setCompareList((prev) => {
      if (prev.find((c) => c.id === component.id)) {
        return prev.filter((c) => c.id !== component.id);
      }
      if (prev.length >= 2) {
        addToast('Solo puedes comparar 2 componentes a la vez', 'warning');
        return prev;
      }
      // Solo permitir comparar componentes del mismo tipo
      if (prev.length === 1 && prev[0]!.type_id !== component.type_id) {
        addToast(`Solo puedes comparar ${prev[0]!.type_name} con ${prev[0]!.type_name}`, 'warning');
        return prev;
      }
      const next = [...prev, component];
      if (next.length === 2) setShowCompareModal(true);
      return next;
    });
  };

  const handleSaveBuild = async () => {
    if (!saveName.trim()) return;
    try {
      await saveBuild(saveName.trim(), buildComponents);
      addToast(`Build "${saveName.trim()}" guardado`, 'success');
      setSaveName('');
      setShowSaveDialog(false);
    } catch {
      addToast('Error al guardar el build', 'error');
    }
  };

  const handleLoadBuild = (build: SavedBuild) => {
    setBuildComponents(build.components);
    addToast(`Build "${build.name}" cargado`, 'success');
    setActiveTab('build');
  };

  const handleClearBuild = () => {
    setBuildComponents([]);
    addToast('Build limpiado', 'warning');
  };

  // Desde el placeholder de BuildList, ir directo a buscar un tipo específico
  const handleSearchType = (typeName: string) => {
    const type = componentTypes.find((t) => t.name === typeName);
    if (type) setSelectedType(String(type.id));
    setSearch('');
    setActiveTab('search');
  };

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          setShowUserMenu(false);
          navigate('/login');
        },
      },
    });
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedType('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('default');
  };

  const hasActiveFilters = search || selectedType || selectedBrand || minPrice || maxPrice;

  // Bento Grid: large card for high-end CPUs and GPUs
  function isLargeCard(component: Component): boolean {
    const name = component.name.toLowerCase();
    if (component.type_name === 'CPU') {
      if (name.includes('ryzen 9') || name.includes('core i9') || name.includes('threadripper') ||
          name.includes('7950') || name.includes('7900x') || name.includes('9950')) return true;
      if (component.specs?.core_count && Number(component.specs.core_count) >= 12) return true;
    }
    if (component.type_name === 'GPU') {
      if (name.includes('4090') || name.includes('4080') || name.includes('7900 xtx') ||
          name.includes('4070 ti') || name.includes('w7900')) return true;
      if (component.specs?.vram_quantity && Number(component.specs.vram_quantity) >= 20) return true;
    }
    return false;
  }

  const containerVariant = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.055 } },
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 18 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.04, duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  };

  if (isPending) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className='min-h-screen bg-[#050505] flex items-center justify-center'
      >
        <div className='flex flex-col items-center gap-3'>
          <Loader2 className='w-5 h-5 text-white animate-spin' />
          <span className='font-mono text-[9px] text-zinc-700 uppercase tracking-widest'>Iniciando...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(5px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className='min-h-screen bg-[#050505] text-white'
    >

      {/* ── HEADER — Glassmorphism Stealth ── */}
      <header className='sticky top-0 z-20 border-b border-[#171717] bg-[#050505]/85 backdrop-blur-xl px-6 py-4'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>

          {/* Logo — Mono engineering */}
          <Link to='/' className='group flex flex-col gap-0.5'>
            <span className='font-mono text-sm font-bold text-white tracking-[0.12em] uppercase group-hover:text-zinc-200 transition-colors'>
              PC·BUILDER
            </span>
            <span className='font-mono text-[9px] text-zinc-700 tracking-[0.2em] uppercase'>
              Compara · Arma · Ahorra
            </span>
          </Link>

          <div className='flex items-center gap-3'>
            {buildComponents.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab('build')}
                className='flex items-center gap-2 border border-white/10 hover:border-white/20 bg-white/4 hover:bg-white/7 text-white font-mono text-xs px-3 py-2 rounded-lg transition-all cursor-pointer'>
                <span className='font-mono w-4 h-4 bg-white/10 rounded flex items-center justify-center text-[10px] font-bold'>
                  {buildComponents.length}
                </span>
                Mi Build
              </motion.button>
            )}

            {isPending ? (
              <div className='h-8 w-20 bg-[#111] rounded-lg animate-pulse' />
            ) : session ? (
              <div className='relative'>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className='flex items-center gap-2 px-2.5 py-2 border border-white/10 hover:border-white/18 hover:bg-white/4 rounded-lg transition-all cursor-pointer'>
                  <div className='w-6 h-6 rounded-md bg-[#161616] border border-white/10 flex items-center justify-center font-mono text-[10px] font-bold text-zinc-400'>
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className='font-mono text-[11px] text-zinc-500 hidden sm:block'>
                    {session.user.name?.split(' ')[0] || session.user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-zinc-700 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <>
                      <div className='fixed inset-0 z-10' onClick={() => setShowUserMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className='absolute right-0 mt-2 w-52 bg-[#080808]/98 backdrop-blur-xl border border-[#222] rounded-xl shadow-2xl shadow-black/60 z-20 overflow-hidden'>
                        <div className='px-4 py-3 border-b border-[#171717]'>
                          <p className='font-mono text-[9px] text-zinc-700 uppercase tracking-widest'>Sesión activa</p>
                          <p className='font-mono text-xs text-zinc-400 mt-0.5 truncate'>{session.user.email}</p>
                        </div>
                        <div className='p-1.5 space-y-0.5'>
                          <Link
                            to='/account'
                            onClick={() => setShowUserMenu(false)}
                            className='flex items-center gap-2.5 px-3 py-2 font-mono text-xs text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all'>
                            <User className='w-3.5 h-3.5' />
                            Configuración
                          </Link>
                          <button
                            onClick={handleLogout}
                            className='w-full flex items-center gap-2.5 px-3 py-2 font-mono text-xs text-red-500/70 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all cursor-pointer'>
                            <LogOut className='w-3.5 h-3.5' />
                            Cerrar sesión
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to='/login'
                className='font-mono text-xs text-zinc-500 hover:text-white border border-white/10 hover:border-white/22 px-4 py-2 rounded-lg transition-all'>
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-6 py-8'>

        {/* ── TABS — Line minimal ── */}
        <div className='flex gap-0 mb-8 border-b border-[#171717]'>
          {(['search', 'build'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-3 px-1 mr-6 font-mono text-[11px] uppercase tracking-widest transition-colors duration-200 cursor-pointer flex items-center gap-2 ${
                activeTab === tab ? 'text-white' : 'text-zinc-700 hover:text-zinc-400'
              }`}>
              {activeTab === tab && (
                <motion.div
                  layoutId='tab-indicator'
                  className='absolute bottom-0 left-0 right-0 h-px bg-white'
                  transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              )}
              {tab === 'search' ? 'Componentes' : 'Mi Build'}
              {tab === 'build' && buildComponents.length > 0 && (
                <span className='font-mono text-[9px] text-zinc-700 border border-white/10 px-1.5 py-0.5 rounded tabular-nums'>
                  {buildComponents.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB: BUSCAR ── */}
        {activeTab === 'search' && (
          <div>

            {/* Compare bar */}
            {compareList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className='flex items-center justify-between border border-[#242424] bg-[#0A0A0A]/80 backdrop-blur-xl rounded-xl px-4 py-3 mb-4'>
                <div className='flex items-center gap-3 flex-wrap'>
                  <span className='font-mono text-[9px] text-zinc-600 uppercase tracking-widest'>
                    Comparando {compareList.length}/2
                  </span>
                  {compareList.map((c) => (
                    <span key={c.id} className='font-mono text-[10px] text-zinc-400 border border-[#242424] px-2.5 py-1 rounded'>
                      {c.name}
                    </span>
                  ))}
                </div>
                <div className='flex gap-2 shrink-0'>
                  {compareList.length === 2 && (
                    <button
                      onClick={() => setShowCompareModal(true)}
                      className='font-mono text-[10px] text-white border border-white/15 hover:border-white/28 hover:bg-white/5 px-3 py-1.5 rounded transition-all cursor-pointer uppercase tracking-widest'>
                      Ver comparación
                    </button>
                  )}
                  <button
                    onClick={() => setCompareList([])}
                    className='font-mono text-[10px] text-zinc-700 hover:text-zinc-400 px-2 py-1.5 transition-colors cursor-pointer'>
                    Cancelar
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── FILTROS — GLASSMORPHISM REAL ── */}
            <div className='relative mb-8 rounded-xl border border-[#1E1E1E] bg-[#080808]/80 backdrop-blur-xl p-4'>
              {/* Top shimmer */}
              <div className='absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent' />

              <div className='flex flex-col gap-3'>
                {/* Row 1: Search + Type + Brand */}
                <div className='flex flex-col sm:flex-row gap-2.5'>
                  <div className='relative flex-1'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-700' />
                    <input
                      type='text'
                      placeholder='Buscar componentes...'
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className='w-full font-mono text-xs bg-[#0F0F0F] border border-[#1E1E1E] text-white placeholder-zinc-800 rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#303030] transition-all'
                    />
                  </div>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className='font-mono text-xs bg-[#0F0F0F] border border-[#1E1E1E] text-zinc-400 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#303030] cursor-pointer appearance-none transition-all min-w-[140px]'>
                    <option value=''>Todos los tipos</option>
                    {componentTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className='font-mono text-xs bg-[#0F0F0F] border border-[#1E1E1E] text-zinc-400 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#303030] cursor-pointer appearance-none transition-all min-w-[140px]'>
                    <option value=''>Todas las marcas</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                {/* Row 2: Price + Sort + Clear */}
                <div className='flex flex-col sm:flex-row gap-2.5 items-center'>
                  <div className='flex items-center gap-2 flex-1'>
                    <span className='font-mono text-[9px] text-zinc-700 uppercase tracking-widest shrink-0'>Precio</span>
                    <input
                      type='number' placeholder='Mín' value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className='flex-1 font-mono text-xs bg-[#0F0F0F] border border-[#1E1E1E] text-white placeholder-zinc-800 rounded-lg px-3 py-2 focus:outline-none focus:border-[#303030] transition-all'
                    />
                    <span className='text-zinc-800 text-xs'>—</span>
                    <input
                      type='number' placeholder='Máx' value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className='flex-1 font-mono text-xs bg-[#0F0F0F] border border-[#1E1E1E] text-white placeholder-zinc-800 rounded-lg px-3 py-2 focus:outline-none focus:border-[#303030] transition-all'
                    />
                    {(minPrice || maxPrice) && (
                      <button onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                        className='font-mono text-xs text-zinc-700 hover:text-zinc-400 cursor-pointer transition-colors shrink-0'>✕</button>
                    )}
                  </div>
                  <div className='flex items-center gap-2 shrink-0'>
                    <select
                      value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                      className='font-mono text-xs bg-[#0F0F0F] border border-[#1E1E1E] text-zinc-400 rounded-lg px-3 py-2 focus:outline-none focus:border-[#303030] cursor-pointer appearance-none transition-all'>
                      <option value='default'>Ordenar: Defecto</option>
                      <option value='price_asc'>Precio ↑</option>
                      <option value='price_desc'>Precio ↓</option>
                      <option value='name'>Nombre A–Z</option>
                    </select>
                    {hasActiveFilters && (
                      <button onClick={clearFilters}
                        className='font-mono text-[9px] text-zinc-700 hover:text-zinc-400 border border-white/8 hover:border-white/15 px-3 py-2 rounded-lg transition-all cursor-pointer uppercase tracking-widest'>
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── RESULTADOS ── */}
            {loading ? (
              <div className='grid grid-cols-12 gap-3'>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className='col-span-12 sm:col-span-6 lg:col-span-3'><SkeletonCard /></div>
                ))}
              </div>
            ) : displayedComponents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='flex flex-col items-center justify-center py-24 gap-4'>
                <div className='w-10 h-10 border border-[#1E1E1E] rounded-xl flex items-center justify-center'>
                  <Search className='w-4 h-4 text-zinc-800' />
                </div>
                <div className='text-center space-y-1'>
                  <p className='text-zinc-400 text-sm'>Sin resultados</p>
                  <p className='font-mono text-[9px] text-zinc-800 uppercase tracking-widest'>
                    {hasActiveFilters ? 'Ajusta los filtros' : 'No hay componentes disponibles'}
                  </p>
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters}
                    className='font-mono text-[9px] text-zinc-600 hover:text-zinc-400 border border-white/8 hover:border-white/15 px-4 py-2 rounded-lg transition-all cursor-pointer uppercase tracking-widest'>
                    Limpiar filtros
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div variants={containerVariant} initial='hidden' animate='visible'>
                <p className='font-mono text-[9px] text-zinc-800 uppercase tracking-widest mb-4'>
                  {displayedComponents.length} componentes
                </p>
                {/* ── BENTO GRID — Asimétrico ── */}
                <div className='grid grid-cols-12 gap-3'>
                  {displayedComponents.map((c, i) => {
                    const large = isLargeCard(c);
                    return (
                      <motion.div
                        key={c.id}
                        custom={i}
                        variants={cardVariant}
                        className={large
                          ? 'col-span-12 sm:col-span-6 lg:col-span-6'
                          : 'col-span-12 sm:col-span-6 lg:col-span-3'
                        }>
                        <ComponentCard
                          component={c}
                          onAdd={handleAdd}
                          onCompare={handleCompare}
                          isSelectedForCompare={compareList.some((x) => x.id === c.id)}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ── TAB: MI BUILD ── */}
        {activeTab === 'build' && (
          <div className='flex flex-col lg:flex-row gap-6'>
            <div className='flex-1 flex flex-col gap-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-mono text-[9px] text-zinc-700 uppercase tracking-widest mb-1'>Configuración actual</p>
                  <h2 className='text-white font-semibold text-base'>
                    {buildComponents.length === 0
                      ? 'Agrega componentes'
                      : `${buildComponents.length} componente${buildComponents.length > 1 ? 's' : ''} seleccionado${buildComponents.length > 1 ? 's' : ''}`}
                  </h2>
                </div>
                {buildComponents.length > 0 && (
                  <div className='flex gap-2'>
                    <button
                      onClick={() => setShowSaveDialog(true)}
                      className='font-mono text-[10px] text-zinc-500 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-widest'>
                      Guardar
                    </button>
                    <button
                      onClick={handleClearBuild}
                      className='font-mono text-[10px] text-red-500/50 hover:text-red-400 border border-red-500/15 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-widest'>
                      Limpiar
                    </button>
                  </div>
                )}
              </div>

              {/* Compatibility issues */}
              {compatibilityIssues.length > 0 && (
                <div className='flex flex-col gap-2'>
                  {compatibilityIssues.map((issue, i) => (
                    <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border font-mono text-xs ${
                      issue.type === 'error'
                        ? 'bg-red-500/5 border-red-500/15 text-red-400/80'
                        : 'bg-amber-500/5 border-amber-500/15 text-amber-400/80'
                    }`}>
                      <span className='shrink-0 mt-px'>{issue.type === 'error' ? '✕' : '△'}</span>
                      <span>{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}

              <BuildList buildComponents={buildComponents} onRemove={handleRemove} onSearchType={handleSearchType} />
            </div>

            <div className='lg:w-64 flex flex-col gap-4'>
              <BuildChecklist build={buildComponents} />
              <SavedBuildsPanel
                savedBuilds={savedBuilds}
                onLoad={handleLoadBuild}
                onDelete={async (id) => {
                  try {
                    await deleteBuild(id);
                    addToast('Build eliminado', 'warning');
                  } catch {
                    addToast('Error al eliminar el build', 'error');
                  }
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* ── SAVE DIALOG ── */}
      {showSaveDialog && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md'
          onClick={(e) => { if (e.target === e.currentTarget) setShowSaveDialog(false); }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className='relative bg-[#080808]/98 backdrop-blur-xl border border-[#1E1E1E] rounded-xl w-full max-w-sm shadow-2xl shadow-black/80 p-6 flex flex-col gap-4'>
            <div className='absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent' />
            <div>
              <p className='font-mono text-[9px] text-zinc-700 uppercase tracking-widest mb-1'>Guardar build</p>
              <h3 className='text-white font-semibold text-sm'>Dale un nombre a tu configuración</h3>
            </div>
            <input
              type='text' placeholder='Mi gaming build...' value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveBuild(); }}
              autoFocus
              className='font-mono text-xs bg-[#0F0F0F] border border-[#1E1E1E] text-white placeholder-zinc-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#303030] transition-all'
            />
            <div className='flex gap-2'>
              <button onClick={handleSaveBuild} disabled={!saveName.trim()}
                className='flex-1 font-mono text-[11px] text-white border border-white/12 hover:border-white/25 hover:bg-white/5 disabled:opacity-25 disabled:cursor-not-allowed py-2.5 rounded-lg transition-all cursor-pointer uppercase tracking-widest'>
                Guardar
              </button>
              <button onClick={() => { setShowSaveDialog(false); setSaveName(''); }}
                className='px-4 font-mono text-[11px] text-zinc-600 border border-white/8 hover:border-white/15 hover:text-zinc-400 py-2.5 rounded-lg transition-all cursor-pointer'>
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Compare modal */}
      {showCompareModal && compareList.length === 2 && (
        <CompareModal
          components={compareList}
          onClose={() => { setShowCompareModal(false); setCompareList([]); }}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </motion.div>
  );
}

export default App;
