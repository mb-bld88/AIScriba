
import React, { useState, useEffect } from 'react';
import type { Meeting, Verbal, Company, User } from '../types';
import { refineMinutes } from '../services/geminiService';
import { deleteMeeting } from '../utils/storageUtils';
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
}

const SectionCard: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-sm p-6 mb-6 print:p-0 print:shadow-none print:mb-8 print:break-inside-avoid">
        <div className="flex items-center mb-4 print:mb-2 border-b print:border-black pb-2">
            <i className={`fa-solid ${icon} text-xl text-blue-500 mr-4 print:hidden`}></i>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 print:text-black print:text-lg uppercase w-full">{title}</h3>
        </div>
        <div className="prose prose-slate dark:prose-invert max-w-none print:prose-none text-justify">
            {children}
        </div>
    </div>
);

const PdfExportButton: React.FC<{ onExport: () => void }> = ({ onExport }) => {
    const { t } = useLanguage();
    return (
        <button
            onClick={onExport}
            className="flex items-center bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors no-print"
        >
            <i className="fa-solid fa-file-pdf mr-2"></i>
            {t('exportPdf')}
        </button>
    );
};

const ZipExportButton: React.FC<{ onExport: () => void }> = ({ onExport }) => {
    const { t } = useLanguage();
    return (
        <button
            onClick={onExport}
            className="flex items-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors no-print"
        >
            <i className="fa-solid fa-file-zipper mr-2"></i>
            {t('downloadZip')}
        </button>
    );
};


export const MeetingDetails: React.FC<MeetingDetailsProps> = ({ meeting, onUpdateVerbal, company, currentUser, onDelete }) => {
    const [refinementPrompt, setRefinementPrompt] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { t, language } = useLanguage();
    
    // Aggressive Mermaid Sanitizer
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
                        .then(({ svg }: { svg: string }) => {
                            if (element) element.innerHTML = svg;
                        })
                        .catch((e: any) => {
                            console.error("Mermaid render error:", e);
                            if (element) {
                                element.innerHTML = `
                                    <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg no-print">
                                        <p class="text-red-600 dark:text-red-300 text-sm font-semibold mb-2">Impossibile visualizzare il grafico</p>
                                        <p class="text-xs text-slate-500 mb-2">Errore di sintassi nel codice generato dall'IA.</p>
                                        <pre class="text-xs text-slate-500 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap border p-2 rounded">${cleanFlowchart}</pre>
                                    </div>
                                    `;
                            }
                        });
                } catch(e: any) {
                     console.error("Mermaid initialization error:", e);
                     if (element) element.innerHTML = `<p class="text-slate-500 text-sm">Grafico non disponibile.</p>`;
                }
            }
        }
    }, [meeting.verbal?.flowchart, meeting.id]);

    const handleExportPdf = () => {
        window.print();
    };

    const handleExportZip = async () => {
        if (!meeting.verbal) return;
        try {
            const zip = new JSZip();
            
            // 1. Add Audio File
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

            // 2. Add Minutes as Markdown Text
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
        if (confirm("Sei sicuro di voler eliminare questa riunione? L'azione è irreversibile.")) {
            try {
                await deleteMeeting(meeting.id);
                onDelete(meeting.id);
            } catch (e) {
                alert("Errore durante l'eliminazione della riunione.");
            }
        }
    };
    
    if (meeting.status === 'pending' || meeting.status === 'processing') {
        const isProcessing = meeting.status === 'processing';
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white dark:bg-slate-800 rounded-lg">
                {isProcessing ? (
                    <Spinner className="h-12 w-12 border-b-4 border-blue-500 mb-6" />
                ) : (
                    <i className="fa-solid fa-hourglass-half text-5xl text-slate-400 mb-6"></i>
                )}
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                    {isProcessing ? t('processing') : t('processingPending')}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
                    {isProcessing ? t('processingMessage') : t('processingPendingMessage').split('\n').map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>)}
                </p>
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
                    <p className="text-slate-500 dark:text-slate-400">{meeting.date} &bull; {t('participants')}: {meeting.participants.join(', ')}</p>
                </div>
                <div className="flex items-center space-x-2">
                     <button onClick={handleDelete} className="flex items-center bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-3 rounded-lg transition-colors" title="Elimina Riunione">
                        <i className="fa-solid fa-trash-can"></i>
                    </button>
                     <button className="flex items-center bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg transition-colors">
                        <i className="fa-solid fa-share-nodes mr-2"></i>
                        {t('share')}
                    </button>
                    {meeting.audioUrl && <ZipExportButton onExport={handleExportZip} />}
                    <PdfExportButton onExport={handleExportPdf} />
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block text-center mb-12">
                 {company.logoUrl && (
                     <div className="flex justify-center mb-4">
                         <img src={company.logoUrl} alt="Company Logo" className="h-16 w-auto object-contain" />
                     </div>
                 )}
                 <h1 className="text-3xl font-bold mb-2">{company.name}</h1>
                 <h2 className="text-2xl font-semibold mb-1">{meeting.title} - {t('meetingMinutes')}</h2>
                 <p className="text-gray-500">{meeting.date}</p>
                 <p className="text-gray-500 text-sm mt-1">{t('participants')}: {meeting.participants.join(', ')}</p>
            </div>

            {meeting.audioUrl && (
                <div className="no-print mb-6">
                    <SectionCard title={t('meetingRecording')} icon="fa-headphones-simple">
                        <audio controls src={meeting.audioUrl} className="w-full rounded-lg"></audio>
                    </SectionCard>
                </div>
            )}

            <div id={`pdf-content-${meeting.id}`}>
                <SectionCard title={t('executiveSummary')} icon="fa-rocket">
                    <p>{verbal.executiveSummary}</p>
                </SectionCard>

                <SectionCard title={t('decisions')} icon="fa-gavel">
                    <ul className="list-disc pl-5">
                        {verbal.decisions.map((d, i) => <li key={i} className="mb-2">{d.decision}</li>)}
                    </ul>
                </SectionCard>

                <SectionCard title={t('actionItems')} icon="fa-list-check">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="border-b dark:border-slate-600 print:border-gray-300">
                                <tr>
                                    <th className="pb-2 pr-4 font-semibold">{t('task')}</th>
                                    <th className="pb-2 pr-4 font-semibold">{t('owner')}</th>
                                    <th className="pb-2 font-semibold">{t('dueDate')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {verbal.actionItems.map((item, i) => (
                                    <tr key={i} className="border-b dark:border-slate-700 print:border-gray-200">
                                        <td className="py-3 pr-4">{item.task}</td>
                                        <td className="py-3 pr-4">
                                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 print:bg-gray-100 print:text-black print:border print:border-gray-300 text-xs font-medium px-2.5 py-0.5 rounded-full">{item.owner}</span>
                                        </td>
                                        <td className="py-3 font-mono text-sm">{item.dueDate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </SectionCard>

                {verbal.flowchart && (
                    <SectionCard title={t('flowchart')} icon="fa-sitemap">
                        <div id={`mermaid-chart-${meeting.id}`} className="flex justify-center items-center">
                           {/* Content is rendered by useEffect */}
                        </div>
                    </SectionCard>
                )}

                <SectionCard title={t('discussionSummary')} icon="fa-comments">
                    <p>{verbal.discussionSummary}</p>
                </SectionCard>

                 <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-sm mb-6 print:shadow-none print:border-none">
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
