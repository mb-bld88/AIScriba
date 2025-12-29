
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
    onSave: (newContent: string) => void; 
    isVisibleInPrint: boolean;
}> = ({ title, icon, content, onSave, isVisibleInPrint }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(content);

    const handleSave = () => {
        onSave(value);
        setIsEditing(false);
    };

    return (
        <div className={`bg-white dark:bg-slate-800/50 rounded-xl shadow-sm p-6 mb-6 print:p-0 print:shadow-none print:mb-8 print:break-inside-avoid ${!isVisibleInPrint ? 'print:hidden' : ''}`}>
            <div className="flex items-center justify-between mb-4 print:mb-2 border-b print:border-black pb-2">
                <div className="flex items-center">
                    <i className={`fa-solid ${icon} text-xl text-blue-500 mr-4 print:hidden`}></i>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 print:text-black print:text-lg uppercase">{title}</h3>
                </div>
                <button onClick={() => setIsEditing(!isEditing)} className="text-slate-400 hover:text-blue-500 print:hidden" title="Modifica Testo">
                    <i className={`fa-solid ${isEditing ? 'fa-times' : 'fa-pen-to-square'}`}></i>
                </button>
            </div>
            {isEditing ? (
                <div className="space-y-3">
                    <textarea 
                        className="w-full p-3 border rounded-md dark:bg-slate-700 dark:text-white" 
                        rows={6} 
                        value={value} 
                        onChange={e => setValue(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Salva Modifiche</button>
                    </div>
                </div>
            ) : (
                <div className="prose prose-slate dark:prose-invert max-w-none print:prose-none text-justify whitespace-pre-wrap">
                    {content}
                </div>
            )}
        </div>
    );
}

export const MeetingDetails: React.FC<MeetingDetailsProps> = ({ meeting, onUpdateVerbal, company, currentUser, onDelete, onRetry }) => {
    const [refinementPrompt, setRefinementPrompt] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [isGeneratingFlowchart, setIsGeneratingFlowchart] = useState(false);
    const [flowchartError, setFlowchartError] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { t, language } = useLanguage();
    const mermaidRef = useRef<HTMLDivElement>(null);
    
    const [showPdfOptions, setShowPdfOptions] = useState(false);
    const [printConfig, setPrintConfig] = useState({
        executiveSummary: true,
        decisions: true,
        actionItems: true,
        flowchart: true,
        discussionSummary: true,
        fullTranscript: true
    });
    const pdfMenuRef = useRef<HTMLDivElement>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareEmail, setShareEmail] = useState('');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pdfMenuRef.current && !pdfMenuRef.current.contains(event.target as Node)) {
                setShowPdfOptions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reset flowchart state when ID changes
    useEffect(() => {
        setFlowchartError(false);
        setIsGeneratingFlowchart(false);
    }, [meeting.id]);

    // Mermaid Rendering Logic
    useEffect(() => {
        if (meeting.verbal?.flowchart && !flowchartError && mermaidRef.current) {
            const renderChart = async () => {
                const container = mermaidRef.current;
                if (!container) return;
                
                // Set initial loading state inside container
                container.innerHTML = `<div class="p-4 flex justify-center"><i class="fa-solid fa-circle-notch fa-spin text-blue-500"></i></div>`;
                
                try {
                    const isDarkMode = document.documentElement.classList.contains('dark');
                    mermaid.initialize({ 
                        startOnLoad: false, 
                        theme: isDarkMode ? 'dark' : 'default',
                        securityLevel: 'loose'
                    });

                    const code = meeting.verbal!.flowchart!;
                    
                    // Validate syntax first to avoid crash
                    try {
                        await mermaid.parse(code);
                    } catch (syntaxErr) {
                        console.error("Syntax Error in Mermaid:", syntaxErr);
                        setFlowchartError(true);
                        container.innerHTML = "";
                        return;
                    }

                    const { svg } = await mermaid.render(`svg-${meeting.id}`, code);
                    if (container) container.innerHTML = svg;
                } catch (e) {
                    console.error("Mermaid final render fail:", e);
                    setFlowchartError(true);
                    if (container) container.innerHTML = "";
                }
            };
            
            renderChart();
        }
    }, [meeting.verbal?.flowchart, meeting.id, flowchartError]);

    const handleGenerateFlowchart = async () => {
        if (!meeting.verbal) return;
        setIsGeneratingFlowchart(true);
        setFlowchartError(false);
        try {
            const flowchartCode = await generateFlowchartFromText(meeting.verbal.fullTranscript, language, currentUser.googleApiKey || '');
            const updatedVerbal = { ...meeting.verbal, flowchart: flowchartCode };
            onUpdateVerbal(meeting.id, updatedVerbal);
        } catch (e) {
            setFlowchartError(true);
        } finally {
            setIsGeneratingFlowchart(false);
        }
    };

    const handleUpdateSection = (section: keyof Verbal, newValue: string) => {
        if (!meeting.verbal) return;
        const updatedVerbal = { ...meeting.verbal, [section]: newValue };
        onUpdateVerbal(meeting.id, updatedVerbal);
    };

    const handleExportPdf = () => window.print();

    const handleExportZip = async () => {
        if (!meeting.verbal) return;
        try {
            const zip = new JSZip();
            if (meeting.audioUrl) {
                const response = await fetch(meeting.audioUrl);
                const blob = await response.blob();
                zip.file(`audio_recording.webm`, blob);
            }
            const mdContent = `# ${meeting.title}\nDate: ${meeting.date}\n\n${meeting.verbal.executiveSummary}`;
            zip.file('minutes.md', mdContent);
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${meeting.title.replace(/\s/g, '_')}_archive.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) { alert("Errore creazione ZIP"); }
    };

    const handleRefinement = async () => {
        if (!refinementPrompt.trim() || !meeting.verbal) return;
        setIsRefining(true);
        setError(null);
        try {
            const updatedVerbal = await refineMinutes(meeting.verbal, refinementPrompt, language, currentUser.googleApiKey || '');
            onUpdateVerbal(meeting.id, updatedVerbal);
            setRefinementPrompt('');
        } catch (err: any) { setError(err.message || "Errore raffinamento"); } finally { setIsRefining(false); }
    };

    const handleDelete = async () => {
        if (confirm("Eliminare questa riunione?")) {
            try { await deleteMeeting(meeting.id); onDelete(meeting.id); } catch (e) { alert("Errore"); }
        }
    };

    const handleShare = async () => {
        if (!shareEmail.trim()) return;
        try {
            await shareMeeting(meeting.id, shareEmail.trim());
            alert("Condiviso!");
            setShowShareModal(false);
            setShareEmail('');
        } catch (e) { alert("Errore condivisione"); }
    }

    if (meeting.status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-lg">
                <i className="fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-4"></i>
                <h2 className="text-2xl font-bold text-red-700">Elaborazione Fallita</h2>
                <div className="mt-6 flex space-x-4">
                    {onRetry && <button onClick={() => onRetry(meeting)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Riprova</button>}
                    <button onClick={handleDelete} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-bold">Elimina</button>
                </div>
            </div>
        );
    }

    if (meeting.status === 'processing' || meeting.status === 'pending') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Spinner className="h-16 w-16 border-b-4 border-blue-500 mb-6" />
                <h3 className="text-xl font-bold">{t('processing')}...</h3>
                <p className="text-slate-500 mt-2">{t('processingMessage')}</p>
            </div>
        );
    }

    const { verbal } = meeting;
    if (!verbal) return null;

    return (
        <div className="print:bg-white print:text-black print:p-8">
            <div className="flex justify-between items-center mb-6 no-print">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{meeting.title}</h2>
                    <p className="text-slate-500">{meeting.date}</p>
                </div>
                <div className="flex items-center space-x-2">
                     <button onClick={handleDelete} className="bg-red-100 text-red-700 p-2 rounded-lg"><i className="fa-solid fa-trash-can"></i></button>
                     <button onClick={handleExportZip} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg">ZIP</button>
                     <button onClick={() => setShowShareModal(true)} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg"><i className="fa-solid fa-share-nodes"></i></button>
                     <button onClick={handleExportPdf} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg"><i className="fa-solid fa-file-pdf mr-2"></i> PDF</button>
                </div>
            </div>

            {meeting.audioUrl && (
                <div className="no-print mb-6 bg-white dark:bg-slate-800/50 p-4 rounded-xl shadow-sm">
                    <audio controls src={meeting.audioUrl} className="w-full"></audio>
                </div>
            )}

            <EditableSection title={t('executiveSummary')} icon="fa-rocket" content={verbal.executiveSummary} onSave={(val) => handleUpdateSection('executiveSummary', val)} isVisibleInPrint={printConfig.executiveSummary} />

            <div className={`bg-white dark:bg-slate-800/50 rounded-xl shadow-sm p-6 mb-6 ${!printConfig.decisions ? 'print:hidden' : ''}`}>
                <h3 className="text-xl font-bold uppercase mb-4 border-b pb-2">{t('decisions')}</h3>
                <ul className="list-disc pl-5">{verbal.decisions.map((d, i) => <li key={i} className="mb-2">{d.decision}</li>)}</ul>
            </div>

            <div className={`bg-white dark:bg-slate-800/50 rounded-xl shadow-sm p-6 mb-6 ${!printConfig.actionItems ? 'print:hidden' : ''}`}>
                <h3 className="text-xl font-bold uppercase mb-4 border-b pb-2">{t('actionItems')}</h3>
                <table className="w-full text-left">
                    <thead><tr><th className="pb-2">{t('task')}</th><th className="pb-2">{t('owner')}</th><th className="pb-2">{t('dueDate')}</th></tr></thead>
                    <tbody>
                        {verbal.actionItems.map((item, i) => (
                            <tr key={i} className="border-b dark:border-slate-700">
                                <td className="py-2">{item.task}</td><td className="py-2">{item.owner}</td><td className="py-2">{item.dueDate}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={`bg-white dark:bg-slate-800/50 rounded-xl shadow-sm p-6 mb-6 ${!printConfig.flowchart ? 'print:hidden' : ''}`}>
                <h3 className="text-xl font-bold uppercase mb-4 border-b pb-2">{t('flowchart')}</h3>
                <div ref={mermaidRef} className="flex justify-center overflow-x-auto min-h-[50px]"></div>
                {flowchartError && (
                    <div className="text-center py-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg no-print">
                        <p className="text-red-500 mb-2 font-semibold">Diagramma non disponibile o non valido.</p>
                        <button onClick={handleGenerateFlowchart} disabled={isGeneratingFlowchart} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">
                            {isGeneratingFlowchart ? "Rigenerazione..." : "Ripara Diagramma"}
                        </button>
                    </div>
                )}
            </div>

            <EditableSection title={t('discussionSummary')} icon="fa-comments" content={verbal.discussionSummary} onSave={(val) => handleUpdateSection('discussionSummary', val)} isVisibleInPrint={printConfig.discussionSummary} />

            <div className="no-print mt-8 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                <h3 className="text-xl font-bold mb-3 flex items-center"><i className="fa-solid fa-wand-magic-sparkles text-purple-500 mr-3"></i>{t('aiRefinement')}</h3>
                <textarea value={refinementPrompt} onChange={(e) => setRefinementPrompt(e.target.value)} placeholder={t('refinementPlaceholder')} className="w-full p-3 border rounded-md dark:bg-slate-700" rows={3} disabled={isRefining} />
                <div className="flex justify-end mt-3">
                    <button onClick={handleRefinement} disabled={isRefining || !refinementPrompt.trim()} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold">
                        {isRefining ? <Spinner /> : t('refine')}
                    </button>
                </div>
            </div>

            {showShareModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Condividi</h3>
                        <input type="email" value={shareEmail} onChange={e => setShareEmail(e.target.value)} placeholder="Email collega" className="w-full p-2 border rounded mb-4 dark:bg-slate-700" />
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setShowShareModal(false)} className="px-4 py-2">Annulla</button>
                            <button onClick={handleShare} className="bg-blue-600 text-white px-4 py-2 rounded">Invia</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
