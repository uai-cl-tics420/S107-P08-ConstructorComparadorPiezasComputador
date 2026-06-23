import { motion, type Variants } from 'framer-motion';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ComponentCard } from '@/components/ComponentCard';
import { Pagination } from '@/components/Pagination';
import type { Component, BuildComponent } from '@/types/Frontend_types';
import type { ReasonText } from '@/utils/recommendations';

interface ComponentGridProps {
  loading: boolean;
  components: Component[];
  sortedComponents: Component[];
  totalCount: number;
  hasActiveFilters: boolean | string;
  clearFilters: () => void;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  setCurrentPage: (p: number) => void;
  setItemsPerPage: (p: number) => void;
  handleAdd: (c: Component) => void;
  handleCompare: (c: Component) => void;
  setDetailComponent: (c: Component) => void;
  compareList: Component[];
  buildComponents: BuildComponent[];
  componentCompatibility: Map<string, { isCompatible: boolean; reasons: ReasonText[] }>;
  componentReplaces: Set<string>;
}

export function ComponentGrid({
  loading,
  components,
  sortedComponents,
  totalCount,
  hasActiveFilters,
  clearFilters,
  currentPage,
  totalPages,
  itemsPerPage,
  setCurrentPage,
  setItemsPerPage,
  handleAdd,
  handleCompare,
  setDetailComponent,
  compareList,
  buildComponents,
  componentCompatibility,
  componentReplaces,
}: ComponentGridProps) {
  const { t } = useTranslation();

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

  if (loading) {
    return (
      <div className='grid grid-cols-12 gap-3'>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className='col-span-12 sm:col-span-6 lg:col-span-3'>
            <SkeletonCard />
          </div>
        ))}
      </div>
    );
  }

  if (components.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='flex flex-col items-center justify-center py-24 gap-4'>
        <div className='w-10 h-10 border border-tw-border-deep rounded-xl flex items-center justify-center'>
          <Search className='w-4 h-4 text-tw-muted-de' />
        </div>
        <div className='text-center space-y-1'>
          <p className='text-tw-muted-highlight text-sm'>{t('results.noResults')}</p>
          <p className='font-mono text-[0.6rem] text-tw-muted-deep uppercase tracking-widest'>
            {hasActiveFilters ? t('results.adjustFilters') : t('results.noComponents')}
          </p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className='font-mono text-[0.6rem] text-tw-muted hover:text-tw-muted-highlight border border-tw-glass/8 hover:border-tw-glass/15 px-4 py-2 rounded-lg transition-all cursor-pointer uppercase tracking-widest'>
            {t('filters.clearFilters')}
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <>
      <motion.div variants={containerVariant} initial='hidden' animate='visible'>
        <p className='font-mono text-[0.6rem] text-tw-muted-deep uppercase tracking-widest mb-4'>
          {t('results.componentCount', { count: totalCount })}
        </p>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
          {sortedComponents.map((c, i) => (
            <motion.div key={c.id} custom={i} variants={cardVariant}>
              <ComponentCard
                component={c}
                onAdd={handleAdd}
                onCompare={handleCompare}
                onViewSpecs={setDetailComponent}
                isSelectedForCompare={compareList.some((x) => x.id === c.id)}
                buildCompatibility={buildComponents.length > 0 ? componentCompatibility.get(c.id) : null}
                willReplace={componentReplaces.has(c.id)}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

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
  );
}
