
import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface WelcomeScreenProps {
  onNewMeeting: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNewMeeting }) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg mb-6 -rotate-12">
        <i className="fa-solid fa-feather-pointed text-white text-5xl"></i>
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">{t('welcomeToAIScriba')}</h1>
      <p className="text-lg text-slate-500 dark:text-slate-400 mt-2 max-w-md">
        {t('welcomeMessage')}
      </p>
      <button 
        onClick={onNewMeeting}
        className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center transition-transform duration-200 hover:scale-105 shadow-lg"
      >
        <i className="fa-solid fa-plus mr-2"></i>
        {t('createNewMeeting')}
      </button>
    </div>
  );
};
