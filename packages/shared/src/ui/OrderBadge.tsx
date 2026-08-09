import { useLocale } from '@/shared/contexts/LocaleContext';
import type { FullOrderStatus } from '@/shared/lib/order';

const STATUS_STYLES: Record<FullOrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  assigned: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  picked_up: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  in_transit: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const STATUS_LABELS: Record<FullOrderStatus, { en: string; ar: string }> = {
  pending: { en: 'Pending', ar: 'معلّق' },
  processing: { en: 'Processing', ar: 'قيد المعالجة' },
  assigned: { en: 'Assigned', ar: 'تم التعيين' },
  picked_up: { en: 'Picked Up', ar: 'تم الاستلام' },
  in_transit: { en: 'In Transit', ar: 'في الطريق' },
  delivered: { en: 'Delivered', ar: 'تم التوصيل' },
};

export const OrderBadge = ({ status }: { status: FullOrderStatus }) => {
  const { t } = useLocale();
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status]}`}>
      {t(STATUS_LABELS[status].en, STATUS_LABELS[status].ar)}
    </span>
  );
};









