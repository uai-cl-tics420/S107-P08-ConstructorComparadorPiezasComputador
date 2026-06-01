import { useState, useEffect, useMemo, useContext } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, User, LogOut, Loader2, Sun, Moon, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSession, signOut } from '@/lib/auth/auth-client';
import { ComponentCard } from '@/components/ComponentCard';
import { BuildList } from '@/components/BuildList';
import { ToastContainer } from '@/components/ToastContainer';
import { SkeletonCard } from '@/components/SkeletonCard';
import { BuildChecklist } from '@/components/BuildChecklist';
import { CompareModal } from '@/components/CompareModal';
import { ComponentDetailModal } from '@/components/ComponentDetailModal';
import { SavedBuildsPanel } from '@/components/SavedBuildsPanel';
import { Pagination } from '@/components/Pagination';
import { RecommendationsPanel } from '@/components/RecommendationsPanel';
import { LanguageDropdown } from '@/components/LanguageDropdown';
import { useToast } from '@/hooks/useToast';
import { useSavedBuilds } from '@/hooks/useSavedBuilds';
import { useRecommendations } from '@/hooks/useRecommendations';
import { checkCompatibility } from '@/utils/compatibility';
import { scoreCompatibility } from '@/utils/recommendations';
import type { Component, ComponentType, Brand, BuildComponent, SavedBuild } from '@/types/Frontend_types';
import { ConfigContext } from '@/frontend';
import '@/index.css';

export function App() {
  const { t } = useTranslation();
  const { config, setConfig } = useContext(ConfigContext);

  const [components, setComponents] = useState<Component[]>([]);
  const [componentTypes, setComponentTypes] = useState<ComponentType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Restaurar build local desde localStorage al montar (persiste a través de login/logout)
  const [buildComponents, setBuildComponents] = useState<BuildComponent[]>(() => {
    try {
      const saved = localStorage.getItem('local_build');
      return saved ? (JSON.parse(saved) as BuildComponent[]) : [];
    } catch {
      return [];
    }
  });

  // Cuántos componentes se restauraron desde localStorage (para el toast de bienvenida)
  const [restoredCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('local_build');
      return saved ? (JSON.parse(saved) as BuildComponent[]).length : 0;
    } catch {
      return 0;
    }
  });

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentBuildId, setCurrentBuildId] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'build'>('search');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalCount, setTotalCount] = useState(0);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();

  // Compare mode
  const [compareList, setCompareList] = useState<Component[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Detail/specs modal
  const [detailComponent, setDetailComponent] = useState<Component | null>(null);

  // Save build dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');

  const { toasts, addToast, removeToast } = useToast();
  const { savedBuilds, saveBuild, deleteBuild } = useSavedBuilds();
  const compatibilityIssues = checkCompatibility(buildComponents);
  const { recommendations, loading: recsLoading } = useRecommendations(buildComponents);

  // Persistir build local en localStorage cada vez que cambia
  useEffect(() => {
    if (buildComponents.length > 0) {
      localStorage.setItem('local_build', JSON.stringify(buildComponents));
    } else {
      localStorage.removeItem('local_build');
    }
  }, [buildComponents]);

  // Load filter options on mount
  useEffect(() => {
    fetch('/api/component-types')
      .then((r) => r.json())
      .then(setComponentTypes);
    fetch('/api/brands')
      .then((r) => r.json())
      .then(setBrands);

    // Si el usuario acaba de hacer login y tenía un build local, mostrárselo
    const fromLogin = sessionStorage.getItem('from_login');
    if (fromLogin) {
      sessionStorage.removeItem('from_login');
      if (restoredCount > 0) {
        setActiveTab('build');
        addToast(
          t(restoredCount === 1 ? 'build.buildRestored' : 'build.buildRestored_other', { count: restoredCount }),
          'success',
        );
      }
    }

    // Initial check for shared build via URL
    const urlParams = new URLSearchParams(window.location.search);
    const shareParam = urlParams.get('share');
    if (shareParam) {
      fetch(`/api/shared-builds/${shareParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.components) {
            setBuildComponents(data.components);
            setCurrentBuildId(data.id);
            setActiveTab('build');
            addToast('Build compartido cargado', 'success');
          } else {
            addToast('Build compartido no encontrado', 'error');
          }
        })
        .catch(() => addToast('Error al cargar build compartido', 'error'));

      // Remove share param from URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete('share');
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
  }, []); // Only run once on mount

  // Fetch components when search/type/brand changes
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedType) params.set('type_id', selectedType);
    if (selectedBrand) params.set('brand_id', selectedBrand);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    params.set('page', String(currentPage));
    params.set('limit', String(itemsPerPage));
    params.set('sortBy', sortBy === 'default' ? 'updated_at' : sortBy);

    fetch(`/api/components?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setComponents(data.components || []);
        setTotalCount(data.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching components:', err);
        setComponents([]);
        setTotalCount(0);
        setLoading(false);
      });
  }, [search, selectedType, selectedBrand, minPrice, maxPrice, currentPage, itemsPerPage, sortBy]);

  // Paginate filtered components
  const displayedComponents = components;

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Compute compatibility for search results
  const componentCompatibility = useMemo(() => {
    const map = new Map<string, { isCompatible: boolean; reasons: string[] }>();
    for (const component of displayedComponents) {
      const compatibility = scoreCompatibility(component, buildComponents);
      map.set(component.id, {
        isCompatible: compatibility.isCompatible,
        reasons: compatibility.reasons,
      });
    }
    return map;
  }, [displayedComponents, buildComponents]);

  const handleAdd = (component: Component) => {
    setBuildComponents((prev) => {
      // Si el mismo componente (mismo id) ya está, intenta subir cantidad
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

      // Si ya hay otro componente del mismo tipo con max_quantity = 1, reemplazar
      const type = componentTypes.find((t) => t.id === component.type_id);
      const sameType = prev.find((b) => b.component.type_id === component.type_id);
      if (sameType && type && type.max_quantity === 1) {
        addToast(`${sameType.component.name} reemplazado por ${component.name}`, 'success');
        return prev.map((b) => (b.component.type_id === component.type_id ? { component, quantity: 1 } : b));
      }

      addToast(`${component.name} agregado al build`, 'success');
      return [...prev, { component, quantity: 1 }];
    });
    setActiveTab('build');
  };

  const handleRemove = (componentId: string) => {
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
        addToast(t('build.onlyCompareTwo'), 'warning');
        return prev;
      }
      // Solo permitir comparar componentes del mismo tipo
      if (prev.length === 1 && prev[0]!.type_id !== component.type_id) {
        addToast(t('build.sameTypeOnly'), 'warning');
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
      const saved = await saveBuild(saveName.trim(), buildComponents);

      if (saved && typeof saved === 'object' && 'id' in saved) {
        setCurrentBuildId(saved.id as string);
      }

      addToast(t('build.buildSaved', { name: saveName.trim() }), 'success');
      setSaveName('');
      setShowSaveDialog(false);
    } catch {
      addToast(t('build.errorDeleting'), 'error');
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
    setCurrentPage(1);
  };

  const hasActiveFilters = search || selectedType || selectedBrand || minPrice || maxPrice;

  // Grid uniforme: todas las cards del mismo tamaño (4 por fila)
  function isLargeCard(_component: Component): boolean {
    return false;
  }

  const containerVariant = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.055 } },
  };

  const cardVariant: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.04, duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  };

  const toggleTheme = () => {
    if (!document.startViewTransition) {
      setConfig((prev) => ({
        ...prev,
        theme: prev.theme === 'dark' ? 'light' : 'dark',
      }));
      return;
    }

    document.startViewTransition(() => {
      setConfig((prev) => ({
        ...prev,
        theme: prev.theme === 'dark' ? 'light' : 'dark',
      }));
    });
  };

  if (isPending) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className='min-h-screen bg-base flex items-center justify-center'>
        <div className='flex flex-col items-center gap-3'>
          <Loader2 className='w-5 h-5 text-tw-primary animate-spin' />
          <span className='font-mono text-[9px] text-tw-muted-deep uppercase tracking-widest'>Iniciando...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className='min-h-screen bg-tw-base text-tw-primary relative'>
      {/* Glassy Reveal Overlay — se desvanece durante entrada */}
      <motion.div
        initial={{ opacity: 0.08, backdropFilter: 'blur(12px)' }}
        animate={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className='absolute inset-0 pointer-events-none'
      />

      {/* ── HEADER — Glassmorphism Stealth ── */}
      <header className='sticky top-0 z-20 border-b border-tw-border-deep bg-tw-base/85 backdrop-blur-xl px-6 py-4'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          {/* Logo — Mono engineering */}
          <Link to='/' className='group flex flex-col gap-0.5'>
            <span className='font-mono text-sm font-bold text-tw-primary tracking-[0.12em] uppercase group-hover:text-tw-primary-deep transition-colors'>
              PC·BUILDER
            </span>
            <span className='font-mono text-[9px] text-tw-muted-deep tracking-[0.2em] uppercase'>
              {t('nav.tagline')}
            </span>
          </Link>

          <div className='flex items-center gap-3'>
            {buildComponents.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab('build')}
                className='flex items-center gap-2 border border-tw-glass/10 hover:border-tw-glass/20 bg-tw-base-highlight/4 hover:bg-tw-base-highlight/7 text-tw-primary font-mono text-xs px-3 py-2 rounded-lg transition-all cursor-pointer'>
                <span className='font-mono w-4 h-4 bg-tw-base-highlight/10 rounded flex items-center justify-center text-[10px] font-bold'>
                  {buildComponents.length}
                </span>
                {t('nav.myBuild')}
              </motion.button>
            )}

            <LanguageDropdown />

            <button
              onClick={toggleTheme}
              className='p-2 border border-tw-border-deep/50 hover:border-tw-border bg-tw-primary hover:bg-tw-primary-highlight rounded-lg transition-all cursor-pointer group'
              title={t('nav.toggleTheme', { mode: t(`nav.${config.theme === 'dark' ? 'light' : 'dark'}`) })}>
              {config.theme === 'dark' ? (
                <Sun className='w-4 h-4 text-tw-base group-hover:text-tw-accent transition-colors' />
              ) : (
                <Moon className='w-4 h-4 text-tw-base group-hover:text-tw-alt transition-colors' />
              )}
            </button>

            {isPending ? (
              <div className='h-9 w-24 bg-tw-surface/50 border border-tw-border/50 rounded-lg animate-pulse' />
            ) : session ? (
              <div className='relative'>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className='flex items-center gap-2 px-2.5 py-2 border border-tw-border/50 hover:border-tw-border bg-tw-surface/50 hover:bg-tw-surface rounded-lg transition-all cursor-pointer group'>
                  <div className='w-6 h-6 rounded-md bg-tw-surface border border-tw-border/50 flex items-center justify-center font-mono text-[10px] font-bold text-tw-muted group-hover:text-tw-primary transition-colors'>
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className='font-mono text-[11px] text-tw-muted group-hover:text-tw-primary hidden sm:block transition-colors'>
                    {session.user.name?.split(' ')[0] || session.user.email?.split('@')[0]}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-tw-muted transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                  />
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
                        className='absolute right-0 mt-2 w-52 bg-tw-surface/98 backdrop-blur-xl border border-tw-border rounded-xl shadow-2xl shadow-black/40 z-20 overflow-hidden'>
                        <div className='px-4 py-3 border-b border-tw-border/50'>
                          <p className='font-mono text-[9px] text-tw-muted-deep uppercase tracking-widest'>
                            {t('nav.activeSession')}
                          </p>
                          <p className='font-mono text-xs text-tw-muted mt-0.5 truncate'>{session.user.email}</p>
                        </div>
                        <div className='p-1.5 space-y-0.5'>
                          <Link
                            to='/account'
                            onClick={() => setShowUserMenu(false)}
                            className='flex items-center gap-2.5 px-3 py-2 font-mono text-xs text-tw-muted hover:text-tw-primary hover:bg-tw-base-highlight/5 rounded-lg transition-all'>
                            <User className='w-3.5 h-3.5' />
                            {t('nav.settings')}
                          </Link>
                          <button
                            onClick={handleLogout}
                            className='w-full flex items-center gap-2.5 px-3 py-2 font-mono text-xs text-tw-alert/70 hover:text-tw-alert-highlight hover:bg-tw-alert/5 rounded-lg transition-all cursor-pointer'>
                            <LogOut className='w-3.5 h-3.5' />
                            {t('nav.signOut')}
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
                className='font-mono text-xs text-tw-mute border text-tw-base border-tw-border-deep/50 hover:border-tw-accent/75 bg-tw-primary hover:bg-tw-primary-highlight hover:text-tw-accent px-4 py-2 rounded-lg transition-all'>
                {t('nav.signIn')}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-6 py-8'>
        {/* ── TABS — Line minimal ── */}
        <div className='flex gap-0 mb-8 border-b border-tw-border-deep'>
          {(['search', 'build'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-3 px-1 mr-6 font-mono text-[11px] uppercase tracking-widest transition-colors duration-200 cursor-pointer flex items-center gap-2 ${
                activeTab === tab ? 'text-tw-primary' : 'text-tw-muted-deep hover:text-tw-muted-highlight'
              }`}>
              {activeTab === tab && (
                <motion.div
                  layoutId='tab-indicator'
                  className='absolute bottom-0 left-0 right-0 h-px bg-tw-base-highlight'
                  transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              )}
              {tab === 'search' ? t('tabs.components') : t('tabs.myBuild')}
              {tab === 'build' && buildComponents.length > 0 && (
                <span className='font-mono text-[9px] text-tw-muted-deep border border-tw-glass/10 px-1.5 py-0.5 rounded tabular-nums'>
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
                className='flex items-center justify-between border border-tw-border bg-tw-base/80 backdrop-blur-xl rounded-xl px-4 py-3 mb-4'>
                <div className='flex items-center gap-3 flex-wrap'>
                  <span className='font-mono text-[9px] text-tw-muted uppercase tracking-widest'>
                    {t('results.comparing', { count: compareList.length })}
                  </span>
                  {compareList.map((c) => (
                    <span
                      key={c.id}
                      className='font-mono text-[10px] text-tw-muted-highlight border border-tw-border px-2.5 py-1 rounded'>
                      {c.name}
                    </span>
                  ))}
                </div>
                <div className='flex gap-2 shrink-0'>
                  {compareList.length === 2 && (
                    <button
                      onClick={() => setShowCompareModal(true)}
                      className='font-mono text-[10px] text-tw-primary border border-tw-glass/15 hover:border-tw-glass/28 hover:bg-tw-base-highlight/5 px-3 py-1.5 rounded transition-all cursor-pointer uppercase tracking-widest'>
                      {t('results.viewComparison')}
                    </button>
                  )}
                  <button
                    onClick={() => setCompareList([])}
                    className='font-mono text-[10px] text-tw-muted-deep hover:text-tw-muted-highlight px-2 py-1.5 transition-colors cursor-pointer'>
                    {t('results.cancel')}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── FILTROS — GLASSMORPHISM REAL ── */}
            <div className='relative mb-8 rounded-xl border border-tw-border-deep bg-tw-surface-deep/80 backdrop-blur-xl p-4'>
              {/* Top shimmer */}
              <div className='absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-linear-to-r from-transparent via-tw-glass/8 to-transparent' />

              <div className='flex flex-col gap-3'>
                {/* Row 1: Search + Type + Brand */}
                <div className='flex flex-col sm:flex-row gap-2.5'>
                  <div className='relative flex-1'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-tw-muted-deep' />
                    <input
                      type='text'
                      placeholder={t('filters.searchPlaceholder')}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className='w-full font-mono text-xs bg-tw-surface border border-tw-border-deep text-tw-primary placeholder-tw-muted-deep rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-tw-border-highlight transition-all'
                    />
                  </div>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className='font-mono text-xs bg-tw-surface border border-tw-border-deep text-tw-muted-highlight rounded-lg px-3 py-2.5 focus:outline-none focus:border-tw-border-highlight cursor-pointer appearance-none transition-all min-w-35'>
                    <option value=''>{t('filters.allTypes')}</option>
                    {componentTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className='font-mono text-xs bg-tw-surface border border-tw-border-deep text-tw-muted-highlight rounded-lg px-3 py-2.5 focus:outline-none focus:border-tw-border-highlight cursor-pointer appearance-none transition-all min-w-35'>
                    <option value=''>{t('filters.allBrands')}</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row 2: Price + Sort + Clear */}
                <div className='flex flex-col sm:flex-row gap-2.5 items-center'>
                  <div className='flex items-center gap-2 flex-1'>
                    <span className='font-mono text-[9px] text-tw-muted-deep uppercase tracking-widest shrink-0'>
                      {t('filters.price')}
                    </span>
                    <input
                      type='number'
                      placeholder={t('filters.minPlaceholder')}
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className='flex-1 font-mono text-xs bg-tw-surface border border-tw-border-deep text-tw-primary placeholder-tw-muted-deep rounded-lg px-3 py-2 focus:outline-none focus:border-tw-border-highlight transition-all'
                    />
                    <span className='text-tw-muted-de text-xs'>—</span>
                    <input
                      type='number'
                      placeholder={t('filters.maxPlaceholder')}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className='flex-1 font-mono text-xs bg-tw-surface border border-tw-border-deep text-tw-primary placeholder-tw-muted-deep rounded-lg px-3 py-2 focus:outline-none focus:border-tw-border-highlight transition-all'
                    />
                    {(minPrice || maxPrice) && (
                      <button
                        onClick={() => {
                          setMinPrice('');
                          setMaxPrice('');
                        }}
                        className='font-mono text-xs text-tw-muted-deep hover:text-tw-muted-highlight cursor-pointer transition-colors shrink-0'>
                        ✕
                      </button>
                    )}
                  </div>
                  <div className='flex items-center gap-2 shrink-0'>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className='font-mono text-xs bg-tw-surface border border-tw-border-deep text-tw-muted-highlight rounded-lg px-3 py-2 focus:outline-none focus:border-tw-border-highlight cursor-pointer appearance-none transition-all'>
                      <option value='default'>{t('filters.sortDefault')}</option>
                      <option value='price_asc'>{t('filters.sortPriceAsc')}</option>
                      <option value='price_desc'>{t('filters.sortPriceDesc')}</option>
                      <option value='name'>{t('filters.sortName')}</option>
                    </select>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className='font-mono text-[9px] text-tw-muted-deep hover:text-tw-muted-highlight border border-tw-glass/8 hover:border-tw-glass/15 px-3 py-2 rounded-lg transition-all cursor-pointer uppercase tracking-widest'>
                        {t('filters.clear')}
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
                  <div key={i} className='col-span-12 sm:col-span-6 lg:col-span-3'>
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            ) : components.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='flex flex-col items-center justify-center py-24 gap-4'>
                <div className='w-10 h-10 border border-tw-border-deep rounded-xl flex items-center justify-center'>
                  <Search className='w-4 h-4 text-tw-muted-de' />
                </div>
                <div className='text-center space-y-1'>
                  <p className='text-tw-muted-highlight text-sm'>{t('results.noResults')}</p>
                  <p className='font-mono text-[9px] text-tw-muted-de uppercase tracking-widest'>
                    {hasActiveFilters ? t('results.adjustFilters') : t('results.noComponents')}
                  </p>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className='font-mono text-[9px] text-tw-muted hover:text-tw-muted-highlight border border-tw-glass/8 hover:border-tw-glass/15 px-4 py-2 rounded-lg transition-all cursor-pointer uppercase tracking-widest'>
                    {t('filters.clearFilters')}
                  </button>
                )}
              </motion.div>
            ) : (
              <>
                <motion.div variants={containerVariant} initial='hidden' animate='visible'>
                  <p className='font-mono text-[9px] text-tw-muted-de uppercase tracking-widest mb-4'>
                    {t('results.componentCount', { count: totalCount })}
                  </p>
                  {/* ── GRID UNIFORME — 4 por fila ── */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
                    {displayedComponents.map((c, i) => {
                      return (
                        <motion.div key={c.id} custom={i} variants={cardVariant}>
                          <ComponentCard
                            component={c}
                            onAdd={handleAdd}
                            onCompare={handleCompare}
                            onViewSpecs={setDetailComponent}
                            isSelectedForCompare={compareList.some((x) => x.id === c.id)}
                            buildCompatibility={buildComponents.length > 0 ? componentCompatibility.get(c.id) : null}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* ── PAGINATION ── */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalCount}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* ── TAB: MI BUILD ── */}
        {activeTab === 'build' && (
          <div className='flex flex-col lg:flex-row gap-6'>
            <div className='flex-1 flex flex-col gap-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-mono text-[9px] text-tw-muted-deep uppercase tracking-widest mb-1'>
                    {t('build.currentConfig')}
                  </p>
                  <h2 className='text-tw-primary font-semibold text-base'>
                    {buildComponents.length === 0
                      ? t('build.addComponents')
                      : t(buildComponents.length === 1 ? 'build.componentSelected_one' : 'build.componentSelected_other', { count: buildComponents.length })}
                  </h2>
                </div>
                {buildComponents.length > 0 && (
                  <div className='flex gap-2'>
                    <button
                      onClick={async () => {
                        const baseUrl = window.location.origin;
                        if (currentBuildId) {
                          const shareUrl = `${baseUrl}/?share=${currentBuildId}`;
                          navigator.clipboard
                            .writeText(shareUrl)
                            .then(() => addToast(t('build.linkCopied'), 'success'))
                            .catch(() => addToast(t('build.errorCopyingLink'), 'error'));
                        } else {
                          try {
                            const res = await fetch('/api/shared-builds', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: 'Shared Build', components: buildComponents }),
                            });
                            const data = await res.json();
                            if (data.id) {
                              setCurrentBuildId(data.id);
                              const shareUrl = `${baseUrl}/?share=${data.id}`;
                              navigator.clipboard
                                .writeText(shareUrl)
                                .then(() => addToast(t('build.linkCopied'), 'success'))
                                .catch(() => addToast(t('build.errorCopyingLink'), 'error'));
                            }
                          } catch (err) {
                            addToast(t('build.errorSharingBuild'), 'error');
                          }
                        }
                      }}
                      className='font-mono flex items-center gap-1.5 text-[10px] text-tw-muted-highlight hover:text-tw-primary border border-tw-glass/10 hover:border-tw-glass/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-widest'>
                      <Share2 className='w-3.5 h-3.5' />
                      {t('build.share')}
                    </button>
                    <button
                      onClick={() => setShowSaveDialog(true)}
                      className='font-mono text-[10px] text-tw-muted-highlight hover:text-tw-primary border border-tw-glass/10 hover:border-tw-glass/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-widest'>
                      {t('build.save')}
                    </button>
                    <button
                      onClick={handleClearBuild}
                      className='font-mono text-[10px] text-tw-alert hover:text-tw-alert-highlight border border-tw-alert/15 hover:border-tw-alert/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-widest'>
                      {t('build.clear')}
                    </button>
                  </div>
                )}
              </div>

              {/* Compatibility issues */}
              {compatibilityIssues.length > 0 && (
                <div className='flex flex-col gap-2'>
                  {compatibilityIssues.map((issue, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 px-4 py-3 rounded-xl border font-mono text-xs ${
                        issue.type === 'error'
                          ? 'bg-tw-alert/5 border-tw-alert/15 text-tw-alert-highlight/80'
                          : 'bg-tw-warning/5 border-tw-warbg-tw-warning/15 text-tw-warning-highlight/80'
                      }`}>
                      <span className='shrink-0 mt-px'>{issue.type === 'error' ? '✕' : '△'}</span>
                      <span>{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}

              <BuildList buildComponents={buildComponents} onRemove={handleRemove} onSearchType={handleSearchType} />

              {buildComponents.length > 0 && (
                <RecommendationsPanel recommendations={recommendations} loading={recsLoading} onAdd={handleAdd} />
              )}
            </div>

            <div className='lg:w-64 flex flex-col gap-4'>
              <BuildChecklist build={buildComponents} />
              <SavedBuildsPanel
                savedBuilds={savedBuilds}
                onLoad={handleLoadBuild}
                onDelete={async (id) => {
                  try {
                    await deleteBuild(id);
                    addToast(t('build.buildEliminated'), 'warning');
                  } catch {
                    addToast(t('build.errorDeleting'), 'error');
                  }
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* ── SAVE DIALOG ── */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-tw-base/80 backdrop-blur-2xl'
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowSaveDialog(false);
            }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className='relative w-full max-w-sm'>
              {/* GlassCard Gradient Border */}
              <div className='absolute -inset-px rounded-2xl bg-linear-to-br from-tw-glass/12 via-tw-glass/4 to-transparent pointer-events-none' />

              <div className='relative bg-tw-surface/90 backdrop-blur-2xl border border-tw-glass/10 rounded-2xl p-6 flex flex-col gap-4'>
                <div className='absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-linear-to-r from-transparent via-tw-glass/8 to-transparent' />

                <div>
                  <p className='font-mono text-[9px] text-tw-muted-deep uppercase tracking-widest mb-1'>
                    {t('saveDialog.title')}
                  </p>
                  <h3 className='text-tw-primary font-semibold text-sm'>{t('saveDialog.subtitle')}</h3>
                </div>

                <input
                  type='text'
                  placeholder={t('build.buildPlaceholder')}
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveBuild();
                  }}
                  autoFocus
                  className='font-mono text-xs bg-tw-base border border-tw-glass/10 text-tw-primary placeholder-tw-muted-deep rounded-lg px-4 py-2.5 focus:outline-none focus:border-tw-glass/20 transition-all'
                />

                <div className='flex gap-2'>
                  <button
                    onClick={handleSaveBuild}
                    disabled={!saveName.trim()}
                    className='flex-1 font-mono text-[11px] text-tw-primary bg-tw-base-highlight/8 border border-tw-glass/12 hover:border-tw-glass/25 hover:bg-tw-base-highlight/12 disabled:opacity-25 disabled:cursor-not-allowed py-2.5 rounded-lg transition-all cursor-pointer uppercase tracking-widest'>
                    {t('saveDialog.save')}
                  </button>
                  <button
                    onClick={() => {
                      setShowSaveDialog(false);
                      setSaveName('');
                    }}
                    className='px-4 font-mono text-[11px] text-tw-muted border border-tw-glass/8 hover:border-tw-glass/15 hover:text-tw-muted-highlight hover:bg-tw-base-highlight/12 py-2.5 rounded-lg transition-all cursor-pointer'>
                    {t('saveDialog.cancel')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare modal */}
      {showCompareModal && compareList.length === 2 && (
        <CompareModal
          components={compareList}
          onClose={() => {
            setShowCompareModal(false);
            setCompareList([]);
          }}
        />
      )}

      {/* Component detail/specs modal */}
      <ComponentDetailModal component={detailComponent} onClose={() => setDetailComponent(null)} onAdd={handleAdd} />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </motion.div>
  );
}

export default App;
