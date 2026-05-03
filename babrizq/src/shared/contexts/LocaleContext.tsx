import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Dir = 'ltr' | 'rtl';
type Lang = 'en' | 'ar';

interface LocaleContextType {
  dir: Dir;
  lang: Lang;
  toggleLocale: () => void;
  t: (en: string, ar: string) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>('ar');
  const dir: Dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
  }, [dir, lang]);

  const toggleLocale = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;

  return (
    <LocaleContext.Provider value={{ dir, lang, toggleLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
};









