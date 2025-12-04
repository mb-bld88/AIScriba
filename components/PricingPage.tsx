
import React, { useState, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface PricingPageProps {
    onNavigateToLogin: () => void;
    onBackToWebsite: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigateToLogin, onBackToWebsite }) => {
    const { t } = useLanguage();
    const [recordings, setRecordings] = useState(1);

    const price = useMemo(() => {
        if (recordings === 50) {
            return '349.99';
        }
        // A simple pricing curve with a progressive discount.
        // It's based on a per-recording price that decreases as the number of recordings increases.
        const basePricePerRec = 9.99;
        const discountFactor = 0.97; // a 3% discount for each additional recording
        let totalPrice = 0;
        for (let i = 0; i < recordings; i++) {
            totalPrice += basePricePerRec * Math.pow(discountFactor, i);
        }
        
        // Ensure price ends in .99
        let calculatedPrice = Math.floor(totalPrice);
        if (totalPrice > calculatedPrice) {
            return `${calculatedPrice}.99`;
        }
        return `${totalPrice.toFixed(2)}`;

    }, [recordings]);

    const features = [
        "unlimitedUsers",
        "monthlyRecordingHoursPerUser",
        "aiTranscriptionSummary",
        "pdfZipExport",
        "userLogoManagement",
        "securityAndCompliance"
    ];

    return (
        <div className="bg-slate-100 dark:bg-slate-900 min-h-screen">
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <button onClick={onBackToWebsite} className="flex items-center space-x-2">
                         <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <i className="fa-solid fa-feather-pointed text-white text-xl"></i>
                        </div>
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">AIScriba</span>
                    </button>
                    <div>
                        <button onClick={onNavigateToLogin} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg">
                            {t('login')}
                        </button>
                    </div>
                </nav>
            </header>

            <main className="py-20">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">{t('pricingTitle')}</h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400">{t('pricingSubtitle')}</p>
                    </div>

                    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border-2 border-blue-500">
                        {/* Calculator */}
                        <div className="flex flex-col justify-center">
                            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">{t('selectRecordings')}</h3>
                            <div className="bg-slate-100 dark:bg-slate-700 p-6 rounded-lg text-center">
                                 <div className="text-5xl font-extrabold text-blue-600 dark:text-blue-400">{recordings}</div>
                                 <p className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-6">{t('simultaneousRecordings')}</p>
                                 <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={recordings}
                                    onChange={(e) => setRecordings(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>
                             <div className="text-center my-8">
                                <span className="text-5xl font-extrabold text-slate-900 dark:text-white">{`€${price}`}</span>
                                <span className="text-lg text-slate-500 dark:text-slate-400">{t('perMonth')}</span>
                            </div>
                            <button
                                onClick={onNavigateToLogin}
                                className='w-full font-bold py-4 px-6 rounded-lg transition-colors text-lg bg-blue-600 hover:bg-blue-700 text-white'
                            >
                                {t('choosePlan')}
                            </button>
                        </div>

                        {/* Features */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg">
                            <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-200">{t('allFeaturesIncluded')}</h3>
                             <ul className="space-y-4 text-slate-600 dark:text-slate-300">
                                {features.map((feature, index) => (
                                     <li key={index} className="flex items-start">
                                        <i className="fa-solid fa-check text-green-500 mr-3 mt-1"></i>
                                        <span>{t(feature)}</span>
                                    </li>

                                ))}
                            </ul>
                            <div className="mt-8 pt-8 border-t border-blue-200 dark:border-blue-800 text-center">
                                <p className="font-semibold text-slate-700 dark:text-slate-200">{t('contactSalesPrompt')}</p>
                                <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
                                    {t('contactSales')}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
             <button onClick={onBackToWebsite} className="block w-fit mx-auto mt-6 mb-12 text-sm text-slate-600 dark:text-slate-400 hover:underline">
                <i className="fa-solid fa-arrow-left mr-2"></i>{t('backToWebsite')}
            </button>
        </div>
    );
};