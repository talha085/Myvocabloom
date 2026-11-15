import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../src/data/vocabulary3000.json');
const words = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || 'AQ.Ab8RN6KkCecgLYiT8sBjMcrnBF7O7aoi1SVb6y8w33QinGzPaw';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

const badPatterns = [
  /in our classroom/i,
  /our approach to achieve better results/i,
  /Linguistic virtuosos deftly/i,
  /His discourse was enriched by/i,
  /epistemology seminar delved into/i,
  /I bought a modern/i,
  /I [a-z]+ every day\./i,
  /This is very [a-z]+\./i,
  /The symposium explored/i,
  /The global initiative/i
];

function getBrokenIndices() {
  const indices = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (badPatterns.some(p => p.test(w.exampleEn || ''))) {
      indices.push(i);
    }
  }
  return indices;
}

const brokenIndices = getBrokenIndices();
console.log(`Found ${brokenIndices.length} broken words remaining.`);

if (brokenIndices.length === 0) {
  console.log('All words already enhanced!');
  process.exit(0);
}

const BATCH_SIZE = 35;
const batches = [];
for (let i = 0; i < brokenIndices.length; i += BATCH_SIZE) {
  batches.push(brokenIndices.slice(i, i + BATCH_SIZE));
}

console.log(`Split into ${batches.length} batches of up to ${BATCH_SIZE} words.`);

async function processBatchWithRetry(batchIndices, batchNum, retries = 3) {
  const items = batchIndices.map(idx => ({
    id: words[idx].id,
    word: words[idx].word,
    meaningTr: words[idx].meaningTr,
    level: words[idx].level
  }));

  const prompt = `You are an expert Oxford/Cambridge ESL lexicographer.
For each vocabulary entry below, provide:
1. partOfSpeech: The accurate part of speech (noun, verb, adjective, adverb, preposition, conjunction, pronoun).
2. exampleEn: A natural, authentic, grammatically correct example sentence using the word in its genuine meaning for CEFR level ${items[0].level}. The sentence must be meaningful, realistic, and make complete sense.
3. exampleTr: Accurate and natural Turkish translation of exampleEn.
4. definitionEn: A simple and accurate English definition.

Words to process:
${JSON.stringify(items, null, 2)}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                partOfSpeech: { type: Type.STRING },
                definitionEn: { type: Type.STRING },
                exampleEn: { type: Type.STRING },
                exampleTr: { type: Type.STRING }
              },
              required: ['id', 'partOfSpeech', 'exampleEn', 'exampleTr']
            }
          }
        }
      });

      const parsed = JSON.parse(response.text || '[]');
      const resultMap = new Map();
      for (const item of parsed) {
        if (item.id && item.exampleEn) {
          resultMap.set(item.id, item);
        }
      }

      let applied = 0;
      for (const idx of batchIndices) {
        const w = words[idx];
        const res = resultMap.get(w.id);
        if (res) {
          w.partOfSpeech = res.partOfSpeech || w.partOfSpeech;
          w.exampleEn = res.exampleEn;
          w.exampleTr = res.exampleTr;
          if (res.definitionEn) w.definitionEn = res.definitionEn;
          applied++;
        }
      }

      // Save immediately to preserve progress
      fs.writeFileSync(jsonPath, JSON.stringify(words, null, 2), 'utf8');
      console.log(`[Batch ${batchNum}/${batches.length}] Applied ${applied}/${batchIndices.length} updates and saved.`);
      return;
    } catch (err) {
      console.warn(`[Batch ${batchNum}] Attempt ${attempt} error: ${err.message}`);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }
}

async function run() {
  const CONCURRENCY = 4;
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const chunk = batches.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map((b, idx) => processBatchWithRetry(b, i + idx + 1))
    );
  }
  console.log('All remaining broken words enhanced and saved successfully!');
}

run().catch(err => {
  console.error('Fatal enhancement error:', err);
  process.exit(1);
});
