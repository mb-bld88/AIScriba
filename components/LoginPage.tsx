
import React, { useState } from 'react';
import type { User } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { loginUser, requestPasswordReset } from '../utils/storageUtils';
import { Spinner } from './Spinner';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onBackToWebsite: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBackToWebsite }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Forgot Password State
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);
      
      try {
          const user = await loginUser(email.trim(), password.trim());
          onLogin(user);
      } catch (err) {
          setError(t('invalidCredentials'));
      } finally {
          setIsLoading(false);
      }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setResetStatus('loading');
      try {
          await requestPasswordReset(resetEmail.trim());
          setResetStatus('success');
      } catch (e) {
          setResetStatus('error');
      }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-xl shadow-2xl relative">
        <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg mb-4 -rotate-12">
                <i className="fa-solid fa-feather-pointed text-white text-4xl"></i>
            </div>
            <h2 className="text-3xl font-extrabold text-center text-slate-900 dark:text-white">{t('welcomeToAIScriba')}</h2>
            <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">{t('loginToContinue')}</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
                <div>
                <label htmlFor="email-address" className="sr-only">{t('email')}</label>
                <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 dark:border-slate-600 placeholder-slate-500 text-slate-900 dark:text-white dark:bg-slate-700 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder={t('email')}
                />
                </div>
                <div>
                <label htmlFor="password" className="sr-only">{t('password')}</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 dark:border-slate-600 placeholder-slate-500 text-slate-900 dark:text-white dark:bg-slate-700 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder={t('password')}
                />
                </div>
            </div>

            {error && <div className="text-red-500 text-sm text-center font-semibold">{error}</div>}

            <div>
                <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-wait transition-transform hover:scale-[1.02]"
                >
                {isLoading ? <Spinner /> : t('login')}
                </button>
            </div>
            
            <div className="text-sm text-center">
                <button type="button" onClick={() => setShowForgot(true)} className="font-medium text-blue-600 hover:text-blue-500">
                    Password dimenticata?
                </button>
            </div>
        </form>

        {/* Forgot Password Modal */}
        {showForgot && (
            <div className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl p-8 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-2xl font-bold mb-4">Recupero Password</h3>
                {resetStatus === 'success' ? (
                    <div className="text-center">
                        <i className="fa-solid fa-check-circle text-green-500 text-5xl mb-4"></i>
                        <p className="text-lg">Se l'email esiste, riceverai un link per resettare la password.</p>
                        <button onClick={() => setShowForgot(false)} className="mt-6 text-blue-600 underline">Torna al Login</button>
                    </div>
                ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <p className="text-slate-600 dark:text-slate-300 text-sm">Inserisci la tua email. Ti invieremo un link per creare una nuova password.</p>
                        <input
                            type="email"
                            required
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700"
                            placeholder="tua@email.com"
                        />
                         <button
                            type="submit"
                            disabled={resetStatus === 'loading'}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md"
                        >
                            {resetStatus === 'loading' ? <Spinner /> : "Invia Link di Reset"}
                        </button>
                        <button type="button" onClick={() => setShowForgot(false)} className="w-full text-slate-500 text-sm hover:underline">Annulla</button>
                    </form>
                )}
            </div>
        )}

      </div>
    </div>
  );
};
