
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

// Editable Section Component
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
    const [error, setError] = useState<string | null>(null);
    const { t, language } = useLanguage();
    
    // PDF Print Options
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
    
    // Share State
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareEmail, setShareEmail] = useState('');

    // Click outside to close PDF menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pdfMenuRef.current && !pdfMenuRef.current.contains(event.target as Node)) {
                setShowPdfOptions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const sanitizeMermaidCode = (code: string) => {
        let clean = code.replace(/```mermaid/g, '').replace(/```/g, '').replace(/^mermaid\s+/g, '').trim();
        clean = clean.replace(/\[(.*?)\]/g, (match, content) => {
            const safeContent = content.replace(/[^a-zA-Z0-9\sàèéìòùÀÈÉÌÒÙ]/g, ' '); 
            return `[${safeContent.trim()}]`;
        });
        clean = clean.replace(/[:"]/g, '');
        return clean;
    };

    useEffect(() => {
        if (meeting.verbal?.flowchart) {
            const mermaidChartId = `mermaid-chart-${meeting.id}`;
            const element = document.getElementById(mermaidChartId);

            if (element) {
                element.innerHTML = `<div class="flex justify-center items-center min-h-[100px]"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>`;
                const isDarkMode = document.documentElement.classList.contains('dark');
                const cleanFlowchart = sanitizeMermaidCode(meeting.verbal.flowchart);

                try {
                    mermaid.initialize({ startOnLoad: false, theme: isDarkMode ? 'dark' : 'default', securityLevel: 'loose', suppressErrorRendering: true });
                    mermaid.render(`mermaid-svg-${meeting.id}`, cleanFlowchart)
                        .then(({ svg }: { svg: string }) => { if (element) element.innerHTML = svg; })
                        .catch((e: any) => {
                            if (element) element.innerHTML = `<div class="p-4 bg-red-50 text-red-600 rounded text-sm border border-red-200">Errore grafico. Codice non valido.</div>`;
                        });
                } catch(e) { if (element) element.innerHTML = `<p class="text-slate-500 text-sm">Grafico non disponibile.</p>`; }
            }
        }
    }, [meeting.verbal?.flowchart, meeting.id]);

    const handleGenerateFlowchart = async () => {
        if (!meeting.verbal) return;
        setIsGeneratingFlowchart(true);
        try {
            const flowchartCode = await generateFlowchartFromText(meeting.verbal.fullTranscript, language, currentUser.googleApiKey || '');
            const updatedVerbal = { ...meeting.verbal, flowchart: flowchartCode };
            onUpdateVerbal(meeting.id, updatedVerbal);
        } catch (e) {
            alert("Impossibile generare il grafico.");
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
                let audioBlob: Blob;
                let extension = 'webm';

                if (meeting.audioUrl.startsWith('data:')) {
                    const fetchRes = await fetch(meeting.audioUrl);
                    audioBlob = await fetchRes.blob();
                    const type = meeting.audioUrl.split(';')[0].split(':')[1];
                    if (type.includes('mp4')) extension = 'mp4';
                    else if (type.includes('mpeg')) extension = 'mp3';
                    else if (type.includes('wav')) extension = 'wav';
                } else {
                    const audioResponse = await fetch(meeting.audioUrl);
                    if (!audioResponse.ok) throw new Error("Audio file not accessible");
                    audioBlob = await audioResponse.blob();
                }
                zip.file(`recording.${extension}`, audioBlob);
            }

            const { verbal } = meeting;
            const mdContent = `
# ${meeting.title}
Date: ${meeting.date}
Participants: ${meeting.participants.join(', ')}

## Executive Summary
${verbal.executiveSummary}

## Decisions
${verbal.decisions.map(d => `- ${d.decision}`).join('\n')}

## Action Items
${verbal.actionItems.map(a => `- [ ] ${a.task} (@${a.owner}) due: ${a.dueDate}`).join('\n')}

## Discussion Summary
${verbal.discussionSummary}

## Full Transcript
${verbal.fullTranscript}
            `.trim();

            zip.file('minutes.md', mdContent);

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${meeting.title.replace(/\s/g, '_')}_archive.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error creating zip file:", err);
            alert("Impossibile creare il file ZIP.");
        }
    };

    const handleRefinement = async () => {
        if (!refinementPrompt.trim() || !meeting.verbal) return;
        setIsRefining(true);
        setError(null);
        try {
            const updatedVerbal = await refineMinutes(meeting.verbal, refinementPrompt, language, currentUser.googleApiKey || '');
            onUpdateVerbal(meeting.id, updatedVerbal);
            setRefinementPrompt('');
        } catch (err: any) {
            setError(err.message || t('unexpectedError'));
        } finally {
            setIsRefining(false);
        }
    };

    const handleDelete = async () => {
        if (confirm("Sei sicuro di voler eliminare questa riunione?")) {
            try { await deleteMeeting(meeting.id); onDelete(meeting.id); } 
            catch (e) { alert("Errore eliminazione."); }
        }
    };

    const handleShare = async () => {
        if (!shareEmail.trim()) return;
        try {
            await shareMeeting(meeting.id, shareEmail.trim());
            alert(`Riunione condivisa con successo con ${shareEmail}!`);
            setShowShareModal(false);
            setShareEmail('');
        } catch (e) {
            alert("Impossibile condividere: Utente non trovato o errore server.");
        }
    }

    if (meeting.status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-red-50 dark:bg-red-900/10 rounded-lg border-2 border-red-100 dark:border-red-900">
                <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                    <i className="fa-solid fa-triangle-exclamation text-4xl text-red-500"></i>
                </div>
                <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">
                    Elaborazione Fallita
                </h2>
                <div className="flex space-x-4 mt-8">
                    <button onClick={handleDelete} className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg">Elimina</button>
                    {onRetry && (
                        <button onClick={() => onRetry(meeting)} className="px-6 py-2 bg-red-600 text-white rounded-lg">Riprova</button>
                    )}
                </div>
            </div>
        );
    }

    if (meeting.status === 'processing' || meeting.status === 'pending') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white dark:bg-slate-800 rounded-lg">
                <Spinner className="h-12 w-12 border-b-4 border-blue-500 mb-4" />
                <p>{t('processing')}...</p>
                <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700 w-full max-w-md">
                    <button onClick={handleDelete} className="text-red-500 hover:text-red-700 text-sm font-semibold hover:underline">
                        <i className="fa-solid fa-trash-can mr-1"></i> Annulla ed Elimina
                    </button>
                </div>
            </div>
        );
    }

    const { verbal } = meeting;
    if (!verbal) return null;

    return (
        <div className="print:bg-white print:text-black print:p-8">
            <div className="flex justify-between items-center mb-6 no-print relative">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{meeting.title}</h2>
                    <p className="text-slate-500 dark:text-slate-400">{meeting.date}</p>
                    {meeting.sharedWith && meeting.sharedWith.length > 0 && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                            <i className="fa-solid fa-users mr-1"></i> 
                            Condiviso con: {meeting.sharedWith.map(u => u.email).join(', ')}
                        </p>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                     <button onClick={handleDelete} className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg"><i className="fa-solid fa-trash-can"></i></button>
                     
                     {/* Share Button with Modal Trigger */}
                     <button 
                        onClick={() => setShowShareModal(true)}
                        className="flex items-center bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg transition-colors"
                     >
                        <i className="fa-solid fa-share-nodes mr-2"></i>
                        {t('share')}
                     </button>

                     <div className="relative" ref={pdfMenuRef}>
                        <button 
                            onClick={() => setShowPdfOptions(!showPdfOptions)}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                        >
                            <i className="fa-solid fa-file-pdf mr-2"></i> {t('exportPdf')} <i className="fa-solid fa-chevron-down ml-2 text-xs"></i>
                        </button>
                        {showPdfOptions && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-4">
                                <h4 className="font-bold mb-2 text-sm text-slate-500">Opzioni Stampa PDF</h4>
                                <div className="space-y-2">
                                    {Object.keys(printConfig).map((key) => (
                                        <label key={key} className="flex items-center space-x-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={printConfig[key as keyof typeof printConfig]} 
                                                onChange={(e) => setPrintConfig({...printConfig, [key]: e.target.checked})}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        </label>
                                    ))}
                                </div>
                                <button onClick={handleExportPdf} className="w-full mt-4 bg-blue-600 text-white py-2 rounded text-sm font-bold">Stampa Ora</button>
                            </div>
                        )}
                     </div>
                </div>
            </div>
            
            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-4">Condividi Riunione</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Inserisci l'email di un collega per condividere questa riunione (deve essere già registrato).
                        </p>
                        <input 
                            type="email" 
                            value={shareEmail}
                            onChange={e => setShareEmail(e.target.value)}
                            placeholder="collega@azienda.com"
                            className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setShowShareModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300">Annulla</button>
                            <button onClick={handleShare} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Condividi</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Header */}
            <div className="hidden print:block text-center mb-12">
                 {company.logoUrl && <img src={company.logoUrl} alt="Logo" className="h-16 w-auto object-contain mx-auto mb-4" />}
                 <h1 className="text-3xl font-bold">{company.name}</h1>
                 <h2 className="text-xl mb-1">{meeting.title}</h2>
                 <p className="text-gray-500 text-sm">{meeting.date} &bull; {t('participants')}: {meeting.participants.join(', ')}</p>
                 <p className="text-xs text-gray-400 mt-2">Trascrizione generata da AI. Verificare con l'audio originale.</p>
                 <hr className="mt-4 border-gray-300"/>
            </div>

            {meeting.audioUrl && (
                <div className="no-print mb-6">
                    <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-sm p-4">
                        <h4 className="font-bold mb-2"><i className="fa-solid fa-headphones mr-2"></i> Audio</h4>
                        <audio controls src={meeting.audioUrl} className="w-full rounded-lg"></audio>
                    </div>
                </div>
            )}

            <div id={`pdf-content-${meeting.id}`}>
                <EditableSection 
                    title={t('executiveSummary')} 
                    icon="fa-rocket" 
                    content={verbal.executiveSummary} 
                    onSave={(val) => handleUpdateSection('executiveSummary', val)} 
                    isVisibleInPrint={printConfig.executiveSummary}
                />

                <div className={`bg-white dark:bg-slate-800/50 rounded-xl shadow-sm p-6 mb-6 print:shadow-none print:break-inside-avoid ${!printConfig.decisions ? 'print:hidden' : ''}`}>
                    <div className="flex items-center mb-4 border-b print:border-black pb-2">
                        <i className="fa-solid fa-gavel text-xl text-blue-500 mr-4 print:hidden"></i>
                        <h3 className="text-xl font-bold uppercase w-full">{t('decisions')}</h3>
                    </div>
                    <ul className="list-disc pl-5">
                        {verbal.decisions.map((d, i) => <li key={i} className="mb-2">{d.decision}</li>)}
                    </ul>
                </div>

                <div className={`bg-white dark:bg-slate-800/50 rounded-xl shadow-sm p-6 mb-6 print:shadow-none print:break-inside-avoid ${!printConfig.actionItems ? 'print:hidden' : ''}`}>
                    <div className="flex items-center mb-4 border-b print:border-black pb-2">
                        <i className="fa-solid fa-list-check text-xl text-blue-500 mr-4 print:hidden"></i>
                        <h3 className="text-xl font-bold uppercase w-full">{t('actionItems')}</h3>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="pb-2 font-semibold">{t('task')}</th>
                                <th className="pb-2 font-semibold">{t('owner')}</th>
                                <th className="pb-2 font-semibold">{t('dueDate')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {verbal.actionItems.map((item, i) => (
                                <tr key={i} className="border-b dark:border-slate-700 print:border-gray-200">
                                    <td className="py-2 pr-2">{item.task}</td>
                                    <td className="py-2 pr-2"><span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full print:border print:bg-transparent">{item.owner}</span></td>
                                    <td className="py-2 text-sm">{item.dueDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className={`bg-white dark:bg-slate-800/50 rounded-xl shadow-sm p-6 mb-6 print:shadow-none print:break-inside-avoid ${!printConfig.flowchart ? 'print:hidden' : ''}`}>
                    <div className="flex items-center justify-between mb-4 border-b print:border-black pb-2">
                        <div className="flex items-center">
                            <i className="fa-solid fa-sitemap text-xl text-blue-500 mr-4 print:hidden"></i>
                            <h3 className="text-xl font-bold uppercase">{t('flowchart')}</h3>
                        </div>
                    </div>
                    {verbal.flowchart ? (
                        <div id={`mermaid-chart-${meeting.id}`} className="flex justify-center items-center"></div>
                    ) : (
                        <div className="text-center py-8 no-print">
                            <p className="text-slate-500 mb-4">Nessun grafico generato.</p>
                            <button onClick={handleGenerateFlowchart} disabled={isGeneratingFlowchart} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50">
                                {isGeneratingFlowchart ? <Spinner /> : "Genera Diagramma di Flusso Ora"}
                            </button>
                        </div>
                    )}
                </div>

                <EditableSection 
                    title={t('discussionSummary')} 
                    icon="fa-comments" 
                    content={verbal.discussionSummary} 
                    onSave={(val) => handleUpdateSection('discussionSummary', val)}
                    isVisibleInPrint={printConfig.discussionSummary}
                />

                 <div className={`bg-white dark:bg-slate-800/50 rounded-xl shadow-sm mb-6 print:shadow-none print:border-none ${!printConfig.fullTranscript ? 'print:hidden' : ''}`}>
                    <details open className="print:block">
                        <summary className="cursor-pointer p-6 flex items-center print:hidden">
                            <i className={`fa-solid fa-file-lines text-xl text-blue-500 mr-4`}></i>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('fullConversation')}</h3>
                        </summary>
                        <div className="hidden print:flex items-center mb-4 border-b print:border-black pb-2">
                             <h3 className="text-xl font-bold uppercase w-full">{t('fullConversation')}</h3>
                        </div>
                        <div className="p-6 pt-0 print:p-0">
                             <div className="prose prose-slate dark:prose-invert max-w-none bg-slate-100 dark:bg-slate-900/50 print:bg-white p-4 rounded-lg print:p-0">
                                <p className="whitespace-pre-wrap font-mono text-sm">{verbal.fullTranscript}</p>
                             </div>
                        </div>
                    </details>
                </div>
            </div>
            
            <div className="mt-8 no-print">
                <h3 className="text-xl font-bold mb-3 flex items-center"><i className="fa-solid fa-wand-magic-sparkles text-purple-500 mr-3"></i>{t('aiRefinement')}</h3>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                    <textarea
                        value={refinementPrompt}
                        onChange={(e) => setRefinementPrompt(e.target.value)}
                        placeholder={t('refinementPlaceholder')}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        rows={3}
                        disabled={isRefining}
                    />
                    <div className="flex justify-end items-center mt-3">
                         {error && <p className="text-sm text-red-500 mr-4">{error}</p>}
                        <button
                            onClick={handleRefinement}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 rounded-lg flex items-center transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
                            disabled={isRefining || !refinementPrompt.trim()}
                        >
                            {isRefining ? <Spinner /> : <><i className="fa-solid fa-paper-plane mr-2"></i> {t('refine')}</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
