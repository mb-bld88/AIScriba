
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Spinner } from '../components/Spinner';

export type Language = 'en' | 'it' | 'fr' | 'de' | 'es' | 'zh' | 'ar' | 'pt' | 'el' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const browserLang = navigator.language.split('-')[0] as Language;
    const supported: Language[] = ['en', 'it', 'fr', 'de', 'es', 'zh', 'ar', 'pt', 'el', 'hi'];
    return supported.includes(browserLang) ? browserLang : 'en';
  });
  const [translations, setTranslations] = useState<any | null>(null);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        // Always try to fetch specific language, fallback to EN if not found or empty
        const response = await fetch(`/i18n/${language}.json`);
        if (response.ok) {
            const data = await response.json();
            setTranslations(data);
        } else {
            // Fallback for languages without UI translation files (keeps UI in EN/IT but Logic in Target Lang)
            const fallback = await fetch(`/i18n/en.json`);
            const data = await fallback.json();
            setTranslations(data);
        }
      } catch (error) {
        console.error(error);
        setTranslations({}); 
      }
    };

    fetchTranslations();
  }, [language]);

  const t = (key: string, options?: { [key: string]: string | number }): string => {
    if (!translations) {
      return key; 
    }
    let text = translations[key] || key;
    if (options && typeof text === 'string') {
        Object.keys(options).forEach(optKey => {
            text = text.replace(`{{${optKey}}}`, String(options[optKey]));
        });
    }
    return text;
  };
  
  if (!translations) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
        <Spinner className="h-12 w-12 border-b-4 border-blue-500" />
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
