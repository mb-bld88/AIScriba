
import React, { useState, useRef, useEffect } from 'react';
import type { Meeting, User, Verbal, MeetingStatus } from '../types';
import { Spinner } from './Spinner';
import { useLanguage } from '../i18n/LanguageContext';
import { WaveformVisualizer } from './WaveformVisualizer';

interface RecordingPageProps {
  onCancel: () => void;
  onAddMeeting: (meeting: Meeting, audioBlob: Blob) => void;
  onUpdateVerbal: (meetingId: string, verbal: Verbal) => void;
  onSetMeetingStatus: (meetingId: string, status: MeetingStatus) => void;
  logUsage: (userId: string, durationSeconds: number) => void;
  currentUser: User;
  meetingDetails: {
    title: string;
    participants: string[];
    visibility: 'company' | 'private';
  }
}

const AudioRecorder: React.FC<{
    onRecordingComplete: (blob: Blob, url: string) => void;
    onRecordAgain: () => void;
    audioUrl: string | null;
    meetingType: 'in-person' | 'browser-tab';
    onError: (message: string | null) => void;
    isReadyToRecord: boolean;
}> = ({ onRecordingComplete, onRecordAgain, audioUrl, meetingType, onError, isReadyToRecord }) => {
    const { t } = useLanguage();
    const [status, setStatus] = useState<'setup' | 'testing' | 'ready' | 'recording' | 'finished'>('setup');
    const [timer, setTimer] = useState(0);
    const [userStream, setUserStream] = useState<MediaStream | null>(null);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<number | null>(null);
    const displayStreamRef = useRef<MediaStream | null>(null);
    const tempMixerContextRef = useRef<AudioContext | null>(null);

    const cleanupDisplayStream = () => {
        if (displayStreamRef.current) {
            displayStreamRef.current.getTracks().forEach(track => track.stop());
            displayStreamRef.current = null;
        }
    };
    
    const handleSetup = async () => {
        onError(null);
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
             onError("ATTENZIONE: Il browser blocca il microfono su siti non sicuri (HTTP). Abilita il flag 'Insecure origins treated as secure' nel browser per questo IP.");
        }

        if (userStream) { setStatus('ready'); return; }
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setUserStream(stream);
            setStatus('testing');
        } catch (err) {
            onError(t('micPermissionsError'));
            setStatus('setup');
        }
    };

    const startRecording = async () => {
        try {
            onRecordAgain();
            onError(null);
            if (!userStream) throw new Error("Microphone stream not initialized.");

            let finalStreamForRecorder: MediaStream;

            if (meetingType === 'browser-tab') {
                try {
                    const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
                        video: true, 
                        audio: {
                            echoCancellation: false,
                            noiseSuppression: false,
                            autoGainControl: false,
                        },
                        // @ts-ignore - Property exists in modern browsers
                        systemAudio: 'include', 
                        selfBrowserSurface: 'include'
                    } as any);
                    
                    displayStreamRef.current = displayStream;

                    const audioTracks = displayStream.getAudioTracks();
                    if (audioTracks.length === 0) {
                        cleanupDisplayStream();
                        alert("⚠️ ERRORE AUDIO MANCANTE ⚠️\n\nHai selezionato il video ma NON l'audio.\n\nPer registrare Teams/Zoom devi:\n1. Selezionare 'Schermo Intero' (non Finestra)\n2. Spuntare la casellina 'Condividi audio di sistema' in basso a sinistra.");
                        return;
                    }
                    
                    const tempMixerContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    tempMixerContextRef.current = tempMixerContext;
                    const destination = tempMixerContext.createMediaStreamDestination();

                    if (audioTracks.length > 0) {
                      const displaySource = tempMixerContext.createMediaStreamSource(displayStream);
                      displaySource.connect(destination);
                    }

                    const userSource = tempMixerContext.createMediaStreamSource(userStream);
                    userSource.connect(destination);
                    
                    // IMPORTANT: We use the destination stream which is AUDIO ONLY.
                    // This strips the video track, drastically reducing file size.
                    finalStreamForRecorder = destination.stream;
                    
                    // Stop recording if user stops sharing screen
                    const videoTrack = displayStream.getVideoTracks()[0];
                    if (videoTrack) {
                        videoTrack.onended = () => stopRecording();
                    }
                } catch (err) {
                    console.log("Selection cancelled", err);
                    return;
                }

            } else {
                finalStreamForRecorder = userStream;
            }
            
            // CRITICAL: Set bitrate to 20kbps (20000 bps).
            // This allows ~1 hour of audio to be < 10MB, fitting within Google's 20MB limit.
            mediaRecorderRef.current = new MediaRecorder(finalStreamForRecorder, { 
                mimeType: 'audio/webm', 
                audioBitsPerSecond: 20000 
            });
            audioChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = event => audioChunksRef.current.push(event.data);
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                onRecordingComplete(audioBlob, url);
                setStatus('finished');
                cleanupDisplayStream();
            };
            
            mediaRecorderRef.current.start();
            setStatus('recording');
            setTimer(0);
            timerIntervalRef.current = window.setInterval(() => setTimer(prev => prev + 1), 1000);

        } catch (err) {
            cleanupDisplayStream();
            setStatus('ready');
            console.error(err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && status === 'recording') {
            mediaRecorderRef.current.stop();
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            cleanupDisplayStream();
            if (tempMixerContextRef.current && tempMixerContextRef.current.state !== 'closed') {
                tempMixerContextRef.current.close().catch(console.error);
                tempMixerContextRef.current = null;
            }
        }
    };

    const handleRecordAgainClick = () => {
        onRecordAgain();
        setStatus('ready');
    };
    
    useEffect(() => {
      return () => { if (userStream) userStream.getTracks().forEach(track => track.stop()); }
    }, [userStream]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    return (
      <div className="w-full bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
          {status === 'setup' && (
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg h-48">
                  <i className="fa-solid fa-microphone text-4xl text-slate-400 mb-4"></i>
                  <button onClick={handleSetup} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg">{t('setupAndTestMic')}</button>
              </div>
          )}
          {status === 'testing' && (
              <div className="flex flex-col items-center justify-center h-48">
                  <h4 className="font-semibold text-lg mb-2">{t('testingMic')}</h4>
                  <WaveformVisualizer stream={userStream} />
                  <button onClick={() => setStatus('ready')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">{t('micLooksGood')}</button>
              </div>
          )}
          {status === 'ready' && (
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg h-auto min-h-[12rem]">
                  <i className="fa-solid fa-microphone text-4xl text-slate-400 mb-4"></i>
                  <p className="text-slate-500 dark:text-slate-400 mb-4 text-lg">{t('readyToRecord')}</p>
                  
                  {meetingType === 'browser-tab' && (
                      <div className="mb-4 bg-amber-50 text-amber-900 p-4 rounded text-sm border border-amber-200 text-left w-full">
                          <strong className="flex items-center gap-2 mb-2"><i className="fa-solid fa-triangle-exclamation"></i> ISTRUZIONI IMPORTANTI:</strong>
                          <ul className="list-disc pl-5 space-y-1">
                              <li>Se usi l'<strong>App Desktop di Teams</strong>: Devi selezionare <strong>"Schermo Intero"</strong> e attivare <strong>"Condividi audio di sistema"</strong>. (La condivisione "Finestra" NON trasmette l'audio).</li>
                              <li>Se usi <strong>Teams Web</strong>: Seleziona la tab del browser.</li>
                          </ul>
                      </div>
                  )}

                  <button 
                    onClick={startRecording}
                    disabled={!isReadyToRecord}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                   >
                     {t('startRecording')}
                   </button>
              </div>
          )}
          {status === 'recording' && (
               <div className="flex flex-col items-center justify-center h-48">
                  <div className="flex items-center text-red-500 animate-pulse mb-2">
                      <i className="fa-solid fa-microphone-lines mr-3 text-2xl"></i>
                      <span className="text-2xl font-mono">{formatTime(timer)}</span>
                  </div>
                  <WaveformVisualizer stream={userStream} />
                  <button onClick={stopRecording} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg">{t('stopRecording')}</button>
               </div>
          )}
          {status === 'finished' && audioUrl && (
              <div className="space-y-4 h-48 flex flex-col justify-center">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-center">{t('audioPreview')}</h4>
                  <audio controls src={audioUrl} className="w-full"></audio>
                  <div className="flex items-center justify-center space-x-4 pt-2">
                      <button onClick={handleRecordAgainClick} className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-lg flex items-center transition-colors">
                          <i className="fa-solid fa-arrow-rotate-left mr-2"></i> {t('recordAgain')}
                      </button>
                      <a href={audioUrl} download={`recording-${new Date().toISOString()}.webm`} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg flex items-center transition-colors">
                          <i className="fa-solid fa-download mr-2"></i> {t('downloadAudio')}
                      </a>
                  </div>
              </div>
          )}
      </div>
    );
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const RecordingPage: React.FC<RecordingPageProps> = ({ onCancel, onAddMeeting, logUsage, currentUser, meetingDetails }) => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState(false);
  const { t } = useLanguage();
  const [meetingType, setMeetingType] = useState<'in-person' | 'browser-tab'>('in-person');
  
  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onloadedmetadata = () => { setDuration(audio.duration); };
    } else {
      setDuration(0);
    }
  }, [audioUrl]);

  const handleRecordingComplete = (blob: Blob, url: string) => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioBlob(blob);
      setAudioUrl(url);
  }

  const handleRecordAgain = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setError(null);
  }

  const handleSubmit = async () => {
    if (!audioBlob) { setError(t("errorNoAudio")); return; }
    
    if (!currentUser.googleApiKey) {
        setError("Chiave API mancante. Vai nelle Impostazioni e inserisci la tua Google Gemini API Key personale.");
        return;
    }

    // Check companyId safely
    if (!currentUser.companyId && currentUser.role !== 'GeneralAdmin') { 
        setError("Errore interno: Utente senza azienda."); 
        return; 
    }
    
    setIsLoading(true);
    
    // Background Processing Logic:
    try {
        const base64Audio = await blobToBase64(audioBlob);

        const newMeeting: Meeting = {
            id: `meeting-${Date.now()}`,
            title: meetingDetails.title,
            participants: meetingDetails.participants,
            date: new Date().toISOString().split('T')[0],
            verbal: null,
            status: 'processing',
            audioUrl: base64Audio,
            companyId: currentUser.companyId || 'company-1', // Fallback for GeneralAdmin
            creatorId: currentUser.id,
            visibility: meetingDetails.visibility
        };
        
        onAddMeeting(newMeeting, audioBlob);
        logUsage(currentUser.id, Math.ceil(duration));
        onCancel();

    } catch (err: any) {
        setIsLoading(false);
        setError(err.message || t('unexpectedError'));
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8">
        <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t('recordingScreenTitle')}</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">{t('recordingFor')}: <span className="font-semibold">{meetingDetails.title}</span></p>
            </div>
            <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                <i className="fa-solid fa-arrow-left mr-2"></i> {t('backToSetup')}
            </button>
        </div>

        <div className="space-y-6">
          <div className="mb-2">
              <label className="font-semibold block mb-2 text-slate-700 dark:text-slate-300">{t('meetingType')}</label>
              <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                  <button onClick={() => setMeetingType('in-person')} className={`flex-1 text-center px-4 py-2 rounded-md transition-all duration-300 ${meetingType === 'in-person' ? 'bg-white dark:bg-slate-800 shadow font-semibold text-blue-600' : 'text-slate-600 dark:text-slate-300'}`}><i className="fa-solid fa-users mr-2"></i> {t('inPersonMeeting')}</button>
                  <button onClick={() => setMeetingType('browser-tab')} className={`flex-1 text-center px-4 py-2 rounded-md transition-all duration-300 ${meetingType === 'browser-tab' ? 'bg-white dark:bg-slate-800 shadow font-semibold text-blue-600' : 'text-slate-600 dark:text-slate-300'}`}><i className="fa-solid fa-desktop mr-2"></i> {t('recordFromBrowserTab')}</button>
              </div>
              <p className="text-sm text-slate-500 mt-2 px-2">
                  {meetingType === 'in-person' ? t('inPersonMeetingDescription') : t('recordFromBrowserTabDescription')}
              </p>
          </div>
          
           <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 rounded-r-lg">
               <div className="flex items-center">
                   <input id="consent-checkbox" type="checkbox" checked={hasConsent} onChange={(e) => setHasConsent(e.target.checked)} className="h-5 w-5 rounded border-slate-300 dark:border-slate-500 bg-slate-50 dark:bg-slate-700 text-blue-600 focus:ring-blue-500" />
                   <label htmlFor="consent-checkbox" className="ml-3 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('recordingConsent')}</label>
               </div>
           </div>

          <AudioRecorder meetingType={meetingType} onRecordingComplete={handleRecordingComplete} onRecordAgain={handleRecordAgain} audioUrl={audioUrl} onError={setError} isReadyToRecord={hasConsent} />
        </div>
        {error && <p className="text-red-500 text-sm mt-4 text-center font-bold bg-red-100 p-2 rounded">{error}</p>}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex justify-end items-center">
            <button onClick={handleSubmit} disabled={isLoading || !audioBlob} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 text-lg w-full justify-center">
              {isLoading ? <Spinner /> : <><i className="fa-solid fa-clock mr-2"></i> Avvia Elaborazione in Background</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
