
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { Verbal } from '../types';

// --- SCHEMAS ---

const flowchartNodesSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: "Simple ID (e.g. A, B, C)." },
            label: { type: Type.STRING, description: "Short label." },
            type: { type: Type.STRING, description: "'process' or 'decision'" }
        },
        required: ["id", "label", "type"]
    }
};

const flowchartEdgesSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            fromId: { type: Type.STRING },
            toId: { type: Type.STRING },
            label: { type: Type.STRING }
        },
        required: ["fromId", "toId"]
    }
};

const verbalSummarySchema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: { type: Type.STRING },
    decisions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { decision: { type: Type.STRING } } } },
    actionItems: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { task: { type: Type.STRING }, owner: { type: Type.STRING }, dueDate: { type: Type.STRING } } } },
    discussionSummary: { type: Type.STRING },
    flowchartData: { 
        type: Type.OBJECT,
        properties: {
            nodes: flowchartNodesSchema,
            edges: flowchartEdgesSchema
        },
        required: ["nodes", "edges"]
    }
  },
  required: ["executiveSummary", "decisions", "actionItems", "discussionSummary", "flowchartData"]
};

// --- PROMPTS ---

const prompts: Record<string, any> = {
  en: {
    transcribe: "Transcribe the following audio word-for-word. Do not summarize. If you hear multiple speakers, try to identify them.",
    analyze: (participants: string[]) => `Analyze this transcript from a meeting with: ${participants.join(', ')}. Generate a structured summary in JSON.`,
    refine: (c:any, r:string) => `Edit this meeting summary JSON. Request: "${r}". Context: ${JSON.stringify(c)}`
  },
  it: {
    transcribe: "Trascrivi l'audio parola per parola. Non riassumere. Se ci sono più parlanti, identificali se possibile.",
    analyze: (participants: string[]) => `Analizza questa trascrizione di una riunione con: ${participants.join(', ')}. Genera un verbale strutturato in JSON.`,
    refine: (c:any, r:string) => `Modifica il JSON di questo verbale. Richiesta: "${r}". Contesto attuale: ${JSON.stringify(c)}`
  },
};

const getPrompts = (lang: string) => prompts[lang] || prompts['en'];

const fileToGenerativePart = (file: Blob): Promise<{inlineData: { data: string; mimeType: string; }}> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const data = result.split(',')[1];
        const mimeType = result.substring(result.indexOf(':') + 1, result.indexOf(';'));
        resolve({ inlineData: { data, mimeType } });
      };
      reader.onerror = error => reject(error);
    });
};

const getAiClient = (apiKey: string) => new GoogleGenAI({ apiKey });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation<T>(operation: () => Promise<T>, retries = 5, baseDelay = 3000): Promise<T> {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            const msg = (error.message || "").toLowerCase();
            if (msg.includes('503') || msg.includes('overloaded') || msg.includes('429')) {
                await delay(baseDelay * (i + 1)); 
                continue;
            }
            throw error; 
        }
    }
    throw lastError;
}

const convertStructuredDataToMermaid = (data: any): string => {
    if (!data || !data.nodes || !Array.isArray(data.nodes)) return "";
    let mermaidCode = "graph TD\n";
    const nodeIds = new Set<string>();
    data.nodes.forEach((node: any) => {
        const safeId = String(node.id || "").replace(/[^a-zA-Z0-9]/g, "");
        if (!safeId) return;
        nodeIds.add(safeId);
        const safeLabel = String(node.label || "").replace(/"/g, "'").trim();
        if (node.type === 'decision' || safeLabel.endsWith('?')) {
            mermaidCode += `  ${safeId}{"${safeLabel}"}\n`;
        } else {
            mermaidCode += `  ${safeId}["${safeLabel}"]\n`;
        }
    });
    if (data.edges && Array.isArray(data.edges)) {
        data.edges.forEach((edge: any) => {
            const from = String(edge.fromId || "").replace(/[^a-zA-Z0-9]/g, "");
            const to = String(edge.toId || "").replace(/[^a-zA-Z0-9]/g, "");
            if (nodeIds.has(from) && nodeIds.has(to)) {
                if (edge.label) {
                    mermaidCode += `  ${from} -->|"${edge.label.replace(/"/g, "'")}"| ${to}\n`;
                } else {
                    mermaidCode += `  ${from} --> ${to}\n`;
                }
            }
        });
    }
    return mermaidCode;
};

const cleanJson = (text: string) => text.replace(/```json/g, '').replace(/```/g, '').trim();

export const generateMinutesFromAudio = async (audioBlob: Blob, participants: string[], language: string, apiKey: string): Promise<Verbal> => {
    const ai = getAiClient(apiKey);
    const p = getPrompts(language);
    const audioPart = await fileToGenerativePart(audioBlob);

    // FASE 1: TRASCRIZIONE TOTALE (Raw Text)
    const transcriptionResponse = await retryOperation(async () => {
        return await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { parts: [{ text: p.transcribe }, audioPart] },
        });
    });
    const fullTranscript = transcriptionResponse.text || "";

    // FASE 2: ANALISI E SINTESI (JSON)
    const analysisResponse = await retryOperation(async () => {
        return await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { parts: [{ text: p.analyze(participants) }, { text: fullTranscript }] },
            config: { responseMimeType: "application/json", responseSchema: verbalSummarySchema },
        });
    });

    const jsonText = cleanJson(analysisResponse.text || "");
    const rawData = JSON.parse(jsonText);

    return {
        executiveSummary: rawData.executiveSummary,
        decisions: rawData.decisions,
        actionItems: rawData.actionItems,
        discussionSummary: rawData.discussionSummary,
        fullTranscript: fullTranscript,
        flowchart: convertStructuredDataToMermaid(rawData.flowchartData)
    };
};

export const refineMinutes = async (currentVerbal: Verbal, refinementPrompt: string, language: string, apiKey: string): Promise<Verbal> => {
    const ai = getAiClient(apiKey);
    const { fullTranscript, ...summaryOnly } = currentVerbal;
    const prompt = getPrompts(language).refine(summaryOnly, refinementPrompt);

    const response = await retryOperation(async () => {
        return await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { parts: [{ text: prompt }, { text: `Original Transcript for context: ${fullTranscript}` }] },
            config: { responseMimeType: "application/json", responseSchema: verbalSummarySchema },
        });
    });
    
    const jsonText = cleanJson(response.text || "");
    const rawData = JSON.parse(jsonText);
    return { 
        ...rawData,
        fullTranscript: fullTranscript,
        flowchart: convertStructuredDataToMermaid(rawData.flowchartData)
    };
};

export const generateFlowchartFromText = async (transcript: string, language: string, apiKey: string): Promise<string> => {
    const ai = getAiClient(apiKey);
    const prompt = `Extract logical flow from text. JSON with 'nodes' and 'edges'. Language: ${language}`;
    const response = await retryOperation(async () => {
        return await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { parts: [{ text: prompt }, { text: transcript }] },
            config: { responseMimeType: "application/json", responseSchema: verbalSummarySchema.properties.flowchartData },
        });
    });
    const jsonText = cleanJson(response.text || "");
    const data = JSON.parse(jsonText);
    return convertStructuredDataToMermaid(data);
};
