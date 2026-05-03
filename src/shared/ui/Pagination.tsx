import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { PAGE_SIZE_OPTIONS } from '@/shared/hooks/usePagination';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  from: number;
  to: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

/** Builds a compact page-number sequence with ellipsis (…) for large ranges. */
function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}

/**
 * Reusable RTL-aware pagination bar.
 *
 * Renders "Showing X–Y of Z" info, optional page-size selector, and
 * previous / numbered / next controls.
 */
const Pagination = ({
  page,
  totalPages,
  totalItems,
  from,
  to,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) => {
  const { t, dir } = useLocale();

  if (totalItems === 0 || totalPages <= 1) return null;

  const pageRange = buildPageRange(page, totalPages);

  // In RTL the visual "previous" is actually the right arrow and vice versa.
  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1">
      {/* Info + page size */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          {t(
            `Showing ${from}–${to} of ${totalItems}`,
            `عرض ${from}–${to} من ${totalItems}`,
          )}
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label={t('Rows per page', 'عدد الصفوف في الصفحة')}
          >
            {PAGE_SIZE_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s} / {t('page', 'صفحة')}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
          aria-label={t('Previous page', 'الصفحة السابقة')}
        >
          <PrevIcon className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        {pageRange.map((p, idx) =>
          p === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className="inline-flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors
                ${p === page
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-accent'
                }`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
          aria-label={t('Next page', 'الصفحة التالية')}
        >
          <NextIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;









