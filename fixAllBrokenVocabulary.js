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

const targetIndices = [];
for (let i = 0; i < words.length; i++) {
  const w = words[i];
  if (badPatterns.some(p => p.test(w.exampleEn || ''))) {
    targetIndices.push(i);
  }
}

console.log(`Starting fix for ${targetIndices.length} broken words...`);

const BATCH_SIZE = 50;
const batches = [];
for (let i = 0; i < targetIndices.length; i += BATCH_SIZE) {
  batches.push(targetIndices.slice(i, i + BATCH_SIZE));
}

console.log(`Divided into ${batches.length} batches of up to ${BATCH_SIZE} words.`);

async function processBatch(batchIndices, bNum) {
  const items = batchIndices.map(idx => ({
    id: words[idx].id,
    word: words[idx].word,
    meaningTr: words[idx].meaningTr,
    level: words[idx].level
  }));

  const prompt = `You are a Senior Oxford/Cambridge ESL Lexicographer.
For each English vocabulary word below, generate an authentic, meaningful, realistic CEFR example sentence and its Turkish translation.
STRICT REQUIREMENTS:
- NEVER write "in our classroom" or repetitive formulaic filler sentences.
- The sentence must clearly illustrate the word's true meaning in daily life, work, education, travel, or conversation.
- The word MUST appear explicitly in exampleEn with proper grammar and spelling.
- Provide accurate partOfSpeech (noun, verb, adjective, adverb, preposition, conjunction).

Items:
${JSON.stringify(items, null, 2)}`;

  try {
    const res = await ai.models.generateContent({
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
              exampleEn: { type: Type.STRING },
              exampleTr: { type: Type.STRING }
            },
            required: ['id', 'partOfSpeech', 'exampleEn', 'exampleTr']
          }
        }
      }
    });

    const results = JSON.parse(res.text || '[]');
    const map = new Map(results.map(r => [r.id, r]));

    let updated = 0;
    for (const idx of batchIndices) {
      const w = words[idx];
      const match = map.get(w.id);
      if (match && match.exampleEn && !match.exampleEn.toLowerCase().includes('in our classroom')) {
        w.partOfSpeech = match.partOfSpeech || w.partOfSpeech;
        w.exampleEn = match.exampleEn;
        w.exampleTr = match.exampleTr;
        updated++;
      }
    }
    console.log(`[Batch ${bNum}/${batches.length}] Updated ${updated} words.`);
    fs.writeFileSync(jsonPath, JSON.stringify(words, null, 2), 'utf8');
  } catch (err) {
    console.warn(`[Batch ${bNum}] Failed: ${err.message}`);
  }
}

async function run() {
  const CONCURRENCY = 5;
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const chunk = batches.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map((b, idx) => processBatch(b, i + idx + 1)));
  }
  console.log('Finished updating dataset!');
}

run();
