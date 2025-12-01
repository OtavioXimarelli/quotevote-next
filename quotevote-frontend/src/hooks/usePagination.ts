'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export interface UsePaginationOptions {
  /**
   * Default page number
   * @default 1
   */
  defaultPage?: number;
  /**
   * Default page size
   * @default 20
   */
  defaultPageSize?: number;
  /**
   * URL parameter name for page
   * @default 'page'
   */
  pageParam?: string;
  /**
   * URL parameter name for page size
   * @default 'page_size'
   */
  pageSizeParam?: string;
  /**
   * Callback when page changes
   */
  onPageChange?: (page: number) => void;
  /**
   * Callback when page size changes
   */
  onPageSizeChange?: (pageSize: number) => void;
  /**
   * Reset to page 1 when filters change
   * @default true
   */
  resetOnFilterChange?: boolean;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
}

export interface UsePaginationReturn {
  currentPage: number;
  pageSize: number;
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (pageSize: number) => void;
  resetToFirstPage: () => void;
  calculatePagination: (totalCount: number) => PaginationData;
  // Legacy support
  setCurrentPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

/**
 * Custom hook for managing pagination state with URL synchronization
 * Adapted for Next.js 16 App Router using useSearchParams and useRouter
 */
export function usePagination({
  defaultPage = 1,
  defaultPageSize = 20,
  pageParam = 'page',
  pageSizeParam = 'page_size',
  onPageChange,
  onPageSizeChange,
}: UsePaginationOptions = {}): UsePaginationReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse URL parameters
  const urlPageParam = searchParams.get(pageParam);
  const urlPageSizeParam = searchParams.get(pageSizeParam);
  const urlPage = urlPageParam ? parseInt(urlPageParam, 10) : NaN;
  const urlPageSize = urlPageSizeParam ? parseInt(urlPageSizeParam, 10) : NaN;

  // Initialize state from URL or defaults
  const [currentPage, setCurrentPage] = useState(
    !isNaN(urlPage) && urlPage > 0 ? urlPage : defaultPage
  );
  const [pageSize, setPageSize] = useState(
    !isNaN(urlPageSize) && urlPageSize > 0 ? urlPageSize : defaultPageSize
  );

  // Update URL when pagination changes
  const updateURL = useCallback(
    (page: number, size: number) => {
      const params = new URLSearchParams(searchParams.toString());
      
      // Always set page parameter
      params.set(pageParam, page.toString());

      // Update page size parameter (only if different from default)
      if (size !== defaultPageSize) {
        params.set(pageSizeParam, size.toString());
      } else {
        params.delete(pageSizeParam);
      }

      // Update URL without triggering a page reload
      const newURL = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      router.push(newURL, { scroll: false });
    },
    [pathname, router, searchParams, pageParam, pageSizeParam, defaultPageSize]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      if (page !== currentPage) {
        setCurrentPage(page);
        updateURL(page, pageSize);
        onPageChange?.(page);
      }
    },
    [currentPage, pageSize, updateURL, onPageChange]
  );

  // Handle page size change
  const handlePageSizeChange = useCallback(
    (size: number) => {
      if (size !== pageSize) {
        setPageSize(size);
        setCurrentPage(1); // Reset to first page when page size changes
        updateURL(1, size);
        onPageSizeChange?.(size);
      }
    },
    [pageSize, updateURL, onPageSizeChange]
  );

  // Reset to first page (useful when filters change)
  const resetToFirstPage = useCallback(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
      updateURL(1, pageSize);
      onPageChange?.(1);
    }
  }, [currentPage, pageSize, updateURL, onPageChange]);

  // Sync with URL changes (browser back/forward)
  // Only sync when URL params actually change, not when state changes
  useEffect(() => {
    const newUrlPage = !isNaN(urlPage) && urlPage > 0 ? urlPage : null;
    const newUrlPageSize = !isNaN(urlPageSize) && urlPageSize > 0 ? urlPageSize : null;

    // Update page if URL has a valid page number and it's different from current
    // This handles browser back/forward navigation
    if (newUrlPage !== null && newUrlPage !== currentPage) {
      setCurrentPage(newUrlPage);
      onPageChange?.(newUrlPage);
    }

    // Update page size if URL has a valid page size and it's different from current
    if (newUrlPageSize !== null && newUrlPageSize !== pageSize) {
      setPageSize(newUrlPageSize);
      onPageSizeChange?.(newUrlPageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlPage, urlPageSize]); // Only depend on URL params, not state

  // Calculate pagination values
  const calculatePagination = useCallback(
    (totalCount: number): PaginationData => {
      const totalPages = Math.ceil(totalCount / pageSize);
      const normalizedPage = Math.min(Math.max(currentPage, 1), totalPages || 1);
      
      return {
        currentPage: normalizedPage,
        totalPages: Math.max(totalPages, 1),
        totalCount,
        pageSize,
        hasNextPage: normalizedPage < totalPages,
        hasPreviousPage: normalizedPage > 1,
        startIndex: (normalizedPage - 1) * pageSize,
        endIndex: Math.min(normalizedPage * pageSize, totalCount),
      };
    },
    [currentPage, pageSize]
  );

  return {
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    resetToFirstPage,
    calculatePagination,
    // Legacy support for existing code
    setCurrentPage: handlePageChange,
    setPageSize: handlePageSizeChange,
  };
}

/**
 * Hook for managing pagination with filter synchronization
 * Automatically resets to page 1 when filters change
 */
export function usePaginationWithFilters<T extends unknown[]>(
  paginationOptions: UsePaginationOptions = {},
  dependencies: T = [] as unknown as T
): UsePaginationReturn {
  const pagination = usePagination(paginationOptions);
  const [previousDependencies, setPreviousDependencies] = useState<T>(dependencies);

  // Reset to first page when dependencies (filters) change
  useEffect(() => {
    // Only reset if dependencies actually changed (not on initial mount)
    const dependenciesChanged = dependencies.some(
      (dep, index) => dep !== previousDependencies[index]
    );
    
    if (dependenciesChanged && paginationOptions.resetOnFilterChange !== false) {
      pagination.resetToFirstPage();
    }
    
    setPreviousDependencies(dependencies);
  }, dependencies);

  return pagination;
}

