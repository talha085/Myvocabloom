/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CEFRLevel, VocabWord } from '../types';

/**
 * Client-side Gemini service that proxies all AI calls through the secure server backend.
 * Zero API keys are stored or exposed in the browser bundle.
 */

/**
 * Generate CEFR vocabulary explanation and 2 example sentences via server proxy.
 */
export const generateVocabulary = async (word: string, level: string = 'A1'): Promise<string | undefined> => {
  try {
    const res = await fetch('/api/gemini/generate-vocabulary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, level }),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    return data.text;
  } catch (error) {
    console.error('generateVocabulary error:', error);
    return `"${word}" (${level}): Bu kelime hedeflenen CEFR ${level} seviyesinde yaygın olarak kullanılır. Örnek: "Consistent practice with ${word} brings fluency."`;
  }
};

/**
 * Generate CEFR level vocabulary words using server proxy.
 */
export async function generateVocabularyWithAI(
  level: CEFRLevel,
  topic: string = 'general'
): Promise<Partial<VocabWord>[]> {
  try {
    const res = await fetch('/api/gemini/generate-words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, topic }),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    if (data.words && Array.isArray(data.words)) {
      return data.words;
    }
    throw new Error('Invalid words payload');
  } catch (error) {
    console.error('generateVocabularyWithAI error, using fallback:', error);
    return [
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
    ];
  }
}

/**
 * Generate a short reading story with target words using server proxy.
 */
export async function generateMiniStory(
  words: string[],
  level: CEFRLevel
): Promise<{ title: string; storyEn: string; storyTr: string }> {
  try {
    const res = await fetch('/api/gemini/generate-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words, level }),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    if (data.title && data.storyEn) {
      return data;
    }
    throw new Error('Invalid story payload');
  } catch (err) {
    console.error('generateMiniStory error:', err);
    return {
      title: 'Learning Together',
      storyEn: `Studying English opens wonderful doors. Through consistent practice, our vocabulary grows stronger every day.`,
      storyTr: `İngilizce öğrenmek harika kapılar açar. Düzenli pratikle kelime dağarcığımız her gün daha da güçlenir.`,
    };
  }
}

export interface ContextWordAnalysis {
  word: string;
  sentenceEn: string;
  sentenceTr: string;
  usageTip: string;
}

export interface ContextualParagraphResult {
  title: string;
  paragraphEn: string;
  paragraphTr: string;
  wordCount: number;
  usedWords: string[];
  contextBreakdown?: ContextWordAnalysis[];
}

/**
 * Generate a cohesive 50-60 word English paragraph with 5-10 selected vocabulary words
 */
export async function generateContextualParagraph(
  words: string[],
  level: CEFRLevel = 'A1',
  topic: string = 'general'
): Promise<ContextualParagraphResult> {
  try {
    const res = await fetch('/api/gemini/generate-contextual-paragraph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words, level, topic }),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    if (data.paragraphEn && data.paragraphTr) {
      return data;
    }
    throw new Error('Invalid paragraph payload');
  } catch (err) {
    console.error('generateContextualParagraph error, using fallback:', err);
    const wordList = words.slice(0, 10);
    const joinedWords = wordList.join(', ');
    const fallbackEn = `During our ${level} classroom study, we focused on ${joinedWords}. Through active daily practice, students master meaningful expressions that empower their English communication with great confidence and joyful progress.`;
    const count = fallbackEn.split(/\s+/).filter(Boolean).length;
    return {
      title: `Learning in Context (${level})`,
      paragraphEn: fallbackEn,
      paragraphTr: `${level} sınıf çalışmamız sırasında ${joinedWords} kelimelerine odaklandık. Günlük aktif pratikle öğrenciler, İngilizce iletişimlerini büyük bir özgüven ve neşeyle güçlendiren anlamlı ifadelerde ustalaşırlar.`,
      wordCount: count,
      usedWords: wordList,
    };
  }
}

/**
 * Client-side Server-Sent Events (SSE) streaming helper for real-time text generation.
 */
export async function streamGeminiContent(
  prompt: string,
  onChunk: (chunk: string) => void,
  systemInstruction?: string
): Promise<string> {
  const response = await fetch('/api/gemini/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemInstruction }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Stream request failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.text) {
            fullText += parsed.text;
            onChunk(parsed.text);
          }
        } catch {
          // parse error ignored
        }
      }
    }
  }

  return fullText;
}

/**
 * Real-time Live API WebSocket connection helper for audio & voice streaming.
 */
export function connectGeminiLiveSession(callbacks: {
  onAudio?: (base64Audio: string) => void;
  onText?: (text: string) => void;
  onInterrupted?: () => void;
  onError?: (error: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
}): {
  sendAudioChunk: (base64Audio: string) => void;
  sendTextMessage: (text: string) => void;
  close: () => void;
} {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/api/gemini/live`;
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    callbacks.onOpen?.();
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.audio) callbacks.onAudio?.(msg.audio);
      if (msg.text) callbacks.onText?.(msg.text);
      if (msg.interrupted) callbacks.onInterrupted?.();
      if (msg.error) callbacks.onError?.(msg.error);
    } catch (e) {
      console.error('Failed to parse incoming live message:', e);
    }
  };

  ws.onerror = (err) => {
    console.error('Live WebSocket error:', err);
    callbacks.onError?.('Live connection error');
  };

  ws.onclose = () => {
    callbacks.onClose?.();
  };

  return {
    sendAudioChunk: (base64Audio: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ audio: base64Audio }));
      }
    },
    sendTextMessage: (text: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ text }));
      }
    },
    close: () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    },
  };
}

export interface GuideAgentResponse {
  answer: string;
  suggestions: string[];
  shortcutAction?: string;
}

/**
 * Ask the VocaBloom Guide Agent how to use any part of the application.
 */
export async function askGuideAgent(params: {
  message: string;
  chatHistory?: { role: 'user' | 'model'; text: string }[];
  userRole?: string;
  userName?: string;
  userClassCode?: string;
  currentView?: string;
}): Promise<GuideAgentResponse> {
  try {
    const res = await fetch('/api/gemini/guide-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    return {
      answer: data.answer || 'Sorunuzla ilgili bilgilere rehberimizden ulaşabilirsiniz.',
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      shortcutAction: data.shortcutAction,
    };
  } catch (error) {
    console.error('askGuideAgent error, falling back to local guide KB:', error);
    const { getGuideAgentFallback } = await import('../utils/guideKnowledgeBase');
    return getGuideAgentFallback(params.message, params.userRole);
  }
}
