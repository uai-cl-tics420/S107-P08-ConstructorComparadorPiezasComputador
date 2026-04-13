import type { Toast } from "../types";

interface Props {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const TYPE_STYLES: Record<Toast["type"], { bar: string; icon: string; label: string }> = {
  success: { bar: "bg-green-500", icon: "text-green-400", label: "✓" },
  error:   { bar: "bg-red-500",   icon: "text-red-400",   label: "✕" },
  warning: { bar: "bg-amber-500", icon: "text-amber-400", label: "⚠" },
};

export function ToastContainer({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => {
        const style = TYPE_STYLES[toast.type];
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 shadow-2xl min-w-[280px] max-w-sm animate-in slide-in-from-right-4 fade-in duration-200"
          >
            {/* Colored left bar */}
            <div className={`w-1 self-stretch rounded-full shrink-0 ${style.bar}`} />

            {/* Icon */}
            <span className={`text-sm font-bold shrink-0 ${style.icon}`}>{style.label}</span>

            {/* Message */}
            <p className="text-white text-sm flex-1 leading-snug">{toast.message}</p>

            {/* Close button */}
            <button
              onClick={() => onRemove(toast.id)}
              className="shrink-0 text-neutral-500 hover:text-white transition-colors duration-150 text-lg leading-none cursor-pointer"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
