import { useTranslation } from 'react-i18next';
import type { SavedBuild } from '../types/Frontend_types';
import { Save } from 'lucide-react';
interface Props {
  savedBuilds: SavedBuild[];
  onLoad: (build: SavedBuild) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === 'es' ? 'es-CL' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function totalPrice(build: SavedBuild): number {
  return build.components.reduce((sum, bc) => {
    const minPrice = Math.min(...bc.component.prices.map((p) => p.price));
    return sum + minPrice * bc.quantity;
  }, 0);
}

export function SavedBuildsPanel({ savedBuilds, onLoad, onDelete }: Props) {
  const { t, i18n } = useTranslation();

  return (
    <div className='bg-tw-base-highlight/60 border border-tw-glass/5 rounded-2xl p-4 flex flex-col gap-3'>
      <h3 className='text-tw-primary text-sm font-semibold'>{t('savedBuilds.title')}</h3>

      {savedBuilds.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-8 gap-2'>
          <Save className='text-tw-muted text-4xl w-10 h-10' />
          <p className='text-tw-muted text-sm text-center'>{t('savedBuilds.empty')}</p>
          <p className='text-tw-muted-deep text-xs text-center'>{t('savedBuilds.emptyHint')}</p>
        </div>
      ) : (
        <div className='flex flex-col gap-2'>
          {savedBuilds.map((build) => (
            <div
              key={build.id}
              className='bg-tw-glass/3 border border-tw-glass/5 rounded-xl p-3 flex flex-col gap-2 hover:border-tw-glass/10 transition-colors duration-200'>
              <div className='flex items-start justify-between gap-2'>
                <div className='flex flex-col gap-0.5 min-w-0'>
                  <p className='text-tw-primary text-sm font-semibold truncate'>{build.name}</p>
                  <p className='text-tw-muted text-xs'>{formatDate(build.created_at, i18n.language)}</p>
                </div>
                <div className='flex flex-col items-end gap-0.5 shrink-0'>
                  <span className='text-tw-success-highlight text-sm font-bold tabular-nums'>
                    ${totalPrice(build).toLocaleString('es-CL')}
                  </span>
                  <span className='text-tw-muted text-xs'>
                    {t(build.components.length === 1 ? 'savedBuilds.componentCount_one' : 'savedBuilds.componentCount_other', { count: build.components.length })}
                  </span>
                </div>
              </div>

              <div className='flex flex-wrap gap-1'>
                {build.components.map((bc) => (
                  <span
                    key={bc.component.id}
                    className='px-1.5 py-0.5 bg-tw-glass/5 border border-tw-glass/5 rounded-md text-tw-muted-highlight text-xs'>
                    {bc.component.type_name}
                  </span>
                ))}
              </div>

              <div className='flex gap-2 pt-1'>
                <button onClick={() => onLoad(build)}
                  className='flex-1 bg-tw-glass/10 hover:bg-tw-glass/15 border border-tw-glass/10 hover:border-tw-glass/20 text-tw-primary text-xs font-semibold py-2 rounded-lg transition-all duration-150 cursor-pointer'>
                  {t('savedBuilds.load')}
                </button>
                <button onClick={() => onDelete(build.id)}
                  className='px-3 bg-tw-alert/10 hover:bg-tw-alert/20 border border-tw-alert/20 hover:border-tw-alert/30 text-tw-alert-highlight text-xs font-semibold py-2 rounded-lg transition-all duration-150 cursor-pointer'>
                  {t('savedBuilds.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
