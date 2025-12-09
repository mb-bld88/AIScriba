
import React, { useState } from 'react';
import type { User, Company } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { deleteCompany } from '../utils/storageUtils';

interface CompanyManagementPageProps {
  user: User;
  companies: Company[];
  addCompanyAndAdmin: (companyName: string, adminEmail: string, adminPassword: string, logoUrl: string | null) => Promise<Company | null>;
}

export const CompanyManagementPage: React.FC<CompanyManagementPageProps> = ({ user, companies, addCompanyAndAdmin }) => {
  const { t } = useLanguage();
  const [companyName, setCompanyName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName.trim() && adminEmail.trim() && adminPassword.trim()) {
      const newCompany = await addCompanyAndAdmin(companyName.trim(), adminEmail.trim(), adminPassword.trim(), logoUrl);
      if (newCompany) {
        setCompanyName('');
        setAdminEmail('');
        setAdminPassword('');
        setLogoUrl(null);
      }
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
      if (confirm("ATTENZIONE: Stai per eliminare un'intera azienda, inclusi TUTTI i suoi utenti e TUTTE le riunioni. Questa azione è irreversibile. Confermi?")) {
          try {
              await deleteCompany(companyId);
              window.location.reload();
          } catch(e) {
              alert("Errore durante l'eliminazione dell'azienda.");
          }
      }
  }

  return (
    <div className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Create Company Form */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">{t('createNewCompany')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="font-semibold block mb-2 text-slate-700 dark:text-slate-300">{t('companyName')}</label>
                        <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-2 text-slate-700 dark:text-slate-300">{t('companyLogo')}</label>
                        <div className="flex items-center space-x-4">
                            <div className="h-20 w-auto min-w-[100px] bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center flex-shrink-0 p-2">
                                {logoUrl ? <img src={logoUrl} alt="Logo preview" className="h-full w-auto object-contain rounded-md" /> : <i className="fa-solid fa-image text-3xl text-slate-400"></i>}
                            </div>
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/50 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900"/>
                        </div>
                    </div>
                     <div>
                        <label className="font-semibold block mb-2 text-slate-700 dark:text-slate-300">{t('adminEmail')}</label>
                        <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-2 text-slate-700 dark:text-slate-300">{t('adminPassword')}</label>
                        <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg">{t('createCompany')}</button>
                </form>
            </div>
            
            {/* Companies List */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">{t('companies')}</h2>
                <ul className="space-y-3">
                    {companies.map(company => (
                        <li key={company.id} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-between">
                            <div className="flex items-center">
                                {company.logoUrl ? (
                                <img src={company.logoUrl} alt={`${company.name} logo`} className="h-8 w-auto max-w-[100px] mr-3 rounded-sm object-contain" />
                                ) : (
                                    <i className="fa-solid fa-building text-slate-500 mr-3"></i>
                                )}
                                {company.name}
                            </div>
                            <button onClick={() => handleDeleteCompany(company.id)} className="text-red-500 hover:text-red-700 p-2" title="Elimina Azienda">
                                <i className="fa-solid fa-trash-can"></i>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </div>
  );
};
