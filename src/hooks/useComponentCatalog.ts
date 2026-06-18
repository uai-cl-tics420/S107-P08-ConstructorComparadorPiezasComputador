import { useState, useEffect } from 'react';
import type { Component, ComponentType, Brand } from '@/types/Frontend_types';

export function useComponentCatalog(filters: {
  search: string;
  selectedType: string;
  selectedBrand: string;
  minPrice: string;
  maxPrice: string;
  currentPage: number;
  lastPage: number;
  setCurrentPage: (page: number) => void;
  setLastPage: (page: number) => void;
  itemsPerPage: number;
  sortBy: string;
}) {
  const [components, setComponents] = useState<Component[]>([]);
  const [componentTypes, setComponentTypes] = useState<ComponentType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetch('/api/component-types')
      .then((r) => r.json())
      .then(setComponentTypes);
    fetch('/api/brands')
      .then((r) => r.json())
      .then(setBrands);
  }, []);

  useEffect(() => {
    setLoading(true);

    if (filters.currentPage == filters.lastPage) {
      filters.setCurrentPage(1);
    }
    filters.setLastPage(filters.currentPage);

    const apiFilters = {
      search: filters.search || undefined,
      typeId: filters.selectedType || undefined,
      brandId: filters.selectedBrand || undefined,
      minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
      page: filters.currentPage,
      limit: filters.itemsPerPage,
      sortBy: 'synced_at',
      sortOrder: -1 as -1 | 1,
    };

    switch (filters.sortBy) {
      case 'latest':
        apiFilters.sortBy = 'synced_at';
        apiFilters.sortOrder = -1;
        break;
      case 'price_asc':
        apiFilters.sortBy = 'final_price';
        apiFilters.sortOrder = 1;
        break;
      case 'price_desc':
        apiFilters.sortBy = 'final_price';
        apiFilters.sortOrder = -1;
        break;
      case 'alphabetical':
        apiFilters.sortBy = 'name_model';
        apiFilters.sortOrder = 1;
        break;
    }

    fetch(`/api/components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiFilters),
    })
      .then((r) => r.json())
      .then((data) => {
        setComponents(data.components || []);
        setTotalCount(data.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching components:', err);
        setComponents([]);
        setTotalCount(0);
        setLoading(false);
      });
  }, [
    filters.search,
    filters.selectedType,
    filters.selectedBrand,
    filters.minPrice,
    filters.maxPrice,
    filters.currentPage,
    filters.itemsPerPage,
    filters.sortBy,
  ]);

  return {
    components,
    componentTypes,
    brands,
    loading,
    totalCount,
  };
}
