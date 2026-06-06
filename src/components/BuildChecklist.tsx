import { useTranslation } from 'react-i18next';
import type { BuildComponent } from '../types/Frontend_types';

interface Props {
  build: BuildComponent[];
}

const ALL_TYPES = ['CPU', 'Motherboard', 'RAM', 'GPU', 'Storage', 'Fans', 'CPU Cooler', 'PSU', 'Case'];

const TYPE_DOT_COLOR: Record<string, string> = {
  CPU: 'bg-tw-cpu',
  Motherboard: 'bg-tw-motherboard',
  RAM: 'bg-tw-ram',
  GPU: 'bg-tw-gpu',
  Storage: 'bg-tw-storage',
  Fans: 'bg-tw-cooler',
  'CPU Cooler': 'bg-tw-cooler',
  PSU: 'bg-tw-psu',
  Case: 'bg-tw-case',
};

export function BuildChecklist({ build }: Props) {
  const { t } = useTranslation();
  const presentTypes = new Set(build.map((b) => b.component.type_name));
  const completed = ALL_TYPES.filter((tp) => presentTypes.has(tp)).length;
  const percentage = Math.round((completed / ALL_TYPES.length) * 100);

  return (
    <div className='bg-tw-base-deep/60 border border-tw-glass/5 rounded-2xl p-4 flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-tw-primary text-sm font-semibold'>{t('checklist.title')}</h3>
        <span className='text-xs font-bold text-tw-muted-highlight tabular-nums'>{percentage}%</span>
      </div>

      <div className='h-1.5 bg-tw-glass/5 rounded-full overflow-hidden'>
        <div
          className='h-full bg-linear-to-r from-tw-alt to-tw-accent rounded-full transition-all duration-500'
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className='flex flex-col gap-1'>
        {ALL_TYPES.map((type, i) => {
          const present = presentTypes.has(type);
          return (
            <div key={type} className='flex items-center justify-between py-1'>
              <div className='flex items-center gap-2'>
                <span className='text-tw-muted text-[0.6rem] tabular-nums w-3 shrink-0'>{i + 1}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${TYPE_DOT_COLOR[type] ?? 'bg-tw-case'}`} />
                <span className='text-tw-muted-highlight text-xs'>{type}</span>
              </div>
              {present ? (
                <span className='text-tw-success text-xs font-medium'>{t('checklist.added')}</span>
              ) : (
                <span className='text-tw-muted text-xs'>{t('checklist.missing')}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
