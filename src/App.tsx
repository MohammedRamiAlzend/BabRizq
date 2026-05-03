import { useEffect } from 'react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { AppProviders } from '~/app/providers/appProviders';
import { AppRouter } from '~/app/routing/appRouter';

const AppContent = () => {
  const { locale } = useLocale();

  useEffect(() => {
    const isRTL = locale === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;

    if (isRTL) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }

    window.dispatchEvent(new Event('resize'));
  }, [locale]);

  return <AppRouter />;
};

const App = () => (
  <AppProviders>
    <AppContent />
  </AppProviders>
);

export default App;








