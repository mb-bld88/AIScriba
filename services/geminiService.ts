
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

// Prompts for all supported languages
const prompts: Record<string, any> = {
  en: {
    generate: (participants: string[]) => `
      You are AIScriba, an expert minute-taker. 
      1. Transcribe the audio word-for-word into 'fullTranscript'.
      2. Generate a structured summary.
      3. Participants: ${participants.join(', ')}.
      4. Language: ENGLISH.
      5. Flowchart (Mermaid graph TD): Use extremely simple labels (A, B, C or 1-2 words max). NO special chars like colon, quotes, or brackets inside labels.
      6. Output valid JSON.
    `,
    refine: (currentVerbal: any, refinementPrompt: string) => `Edit JSON. Context: ${JSON.stringify(currentVerbal)}. Request: "${refinementPrompt}". Output valid JSON.`
  },
  it: {
    generate: (participants: string[]) => `
      Sei AIScriba.
      1. Trascrivi audio in 'fullTranscript'.
      2. Genera riassunto.
      3. Partecipanti: ${participants.join(', ')}.
      4. Lingua: ITALIANO.
      5. Flowchart (Mermaid graph TD): Usa etichette SEMPLICI. Solo lettere/numeri. NO simboli speciali (due punti, virgolette, parentesi) nei testi dei nodi.
      6. Output JSON valido.
    `,
    refine: (currentVerbal: any, refinementPrompt: string) => `Modifica JSON. Contesto: ${JSON.stringify(currentVerbal)}. Richiesta: "${refinementPrompt}". Output JSON.`
  },
  fr: {
    generate: (participants: string[]) => `
      Vous êtes AIScriba.
      1. Transcrivez l'audio dans 'fullTranscript'.
      2. Générez un résumé structuré.
      3. Participants: ${participants.join(', ')}.
      4. Langue: FRANÇAIS.
      5. Flowchart: Étiquettes SIMPLES. Pas de caractères spéciaux.
      6. Output JSON valide.
    `,
    refine: (currentVerbal: any, refinementPrompt: string) => `Modifier JSON. Contexte: ${JSON.stringify(currentVerbal)}. Demande: "${refinementPrompt}". Output JSON.`
  },
  de: {
    generate: (participants: string[]) => `
      Du bist AIScriba.
      1. Transkribiere Audio in 'fullTranscript'.
      2. Erstelle eine Zusammenfassung.
      3. Teilnehmer: ${participants.join(', ')}.
      4. Sprache: DEUTSCH.
      5. Flowchart: EINFACHE Labels. Keine Sonderzeichen.
      6. Output gültiges JSON.
    `,
    refine: (currentVerbal: any, refinementPrompt: string) => `JSON bearbeiten. Kontext: ${JSON.stringify(currentVerbal)}. Anfrage: "${refinementPrompt}". Output JSON.`
  },
  es: {
    generate: (participants: string[]) => `
      Eres AIScriba.
      1. Transcribe el audio en 'fullTranscript'.
      2. Genera un resumen.
      3. Participantes: ${participants.join(', ')}.
      4. Idioma: ESPAÑOL.
      5. Flowchart: Etiquetas SIMPLES. Sin caracteres especiales.
      6. Output JSON válido.
    `,
    refine: (currentVerbal: any, refinementPrompt: string) => `Editar JSON. Contexto: ${JSON.stringify(currentVerbal)}. Solicitud: "${refinementPrompt}". Output JSON.`
  },
  zh: {
    generate: (participants: string[]) => `
      你是 AIScriba。
      1. 将音频逐字转录为 'fullTranscript'。
      2. 生成结构化摘要。
      3. 参与者: ${participants.join(', ')}.
      4. 语言: 中文 (Chinese).
      5. 流程图: 使用非常简单的标签。无特殊字符。
      6. 输出有效的 JSON。
    `,
    refine: (currentVerbal: any, refinementPrompt: string) => `编辑 JSON。上下文: ${JSON.stringify(currentVerbal)}. 请求: "${refinementPrompt}". 输出 JSON.`
  },
  ar: {
    generate: (participants: string[]) => `
      أنت AIScriba.
      1. انسخ الصوت كلمة بكلمة في 'fullTranscript'.
      2. إنشاء ملخص منظم.
      3. المشاركون: ${participants.join(', ')}.
      4. اللغة: العربية (Arabic).
      5. مخطط انسيابي: استخدم تسميات بسيطة جداً. لا رموز خاصة.
      6. إخراج JSON صالح.
    `,
    refine: (currentVerbal: any, refinementPrompt: string) => `تعديل JSON. السياق: ${JSON.stringify(currentVerbal)}. الطلب: "${refinementPrompt}". إخراج JSON.`
  },
  pt: {
    generate: (participants: string[]) => `
      Você é AIScriba.
      1. Transcreva o áudio em 'fullTranscript'.
      2. Gere um resumo.
      3. Participantes: ${participants.join(', ')}.
      4. Idioma: PORTUGUÊS.
      5. Flowchart: Rótulos SIMPLES. Sem caracteres especiais.
      6. Output JSON válido.
    `,
    refine: (currentVerbal: any, refinementPrompt: string) => `Editar JSON. Contexto: ${JSON.stringify(currentVerbal)}. Pedido: "${refinementPrompt}". Output JSON.`
  },
  el: {
    generate: (participants: string[]) => `
      Είσαι ο AIScriba.
      1. Μεταγραφή ήχου σε 'fullTranscript'.
      2. Δημιουργία σύνοψης.
      3. Συμμετέχοντες: ${participants.join(', ')}.
      4. Γλώσσα: ΕΛΛΗΝΙΚΑ (Greek).
      5. Flowchart: ΑΠΛΕΣ ετικέτες. Όχι ειδικοί χαρακτήρες.
      6. Output έγκυρο JSON.
    `,
    refine: (currentVerbal: any, refinementPrompt: string) => `Επεξεργασία JSON. Πλαίσιο: ${JSON.stringify(currentVerbal)}. Αίτημα: "${refinementPrompt}". Output JSON.`
  },
  hi: {
    generate: (participants: string[]) => `
      आप AIScriba हैं.
      1. ऑडियो को 'fullTranscript' में ट्रांसक्राइब करें.
      2. सारांश उत्पन्न करें.
      3. प्रतिभागी: ${participants.join(', ')}.
      4. भाषा: हिंदी (Hindi).
      5. फ्लोचार्ट: सरल लेबल का प्रयोग करें. कोई विशेष वर्ण नहीं.
      6. मान्य JSON आउटपुट करें.
    `,
    refine: (currentVerbal: any, refinementPrompt: string) => `JSON संपादित करें. संदर्भ: ${JSON.stringify(currentVerbal)}. अनुरोध: "${refinementPrompt}". मान्य JSON.`
  }
};

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
    if (!apiKey) {
        throw new Error("API Key mancante. Inseriscila nelle Impostazioni.");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateMinutesFromAudio = async (audioBlob: Blob, participants: string[], language: string, apiKey: string): Promise<Verbal> => {
  try {
    const ai = getAiClient(apiKey);
    // Fallback to English if language prompt is not defined
    const promptGenerator = prompts[language]?.generate || prompts['en'].generate;
    const prompt = promptGenerator(participants);
    
    const audioPart = await fileToGenerativePart(audioBlob);

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [ { text: prompt }, audioPart ] },
        config: {
            responseMimeType: "application/json",
            responseSchema: verbalSchema,
        },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Risposta vuota dall'IA");
    return JSON.parse(jsonText) as Verbal;

  } catch (error: any) {
    console.error("Error generating minutes:", error);
    if (error.message.includes("API Key mancante")) throw error;
    throw new Error("Impossibile generare il verbale. Verifica la chiave API e riprova.");
  }
};

export const refineMinutes = async (currentVerbal: Verbal, refinementPrompt: string, language: string, apiKey: string): Promise<Verbal> => {
    try {
        const ai = getAiClient(apiKey);
        const { fullTranscript, ...summary } = currentVerbal;
        const contextSummary = { ...summary };
        
        const promptGenerator = prompts[language]?.refine || prompts['en'].refine;
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
