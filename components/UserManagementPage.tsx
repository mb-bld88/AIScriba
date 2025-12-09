
import React, { useState, useRef } from 'react';
import type { User, Company } from '../types';
import { UserRole } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { deleteUser, resetUserPassword } from '../utils/storageUtils';

interface UserManagementPageProps {
  user: User;
  company: Company | null;
  companyUsers: User[];
  addUser: (email: string, password: string, role: UserRole, companyId: string) => Promise<User | null>;
  setCompanyLogo: (logoUrl: string) => void;
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({ user, company, companyUsers, addUser, setCompanyLogo }) => {
  const { t } = useLanguage();
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.User);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompanyLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail.trim() && newPassword.trim() && user.companyId) {
      const newUser = await addUser(newEmail.trim(), newPassword.trim(), newRole, user.companyId);
      if (newUser) {
        setNewEmail('');
        setNewPassword('');
        setNewRole(UserRole.User);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
      if (confirm("Sei sicuro di voler eliminare questo utente?")) {
          try {
              await deleteUser(userId);
              // Trigger reload via parent or state update (in App.tsx logic handles reload after action)
              window.location.reload(); // Simple reload to refresh data
          } catch(e) {
              alert("Errore durante l'eliminazione");
          }
      }
  };

  const handleResetPassword = async (userId: string) => {
      if (confirm("La password verrà resettata a 'password123'. Confermi?")) {
          try {
              await resetUserPassword(userId);
              alert("Password resettata con successo a 'password123'");
          } catch(e) {
              alert("Errore durante il reset");
          }
      }
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Company Profile Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">{t('companyProfile')}</h2>
            <div className="flex items-center space-x-4">
                 <input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="relative group flex-shrink-0">
                    {company?.logoUrl ? (
                      <img src={company.logoUrl} alt="Company Logo" className="h-20 w-auto max-w-[250px] rounded-md object-contain"/>
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                         <i className="fa-solid fa-building text-3xl text-slate-500"></i>
                      </div>
                    )}
                     <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <i className="fa-solid fa-upload text-white text-2xl"></i>
                    </div>
                  </button>
                  <div>
                      <h3 className="text-xl font-bold">{company?.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('clickLogoToUpload')}</p>
                  </div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Create User Form */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">{t('createNewUser')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="font-semibold block mb-2 text-slate-700 dark:text-slate-300">{t('email')}</label>
                        <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-2 text-slate-700 dark:text-slate-300">{t('password')}</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-2 text-slate-700 dark:text-slate-300">{t('role')}</label>
                        <select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700">
                            <option value={UserRole.User}>{t('user')}</option>
                            <option value={UserRole.CompanyAdmin}>{t('companyAdmin')}</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg">{t('createUser')}</button>
                </form>
            </div>
            
            {/* Users List */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">{t('users')}</h2>
                <ul className="space-y-3 max-h-64 overflow-y-auto">
                    {companyUsers.map(u => (
                        <li key={u.id} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-between">
                            <div className="flex items-center">
                                <i className="fa-solid fa-user text-slate-500 mr-3"></i>
                                <span className="truncate max-w-[150px]" title={u.email}>{u.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.role === 'CompanyAdmin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}>
                                    {u.role === 'CompanyAdmin' ? 'Admin' : 'User'}
                                </span>
                                {u.id !== user.id && (
                                    <>
                                        <button onClick={() => handleResetPassword(u.id)} className="text-amber-500 hover:text-amber-600 p-1" title="Reset Password">
                                            <i className="fa-solid fa-key"></i>
                                        </button>
                                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-600 p-1" title="Elimina Utente">
                                            <i className="fa-solid fa-trash-can"></i>
                                        </button>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};
