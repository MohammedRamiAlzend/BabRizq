import { useState, useEffect } from 'react';

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

export interface UsePaginationResult<T> {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  totalPages: number;
  totalItems: number;
  /** Slice of items for the current page */
  paged: T[];
  /** 1-based index of the first item on this page (0 when empty) */
  from: number;
  /** 1-based index of the last item on this page (0 when empty) */
  to: number;
}

/**
 * Manages pagination state for any array of items.
 *
 * Automatically resets to page 1 whenever the total number of items
 * changes (e.g. due to search / filter updates).
 */
export function usePagination<T>(
  items: T[],
  initialPageSize: (typeof PAGE_SIZE_OPTIONS)[number] = 5,
): UsePaginationResult<T> {
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Reset to page 1 whenever the filtered item count or page-size changes.
  useEffect(() => {
    setPageState(1);
  }, [items.length, pageSize]);

  const safePage = Math.min(page, totalPages);
  const from = items.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, items.length);
  const paged = items.slice((safePage - 1) * pageSize, safePage * pageSize);

  const setPage = (p: number) =>
    setPageState(Math.max(1, Math.min(p, totalPages)));

  const setPageSize = (s: number) => setPageSizeState(s);

  return {
    page: safePage,
    pageSize,
    setPage,
    setPageSize,
    totalPages,
    totalItems: items.length,
    paged,
    from,
    to,
  };
}









