
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { updateUserApiKey, cleanupAudioFiles, getSmtpSettings, saveSmtpSettings, changeUserPassword } from '../utils/storageUtils';
import { UserRole, User, SmtpSettings } from '../types';

interface SettingsModalProps {
    onClose: () => void;
    onReload: () => void;
    user: User;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onReload, user }) => {
    const { t } = useLanguage();
    const [apiKey, setApiKeyInput] = useState(user.googleApiKey || '');
    const [showKey, setShowKey] = useState(false);
    
    // Password Change
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    
    // Maintenance
    const [cleanupDays, setCleanupDays] = useState(30);
    const [cleanupStatus, setCleanupStatus] = useState<string | null>(null);

    // SMTP
    const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>({
        smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', smtpFrom: '', appBaseUrl: window.location.origin
    });
    const [activeTab, setActiveTab] = useState<'general' | 'smtp'>('general');

    const isAdmin = user.role === UserRole.GeneralAdmin;

    useEffect(() => {
        if (isAdmin) {
            getSmtpSettings().then(setSmtpSettings).catch(console.error);
        }
    }, [isAdmin]);

    const handleSaveKey = async () => {
        try {
            await updateUserApiKey(user.id, apiKey.trim());
            alert("Chiave API salvata con successo! Verrà usata per le tue registrazioni.");
            onReload();
        } catch(e) {
            alert("Errore nel salvataggio della chiave.");
        }
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmNewPassword) return;
        
        if (newPassword !== confirmNewPassword) {
            alert("Le nuove password non coincidono.");
            return;
        }

        try {
            await changeUserPassword(oldPassword, newPassword);
            alert("Password cambiata con successo!");
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (e: any) {
            alert("Errore cambio password: " + e.message);
        }
    }

    const handleCleanup = async () => {
        if (!confirm(`Sei sicuro di voler eliminare le registrazioni audio più vecchie di ${cleanupDays} giorni? Questa azione è irreversibile.`)) return;
        try {
            const res = await cleanupAudioFiles(cleanupDays);
            setCleanupStatus(res.message);
        } catch (e) {
            setCleanupStatus("Errore durante la pulizia.");
        }
    };

    const handleSaveSmtp = async () => {
        try {
            await saveSmtpSettings(smtpSettings);
            alert("Impostazioni SMTP salvate.");
        } catch(e) {
            alert("Errore salvataggio SMTP.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-100 dark:bg-slate-700 p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-600 flex-shrink-0">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Impostazioni</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                        <i className="fa-solid fa-times text-xl"></i>
                    </button>
                </div>

                {isAdmin && (
                    <div className="flex border-b border-slate-200 dark:border-slate-700">
                        <button 
                            onClick={() => setActiveTab('general')}
                            className={`flex-1 py-3 font-medium ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                        >
                            Generale
                        </button>
                        <button 
                            onClick={() => setActiveTab('smtp')}
                            className={`flex-1 py-3 font-medium ${activeTab === 'smtp' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                        >
                            Configurazione Email (SMTP)
                        </button>
                    </div>
                )}
                
                <div className="p-6 space-y-6 overflow-y-auto">
                    
                    {activeTab === 'general' && (
                        <>
                            {/* API Key Section */}
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">La tua Google Gemini API Key</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                                    Necessaria per generare i verbali. 
                                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline ml-1">
                                        Ottieni una chiave gratis.
                                    </a>
                                </p>
                                <div className="flex space-x-2">
                                    <div className="relative flex-1">
                                        <input 
                                            type={showKey ? "text" : "password"} 
                                            value={apiKey}
                                            onChange={(e) => setApiKeyInput(e.target.value)}
                                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 pr-10"
                                            placeholder="Incolla la tua chiave AI..."
                                        />
                                        <button 
                                            onClick={() => setShowKey(!showKey)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <i className={`fa-solid ${showKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                    <button onClick={handleSaveKey} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium">
                                        Salva
                                    </button>
                                </div>
                            </div>

                            <hr className="border-slate-200 dark:border-slate-700" />

                            {/* Password Change Section */}
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Sicurezza Account</h4>
                                <div className="space-y-3">
                                    <input 
                                        type="password" 
                                        value={oldPassword} 
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700"
                                        placeholder="Vecchia Password"
                                    />
                                    <input 
                                        type="password" 
                                        value={newPassword} 
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700"
                                        placeholder="Nuova Password"
                                    />
                                    <input 
                                        type="password" 
                                        value={confirmNewPassword} 
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700"
                                        placeholder="Conferma Nuova Password"
                                    />
                                    <button 
                                        onClick={handleChangePassword} 
                                        disabled={!oldPassword || !newPassword || !confirmNewPassword}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:bg-slate-400"
                                    >
                                        Cambia Password
                                    </button>
                                </div>
                            </div>

                            {(isAdmin || user.role === UserRole.CompanyAdmin) && (
                                <>
                                    <hr className="border-slate-200 dark:border-slate-700" />
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Manutenzione Server (Pulizia Audio)</h4>
                                        <div className="flex items-center space-x-4">
                                            <select 
                                                value={cleanupDays} 
                                                onChange={(e) => setCleanupDays(Number(e.target.value))}
                                                className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700"
                                            >
                                                <option value={30}>Più vecchi di 30 giorni</option>
                                                <option value={60}>Più vecchi di 60 giorni</option>
                                            </select>
                                            <button 
                                                onClick={handleCleanup} 
                                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium flex items-center"
                                            >
                                                <i className="fa-solid fa-trash-can mr-2"></i> Pulisci
                                            </button>
                                        </div>
                                        {cleanupStatus && <p className="text-sm text-green-600 mt-2 font-semibold">{cleanupStatus}</p>}
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {activeTab === 'smtp' && isAdmin && (
                         <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Indirizzo Pubblico Server (URL Base)</label>
                                <input type="text" value={smtpSettings.appBaseUrl} onChange={e => setSmtpSettings({...smtpSettings, appBaseUrl: e.target.value})} className="w-full p-2 border rounded" placeholder="http://192.168.x.x:3006" />
                                <p className="text-xs text-slate-500">Importante: Inserisci l'indirizzo IP o DNS usato per accedere al sito (es. http://192.168.1.10:3006). Serve per generare i link cliccabili nelle email.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">SMTP Host</label>
                                    <input type="text" value={smtpSettings.smtpHost || ''} onChange={e => setSmtpSettings({...smtpSettings, smtpHost: e.target.value})} className="w-full p-2 border rounded" placeholder="smtp.gmail.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">SMTP Port</label>
                                    <input type="number" value={smtpSettings.smtpPort || 587} onChange={e => setSmtpSettings({...smtpSettings, smtpPort: parseInt(e.target.value)})} className="w-full p-2 border rounded" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">SMTP User</label>
                                <input type="text" value={smtpSettings.smtpUser || ''} onChange={e => setSmtpSettings({...smtpSettings, smtpUser: e.target.value})} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">SMTP Password</label>
                                <input type="password" value={smtpSettings.smtpPass || ''} onChange={e => setSmtpSettings({...smtpSettings, smtpPass: e.target.value})} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">From Email</label>
                                <input type="text" value={smtpSettings.smtpFrom || ''} onChange={e => setSmtpSettings({...smtpSettings, smtpFrom: e.target.value})} className="w-full p-2 border rounded" placeholder="noreply@domain.com" />
                            </div>
                            <button onClick={handleSaveSmtp} className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">Salva Configurazione</button>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};
