
import React from 'react';
import type { User } from '../types';
import { UserRole } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface SidebarProps {
  currentUser: User;
  currentView: string;
  onNavigate: (view: 'dashboard' | 'newMeeting' | 'administration') => void;
}

const SidebarIcon: React.FC<{ icon: string; isActive?: boolean; }> = ({ icon, isActive = false }) => (
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${isActive ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
        <i className={`fa-solid ${icon} text-2xl ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}></i>
    </div>
);

const NavButton: React.FC<{
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        title={label}
        className="flex flex-col items-center space-y-1 group"
    >
        <SidebarIcon icon={icon} isActive={isActive} />
        <span className={`text-xs font-semibold transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white'}`}>{label}</span>
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentUser, currentView, onNavigate }) => {
  const { t } = useLanguage();
  const isAdmin = currentUser.role === UserRole.GeneralAdmin || currentUser.role === UserRole.CompanyAdmin;
  
  return (
    <div className="w-24 bg-white dark:bg-slate-800 flex flex-col items-center justify-between p-4 border-r border-slate-200 dark:border-slate-700 no-print">
      <div className="flex flex-col items-center space-y-8 w-full">
        <div className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <i className={`fa-solid fa-feather-pointed text-white text-2xl`}></i>
            </div>
        </div>
        
        <NavButton
            icon="fa-table-columns"
            label={t('dashboard')}
            isActive={currentView === 'dashboard'}
            onClick={() => onNavigate('dashboard')}
        />

        {isAdmin && (
           <NavButton
                icon="fa-cog"
                label={t('administration')}
                isActive={currentView === 'administration'}
                onClick={() => onNavigate('administration')}
            />
        )}
      </div>

      <button onClick={() => onNavigate('newMeeting')} className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110" title={t('createNewMeeting')}>
        <i className="fa-solid fa-plus text-2xl"></i>
      </button>
    </div>
  );
};
