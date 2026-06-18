import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ComponentType, Brand } from '@/types/Frontend_types';

interface FilterBarProps {
  search: string;
  setSearch: (s: string) => void;
  selectedType: string;
  setSelectedType: (s: string) => void;
  selectedBrand: string;
  setSelectedBrand: (s: string) => void;
  minPrice: string;
  setMinPrice: (s: string) => void;
  maxPrice: string;
  setMaxPrice: (s: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  componentTypes: ComponentType[];
  brands: Brand[];
  hasActiveFilters: boolean | string;
  clearFilters: () => void;
}

export function FilterBar({
  search,
  setSearch,
  selectedType,
  setSelectedType,
  selectedBrand,
  setSelectedBrand,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sortBy,
  setSortBy,
  componentTypes,
  brands,
  hasActiveFilters,
  clearFilters,
}: FilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className='relative mb-8 rounded-xl border border-tw-border-deep bg-tw-surface-deep/80 backdrop-blur-xl p-4'>
      <div className='absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-linear-to-r from-transparent via-tw-glass/8 to-transparent' />

      <div className='flex flex-col gap-3'>
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
            className='font-mono text-xs bg-tw-surface border border-tw-border-deep text-tw-muted-highlight rounded-lg px-3 py-2.5 focus:outline-none focus:border-tw-border-highlight cursor-pointer appearance-none transition-all'>
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
            className='font-mono text-xs bg-tw-surface border border-tw-border-deep text-tw-muted-highlight rounded-lg px-3 py-2.5 focus:outline-none focus:border-tw-border-highlight cursor-pointer appearance-none transition-all'>
            <option value=''>{t('filters.allBrands')}</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className='flex flex-col sm:flex-row gap-2.5 items-center'>
          <div className='flex items-center gap-2 flex-1 w-full'>
            <span className='font-mono text-[0.6rem] text-tw-muted-deep uppercase tracking-widest'>
              {t('filters.price')}
            </span>
            <input
              type='number'
              placeholder={t('filters.minPlaceholder')}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className='flex-1 font-mono text-xs bg-tw-surface border border-tw-border-deep text-tw-primary placeholder-tw-muted-deep rounded-lg px-3 py-2 focus:outline-none focus:border-tw-border-highlight transition-all w-0'
            />
            <span className='text-tw-muted-deeep text-xs'>—</span>
            <input
              type='number'
              placeholder={t('filters.maxPlaceholder')}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className='flex-1 font-mono text-xs bg-tw-surface border border-tw-border-deep text-tw-primary placeholder-tw-muted-deep rounded-lg px-3 py-2 focus:outline-none focus:border-tw-border-highlight transition-all w-0'
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
              <option value='latest'>{t('filters.sortDefault')}</option>
              <option value='price_asc'>{t('filters.sortPriceAsc')}</option>
              <option value='price_desc'>{t('filters.sortPriceDesc')}</option>
              <option value='alphabetical'>{t('filters.sortName')}</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className='font-mono text-[0.6rem] text-tw-muted-deep hover:text-tw-muted-highlight border border-tw-glass/8 hover:border-tw-glass/15 px-3 py-2 rounded-lg transition-all cursor-pointer uppercase tracking-widest'>
                {t('filters.clear')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
