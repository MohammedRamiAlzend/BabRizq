import { useEffect, useState, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLocale } from '@/shared/contexts/LocaleContext';

const SCROLL_THRESHOLD = 300;

/**
 * Floating "scroll to top" button that becomes visible once the user has
 * scrolled past SCROLL_THRESHOLD pixels. Placed at the bottom-end of the
 * viewport so it never overlaps the main content.
 */
const ScrollToTopButton = () => {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener('scroll', handleScroll, { passive: true });
    // initialise in case the page is already scrolled
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <button
      onClick={scrollToTop}
      aria-label={t('Scroll to top', 'العودة للأعلى')}
      className={[
        'fixed bottom-6 end-6 z-50 flex h-12 w-12 items-center justify-center rounded-full',
        'gradient-gold shadow-lg shadow-primary/30 text-primary-foreground',
        'transition-all duration-300 hover:opacity-90 active:scale-95',
        visible
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0',
      ].join(' ')}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
};

export default ScrollToTopButton;









