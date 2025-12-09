
import React from 'react';
import type { User, Company } from '../types';
import { UserRole as UserRoleEnum } from '../types';
import { useLanguage, Language } from '../i18n/LanguageContext';

interface HeaderProps {
  user: User;
  company: Company | null;
  onLogout: () => void;
  onOpenSettings: () => void;
}

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();
    
    const languages: { code: Language; label: string; flag: string }[] = [
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'it', label: 'Italiano', flag: '🇮🇹' },
        { code: 'fr', label: 'Français', flag: '🇫🇷' },
        { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
        { code: 'es', label: 'Español', flag: '🇪🇸' },
        { code: 'zh', label: '中文', flag: '🇨🇳' },
        { code: 'ar', label: 'العربية', flag: '🇸🇦' },
        { code: 'pt', label: 'Português', flag: '🇵🇹' },
        { code: 'el', label: 'Ελληνικά', flag: '🇬🇷' },
        { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    ];

    return (
        <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-sm rounded-md px-2 py-1 border-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
            {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.label}
                </option>
            ))}
        </select>
    );
};

export const Header: React.FC<HeaderProps> = ({ user, company, onLogout, onOpenSettings }) => {
  const { t } = useLanguage();
  
  const companyName = user.role === UserRoleEnum.GeneralAdmin ? "AIScriba Local" : company?.name;

  return (
    <header className="flex-shrink-0 bg-white dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center no-print layout-header">
      <div className="flex items-center space-x-4">
        {company?.logoUrl ? (
            <img 
              src={company.logoUrl} 
              alt="Company Logo" 
              className="h-10 w-auto max-w-[150px] rounded-md object-contain" 
            />
        ) : (
            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <i className="fa-solid fa-building text-slate-500"></i>
            </div>
        )}
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{companyName}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <LanguageSwitcher />
        <button 
            onClick={onOpenSettings}
            className="p-2 rounded-full text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-700 transition-colors"
            title="Impostazioni"
        >
            <i className="fa-solid fa-gear text-lg"></i>
        </button>
        <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {user.email.charAt(0).toUpperCase()}
            </div>
             <button onClick={onLogout} title={t('logout')} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-500 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                <i className="fa-solid fa-right-from-bracket"></i>
            </button>
        </div>
      </div>
    </header>
  );
};
