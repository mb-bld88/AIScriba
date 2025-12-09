
import { GoogleGenAI, Type } from "@google/genai";
import type { Verbal } from '../types';

const verbalSummarySchema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: { type: Type.STRING },
    decisions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { decision: { type: Type.STRING } } } },
    actionItems: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { task: { type: Type.STRING }, owner: { type: Type.STRING }, dueDate: { type: Type.STRING } } } },
    discussionSummary: { type: Type.STRING },
    flowchart: { type: Type.STRING },
  },
  required: ["executiveSummary", "decisions", "actionItems", "discussionSummary", "flowchart"]
};

const verbalSchema = {
    ...verbalSummarySchema,
    properties: {
        fullTranscript: { type: Type.STRING },
        ...verbalSummarySchema.properties,
    },
    required: ["fullTranscript", ...verbalSummarySchema.required],
};

const flowchartSchema = {
    type: Type.OBJECT,
    properties: {
        flowchart: { type: Type.STRING }
    },
    required: ["flowchart"]
};

const prompts: Record<string, any> = {
  en: {
    generate: (participants: string[]) => `
      You are AIScriba. Transcribe audio to 'fullTranscript' and generate structured summary.
      Participants: ${participants.join(', ')}. Language: ENGLISH.
      Flowchart: Simple labels, NO special chars. Output valid JSON.
    `,
    analyzeText: (participants: string[]) => `
      You are AIScriba. Analyze this TRANSCRIPT. Generate structured summary and flowchart.
      Participants: ${participants.join(', ')}. Language: ENGLISH.
      Flowchart: Simple labels, NO special chars. Output valid JSON (exclude fullTranscript).
    `,
    transcribeOnly: "Transcribe audio word-for-word. Output ONLY raw text. No markdown.",
    refine: (currentVerbal: any, refinementPrompt: string) => `Edit JSON. Context: ${JSON.stringify(currentVerbal)}. Request: "${refinementPrompt}". Output valid JSON.`
  },
  it: {
    generate: (participants: string[]) => `
      Sei AIScriba. Trascrivi audio in 'fullTranscript' e genera riassunto.
      Partecipanti: ${participants.join(', ')}. Lingua: ITALIANO.
      Flowchart: Etichette SEMPLICI. NO simboli speciali. Output JSON.
    `,
    analyzeText: (participants: string[]) => `
      Sei AIScriba. Analizza questo TESTO TRASCRITTO. Genera riassunto e diagramma di flusso.
      Partecipanti: ${participants.join(', ')}. Lingua: ITALIANO.
      Flowchart: Etichette SEMPLICI. NO simboli speciali. Output JSON (senza fullTranscript).
    `,
    transcribeOnly: "Trascrivi questo audio parola per parola. Restituisci SOLO il testo grezzo. Niente markdown.",
    refine: (currentVerbal: any, refinementPrompt: string) => `Modifica JSON. Contesto: ${JSON.stringify(currentVerbal)}. Richiesta: "${refinementPrompt}". Output JSON.`
  },
  fr: {
    generate: (participants: string[]) => `Vous êtes AIScriba. Transcrivez et résumez. Langue: FRANÇAIS. Flowchart: Étiquettes simples.`,
    analyzeText: (participants: string[]) => `Analysez ce TEXTE. Résumez et créez un diagramme. Langue: FRANÇAIS.`,
    transcribeOnly: "Transcrivez l'audio mot à mot. Texte brut uniquement.",
    refine: (c:any, r:string) => `Modifier JSON. Contexte: ${JSON.stringify(c)}. Demande: "${r}".`
  },
  de: {
    generate: (participants: string[]) => `Du bist AIScriba. Transkribieren und zusammenfassen. Sprache: DEUTSCH. Flowchart: Einfache Labels.`,
    analyzeText: (participants: string[]) => `Analysiere diesen TEXT. Zusammenfassen und Flussdiagramm. Sprache: DEUTSCH.`,
    transcribeOnly: "Transkribieren Sie Wort für Wort. Nur Rohtext.",
    refine: (c:any, r:string) => `JSON bearbeiten. Kontext: ${JSON.stringify(c)}. Anfrage: "${r}".`
  },
  es: {
    generate: (participants: string[]) => `Eres AIScriba. Transcribe y resume. Idioma: ESPAÑOL. Flowchart: Etiquetas simples.`,
    analyzeText: (participants: string[]) => `Analiza este TEXTO. Resume y crea diagrama. Idioma: ESPAÑOL.`,
    transcribeOnly: "Transcribe palabra por palabra. Solo texto sin formato.",
    refine: (c:any, r:string) => `Editar JSON. Contexto: ${JSON.stringify(c)}. Solicitud: "${r}".`
  },
  zh: {
    generate: (participants: string[]) => `你是 AIScriba。转录并总结。语言：中文。流程图：简单标签。`,
    analyzeText: (participants: string[]) => `分析此文本。总结并创建流程图。语言：中文。`,
    transcribeOnly: "逐字转录音频。仅纯文本。",
    refine: (c:any, r:string) => `编辑 JSON。上下文: ${JSON.stringify(c)}. 请求: "${r}".`
  },
  ar: {
    generate: (participants: string[]) => `أنت AIScriba. انسخ ولخص. اللغة: العربية. المخطط الانسيابي: تسميات بسيطة.`,
    analyzeText: (participants: string[]) => `تحليل هذا النص. تلخيص وإنشاء مخطط انسيابي. اللغة: العربية.`,
    transcribeOnly: "انسخ الصوت كلمة بكلمة. نص خام فقط.",
    refine: (c:any, r:string) => `تعديل JSON. السياق: ${JSON.stringify(c)}. الطلب: "${r}".`
  },
  pt: {
    generate: (participants: string[]) => `Você é AIScriba. Transcreva e resuma. Idioma: PORTUGUÊS. Flowchart: Rótulos simples.`,
    analyzeText: (participants: string[]) => `Analise este TEXTO. Resuma e crie fluxograma. Idioma: PORTUGUÊS.`,
    transcribeOnly: "Transcreva palavra por palavra. Apenas texto puro.",
    refine: (c:any, r:string) => `Editar JSON. Contexto: ${JSON.stringify(c)}. Pedido: "${r}".`
  },
  el: {
    generate: (participants: string[]) => `Είσαι AIScriba. Μεταγραφή και σύνοψη. Γλώσσα: ΕΛΛΗΝΙΚΑ. Flowchart: Απλές ετικέτες.`,
    analyzeText: (participants: string[]) => `Αναλύστε αυτό το ΚΕΙΜΕΝΟ. Σύνοψη και διάγραμμα ροής. Γλώσσα: ΕΛΛΗΝΙΚΑ.`,
    transcribeOnly: "Μεταγραφή λέξη προς λέξη. Μόνο απλό κείμενο.",
    refine: (c:any, r:string) => `Επεξεργασία JSON. Πλαίσιο: ${JSON.stringify(c)}. Αίτημα: "${r}".`
  },
  hi: {
    generate: (participants: string[]) => `आप AIScriba हैं. ट्रांसक्राइब और सारांशित करें. भाषा: हिंदी. फ्लोचार्ट: सरल लेबल.`,
    analyzeText: (participants: string[]) => `इस पाठ का विश्लेषण करें. सारांश और फ्लोचार्ट. भाषा: हिंदी.`,
    transcribeOnly: "शब्द-दर-शब्द प्रतिलेखन. केवल कच्चा पाठ.",
    refine: (c:any, r:string) => `JSON संपादित करें. संदर्भ: ${JSON.stringify(c)}. अनुरोध: "${r}".`
  }
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

const getAiClient = (apiKey: string) => {
    if (!apiKey) throw new Error("API Key mancante. Inseriscila nelle Impostazioni.");
    return new GoogleGenAI({ apiKey });
};

// --- CHUNKING LOGIC ---
const MAX_CHUNK_SIZE_MB = 18; 
const MAX_CHUNK_SIZE_BYTES = MAX_CHUNK_SIZE_MB * 1024 * 1024;

async function transcribeChunk(ai: GoogleGenAI, audioBlob: Blob, lang: string): Promise<string> {
    const audioPart = await fileToGenerativePart(audioBlob);
    const p = getPrompts(lang);
    
    // We use generateContent but specifically ask ONLY for text transcription to keep it fast/cheap
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [ { text: p.transcribeOnly || prompts['en'].transcribeOnly }, audioPart ] },
    });
    
    return response.text || "";
}

export const generateMinutesFromAudio = async (audioBlob: Blob, participants: string[], language: string, apiKey: string): Promise<Verbal> => {
  const ai = getAiClient(apiKey);
  const p = getPrompts(language);

  // 1. Direct generation for small files
  if (audioBlob.size < MAX_CHUNK_SIZE_BYTES) {
      console.log("Audio small, using direct generation.");
      const prompt = p.generate(participants);
      const audioPart = await fileToGenerativePart(audioBlob);

      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: { parts: [ { text: prompt }, audioPart ] },
          config: { responseMimeType: "application/json", responseSchema: verbalSchema },
      });

      const jsonText = response.text;
      if (!jsonText) throw new Error("Risposta vuota dall'IA");
      return JSON.parse(jsonText) as Verbal;
  }

  // 2. Chunking strategy for large files
  console.log("Audio large, using chunking strategy.");
  const chunks: Blob[] = [];
  let start = 0;
  while (start < audioBlob.size) {
      const end = Math.min(start + MAX_CHUNK_SIZE_BYTES, audioBlob.size);
      chunks.push(audioBlob.slice(start, end, audioBlob.type));
      start = end;
  }

  console.log(`Split into ${chunks.length} chunks.`);
  let fullTranscript = "";

  for (let i = 0; i < chunks.length; i++) {
      console.log(`Transcribing chunk ${i + 1}/${chunks.length}...`);
      try {
          const chunkText = await transcribeChunk(ai, chunks[i], language);
          fullTranscript += chunkText + "\n";
      } catch (e) {
          console.error(`Error transcribing chunk ${i}`, e);
          fullTranscript += `[Error transcribing part ${i + 1}]\n`;
      }
  }

  console.log("Transcription complete. Generating summary from text...");
  
  // Use a specialized text-analysis prompt (no audio payload here)
  const analysisPrompt = p.analyzeText ? p.analyzeText(participants) : prompts['en'].analyzeText(participants);
  
  const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [ { text: analysisPrompt }, { text: fullTranscript } ] },
      config: { responseMimeType: "application/json", responseSchema: verbalSummarySchema },
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("Risposta analisi testo vuota");
  
  const summaryData = JSON.parse(jsonText);
  
  return {
      ...summaryData,
      fullTranscript: fullTranscript
  };
};

export const refineMinutes = async (currentVerbal: Verbal, refinementPrompt: string, language: string, apiKey: string): Promise<Verbal> => {
    try {
        const ai = getAiClient(apiKey);
        const { fullTranscript, ...summary } = currentVerbal;
        const contextSummary = { ...summary };
        
        const promptGenerator = getPrompts(language).refine || prompts['en'].refine;
        const prompt = promptGenerator(contextSummary, refinementPrompt);

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: verbalSummarySchema,
            },
        });
        
        const jsonText = response.text;
        if (!jsonText) throw new Error("Risposta vuota dall'IA");
        const refinedSummary = JSON.parse(jsonText) as Omit<Verbal, 'fullTranscript'>;
        return { ...refinedSummary, fullTranscript };

    } catch (error: any) {
        console.error("Refinement error:", error);
         if (error.message.includes("API Key mancante")) throw error;
        throw new Error("Impossibile affinare il verbale.");
    }
};

export const generateFlowchartFromText = async (transcript: string, language: string, apiKey: string): Promise<string> => {
    try {
        const ai = getAiClient(apiKey);
        const prompt = `
          You are an expert at creating process flowcharts from meeting transcripts.
          Analyze the following transcript and generate a Mermaid.js flowchart code that represents the process, decisions, and flow discussed.
          Use simple labels. Do not use special characters (like quotes or brackets) in node IDs.
          Return ONLY valid JSON with a single property 'flowchart' containing the Mermaid code string.
          Target Language: ${language}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: prompt }, { text: transcript }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: flowchartSchema,
            },
        });

        const jsonText = response.text;
        if (!jsonText) throw new Error("Empty response");
        const data = JSON.parse(jsonText);
        return data.flowchart;
    } catch (e: any) {
        console.error("Flowchart generation failed", e);
        if (e.message.includes("API Key")) throw e;
        throw new Error("Failed to generate flowchart");
    }
};
