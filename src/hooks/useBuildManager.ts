import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { checkCompatibility } from '@/utils/compatibility';
import type { Component, ComponentType, BuildComponent } from '@/types/Frontend_types';

export function useBuildManager(
  componentTypes: ComponentType[],
  addToast: (message: string, type?: 'error' | 'success' | 'warning') => void,
) {
  const { t } = useTranslation();

  const [buildComponents, setBuildComponents] = useState<BuildComponent[]>(() => {
    try {
      const saved = localStorage.getItem('local_build');
      return saved ? (JSON.parse(saved) as BuildComponent[]) : [];
    } catch {
      return [];
    }
  });

  const [restoredCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('local_build');
      return saved ? (JSON.parse(saved) as BuildComponent[]).length : 0;
    } catch {
      return 0;
    }
  });

  const [currentBuildId, setCurrentBuildId] = useState<string | null>(null);
  const [outOfStockIds, setOutOfStockIds] = useState<Set<string>>(new Set());
  const notifiedOosRef = useRef<Set<string>>(new Set());

  // Restore logic and Shared Build URL logic handled by the caller or here?
  // Let's keep shared build fetching here.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareParam = urlParams.get('share');
    if (shareParam) {
      fetch(`/api/shared-builds/${shareParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.components) {
            setBuildComponents(data.components);
            setCurrentBuildId(data.id);
            addToast(t('build.sharedBuildLoaded'), 'success');
            // We should ideally set activeTab='build' but this hook shouldn't know about tabs directly.
            // We can dispatch an event or return a flag. For now, returning currentBuildId changes might suffice or we handle it in App.
          } else {
            addToast(t('build.sharedBuildNotFound'), 'error');
          }
        })
        .catch(() => addToast(t('build.errorLoadingSharedBuild'), 'error'));

      const url = new URL(window.location.href);
      url.searchParams.delete('share');
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
  }, []);

  useEffect(() => {
    if (buildComponents.length > 0) {
      localStorage.setItem('local_build', JSON.stringify(buildComponents));
    } else {
      localStorage.removeItem('local_build');
    }
  }, [buildComponents]);

  useEffect(() => {
    const ids = buildComponents.map((b) => b.component.id);
    if (ids.length === 0) {
      setOutOfStockIds(new Set());
      return;
    }
    let cancelled = false;
    fetch('/api/components/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const oos: string[] = Array.isArray(data?.outOfStock) ? data.outOfStock : [];
        setOutOfStockIds(new Set(oos));
        const fresh = oos.filter((id) => !notifiedOosRef.current.has(id));
        if (fresh.length > 0) {
          fresh.forEach((id) => notifiedOosRef.current.add(id));
          addToast(
            t(fresh.length === 1 ? 'build.outOfStockToast' : 'build.outOfStockToast_other', {
              count: fresh.length,
            }),
            'warning',
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [buildComponents]);

  const handleAdd = (component: Component, setActiveTab: (tab: 'search' | 'build') => void) => {
    const type = componentTypes.find((t) => t.id === component.type_id);
    const existing = buildComponents.find((b) => b.component.id === component.id);
    const sameType = buildComponents.find((b) => b.component.type_id === component.type_id);

    let prospective: BuildComponent[];
    let action: 'increment' | 'replace' | 'add';
    if (existing) {
      if (type && existing.quantity >= type.max_quantity) {
        addToast(t('build.maxLimitReached', { type: component.type_name }), 'warning');
        return;
      }
      action = 'increment';
      prospective = buildComponents.map((b) =>
        b.component.id === component.id ? { ...b, quantity: b.quantity + 1 } : b,
      );
    } else if (sameType && type && type.max_quantity === 1) {
      action = 'replace';
      prospective = buildComponents.map((b) =>
        b.component.type_id === component.type_id ? { component, quantity: 1 } : b,
      );
    } else {
      action = 'add';
      prospective = [...buildComponents, { component, quantity: 1 }];
    }

    const currentErrors = new Set(
      checkCompatibility(buildComponents)
        .filter((i) => i.type === 'error')
        .map((i) => i.message),
    );
    const newErrors = checkCompatibility(prospective).filter(
      (i) => i.type === 'error' && !currentErrors.has(i.message),
    );
    if (newErrors.length > 0) {
      addToast(t('build.cannotAdd', { name: component.name, error: newErrors[0]!.message }), 'error');
      return;
    }

    setBuildComponents(prospective);
    if (action === 'increment') addToast(t('build.componentUpdated', { name: component.name }), 'success');
    else if (action === 'replace')
      addToast(t('build.componentReplaced', { oldName: sameType!.component.name, newName: component.name }), 'success');
    else addToast(t('build.componentAdded', { name: component.name }), 'success');
    setActiveTab('build');
  };

  const handleRemove = (componentId: string) => {
    const found = buildComponents.find((b) => b.component.id === componentId);
    setBuildComponents((prev) => prev.filter((b) => b.component.id !== componentId));
    if (found) addToast(t('build.componentRemoved', { name: found.component.name }), 'warning');
  };

  return {
    buildComponents,
    setBuildComponents,
    currentBuildId,
    setCurrentBuildId,
    outOfStockIds,
    restoredCount,
    handleAdd,
    handleRemove,
  };
}
