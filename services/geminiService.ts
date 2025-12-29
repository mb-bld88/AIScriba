
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { Verbal } from '../types';

// --- SCHEMAS ---

const flowchartNodesSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: "Simple alphanumeric ID (e.g. A, B, C, N1, N2). No spaces." },
            label: { type: Type.STRING, description: "Label text. Short and concise." },
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
            fromId: { type: Type.STRING, description: "ID of the source node" },
            toId: { type: Type.STRING, description: "ID of the target node" },
            label: { type: Type.STRING, description: "Optional transition text (e.g. Yes/No)" }
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
      You are AIScriba. Generate meeting minutes JSON.
      For 'flowchartData', extract the logical flow. Use SIMPLE IDs like A, B, C.
      Participants: ${participants.join(', ')}. Language: ENGLISH.
    `,
    analyzeText: (participants: string[]) => `
      You are AIScriba. Analyze text and generate minutes JSON.
      For 'flowchartData', use alphanumeric IDs ONLY.
      Participants: ${participants.join(', ')}. Language: ENGLISH.
    `,
    transcribeOnly: "Transcribe audio. Raw text only.",
    refine: (c:any, r:string) => `Update minutes JSON based on: "${r}". Context: ${JSON.stringify(c)}.`
  },
  it: {
    generate: (participants: string[]) => `
      Sei AIScriba. Genera il JSON del verbale.
      Per 'flowchartData', usa ID SEMPLICI (A, B, C...) per i nodi.
      Partecipanti: ${participants.join(', ')}. Lingua: ITALIANO.
    `,
    analyzeText: (participants: string[]) => `
      Sei AIScriba. Analizza la trascrizione e genera il JSON.
      Per 'flowchartData', usa ID ALFANUMERICI semplici.
      Partecipanti: ${participants.join(', ')}. Lingua: ITALIANO.
    `,
    transcribeOnly: "Trascrivi l'audio parola per parola.",
    refine: (c:any, r:string) => `Aggiorna il JSON del verbale seguendo questa richiesta: "${r}". Contesto attuale: ${JSON.stringify(c)}.`
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
                const waitTime = baseDelay * (i + 1);
                await delay(waitTime); 
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

    // Step 1: Add Nodes
    data.nodes.forEach((node: any) => {
        const safeId = String(node.id || "").replace(/[^a-zA-Z0-9]/g, "");
        if (!safeId) return;
        
        nodeIds.add(safeId);
        const safeLabel = String(node.label || "Step")
            .replace(/"/g, "'")
            .replace(/[\[\]\(\)\{\}]/g, "")
            .trim();

        if (node.type === 'decision' || safeLabel.endsWith('?')) {
            mermaidCode += `  ${safeId}{"${safeLabel}"}\n`;
        } else {
            mermaidCode += `  ${safeId}["${safeLabel}"]\n`;
        }
    });

    // Step 2: Add Edges (only if both nodes exist)
    if (data.edges && Array.isArray(data.edges)) {
        data.edges.forEach((edge: any) => {
            const from = String(edge.fromId || "").replace(/[^a-zA-Z0-9]/g, "");
            const to = String(edge.toId || "").replace(/[^a-zA-Z0-9]/g, "");
            
            if (nodeIds.has(from) && nodeIds.has(to)) {
                if (edge.label) {
                    const edgeLabel = String(edge.label).replace(/"/g, "'").trim();
                    mermaidCode += `  ${from} -->|"${edgeLabel}"| ${to}\n`;
                } else {
                    mermaidCode += `  ${from} --> ${to}\n`;
                }
            }
        });
    }

    return mermaidCode;
};

const MAX_CHUNK_SIZE_BYTES = 18 * 1024 * 1024;

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

  // Large audio logic
  const chunks: Blob[] = [];
  let start = 0;
  while (start < audioBlob.size) {
      const end = Math.min(start + MAX_CHUNK_SIZE_BYTES, audioBlob.size);
      chunks.push(audioBlob.slice(start, end, audioBlob.type));
      start = end;
  }

  let fullTranscript = "";
  for (const chunk of chunks) {
      fullTranscript += await transcribeChunk(ai, chunk, language) + "\n";
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
    const prompt = `Extract logical process flow from text. Output JSON with 'nodes' (id, label, type) and 'edges' (fromId, toId, label). Use simple IDs like A, B, C.`;
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
