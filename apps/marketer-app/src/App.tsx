import { useEffect } from 'react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { AppProviders } from '~/app/providers/appProviders';
import { AppRouter } from '~/app/routing/appRouter';

const AppContent = () => {
  const { lang } = useLocale();

  useEffect(() => {
    const isRTL = lang === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    if (isRTL) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }

    window.dispatchEvent(new Event('resize'));
  }, [lang]);

  return <AppRouter />;
};

const App = () => (
  <AppProviders>
    <AppContent />
  </AppProviders>
);

export default App;








