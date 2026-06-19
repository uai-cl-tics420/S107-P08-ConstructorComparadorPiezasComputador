import { useState } from 'react';

export function useFilters() {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(currentPage);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const clearFilters = () => {
    setSearch('');
    setSelectedType('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('default');
    setCurrentPage(1);
  };

  const hasActiveFilters = search || selectedType || selectedBrand || minPrice || maxPrice;

  return {
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
    currentPage,
    setCurrentPage,
    lastPage,
    setLastPage,
    itemsPerPage,
    setItemsPerPage,
    clearFilters,
    hasActiveFilters,
  };
}
