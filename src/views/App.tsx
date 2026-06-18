import { useState, useContext, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSession, signOut } from '@/lib/auth/auth-client';
import { ToastContainer } from '@/components/ToastContainer';
import { CompareModal } from '@/components/CompareModal';
import { ComponentDetailModal } from '@/components/ComponentDetailModal';
import { useToast } from '@/hooks/useToast';
import { useSavedBuilds } from '@/hooks/useSavedBuilds';
import { useRecommendations } from '@/hooks/useRecommendations';
import { checkCompatibility } from '@/utils/compatibility';
import { scoreCompatibility } from '@/utils/recommendations';
import type { Component, SavedBuild } from '@/types/Frontend_types';
import { ConfigContext } from '@/frontend';
import '@/index.css';

import { useFilters } from '@/hooks/useFilters';
import { useComponentCatalog } from '@/hooks/useComponentCatalog';
import { useBuildManager } from '@/hooks/useBuildManager';
import { AppHeader } from '@/components/App/AppHeader';
import { FilterBar } from '@/components/App/FilterBar';
import { ComponentGrid } from '@/components/App/ComponentGrid';
import { BuildTab } from '@/components/App/BuildTab';
import { SaveBuildDialog } from '@/components/App/SaveBuildDialog';

export function App() {
  const { t } = useTranslation();
  const { config, setConfig } = useContext(ConfigContext);
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const { toasts, addToast, removeToast } = useToast();
  const { savedBuilds, saveBuild, deleteBuild } = useSavedBuilds();

  const [activeTab, setActiveTab] = useState<'search' | 'build'>('search');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [compareList, setCompareList] = useState<Component[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [detailComponent, setDetailComponent] = useState<Component | null>(null);

  const filters = useFilters();
  const catalog = useComponentCatalog(filters);
  const buildManager = useBuildManager(catalog.componentTypes, addToast);
  const { recommendations, loading: recsLoading } = useRecommendations(buildManager.buildComponents);

  const compatibilityIssues = checkCompatibility(buildManager.buildComponents);

  const componentCompatibility = useMemo(() => {
    const map = new Map<string, { isCompatible: boolean; reasons: string[] }>();
    for (const component of catalog.components) {
      const compatibility = scoreCompatibility(component, buildManager.buildComponents);
      map.set(component.id, {
        isCompatible: compatibility.isCompatible,
        reasons: compatibility.reasons,
      });
    }
    return map;
  }, [catalog.components, buildManager.buildComponents]);

  const sortedComponents = useMemo(() => {
    if (buildManager.buildComponents.length === 0) return catalog.components;
    return [...catalog.components].sort((a, b) => {
      const aRank = componentCompatibility.get(a.id)?.isCompatible === false ? 1 : 0;
      const bRank = componentCompatibility.get(b.id)?.isCompatible === false ? 1 : 0;
      return aRank - bRank;
    });
  }, [catalog.components, componentCompatibility, buildManager.buildComponents]);

  useEffect(() => {
    const fromLogin = sessionStorage.getItem('from_login');
    if (fromLogin) {
      sessionStorage.removeItem('from_login');
      if (buildManager.restoredCount > 0) {
        setActiveTab('build');
        addToast(
          t(buildManager.restoredCount === 1 ? 'build.buildRestored' : 'build.buildRestored_other', { count: buildManager.restoredCount }),
          'success',
        );
      }
    }
  }, [buildManager.restoredCount, addToast, t]);

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => navigate('/login'),
      },
    });
  };

  const toggleTheme = () => {
    if (!document.startViewTransition) {
      setConfig((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
      return;
    }
    document.startViewTransition(() => {
      setConfig((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
    });
  };

  const handleCompare = (component: Component) => {
    setCompareList((prev) => {
      if (prev.find((c) => c.id === component.id)) return prev.filter((c) => c.id !== component.id);
      if (prev.length >= 2) {
        addToast(t('build.onlyCompareTwo'), 'warning');
        return prev;
      }
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
      const saved = await saveBuild(saveName.trim(), buildManager.buildComponents);
      if (saved && typeof saved === 'object' && 'id' in saved) {
        buildManager.setCurrentBuildId(saved.id as string);
      }
      addToast(t('build.buildSaved', { name: saveName.trim() }), 'success');
      setSaveName('');
      setShowSaveDialog(false);
    } catch {
      addToast(t('build.errorDeleting'), 'error');
    }
  };

  const handleLoadBuild = (build: SavedBuild) => {
    buildManager.setBuildComponents(build.components);
    addToast(`Build "${build.name}" cargado`, 'success');
    setActiveTab('build');
  };

  const handleClearBuild = () => {
    buildManager.setBuildComponents([]);
    addToast('Build limpiado', 'warning');
  };

  const handleSearchType = (typeName: string) => {
    filters.clearFilters();
    const type = catalog.componentTypes.find((t) => t.name === typeName);
    if (type) filters.setSelectedType(String(type.id));
    setActiveTab('search');
  };

  if (isPending) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className='min-h-screen bg-base flex items-center justify-center'>
        <div className='flex flex-col items-center gap-3'>
          <Loader2 className='w-5 h-5 text-tw-primary animate-spin' />
          <span className='font-mono text-[0.6rem] text-tw-muted-deep uppercase tracking-widest'>Iniciando...</span>
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
      <motion.div
        initial={{ opacity: 0.08, backdropFilter: 'blur(12px)' }}
        animate={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className='absolute inset-0 pointer-events-none'
      />

      <AppHeader
        buildComponents={buildManager.buildComponents}
        setActiveTab={setActiveTab}
        session={session}
        isPending={isPending}
        handleLogout={handleLogout}
        config={config}
        toggleTheme={toggleTheme}
      />

      <main className='max-w-7xl mx-auto px-6 py-8'>
        <div className='flex gap-0 mb-8 border-b border-tw-border-deep'>
          {(['search', 'build'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-3 px-1 mr-6 font-mono text-xs uppercase tracking-widest transition-colors duration-200 cursor-pointer flex items-center gap-2 ${
                activeTab === tab ? 'text-tw-primary' : 'text-tw-muted-deep hover:text-tw-muted-highlight'
              }`}>
              {activeTab === tab && (
                <motion.div layoutId='tab-indicator' className='absolute bottom-0 left-0 right-0 h-px bg-tw-base-highlight' transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }} />
              )}
              {tab === 'search' ? t('tabs.components') : t('tabs.myBuild')}
              {tab === 'build' && buildManager.buildComponents.length > 0 && (
                <span className='font-mono text-[0.6rem] text-tw-muted-deep border border-tw-glass/10 px-1.5 py-0.5 rounded tabular-nums'>
                  {buildManager.buildComponents.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'search' && (
          <div>
            {compareList.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className='flex items-center justify-between border border-tw-border bg-tw-base/80 backdrop-blur-xl rounded-xl px-4 py-3 mb-4'>
                <div className='flex items-center gap-3 flex-wrap'>
                  <span className='font-mono text-[0.6rem] text-tw-muted uppercase tracking-widest'>{t('results.comparing', { count: compareList.length })}</span>
                  {compareList.map((c) => (
                    <span key={c.id} className='font-mono text-[0.6rem] text-tw-muted-highlight border border-tw-border px-2.5 py-1 rounded'>{c.name}</span>
                  ))}
                </div>
                <div className='flex gap-2 shrink-0'>
                  {compareList.length === 2 && (
                    <button onClick={() => setShowCompareModal(true)} className='font-mono text-[0.6rem] text-tw-primary border border-tw-glass/15 hover:border-tw-glass/28 hover:bg-tw-base-highlight/5 px-3 py-1.5 rounded transition-all cursor-pointer uppercase tracking-widest'>
                      {t('results.viewComparison')}
                    </button>
                  )}
                  <button onClick={() => setCompareList([])} className='font-mono text-[0.6rem] text-tw-muted-deep hover:text-tw-muted-highlight px-2 py-1.5 transition-colors cursor-pointer'>
                    {t('results.cancel')}
                  </button>
                </div>
              </motion.div>
            )}

            <FilterBar {...filters} componentTypes={catalog.componentTypes} brands={catalog.brands} />

            <ComponentGrid
              loading={catalog.loading}
              components={catalog.components}
              sortedComponents={sortedComponents}
              totalCount={catalog.totalCount}
              hasActiveFilters={filters.hasActiveFilters}
              clearFilters={filters.clearFilters}
              currentPage={filters.currentPage}
              totalPages={Math.ceil(catalog.totalCount / filters.itemsPerPage)}
              itemsPerPage={filters.itemsPerPage}
              setCurrentPage={filters.setCurrentPage}
              setItemsPerPage={filters.setItemsPerPage}
              handleAdd={(c) => buildManager.handleAdd(c, setActiveTab)}
              handleCompare={handleCompare}
              setDetailComponent={setDetailComponent}
              compareList={compareList}
              buildComponents={buildManager.buildComponents}
              componentCompatibility={componentCompatibility}
            />
          </div>
        )}

        {activeTab === 'build' && (
          <BuildTab
            compatibilityIssues={compatibilityIssues}
            buildComponents={buildManager.buildComponents}
            currentBuildId={buildManager.currentBuildId}
            setCurrentBuildId={buildManager.setCurrentBuildId}
            addToast={addToast}
            setShowSaveDialog={setShowSaveDialog}
            handleClearBuild={handleClearBuild}
            handleRemove={buildManager.handleRemove}
            handleSearchType={handleSearchType}
            outOfStockIds={buildManager.outOfStockIds}
            recommendations={recommendations}
            recsLoading={recsLoading}
            handleAdd={(c) => buildManager.handleAdd(c, setActiveTab)}
            savedBuilds={savedBuilds}
            handleLoadBuild={handleLoadBuild}
            deleteBuild={deleteBuild}
          />
        )}
      </main>

      <SaveBuildDialog
        showSaveDialog={showSaveDialog}
        setShowSaveDialog={setShowSaveDialog}
        saveName={saveName}
        setSaveName={setSaveName}
        handleSaveBuild={handleSaveBuild}
      />

      {showCompareModal && compareList.length === 2 && (
        <CompareModal components={compareList} onClose={() => { setShowCompareModal(false); setCompareList([]); }} />
      )}

      <ComponentDetailModal component={detailComponent} onClose={() => setDetailComponent(null)} onAdd={(c) => buildManager.handleAdd(c, setActiveTab)} />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </motion.div>
  );
}

export default App;
