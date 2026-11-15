/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { GUIDE_SYSTEM_INSTRUCTION, getGuideAgentFallback } from '../../src/utils/guideKnowledgeBase.ts';

dotenv.config();

// Read API key strictly from process.env.GEMINI_API_KEY on the server
export function getApiKey(): string {
  return process.env.GEMINI_API_KEY || '';
}

export const apiKey = getApiKey();

let cachedAi: GoogleGenAI | null = null;
let cachedKey = '';

export function getAiClient(): GoogleGenAI {
  const key = getApiKey();
  if (!cachedAi || cachedKey !== key) {
    cachedKey = key;
    cachedAi = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAi;
}

function getBody(req: Request): Record<string, any> {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

// Timeout helper to guarantee fast responses under all network conditions
export async function withTimeout<T>(promise: Promise<T>, ms: number = 8000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Operation timed out')), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Helper to generate a coherent 50-60 word paragraph that contextually weaves 100% of the selected words cleanly.
 */
export function buildFullContextualFallback(words: string[], level: string = 'A1', topic: string = 'general') {
  const cleanWords = words.map((w) => w.trim()).filter(Boolean);
  const n = cleanWords.length;

  if (n === 0) {
    const fallbackEn = `In our inspiring ${level} classroom, learning English is always a wonderful journey. Every single day, students practice together in cheerful morning dialogues. Through consistent vocabulary exploration, our communication blossoms with immense confidence and lasting enthusiasm.`;
    const fallbackTr = `İlham verici ${level} sınıfımızda İngilizce öğrenmek her zaman harika bir yolculuktur. Her gün öğrenciler neşeli sabah diyaloglarında birlikte pratik yapar. Düzenli kelime keşfiyle iletişimimiz büyük bir özgüven ve kalıcı bir hevesle çiçek açar.`;
    return {
      title: `Learning in Context (${level})`,
      paragraphEn: fallbackEn,
      paragraphTr: fallbackTr,
      wordCount: fallbackEn.split(/\s+/).filter(Boolean).length,
      usedWords: [],
    };
  }

  const p1 = cleanWords.slice(0, Math.ceil(n / 3));
  const p2 = cleanWords.slice(Math.ceil(n / 3), Math.ceil((2 * n) / 3));
  const p3 = cleanWords.slice(Math.ceil((2 * n) / 3));

  const formatList = (arr: string[]) => {
    if (arr.length === 0) return '';
    if (arr.length === 1) return arr[0];
    if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
    return `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`;
  };

  const f1 = formatList(p1);
  const f2 = formatList(p2);
  const f3 = formatList(p3);

  const paragraphEn = `In our inspiring ${level} classroom, learning English is always a wonderful journey. Today, students actively practice using ${f1} during cheerful morning dialogues. We also explore how ${f2} connect naturally to everyday conversations. Finally, understanding ${f3} helps our language communication blossom with immense confidence and lasting enthusiasm.`;

  const paragraphTr = `İlham verici ${level} sınıfımızda İngilizce öğrenmek her zaman harika bir yolculuktur. Bugün öğrenciler, neşeli sabah diyalogları sırasında ${f1} kelimelerini aktif olarak kullanarak pratik yapıyor. Ayrıca ${f2} kelimelerinin günlük konuşmalara doğal olarak nasıl bağlandığını keşfediyoruz. Son olarak ${f3} kelimelerini anlamak, dil iletişimimizin büyük bir özgüven ve kalıcı bir hevesle çiçek açmasına yardımcı oluyor.`;

  const wordCount = paragraphEn.split(/\s+/).filter(Boolean).length;

  return {
    title: `Contextual Journey in ${topic.charAt(0).toUpperCase() + topic.slice(1)} (${level})`,
    paragraphEn,
    paragraphTr,
    wordCount,
    usedWords: cleanWords,
  };
}

/**
 * Check if a word or its stem exists in text (case-insensitive, whole-word or with common inflections)
 */
export function isWordPresentInText(word: string, text: string): boolean {
  if (!word || !text) return false;
  const escaped = word.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}(s|es|ed|ing|d|ly)?\\b`, 'i');
  return regex.test(text);
}

// ---------------------------------------------------------------------------
// ENDPOINT HANDLERS
// ---------------------------------------------------------------------------

export async function handleHealth(_req: Request, res: Response) {
  return res.json({ status: 'ok', hasKey: Boolean(getApiKey()) });
}

export async function handleGenerateVocabulary(req: Request, res: Response) {
  try {
    const { word, level = 'A1' } = getBody(req);
    if (!word) {
      return res.status(400).json({ error: 'word parameter is required' });
    }

    if (!getApiKey()) {
      return res.json({
        text: `"${word}" (${level}): Bu kelime hedeflenen CEFR ${level} seviyesinde yaygın olarak kullanılır. Örnek: "Consistent practice with ${word} brings fluency."`,
      });
    }

    const prompt = `CEFR ${level} seviyesindeki "${word}" kelimesi için Türkçe açıklama ve 2 adet İngilizce örnek cümle (Türkçe çevirileriyle birlikte) oluştur.`;
    const response = await withTimeout(
      getAiClient().models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
      }),
      8000
    );

    const text = response.text || `"${word}" (${level}): İngilizce kelime açıklaması.`;
    return res.json({ text });
  } catch (error: any) {
    console.error('generate-vocabulary error:', error);
    const { word = 'kelime', level = 'A1' } = getBody(req);
    return res.json({
      text: `"${word}" (${level}): Bu kelime hedeflenen CEFR ${level} seviyesinde yaygın olarak kullanılır. Örnek: "Consistent practice with ${word} brings fluency."`,
    });
  }
}

export async function handleGenerateWords(req: Request, res: Response) {
  try {
    const { level = 'A1', topic = 'general' } = getBody(req);

    if (!getApiKey()) {
      return res.json({
        words: [
          {
            word: level === 'A1' ? 'inspire' : level === 'A2' ? 'encourage' : level === 'B1' ? 'collaborate' : level === 'B2' ? 'innovate' : 'exemplify',
            phonetic: '/ɪnˈspaɪər/',
            partOfSpeech: 'verb',
            level,
            meaningTr: 'ilham vermek, esinlendirmek',
            definitionEn: 'to fill someone with the urge or ability to do or feel something creative',
            exampleEn: 'Great teachers inspire students to blossom in learning.',
            exampleTr: 'Harika öğretmenler öğrencilerine öğrenmede çiçek açmaları için ilham verir.',
            collocations: ['inspire creativity', 'inspire confidence'],
          },
        ],
      });
    }

    const prompt = `You are an expert English language pedagogue for the platform My VocaBloom.
Generate 3 distinct English vocabulary words strictly for CEFR level ${level} on the topic of "${topic}".
Return words with pronunciation, part of speech, Turkish meaning, English definition, example sentences, and collocations.`;

    const response = await withTimeout(
      getAiClient().models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                phonetic: { type: Type.STRING },
                partOfSpeech: { type: Type.STRING },
                meaningTr: { type: Type.STRING },
                definitionEn: { type: Type.STRING },
                exampleEn: { type: Type.STRING },
                exampleTr: { type: Type.STRING },
                collocations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['word', 'phonetic', 'partOfSpeech', 'meaningTr', 'definitionEn', 'exampleEn', 'exampleTr'],
            },
          },
        },
      }),
      8000
    );

    const parsed = JSON.parse(response.text || '[]');
    const words = parsed.map((item: any) => ({ ...item, level }));
    return res.json({ words });
  } catch (error: any) {
    console.error('generate-words error:', error);
    const { level = 'A1' } = getBody(req);
    return res.json({
      words: [
        {
          word: 'achieve',
          phonetic: '/əˈtʃiːv/',
          partOfSpeech: 'verb',
          level,
          meaningTr: 'başarmak, elde etmek',
          definitionEn: 'successfully reach a desired objective or result by effort',
          exampleEn: 'With consistent practice, you will achieve your language goals.',
          exampleTr: 'Düzenli pratikle dil hedeflerinizi başaracaksınız.',
          collocations: ['achieve a goal', 'achieve success'],
        },
      ],
    });
  }
}

export async function handleGenerateStory(req: Request, res: Response) {
  try {
    const { words = [], level = 'A1' } = getBody(req);

    if (!getApiKey() || !words.length) {
      return res.json({
        title: 'A Blossoming Morning',
        storyEn: `Every day in the language academy is a journey. When students have courage and daily practice, their knowledge begins to blossom like flowers in spring.`,
        storyTr: `Dil akademisindeki her gün bir yolculuktur. Öğrenciler cesarete ve günlük pratiğe sahip olduklarında, bilgileri ilkbaharda çiçekler gibi açmaya başlar.`,
      });
    }

    const prompt = `Write a short, engaging 3-sentence English story suitable for CEFR level ${level}.
Incorporate these vocabulary words naturally: ${words.join(', ')}.`;

    const response = await withTimeout(
      getAiClient().models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              storyEn: { type: Type.STRING },
              storyTr: { type: Type.STRING },
            },
            required: ['title', 'storyEn', 'storyTr'],
          },
        },
      }),
      8000
    );

    const story = JSON.parse(response.text || '{}');
    return res.json(story);
  } catch (error: any) {
    console.error('generate-story error:', error);
    return res.json({
      title: 'Learning Together',
      storyEn: `Studying English opens wonderful doors. Through consistent practice, our vocabulary grows stronger every day.`,
      storyTr: `İngilizce öğrenmek harika kapılar açar. Düzenli pratikle kelime dağarcığımız her gün daha da güçlenir.`,
    });
  }
}

export async function handleGenerateContextualParagraph(req: Request, res: Response) {
  try {
    const { words = [], level = 'A1', topic = 'general' } = getBody(req);

    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'words array is required' });
    }

    const selectedWords: string[] = words.slice(0, 10).map((w: string) => String(w).trim()).filter(Boolean);

    if (!getApiKey()) {
      return res.json(buildFullContextualFallback(selectedWords, level, topic));
    }

    const prompt = `You are an elite CEFR English teacher.
The student has selected these ${selectedWords.length} vocabulary words: ${selectedWords.map((w) => `"${w}"`).join(', ')}.
Your task is to write an engaging, natural, grammatically flawless paragraph of EXACTLY 50 to 60 words total at CEFR level ${level} on the topic of "${topic}".
EVERY SINGLE ONE of the ${selectedWords.length} target words MUST be naturally woven into the text.
Provide Turkish translation, exact word count, and context analysis for each word.`;

    const response = await withTimeout(
      getAiClient().models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              paragraphEn: { type: Type.STRING },
              paragraphTr: { type: Type.STRING },
              wordCount: { type: Type.INTEGER },
              usedWords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              contextBreakdown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    sentenceEn: { type: Type.STRING },
                    sentenceTr: { type: Type.STRING },
                    usageRole: { type: Type.STRING },
                  },
                  required: ['word', 'sentenceEn', 'sentenceTr', 'usageRole'],
                },
              },
            },
            required: ['title', 'paragraphEn', 'paragraphTr', 'wordCount', 'usedWords', 'contextBreakdown'],
          },
        },
      }),
      8500
    );

    const jsonText = (response.text ?? '').trim();
    if (!jsonText) {
      return res.json(buildFullContextualFallback(selectedWords, level, topic));
    }

    const parsed = JSON.parse(jsonText);
    const missingWords = selectedWords.filter((w) => !isWordPresentInText(w, parsed.paragraphEn || ''));

    if (missingWords.length > 0) {
      return res.json(buildFullContextualFallback(selectedWords, level, topic));
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('generate-contextual-paragraph error:', error);
    const { words = [], level = 'A1', topic = 'general' } = getBody(req);
    const wordList = Array.isArray(words) ? words.slice(0, 10) : [];
    return res.json(buildFullContextualFallback(wordList, level, topic));
  }
}

export async function handleGuideAgent(req: Request, res: Response) {
  try {
    const {
      message,
      chatHistory = [],
      userRole = 'guest',
      userName = '',
      userClassCode = '',
      currentView = 'home',
    } = getBody(req);

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message parameter is required' });
    }

    if (!getApiKey()) {
      return res.json(getGuideAgentFallback(message, userRole));
    }

    const recentHistoryText = Array.isArray(chatHistory)
      ? chatHistory.slice(-6).map((m: any) => `${m.role === 'user' ? 'Kullanıcı' : 'Rehber Asistan'}: ${m.text}`).join('\n')
      : '';

    const contextHeader = `Kullanıcı Durumu:
- Mevcut Rol: ${userRole}
- Kullanıcı Adı: ${userName || 'Belirtilmedi'}
- Sınıf Kodu: ${userClassCode || 'Yok'}
- Görüntülenen Sayfa: ${currentView}

${recentHistoryText ? `Önceki Sohbet Geçmişi:\n${recentHistoryText}\n` : ''}
Kullanıcının Yeni Sorusu: "${message}"`;

    const response = await withTimeout(
      getAiClient().models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: contextHeader,
        config: {
          systemInstruction: GUIDE_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: {
                type: Type.STRING,
                description: 'Short, direct Turkish guide answer strictly adhering to the system rules.',
              },
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 3 short follow-up questions the user can tap next.',
              },
              shortcutAction: {
                type: Type.STRING,
                description: 'Optional shortcut action code if relevant, or empty string.',
              },
            },
            required: ['answer', 'suggestions'],
          },
        },
      }),
      8500
    );

    const jsonText = (response.text ?? '').trim();
    if (jsonText) {
      const parsed = JSON.parse(jsonText);
      return res.json({
        answer: parsed.answer || 'Sorunuzla ilgili bilgilere rehberimizden ulaşabilirsiniz.',
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
        shortcutAction: parsed.shortcutAction || undefined,
      });
    }

    return res.json(getGuideAgentFallback(message, userRole));
  } catch (error: any) {
    console.error('guide-agent error:', error);
    const { message = '', userRole = 'guest' } = getBody(req);
    return res.json(getGuideAgentFallback(message, userRole));
  }
}

export async function handleStream(req: Request, res: Response) {
  try {
    const { prompt, systemInstruction } = getBody(req);
    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    if (!getApiKey()) {
      res.write(`data: ${JSON.stringify({ text: 'Harika bir öğrenme serüveni başlıyor! Düzenli kelime tekrarı dili akıcı kılar.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const responseStream = await getAiClient().models.generateContentStream({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Streaming error, delivering educational fallback:', error);
    res.write(`data: ${JSON.stringify({ text: 'Düzenli pratik ve kelime tekrarları ile dil öğrenme yolculuğunuz başarıyla ilerliyor.' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

// ---------------------------------------------------------------------------
// EXPRESS ROUTER (supports both /api/* and root paths)
// ---------------------------------------------------------------------------

export const router = Router();

router.get('/health', handleHealth);
router.get('/api/health', handleHealth);

router.post('/gemini/generate-vocabulary', handleGenerateVocabulary);
router.post('/api/gemini/generate-vocabulary', handleGenerateVocabulary);

router.post('/gemini/generate-words', handleGenerateWords);
router.post('/api/gemini/generate-words', handleGenerateWords);

router.post('/gemini/generate-story', handleGenerateStory);
router.post('/api/gemini/generate-story', handleGenerateStory);

router.post('/gemini/generate-contextual-paragraph', handleGenerateContextualParagraph);
router.post('/api/gemini/generate-contextual-paragraph', handleGenerateContextualParagraph);

router.post('/gemini/guide-agent', handleGuideAgent);
router.post('/api/gemini/guide-agent', handleGuideAgent);

router.post('/gemini/stream', handleStream);
router.post('/api/gemini/stream', handleStream);
