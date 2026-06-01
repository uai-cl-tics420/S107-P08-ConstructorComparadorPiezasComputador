import { useTranslation } from 'react-i18next';
import type { Toast } from '../types/Frontend_types';

interface Props {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const TYPE_STYLES: Record<Toast['type'], { bar: string; icon: string; label: string }> = {
  success: { bar: 'bg-tw-success', icon: 'text-tw-success-highlight', label: '✓' },
  error: { bar: 'bg-tw-alert', icon: 'text-alert-highlight', label: '✕' },
  warning: { bar: 'bg-tw-warning', icon: 'text-tw-warning-highlight', label: '⚠' },
};

export function ToastContainer({ toasts, onRemove }: Props) {
  const { t } = useTranslation();
  if (toasts.length === 0) return null;

  return (
    <div className='fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none'>
      {toasts.map((toast) => {
        const style = TYPE_STYLES[toast.type];
        return (
          <div
            key={toast.id}
            className='pointer-events-auto flex items-center gap-3 bg-tw-surface-highlight border border-tw-glass/10 rounded-xl px-4 py-3 shadow-2xl min-w-70 max-w-sm animate-in slide-in-from-right-4 fade-in duration-200'>
            <div className={`w-1 self-stretch rounded-full shrink-0 ${style.bar}`} />
            <span className={`text-sm font-bold shrink-0 ${style.icon}`}>{style.label}</span>
            <p className='text-tw-primary text-sm flex-1 leading-snug'>{toast.message}</p>
            <button
              onClick={() => onRemove(toast.id)}
              className='shrink-0 text-tw-muted hover:text-tw-primary transition-colors duration-150 text-lg leading-none cursor-pointer'
              aria-label={t('common.close')}>
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
