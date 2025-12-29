
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { Verbal } from '../types';

// --- SCHEMAS ---

const flowchartNodesSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: "Unique alphanumeric ID (e.g., A, B, C). No spaces." },
            label: { type: Type.STRING, description: "Text label. No double quotes." },
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
            label: { type: Type.STRING, description: "Optional label (e.g. Yes, No)" }
        },
        required: ["fromId", "toId"]
    }
};

const verbalGenerationSchema = {
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
    },
    fullTranscript: { type: Type.STRING } 
  },
  required: ["executiveSummary", "decisions", "actionItems", "discussionSummary", "flowchartData"]
};

const flowchartStructuredSchema = {
    type: Type.OBJECT,
    properties: {
        nodes: flowchartNodesSchema,
        edges: flowchartEdgesSchema
    },
    required: ["nodes", "edges"]
};

// --- PROMPTS ---

const prompts: Record<string, any> = {
  en: {
    generate: (participants: string[]) => `
      You are AIScriba. Transcribe audio to 'fullTranscript'.
      Generate structured summary.
      For 'flowchartData', extract the process flow into 'nodes' and 'edges' arrays.
      Participants: ${participants.join(', ')}. Language: ENGLISH.
    `,
    analyzeText: (participants: string[]) => `
      You are AIScriba. Analyze TRANSCRIPT.
      Generate structured summary.
      For 'flowchartData', extract process flow into 'nodes' and 'edges'.
      Participants: ${participants.join(', ')}. Language: ENGLISH.
    `,
    transcribeOnly: "Transcribe audio word-for-word. Output ONLY raw text.",
    refine: (c:any, r:string) => `Edit JSON. Context: ${JSON.stringify(c)}. Request: "${r}". Output valid JSON with flowchartData.`
  },
  it: {
    generate: (participants: string[]) => `
      Sei AIScriba. Trascrivi in 'fullTranscript'.
      Genera riassunto strutturato.
      Per 'flowchartData', estrai il flusso in array 'nodes' e 'edges'.
      Partecipanti: ${participants.join(', ')}. Lingua: ITALIANO.
    `,
    analyzeText: (participants: string[]) => `
      Sei AIScriba. Analizza TRASCRIZIONE.
      Genera riassunto.
      Per 'flowchartData', estrai il flusso in 'nodes' e 'edges'.
      Partecipanti: ${participants.join(', ')}. Lingua: ITALIANO.
    `,
    transcribeOnly: "Trascrivi parola per parola. Solo testo grezzo.",
    refine: (c:any, r:string) => `Modifica JSON. Contesto: ${JSON.stringify(c)}. Richiesta: "${r}". Output JSON con flowchartData.`
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

async function retryOperation<T>(operation: () => Promise<T>, retries = 10, baseDelay = 2000): Promise<T> {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            const msg = (error.message || JSON.stringify(error)).toLowerCase();
            if (msg.includes('503') || msg.includes('overloaded') || msg.includes('429') || msg.includes('resource exhausted')) {
                const waitTime = baseDelay * Math.pow(1.5, i);
                console.warn(`Gemini API Busy (Attempt ${i+1}/${retries}). Waiting ${Math.round(waitTime/1000)}s...`);
                await delay(waitTime); 
                continue;
            }
            throw error; 
        }
    }
    throw lastError;
}

const convertStructuredDataToMermaid = (data: any): string => {
    if (!data || !data.nodes) return "";
    let mermaidCode = "graph TD\n";
    if (Array.isArray(data.nodes)) {
        data.nodes.forEach((node: any) => {
            const safeLabel = (node.label || "").replace(/"/g, "'").replace(/[\[\]\{\}]/g, ""); 
            const safeId = (node.id || "unknown").replace(/[^a-zA-Z0-9]/g, "_"); 
            if (node.type === 'decision' || safeLabel.includes('?')) {
                mermaidCode += `  ${safeId}{"${safeLabel}"}\n`;
            } else {
                mermaidCode += `  ${safeId}["${safeLabel}"]\n`;
            }
        });
    }
    if (data.edges && Array.isArray(data.edges)) {
        data.edges.forEach((edge: any) => {
            const safeFrom = (edge.fromId || "").replace(/[^a-zA-Z0-9]/g, "_");
            const safeTo = (edge.toId || "").replace(/[^a-zA-Z0-9]/g, "_");
            if (safeFrom && safeTo) {
                if (edge.label) {
                    const safeEdgeLabel = edge.label.replace(/"/g, "'");
                    mermaidCode += `  ${safeFrom} -->|"${safeEdgeLabel}"| ${safeTo}\n`;
                } else {
                    mermaidCode += `  ${safeFrom} --> ${safeTo}\n`;
                }
            }
        });
    }
    return mermaidCode;
};

const MAX_CHUNK_SIZE_MB = 18; 
const MAX_CHUNK_SIZE_BYTES = MAX_CHUNK_SIZE_MB * 1024 * 1024;

async function transcribeChunk(ai: GoogleGenAI, audioBlob: Blob, lang: string): Promise<string> {
    const audioPart = await fileToGenerativePart(audioBlob);
    const p = getPrompts(lang);
    return retryOperation(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { parts: [ { text: p.transcribeOnly }, audioPart ] },
        });
        return response.text || "";
    });
}

const cleanJson = (text: string) => text.replace(/```json/g, '').replace(/```/g, '').trim();

export const generateMinutesFromAudio = async (audioBlob: Blob, participants: string[], language: string, apiKey: string): Promise<Verbal> => {
  const ai = getAiClient(apiKey);
  const p = getPrompts(language);

  if (audioBlob.size < MAX_CHUNK_SIZE_BYTES) {
      const prompt = p.generate(participants);
      const audioPart = await fileToGenerativePart(audioBlob);

      const response = await retryOperation(async () => {
          return await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { parts: [ { text: prompt }, audioPart ] },
            config: { responseMimeType: "application/json", responseSchema: verbalGenerationSchema },
          });
      });

      const jsonText = cleanJson(response.text || "");
      if (!jsonText) throw new Error("Risposta vuota dall'IA");
      const rawData = JSON.parse(jsonText);
      return {
          executiveSummary: rawData.executiveSummary,
          decisions: rawData.decisions,
          actionItems: rawData.actionItems,
          discussionSummary: rawData.discussionSummary,
          fullTranscript: rawData.fullTranscript || "",
          flowchart: convertStructuredDataToMermaid(rawData.flowchartData)
      };
  }

  const chunks: Blob[] = [];
  let start = 0;
  while (start < audioBlob.size) {
      const end = Math.min(start + MAX_CHUNK_SIZE_BYTES, audioBlob.size);
      chunks.push(audioBlob.slice(start, end, audioBlob.type));
      start = end;
  }

  let fullTranscript = "";
  for (let i = 0; i < chunks.length; i++) {
      if (i > 0) await delay(2000); 
      fullTranscript += await transcribeChunk(ai, chunks[i], language) + "\n";
  }

  const analysisPrompt = p.analyzeText(participants);
  const response = await retryOperation(async () => {
      return await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [ { text: analysisPrompt }, { text: fullTranscript } ] },
        config: { responseMimeType: "application/json", responseSchema: verbalGenerationSchema },
      });
  });

  const jsonText = cleanJson(response.text || "");
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
    const { fullTranscript, ...summary } = currentVerbal;
    const prompt = getPrompts(language).refine(summary, refinementPrompt);

    const response = await retryOperation(async () => {
        return await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: verbalGenerationSchema },
        });
    });
    
    const jsonText = cleanJson(response.text || "");
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

export const generateFlowchartFromText = async (transcript: string, language: string, apiKey: string): Promise<string> => {
    const ai = getAiClient(apiKey);
    const prompt = `Extract process flow from text. Return 'nodes' and 'edges' in JSON. Target Language: ${language}`;
    const response = await retryOperation(async () => {
        return await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { parts: [{ text: prompt }, { text: transcript }] },
            config: { responseMimeType: "application/json", responseSchema: flowchartStructuredSchema },
        });
    });
    const jsonText = cleanJson(response.text || "");
    const data = JSON.parse(jsonText);
    return convertStructuredDataToMermaid(data);
};
