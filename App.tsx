
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MeetingList } from './components/MeetingList';
import { MeetingDetails } from './components/MeetingDetails';
import { WelcomeScreen } from './components/WelcomeScreen';
import { NewMeetingPage } from './components/NewMeetingPage';
import { RecordingPage } from './components/RecordingPage';
import { LoginPage } from './components/LoginPage';
import { CompanyManagementPage } from './components/CompanyManagementPage';
import { UserManagementPage } from './components/UserManagementPage';
import type { Meeting, User, Verbal, Company } from './types';
import { UserRole } from './types';
import { Spinner } from './components/Spinner';
import { SettingsModal } from './components/SettingsModal';
import { 
    fetchAppData, 
    saveMeetingToBackend, 
    createUserInBackend,
    createCompanyInBackend,
    getAuthToken,
    clearAuthToken,
    completePasswordReset
} from './utils/storageUtils';
import { generateMinutesFromAudio } from './services/geminiService';
import { useLanguage } from './i18n/LanguageContext';

type AppView = 'login' | 'app' | 'resetPassword';
type MainAppView = 'dashboard' | 'newMeeting' | 'recording' | 'administration';

type PendingMeeting = {
  title: string;
  participants: string[];
  visibility: 'company' | 'private';
}

const ResetPasswordScreen: React.FC<{ token: string, onDone: () => void }> = ({ token, onDone }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            alert("Le password non coincidono.");
            return;
        }

        setStatus('loading');
        try {
            await completePasswordReset(token, password);
            setStatus('success');
            setTimeout(onDone, 2000);
        } catch {
            setStatus('error');
        }
    }

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4">
                <div className="bg-white p-8 rounded-xl shadow-xl text-center">
                    <i className="fa-solid fa-check-circle text-green-500 text-5xl mb-4"></i>
                    <h2 className="text-2xl font-bold">Password Aggiornata!</h2>
                    <p>Reindirizzamento al login...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl">
                 <h2 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">Imposta Nuova Password</h2>
                 <form onSubmit={handleSubmit} className="space-y-4">
                     <input type="password" required placeholder="Nuova Password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-3 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                     <input type="password" required placeholder="Conferma Password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full p-3 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                     <button type="submit" disabled={status === 'loading'} className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700">
                         {status === 'loading' ? <Spinner/> : "Salva Password"}
                     </button>
                     {status === 'error' && <p className="text-red-500 text-center">Errore: Link scaduto o invalido.</p>}
                 </form>
            </div>
        </div>
    )
}

const MainApp: React.FC<{
  currentUser: User,
  onLogout: () => void,
  onUserUpdate: (u: User) => void
}> = ({ currentUser, onLogout, onUserUpdate }) => {
  const { language } = useLanguage();
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [view, setView] = useState<MainAppView>('dashboard');
  const [pendingMeeting, setPendingMeeting] = useState<PendingMeeting | null>(null);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [companyUsers, setCompanyUsers] = useState<User[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const refreshData = useCallback(async () => {
    try {
        const data = await fetchAppData();
        const safeMeetings = data.meetings.map(m => ({
            ...m,
            participants: typeof m.participants === 'string' ? JSON.parse(m.participants) : m.participants,
            verbal: typeof m.verbal === 'string' ? JSON.parse(m.verbal as unknown as string) : m.verbal
        }));
        
        setMeetings(prev => JSON.stringify(prev) !== JSON.stringify(safeMeetings) ? safeMeetings : prev);
        setCompany(prev => JSON.stringify(prev) !== JSON.stringify(data.company) ? data.company : prev);
        setCompanyUsers(prev => JSON.stringify(prev) !== JSON.stringify(data.users) ? data.users : prev);
        if (data.companies) setAllCompanies(prev => JSON.stringify(prev) !== JSON.stringify(data.companies) ? data.companies : prev);
        
        const me = data.users.find(u => u.id === currentUser.id);
        if (me && JSON.stringify(me) !== JSON.stringify(currentUser)) {
            onUserUpdate(me);
        }
        
    } catch (error) {
        if ((error as Error).message === 'Unauthorized') onLogout();
    }
  }, [currentUser, onLogout, onUserUpdate]);

  useEffect(() => {
    setIsLoading(true);
    refreshData().finally(() => setIsLoading(false));
  }, [refreshData]);
  
  const handleStartRecording = (title: string, participants: string[], visibility: 'company' | 'private') => {
    setPendingMeeting({ title, participants, visibility });
    setView('recording');
  };

  // BACKGROUND PROCESSING LOGIC
  const processMeetingBackground = async (meeting: Meeting, audioBlob: Blob) => {
      console.log(`Starting background processing for meeting ${meeting.id}`);
      try {
          // 1. Generate Minutes (Heavy Task)
          const verbal = await generateMinutesFromAudio(audioBlob, meeting.participants, language, currentUser.googleApiKey!);
          
          // 2. Update Meeting with Result
          const updatedMeeting = { ...meeting, verbal, status: 'processed' as const };
          await saveMeetingToBackend(updatedMeeting);
          
          console.log(`Background processing complete for ${meeting.id}`);
          
          // 3. Refresh List
          await refreshData();
      } catch (error) {
          console.error(`Background processing failed for ${meeting.id}`, error);
          // Optionally update status to 'error' if you add that state
      }
  };

  const handleAddMeeting = async (newMeeting: Meeting, audioBlob: Blob) => {
      // 1. Save Initial State ('processing') to Backend immediately
      try {
          await saveMeetingToBackend(newMeeting);
          // Update local state immediately to show it in list
          setMeetings(prev => [newMeeting, ...prev]);
          setSelectedMeetingId(newMeeting.id);
          
          // 2. Kick off background processing
          processMeetingBackground(newMeeting, audioBlob);
      } catch(e) {
          alert("Errore salvataggio riunione iniziale.");
      }
  };

  const handleDeleteMeeting = (meetingId: string) => {
      setMeetings(prev => prev.filter(m => m.id !== meetingId));
      if (selectedMeetingId === meetingId) {
          setSelectedMeetingId(null);
      }
  };

  const handleUpdateVerbal = async (meetingId: string, verbal: Verbal) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    const updatedMeeting = { ...meeting, verbal };
    setMeetings(prev => prev.map(m => m.id === meetingId ? updatedMeeting : m));
    try { await saveMeetingToBackend(updatedMeeting); } 
    catch (e) { refreshData(); }
  };

  const handleAddUser = async (email: string, pass: string, role: UserRole, companyId: string) => {
      try {
          const newUser = await createUserInBackend(email, pass, role, companyId);
          await refreshData();
          return newUser;
      } catch (e) {
          alert("Errore creazione utente");
          return null;
      }
  };

  const handleAddCompany = async (name: string, adminEmail: string, adminPass: string, logoUrl: string | null) => {
      try {
          const newCompany = await createCompanyInBackend(name, adminEmail, adminPass, logoUrl);
          await refreshData();
          return newCompany;
      } catch (e) {
          alert("Errore creazione azienda");
          return null;
      }
  };
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-100 dark:bg-slate-900 flex-col">
        <Spinner className="h-12 w-12 border-b-4 border-blue-500 mb-4" />
        <p className="text-slate-500">Caricamento dati dal server...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (view) {
      case 'newMeeting':
        return <NewMeetingPage onStartRecording={handleStartRecording} onCancel={() => setView('dashboard')} />;
      case 'recording':
        if (!pendingMeeting) { setView('newMeeting'); return null; }
        return (
          <RecordingPage
            meetingDetails={pendingMeeting}
            currentUser={currentUser}
            onAddMeeting={handleAddMeeting}
            onUpdateVerbal={() => {}} 
            onSetMeetingStatus={() => {}}
            logUsage={() => {}}
            onCancel={() => setView('dashboard')}
          />
        );
      case 'administration':
        if (currentUser.role === UserRole.GeneralAdmin) {
            return <CompanyManagementPage user={currentUser} companies={allCompanies} addCompanyAndAdmin={handleAddCompany} />;
        }
        if (currentUser.role === UserRole.CompanyAdmin && company) {
             return <UserManagementPage user={currentUser} company={company} companyUsers={companyUsers} addUser={handleAddUser} setCompanyLogo={() => {}} />;
        }
        setView('dashboard');
        return null;
      case 'dashboard':
      default:
        const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);
        return (
           <main className="flex-1 flex overflow-hidden p-4 md:p-6 layout-content-wrapper">
              <div className="layout-meeting-list w-full md:w-1/3 lg:w-1/4 overflow-y-auto pr-4 border-r border-slate-200 dark:border-slate-700">
                <MeetingList 
                    meetings={meetings} 
                    selectedMeetingId={selectedMeetingId} 
                    onSelectMeeting={setSelectedMeetingId} 
                    currentUserId={currentUser.id}
                />
              </div>
              <div className="flex-1 overflow-y-auto pl-4 md:pl-6 layout-meeting-details">
                {selectedMeeting ? (
                  <MeetingDetails 
                    key={selectedMeeting.id} 
                    meeting={selectedMeeting} 
                    onUpdateVerbal={handleUpdateVerbal} 
                    company={company || {id:'local', name:'Local', logoUrl:null}} 
                    currentUser={currentUser}
                    onDelete={handleDeleteMeeting}
                  />
                ) : (
                  <WelcomeScreen onNewMeeting={() => setView('newMeeting')} />
                )}
              </div>
            </main>
        );
    }
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans layout-root">
      <div className="layout-sidebar">
        <Sidebar currentUser={currentUser} currentView={view} onNavigate={(v) => setView(v as MainAppView)} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden layout-main">
        <div className="layout-header">
            <Header user={currentUser} company={company} onLogout={onLogout} onOpenSettings={() => setIsSettingsOpen(true)} />
        </div>
        {renderContent()}
      </div>
      {isSettingsOpen && (
          <SettingsModal onClose={() => setIsSettingsOpen(false)} onReload={() => { refreshData(); setIsSettingsOpen(false); }} user={currentUser} />
      )}
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appView, setAppView] = useState<AppView>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
     const params = new URLSearchParams(window.location.search);
     const token = params.get('resetToken');
     if (token) {
         setResetToken(token);
         setAppView('resetPassword');
     } else if (getAuthToken()) {
         setAppView('login');
     }
  }, []);
  
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setAppView('app');
  };
  
  const handleLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
    setAppView('login');
  };
  
  switch (appView) {
    case 'resetPassword':
        return <ResetPasswordScreen token={resetToken!} onDone={() => { window.history.replaceState(null, '', '/'); setAppView('login'); }} />;
    case 'login':
      return <LoginPage onLogin={handleLogin} onBackToWebsite={() => {}} />; 
    case 'app':
      if (currentUser) return <MainApp currentUser={currentUser} onLogout={handleLogout} onUserUpdate={setCurrentUser} />;
      return <LoginPage onLogin={handleLogin} onBackToWebsite={() => {}} />;
    default:
      return <LoginPage onLogin={handleLogin} onBackToWebsite={() => {}} />;
  }
}
