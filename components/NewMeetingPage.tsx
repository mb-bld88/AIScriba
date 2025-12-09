import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface NewMeetingPageProps {
  onCancel: () => void;
  onStartRecording: (title: string, participants: string[], visibility: 'company' | 'private') => void;
}

export const NewMeetingPage: React.FC<NewMeetingPageProps> = ({ onCancel, onStartRecording }) => {
  const [title, setTitle] = useState('');
  const [participantList, setParticipantList] = useState<string[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState('');
  const [visibility, setVisibility] = useState<'company' | 'private'>('private');
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleAddParticipant = () => {
    if (currentParticipant.trim()) {
      setParticipantList([...participantList, currentParticipant.trim()]);
      setCurrentParticipant('');
    }
  };

  const handleRemoveParticipant = (indexToRemove: number) => {
    setParticipantList(participantList.filter((_, index) => index !== indexToRemove));
  };

  const handleParticipantKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          handleAddParticipant();
      }
  };
  
  const handleProceed = () => {
    if (!title || participantList.length === 0) {
      setError(t("errorAllFields"));
      return;
    }
    setError(null);
    onStartRecording(title, participantList, visibility);
  };
  
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t('newMeeting')}</h2>
            <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                <i className="fa-solid fa-times fa-lg"></i>
            </button>
        </div>
        <div className="space-y-6">
          <div>
            <label className="font-semibold block mb-2 text-slate-700 dark:text-slate-300">{t('meetingTitle')}</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 transition" 
              placeholder={t('meetingTitle')}
            />
          </div>
          
          <div>
            <label className="font-semibold block mb-2 text-slate-700 dark:text-slate-300">Visibilità</label>
            <select
                value={visibility}
                onChange={e => setVisibility(e.target.value as 'company' | 'private')}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 transition"
            >
                <option value="company">Pubblica (Visibile a tutta l'azienda)</option>
                <option value="private">Privata (Visibile solo a me)</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
                {visibility === 'company' 
                    ? "Tutti gli utenti dell'azienda potranno vedere e leggere questo verbale." 
                    : "Solo tu e gli amministratori potrete vedere questo verbale."}
            </p>
          </div>

          <div>
            <label className="font-semibold block mb-2 text-slate-700 dark:text-slate-300">{t('participantsLabel')}</label>
            <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  value={currentParticipant} 
                  onChange={e => setCurrentParticipant(e.target.value)}
                  onKeyDown={handleParticipantKeyDown}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 transition"
                  placeholder={t('addParticipantPlaceholder')}
                />
                <button
                    onClick={handleAddParticipant}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 w-12 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                    aria-label={t('addParticipantAriaLabel')}
                >
                    <i className="fa-solid fa-plus"></i>
                </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 min-h-[2.5rem]">
                {participantList.map((participant, index) => (
                <div key={index} className="bg-slate-200 dark:bg-slate-600 rounded-full px-3 py-1 flex items-center text-sm font-medium animate-in fade-in zoom-in-95 duration-200">
                    <span>{participant}</span>
                    <button onClick={() => handleRemoveParticipant(index)} className="ml-2 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 transition-colors" aria-label={`Remove ${participant}`}>
                    <i className="fa-solid fa-times fa-xs"></i>
                    </button>
                </div>
                ))}
            </div>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        <div className="flex justify-end items-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onCancel} className="text-slate-600 dark:text-slate-300 font-bold py-2 px-5 rounded-lg mr-4 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">{t('cancel')}</button>
          <button
            onClick={handleProceed}
            disabled={!title || participantList.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-300"
          >
            <i className="fa-solid fa-microphone-lines mr-2"></i>{t('goToRecording')}
          </button>
        </div>
      </div>
    </div>
  );
};