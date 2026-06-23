import { useState, useCallback } from 'react';
import type { Toast } from '../types/Frontend_types';

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    // Los avisos de error/advertencia (p. ej. incompatibilidades) duran más para
    // que alcancen a leerse; los de éxito se mantienen breves.
    const duration = type === 'success' ? 3000 : 7000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
