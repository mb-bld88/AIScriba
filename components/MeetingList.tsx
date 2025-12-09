
import React, { useState, useMemo } from 'react';
import type { Meeting } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { Spinner } from './Spinner';

interface MeetingListProps {
  meetings: Meeting[];
  selectedMeetingId: string | null;
  onSelectMeeting: (id: string) => void;
  currentUserId?: string;
}

const MeetingCard: React.FC<{ meeting: Meeting; isSelected: boolean; onSelect: () => void; }> = ({ meeting, isSelected, onSelect }) => {
  const { t } = useLanguage();
  const cardClasses = `p-4 rounded-lg border-2 mb-3 cursor-pointer transition-all duration-200 ${
    isSelected
      ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-500 shadow-md'
      : 'bg-white dark:bg-slate-800 border-transparent hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-sm'
  }`;
  
  const renderStatus = () => {
    if (meeting.status === 'processing') {
        return (
            <span className="flex items-center text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full animate-pulse">
                <Spinner className="h-3 w-3 border-b-2 border-blue-600 dark:border-blue-400 mr-1.5" />
                {t('processing')}
            </span>
        );
    }
    return null;
  };

  return (
    <div className={cardClasses} onClick={onSelect}>
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-md text-slate-800 dark:text-slate-100 truncate pr-2">{meeting.title}</h3>
        {renderStatus()}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{meeting.date}</p>
      <div className="flex items-center mt-3 text-xs text-slate-600 dark:text-slate-300">
        <i className="fa-solid fa-users mr-2"></i>
        <span className="truncate">{meeting.participants.join(', ')}</span>
      </div>
    </div>
  );
};

export const MeetingList: React.FC<MeetingListProps> = ({ meetings, selectedMeetingId, onSelectMeeting, currentUserId }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const { myMeetings, sharedWithMe, companyMeetings } = useMemo(() => {
    // 1. Filter by search/date
    const filtered = meetings.filter(meeting => {
      const matchSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase());
      let matchDate = true;
      if (startDate && endDate) {
          matchDate = meeting.date >= startDate && meeting.date <= endDate;
      } else if (startDate) {
          matchDate = meeting.date >= startDate;
      } else if (endDate) {
          matchDate = meeting.date <= endDate;
      }
      return matchSearch && matchDate;
    });

    // 2. Group by type
    const my: Meeting[] = [];
    const shared: Meeting[] = [];
    const company: Meeting[] = [];

    if (!currentUserId) return { myMeetings: filtered, sharedWithMe: [], companyMeetings: [] };

    filtered.forEach(m => {
        if (m.creatorId === currentUserId) {
            my.push(m);
        } else if (m.sharedWith?.some(u => u.id === currentUserId)) {
            shared.push(m);
        } else {
            company.push(m);
        }
    });

    return { myMeetings: my, sharedWithMe: shared, companyMeetings: company };
  }, [meetings, searchTerm, startDate, endDate, currentUserId]);

  return (
    <div>
      <div className="px-2 mb-4">
        <h2 className="text-2xl font-bold mb-4">{t('meetings')}</h2>
        
        <div className="space-y-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder={t('searchMeetings')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('filterByDate')}</label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"
              />
              <span className="text-slate-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"
              />
            </div>
          </div>
           <button 
             onClick={handleClearFilters}
             className="w-full text-sm text-center text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t('clearFilters')}
            </button>
        </div>
      </div>
      
      <div className="space-y-6">
        
        {/* My Meetings */}
        {myMeetings.length > 0 && (
            <div>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Le Mie Riunioni</h3>
                 {myMeetings.map(meeting => (
                    <MeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        isSelected={meeting.id === selectedMeetingId}
                        onSelect={() => onSelectMeeting(meeting.id)}
                    />
                 ))}
            </div>
        )}

        {/* Shared With Me */}
        {sharedWithMe.length > 0 && (
            <div>
                 <h3 className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-2 px-2 flex items-center">
                    <i className="fa-solid fa-share-nodes mr-1"></i> Condivise con te
                 </h3>
                 {sharedWithMe.map(meeting => (
                    <MeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        isSelected={meeting.id === selectedMeetingId}
                        onSelect={() => onSelectMeeting(meeting.id)}
                    />
                 ))}
            </div>
        )}

        {/* Company Wide */}
        {companyMeetings.length > 0 && (
            <div>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Aziendali (Pubbliche)</h3>
                 {companyMeetings.map(meeting => (
                    <MeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        isSelected={meeting.id === selectedMeetingId}
                        onSelect={() => onSelectMeeting(meeting.id)}
                    />
                 ))}
            </div>
        )}

        {myMeetings.length === 0 && sharedWithMe.length === 0 && companyMeetings.length === 0 && (
          <div className="text-center py-10 px-4">
              <p className="text-slate-500 dark:text-slate-400">{t('noMeetingsFound')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
