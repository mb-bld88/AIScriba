import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface WebsiteProps {
    onNavigateToLogin: () => void;
    onNavigateToPricing: () => void;
}

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();
    return (
        <div className="flex items-center space-x-1 bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
            <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${language === 'en' ? 'bg-white dark:bg-slate-800 shadow text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}
            >
                EN
            </button>
            <button
                onClick={() => setLanguage('it')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${language === 'it' ? 'bg-white dark:bg-slate-800 shadow text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}
            >
                IT
            </button>
        </div>
    );
};

const FeatureCard: React.FC<{ icon: string, title: string, description: string }> = ({ icon, title, description }) => (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 h-full">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
            <i className={`fa-solid ${icon} text-white text-2xl`}></i>
        </div>
        <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400">{description}</p>
    </div>
);

const StepCard: React.FC<{ number: string, title: string, description: string }> = ({ number, title, description }) => (
    <div className="relative pl-10">
         <div className="absolute left-0 top-0 w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">{number.charAt(0)}</div>
        <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400">{description}</p>
    </div>
);

export const Website: React.FC<WebsiteProps> = ({ onNavigateToLogin, onNavigateToPricing }) => {
    const { t } = useLanguage();

    return (
        <div className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-screen">
            {/* Header */}
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                         <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <i className="fa-solid fa-feather-pointed text-white text-xl"></i>
                        </div>
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">AIScriba</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <LanguageSwitcher />
                        <button onClick={onNavigateToPricing} className="font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {t('pricing')}
                        </button>
                        <button onClick={onNavigateToLogin} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg">
                            {t('login')}
                        </button>
                    </div>
                </nav>
            </header>

            <main>
                {/* Hero Section */}
                <section className="py-20 md:py-32 text-center">
                    <div className="container mx-auto px-6">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">{t('siteTitle')}</h1>
                        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-8">{t('siteSubtitle')}</p>
                        <button onClick={onNavigateToLogin} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-lg transition-transform duration-200 hover:scale-105 shadow-lg">
                            {t('getStarted')}
                        </button>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 bg-white dark:bg-slate-800/50">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">{t('featuresTitle')}</h2>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <FeatureCard icon="fa-microphone-lines" title={t('feature1Title')} description={t('feature1Desc')} />
                            <FeatureCard icon="fa-wand-magic-sparkles" title={t('feature2Title')} description={t('feature2Desc')} />
                            <FeatureCard icon="fa-file-pen" title={t('feature3Title')} description={t('feature3Desc')} />
                            <FeatureCard icon="fa-users-gear" title={t('feature4Title')} description={t('feature4Desc')} />
                        </div>
                    </div>
                </section>
                
                {/* How It Works Section */}
                <section id="how-it-works" className="py-20">
                    <div className="container mx-auto px-6">
                         <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">{t('howItWorksTitle')}</h2>
                        </div>
                        <div className="max-w-3xl mx-auto">
                            <div className="space-y-12">
                                <StepCard number={t('step1')} title={t('step1')} description={t('step1Desc')} />
                                <StepCard number={t('step2')} title={t('step2')} description={t('step2Desc')} />
                                <StepCard number={t('step3')} title={t('step3')} description={t('step3Desc')} />
                            </div>
                        </div>
                    </div>
                </section>

                 {/* Security Section */}
                <section id="security" className="py-20 bg-white dark:bg-slate-800/50">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">{t('securityTitle')}</h2>
                             <p className="text-lg text-slate-600 dark:text-slate-400 mt-2 max-w-2xl mx-auto">{t('securitySubtitle')}</p>
                        </div>
                        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            <FeatureCard icon="fa-shield-halved" title={t('securityGdprTitle')} description={t('securityGdprDesc')} />
                            <FeatureCard icon="fa-user-secret" title={t('securityConfidentialityTitle')} description={t('securityConfidentialityDesc')} />
                            <FeatureCard icon="fa-lock" title={t('securityEncryptionTitle')} description={t('securityEncryptionDesc')} />
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-200 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 py-8">
                <div className="container mx-auto px-6 text-center text-slate-600 dark:text-slate-400">
                    <p>&copy; {new Date().getFullYear()} AIScriba. {t('allRightsReserved')}</p>
                </div>
            </footer>
        </div>
    );
};