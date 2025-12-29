
import React, { useState, useEffect, useRef } from 'react';
import type { Meeting, Verbal, Company, User } from '../types';
import { refineMinutes, generateFlowchartFromText } from '../services/geminiService';
import { deleteMeeting, shareMeeting } from '../utils/storageUtils';
import { Spinner } from './Spinner';
import { useLanguage } from '../i18n/LanguageContext';
import JSZip from 'jszip';
import mermaid from 'mermaid';

interface MeetingDetailsProps {
    meeting: Meeting;
    onUpdateVerbal: (meetingId: string, verbal: Verbal) => void;
    company: Company;
    currentUser: User;
    onDelete: (meetingId: string) => void;
    onRetry?: (meeting: Meeting) => void;
}

const EditableSection: React.FC<{ 
    title: string; 
    icon: string; 
    content: string; 
    onSave?: (newContent: string) => void; // Optional if readOnly
    isVisibleInPrint: boolean;
    readOnly?: boolean;
}> = ({ title, icon, content, onSave, isVisibleInPrint, readOnly = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(content);

    useEffect(() => {
        setValue(content);
    }, [content]);

    const handleSave = () => {
        if (onSave) onSave(value);
        setIsEditing(false);
    };

    return (
        <div className={`bg-white dark:bg-slate-800/50 rounded-xl shadow-sm p-6 mb-6 print:p-0 print:shadow-none print:mb-8 print:break-inside-avoid ${!isVisibleInPrint ? 'print:hidden' : ''}`}>
            <div className="flex items-center justify-between mb-4 print:mb-2 border-b print:border-black pb-2">
                <div className="flex items-center">
                    <i className={`fa-solid ${icon} text-xl text-blue-500 mr-4 print:hidden`}></i>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 print:text-black print:text-lg uppercase">{title}</h3>
                </div>
                {!readOnly && (
                    <button onClick={() => setIsEditing(!isEditing)} className="text-slate-400 hover:text-blue-500 print:hidden transition-colors" title="Modifica Testo">
                        <i className={`fa-solid ${isEditing ? 'fa-times' : 'fa-pen-to-square'}`}></i>
                    </button>
                )}
            </div>
            {isEditing && !readOnly ? (
                <div className="space-y-3">
                    <textarea 
                        className="w-full p-3 border rounded-md dark:bg-slate-700 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        rows={10} 
                        value={value} 
                        onChange={e => setValue(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold shadow-sm">Salva Modifiche</button>
                    </div>
                </div>
            ) : (
                <div className="prose prose-slate dark:prose-invert max-w-none print:prose-none text-justify whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
                    {content || "Nessun contenuto disponibile."}
                </div>
            )}
        </div>
    );
}

export const MeetingDetails: React.FC<MeetingDetailsProps> = ({ meeting, onUpdateVerbal, company, currentUser, onDelete, onRetry }) => {
    const [refinementPrompt, setRefinementPrompt] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [flowchartError, setFlowchartError] = useState(false);
    const { t, language } = useLanguage();
    const mermaidRef = useRef<HTMLDivElement>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareEmail, setShareEmail] = useState('');

    const [printConfig] = useState({
        executiveSummary: true,
        decisions: true,
        actionItems: true,
        flowchart: true,
        discussionSummary: true,
        fullTranscript: true
    });

    useEffect(() => {
        if (meeting.verbal?.flowchart && mermaidRef.current) {
            const renderChart = async () => {
                const container = mermaidRef.current;
                if (!container) return;
                try {
                    const isDarkMode = document.documentElement.classList.contains('dark');
                    mermaid.initialize({ startOnLoad: false, theme: isDarkMode ? 'dark' : 'default', securityLevel: 'loose' });
                    const code = meeting.verbal!.flowchart!;
                    const { svg } = await mermaid.render(`svg-${meeting.id}`, code);
                    container.innerHTML = svg;
                    setFlowchartError(false);
                } catch (e) {
                    console.error("Mermaid error:", e);
                    setFlowchartError(true);
                }
            };
            renderChart();
        }
    }, [meeting.verbal?.flowchart, meeting.id]);

    const handleUpdateSection = (section: keyof Verbal, newValue: string) => {
        if (!meeting.verbal) return;
        const updatedVerbal = { ...meeting.verbal, [section]: newValue };
        onUpdateVerbal(meeting.id, updatedVerbal);
    };

    const handleExportZip = async () => {
        if (!meeting.verbal) return;
        const zip = new JSZip();
        if (meeting.audioUrl) {
            try {
                const response = await fetch(meeting.audioUrl);
                const blob = await response.blob();
                zip.file(`audio_${meeting.id}.webm`, blob);
            } catch (e) {}
        }
        const md = `# ${meeting.title}\n\n## Summary\n${meeting.verbal.executiveSummary}\n\n## Transcript\n${meeting.verbal.fullTranscript}`;
        zip.file('minutes.md', md);
        const content = await zip.generateAsync({type:"blob"});
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${meeting.title.replace(/\s/g, '_')}.zip`;
        a.click();
    };

    const handleRefinement = async () => {
        if (!refinementPrompt.trim() || !meeting.verbal) return;
        setIsRefining(true);
        try {
            const updatedVerbal = await refineMinutes(meeting.verbal, refinementPrompt, language, currentUser.googleApiKey || '');
            onUpdateVerbal(meeting.id, updatedVerbal);
            setRefinementPrompt('');
        } catch (err) { alert("Errore IA"); } finally { setIsRefining(false); }
    };

    if (meeting.status === 'processing' || meeting.status === 'pending') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Spinner className="h-16 w-16 border-b-4 border-blue-500 mb-6" />
                <h3 className="text-xl font-bold">{t('processing')}...</h3>
            </div>
        );
    }

    const { verbal } = meeting;
    if (!verbal) return null;

    return (
        <div className="print:bg-white print:text-black">
            <div className="flex justify-between items-center mb-6 no-print">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{meeting.title}</h2>
                    <p className="text-slate-500">{meeting.date}</p>
                </div>
                <div className="flex items-center space-x-2">
                     <button onClick={() => window.print()} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors"><i className="fa-solid fa-file-pdf mr-2"></i> PDF</button>
                     <button onClick={handleExportZip} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg transition-colors">ZIP</button>
                     <button onClick={() => setShowShareModal(true)} className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 px-4 rounded-lg transition-colors"><i className="fa-solid fa-share-nodes"></i></button>
                     <button onClick={() => confirm("Eliminare definitivamente?") && onDelete(meeting.id)} className="bg-red-100 hover:bg-red-200 text-red-700 p-2 px-4 rounded-lg transition-colors"><i className="fa-solid fa-trash-can"></i></button>
                </div>
            </div>

            {meeting.audioUrl && (
                <div className="no-print mb-6 bg-white dark:bg-slate-800/50 p-4 rounded-xl shadow-sm border dark:border-slate-700">
                    <audio controls src={meeting.audioUrl} className="w-full"></audio>
                </div>
            )}

            <EditableSection 
                title={t('executiveSummary')} 
                icon="fa-rocket" 
                content={verbal.executiveSummary} 
                onSave={(val) => handleUpdateSection('executiveSummary', val)} 
                isVisibleInPrint={printConfig.executiveSummary} 
            />

            <div className={`bg-white dark:bg-slate-800/50 rounded-xl shadow-sm p-6 mb-6 ${!printConfig.decisions ? 'print:hidden' : ''}`}>
                <h3 className="text-xl font-bold uppercase mb-4 border-b pb-2 flex items-center"><i className="fa-solid fa-gavel text-blue-500 mr-3"></i>{t('decisions')}</h3>
                <ul className="list-disc pl-5 space-y-2">{verbal.decisions.map((d, i) => <li key={i}>{d.decision}</li>)}</ul>
            </div>

            <div className={`bg-white dark:bg-slate-800/50 rounded-xl shadow-sm p-6 mb-6 ${!printConfig.actionItems ? 'print:hidden' : ''}`}>
                <h3 className="text-xl font-bold uppercase mb-4 border-b pb-2 flex items-center"><i className="fa-solid fa-list-check text-blue-500 mr-3"></i>{t('actionItems')}</h3>
                <table className="w-full text-left">
                    <thead><tr className="border-b dark:border-slate-700 text-slate-500 text-sm"><th className="pb-2">{t('task')}</th><th className="pb-2">{t('owner')}</th><th className="pb-2">{t('dueDate')}</th></tr></thead>
                    <tbody>{verbal.actionItems.map((item, i) => (<tr key={i} className="border-b dark:border-slate-700"><td className="py-3 font-medium">{item.task}</td><td className="py-3">{item.owner}</td><td className="py-3 text-sm">{item.dueDate}</td></tr>))}</tbody>
                </table>
            </div>

            <div className={`bg-white dark:bg-slate-800/50 rounded-xl shadow-sm p-6 mb-6 ${!printConfig.flowchart ? 'print:hidden' : ''}`}>
                <h3 className="text-xl font-bold uppercase mb-4 border-b pb-2 flex items-center"><i className="fa-solid fa-diagram-project text-blue-500 mr-3"></i>{t('flowchart')}</h3>
                <div ref={mermaidRef} className="flex justify-center overflow-x-auto py-4"></div>
                {flowchartError && <p className="text-center text-slate-400 italic">Diagramma non disponibile per questa riunione.</p>}
            </div>

            <EditableSection 
                title={t('discussionSummary')} 
                icon="fa-comments" 
                content={verbal.discussionSummary} 
                onSave={(val) => handleUpdateSection('discussionSummary', val)} 
                isVisibleInPrint={printConfig.discussionSummary} 
            />

            {/* TRASCRIZIONE COMPLETA - MODALITÀ SOLA LETTURA (AUDIT TRAIL) */}
            <EditableSection 
                title={t('fullConversation')} 
                icon="fa-quote-left" 
                content={verbal.fullTranscript} 
                isVisibleInPrint={printConfig.fullTranscript} 
                readOnly={true} 
            />

            <div className="no-print mt-8 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-xl shadow-sm border border-purple-200 dark:border-purple-900/30">
                <h3 className="text-xl font-bold mb-3 flex items-center text-purple-600 dark:text-purple-400"><i className="fa-solid fa-wand-magic-sparkles mr-3"></i>{t('aiRefinement')}</h3>
                <textarea value={refinementPrompt} onChange={(e) => setRefinementPrompt(e.target.value)} placeholder={t('refinementPlaceholder')} className="w-full p-4 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-inner" rows={3} disabled={isRefining} />
                <div className="flex justify-end mt-3">
                    <button onClick={handleRefinement} disabled={isRefining || !refinementPrompt.trim()} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 transition-all flex items-center">
                        {isRefining ? <Spinner className="mr-2" /> : <i className="fa-solid fa-paper-plane mr-2"></i>}
                        {t('refine')}
                    </button>
                </div>
            </div>

            {showShareModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-4">Condividi Verbale</h3>
                        <input type="email" value={shareEmail} onChange={e => setShareEmail(e.target.value)} placeholder="Inserisci email del collega" className="w-full p-3 border rounded-lg mb-4 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" />
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setShowShareModal(false)} className="px-4 py-2 font-semibold text-slate-500 hover:text-slate-800">Annulla</button>
                            <button onClick={() => { shareMeeting(meeting.id, shareEmail); setShowShareModal(false); alert("Condiviso!"); }} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-md">Condividi</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
