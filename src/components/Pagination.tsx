import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

export function Pagination({ currentPage, totalPages, itemsPerPage, totalItems, onPageChange, onItemsPerPageChange }: PaginationProps) {
  const { t } = useTranslation();
  const itemsPerPageOptions = [12, 24, 36, 48];
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePreviousPage = () => {
    if (currentPage > 1) { onPageChange(currentPage - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) { onPageChange(currentPage + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const showPages = 5;
    const halfShow = Math.floor(showPages / 2);
    let startPage = Math.max(1, currentPage - halfShow);
    let endPage = Math.min(totalPages, startPage + showPages - 1);
    if (endPage - startPage < showPages - 1) startPage = Math.max(1, endPage - showPages + 1);
    if (startPage > 1) { pages.push(1); if (startPage > 2) pages.push('...'); }
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (endPage < totalPages) { if (endPage < totalPages - 1) pages.push('...'); pages.push(totalPages); }
    return pages;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className='flex flex-col gap-4 mt-8 py-6 border-t border-tw-border-deep'>
      <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <label htmlFor='items-per-page' className='font-mono text-[9px] text-tw-muted-deep uppercase tracking-widest'>
            {t('pagination.showPerPage')}
          </label>
          <select
            id='items-per-page'
            value={itemsPerPage}
            onChange={(e) => { onItemsPerPageChange(Number(e.target.value)); onPageChange(1); }}
            className='font-mono text-xs bg-tw-surface border border-tw-border-deep text-tw-muted-highlight rounded-lg px-3 py-2 focus:outline-none focus:border-tw-border-highlight cursor-pointer appearance-none transition-all'>
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {t('pagination.itemsOption', { count: option })}
              </option>
            ))}
          </select>
        </div>

        <div className='font-mono text-xs text-tw-muted'>
          {t('pagination.showing', { start: startItem, end: endItem, total: totalItems })}
        </div>
      </div>

      <div className='flex items-center justify-center gap-2'>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className='flex items-center gap-1.5 px-3 py-2 border border-tw-border-deep hover:border-tw-border disabled:border-tw-border-deep disabled:opacity-40 disabled:cursor-not-allowed bg-tw-surface hover:bg-tw-surface-deep rounded-lg transition-all cursor-pointer font-mono text-xs uppercase tracking-widest text-tw-muted hover:text-tw-muted-highlight disabled:text-tw-muted-deep'>
          <ChevronLeft className='w-3.5 h-3.5' />
          {t('pagination.previous')}
        </motion.button>

        <div className='flex items-center gap-1'>
          {getPageNumbers().map((page, index) => (
            <motion.button
              key={`${page}-${index}`}
              whileHover={page !== '...' ? { scale: 1.08 } : {}}
              whileTap={page !== '...' ? { scale: 0.95 } : {}}
              onClick={() => { if (page !== '...') { onPageChange(page as number); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
              disabled={page === '...'}
              className={`w-9 h-9 flex items-center justify-center rounded-lg font-mono text-xs font-semibold uppercase tracking-widest transition-all cursor-pointer ${
                page === currentPage
                  ? 'bg-tw-base-highlight/20 border border-tw-base-highlight/40 text-tw-primary'
                  : page === '...'
                    ? 'text-tw-muted-deep cursor-default'
                    : 'border border-tw-border-deep hover:border-tw-border-highlight text-tw-muted hover:text-tw-muted-highlight hover:bg-tw-surface-deep'
              }`}>
              {page}
            </motion.button>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className='flex items-center gap-1.5 px-3 py-2 border border-tw-border-deep hover:border-tw-border disabled:border-tw-border-deep disabled:opacity-40 disabled:cursor-not-allowed bg-tw-surface hover:bg-tw-surface-deep rounded-lg transition-all cursor-pointer font-mono text-xs uppercase tracking-widest text-tw-muted hover:text-tw-muted-highlight disabled:text-tw-muted-deep'>
          {t('pagination.next')}
          <ChevronRight className='w-3.5 h-3.5' />
        </motion.button>
      </div>
    </motion.div>
  );
}
