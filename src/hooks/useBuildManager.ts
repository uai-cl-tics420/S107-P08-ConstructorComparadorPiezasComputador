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
  const [typesIds, setTypesIds] = useState<Record<string, string>>({});
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

    // Obtain type Ids

    const fetchData = async () => {
      try {
        const res = await fetch('/api/component-types', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error(`Request error, ${res.status}`);
        }

        const body = await res.json();
        let types: Record<string, string> = {};

        for (const type of body) {
          types[type.name] = type.id;
        }

        setTypesIds(types);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
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
    const type = componentTypes.find((t) => t.id === component.type_id)!;
    const existing = buildComponents.find((b) => b.component.id === component.id);
    const sameType = buildComponents.find((b) => b.component.type_id === component.type_id);

    let prospective: BuildComponent[];
    let action: 'increment' | 'replace' | 'add';
    let max_quantity: number = type.max_quantity;
    switch (type.name) {
      case 'RAM':
        try {
          if (typesIds['Motherboard']) {
            const mb = buildComponents.find((b) => b.component.type_id === typesIds['Motherboard']);
            const slots = mb!.component.specs!.memory_slots_quantity;
            max_quantity = typeof slots === 'number' && !isNaN(slots) ? slots : type.max_quantity;
          } else {
            throw new Error('Unable to find typeId for max_quantity check');
          }
        } catch (error) {
          max_quantity = type.max_quantity;
        }
        console.log(max_quantity);
        break;
      case 'Storage':
        try {
          if (typesIds['Motherboard']) {
            const mb = buildComponents.find((b) => b.component.type_id === typesIds['Motherboard']);
            const slots = mb!.component.specs!.m2_slots;
            max_quantity = typeof slots === 'number' && !isNaN(slots) ? slots : type.max_quantity;
          } else {
            throw new Error('Unable to find typeId for max_quantity check');
          }
        } catch (error) {
          max_quantity = type.max_quantity;
        }
        console.log(max_quantity);
        break;

      default:
        console.log('defaulted quantity');

        max_quantity = type.max_quantity;
        console.log(max_quantity);
    }
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

    // No se bloquea agregar componentes incompatibles: se permiten igual para no
    // restringir el uso, y la incompatibilidad se avisa con un toast (que dura más)
    // además de mostrarse de forma persistente en la vista del build.
    const currentErrors = new Set(
      checkCompatibility(buildComponents, t)
        .filter((i) => i.type === 'error')
        .map((i) => i.message),
    );
    const newErrors = checkCompatibility(prospective, t).filter(
      (i) => i.type === 'error' && !currentErrors.has(i.message),
    );

    setBuildComponents(prospective);

    if (newErrors.length > 0) {
      addToast(t('build.addedIncompatible', { name: component.name, error: newErrors[0]!.message }), 'warning');
    } else if (action === 'increment') {
      addToast(t('build.componentUpdated', { name: component.name }), 'success');
    } else if (action === 'replace') {
      addToast(t('build.componentReplaced', { oldName: sameType!.component.name, newName: component.name }), 'success');
    } else {
      addToast(t('build.componentAdded', { name: component.name }), 'success');
    }
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
