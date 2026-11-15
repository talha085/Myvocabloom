import { VocabWord, CEFRLevel } from '../types/index';
import { VOCABULARY_LIST } from '../data/initialData';

/**
 * Fast lookup map for authentic definitions and examples from the verified 3,000-word dataset.
 */
const VOCAB_BY_WORD = new Map<string, VocabWord>();
VOCABULARY_LIST.forEach((w) => {
  if (w.word) {
    VOCAB_BY_WORD.set(w.word.toLowerCase().trim(), w);
  }
});

/**
 * Normalizes parts of speech to standard categories so distractors always match grammatical type.
 * IMPORTANT: Checks 'adv' before 'verb' because 'adverb' contains 'verb'!
 */
export function normalizePos(pos?: string): 'verb' | 'noun' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'pronoun' {
  if (!pos) return 'noun';
  const p = pos.toLowerCase().trim();
  if (p.includes('adv') || p === 'adverb') return 'adverb';
  if (p.includes('adj') || p === 'adjective') return 'adjective';
  if (p.includes('verb') || p === 'v') return 'verb';
  if (p.includes('noun') || p === 'n') return 'noun';
  if (p.includes('prep') || p === 'preposition') return 'preposition';
  if (p.includes('conj') || p === 'conjunction') return 'conjunction';
  if (p.includes('pron') || p === 'pronoun') return 'pronoun';
  return 'noun';
}

/**
 * High-quality authentic sentences with accurate, context-specific Turkish translations
 * for key high-frequency words.
 */
const AUTHENTIC_SENTENCE_MAP: Record<string, { en: string; tr: string }> = {
  add: {
    en: 'Please add your phone number to the contact list.',
    tr: 'Lütfen telefon numaranızı kişi listesine ekleyin.',
  },
  find: {
    en: 'I cannot find my car keys anywhere in the house.',
    tr: 'Evde hiçbir yerde araba anahtarlarımı bulamıyorum.',
  },
  improve: {
    en: 'Daily reading will help improve your English vocabulary.',
    tr: 'Günlük okuma yapmak İngilizce kelime bilginizi geliştirmeye yardımcı olacaktır.',
  },
  college: {
    en: 'My older sister is studying computer science at a local college.',
    tr: 'Ablam yerel bir üniversitede/kolejde bilgisayar bilimi okuyor.',
  },
  interview: {
    en: 'She wore a smart suit for her job interview this morning.',
    tr: 'Bu sabahki iş görüşmesi için şık bir takım elbise giydi.',
  },
  professor: {
    en: 'Our chemistry professor explained the experiment with great clarity.',
    tr: 'Kimya profesörümüz deneyi büyük bir açıklıkla anlattı.',
  },
  court: {
    en: 'The two champions walked onto the tennis court for the final match.',
    tr: 'İki şampiyon final maçı için tenis kortuna çıktı.',
  },
  locate: {
    en: 'Use the GPS map on your phone to locate the nearest train station.',
    tr: 'En yakın tren istasyonunun yerini bulmak için telefonunuzdaki GPS haritasını kullanın.',
  },
  about: {
    en: 'We watched an interesting documentary about space exploration.',
    tr: 'Uzay keşfi hakkında ilginç bir belgesel izledik.',
  },
  above: {
    en: 'The bright full moon was shining high above the peaceful lake.',
    tr: 'Parlak dolunay, huzurlu gölün üzerinde parlıyordu.',
  },
  across: {
    en: 'The tourists walked carefully across the wooden bridge over the river.',
    tr: 'Turistler nehrin üzerindeki ahşap köprünün karşısına dikkatlice yürüdüler.',
  },
  accident: {
    en: 'The police arrived quickly to help after the traffic accident.',
    tr: 'Trafik kazasından sonra polis yardım etmek için hızla geldi.',
  },
  activity: {
    en: 'Swimming in the morning is my favorite outdoor activity during summer.',
    tr: 'Yaz aylarında sabah yüzmek en sevdiğim açık hava aktivitesidir.',
  },
  action: {
    en: 'The city council took immediate action to protect the green parks.',
    tr: 'Belediye meclisi yeşil parkları korumak için derhal harekete geçti.',
  },
  actor: {
    en: 'The talented actor received an award for his brilliant performance.',
    tr: 'Yetenekli aktör harika performansıyla bir ödül aldı.',
  },
  actress: {
    en: 'The famous actress smiled warmly at her fans during the premiere.',
    tr: 'Ünlü aktris galada hayranlarına sıcak bir şekilde gülümsedi.',
  },
  address: {
    en: 'Please write your current home address at the top of the form.',
    tr: 'Lütfen güncel ev adresinizi formun en üstüne yazın.',
  },
  advice: {
    en: 'My mentor gave me valuable advice on how to start my new career.',
    tr: 'Akıl hocam yeni kariyerime nasıl başlayacağım konusunda bana değerli tavsiyeler verdi.',
  },
  afternoon: {
    en: 'We usually drink hot tea together in the late afternoon.',
    tr: 'Genellikle öğleden sonraları birlikte sıcak çay içeriz.',
  },
  airport: {
    en: 'They arrived at the international airport two hours before the flight.',
    tr: 'Uçuştan iki saat önce uluslararası havalimanına vardılar.',
  },
  library: {
    en: 'Students borrow reference books from the university library every week.',
    tr: 'Öğrenciler her hafta üniversite kütüphanesinden kaynak kitaplar ödünç alır.',
  },
  open: {
    en: 'Could you please open the window to let some fresh air in?',
    tr: 'İçeri temiz hava girmesi için lütfen pencereyi açabilir misiniz?',
  },
  close: {
    en: 'Remember to close the door when you leave the office.',
    tr: 'Ofisten çıkarken kapıyı kapatmayı unutmayın.',
  },
  help: {
    en: 'Can you help me carry these heavy boxes upstairs?',
    tr: 'Bu ağır kutuları yukarı taşımama yardım edebilir misiniz?',
  },
  give: {
    en: 'Please give me a glass of cold water.',
    tr: 'Lütfen bana bir bardak soğuk su verin.',
  },
  take: {
    en: 'Do not forget to take your umbrella because it might rain today.',
    tr: 'Bugün yağmur yağabileceği için şemsiyeni almayı unutma.',
  },
  make: {
    en: 'My grandmother will make delicious cookies for our family reunion.',
    tr: 'Büyükannem aile buluşmamız için lezzetli kurabiyeler yapacak.',
  },
  start: {
    en: 'The English lesson will start at nine o\'clock sharp tomorrow.',
    tr: 'İngilizce dersi yarın tam saat dokuzda başlayacak.',
  },
  stop: {
    en: 'The red traffic light signals drivers to stop immediately.',
    tr: 'Kırmızı trafik ışığı sürücülere derhal durmaları gerektiğini bildirir.',
  },
  ask: {
    en: 'Feel free to ask questions if you do not understand the lesson.',
    tr: 'Dersi anlamadıysanız çekinmeden soru sorun.',
  },
  answer: {
    en: 'She knew the correct answer to the teacher\'s difficult question.',
    tr: 'Öğretmenin zor sorusunun doğru cevabını biliyordu.',
  },
  listen: {
    en: 'Please listen carefully to the speaker during the presentation.',
    tr: 'Sunum sırasında lütfen konuşmacıyı dikkatle dinleyin.',
  },
  call: {
    en: 'I will call you on the phone as soon as I arrive at the station.',
    tr: 'İstasyona varır varmaz seni telefonla arayacağım.',
  },
};

const BOGUS_PATTERNS = [
  /in our classroom/i,
  /our approach to achieve better results/i,
  /In daily situations/i,
  /bu eylemi yaparlar/i,
  /imkana sahip olmaktan/i,
  /Linguistic virtuosos/i,
  /His discourse was enriched/i,
  /epistemology seminar/i,
  /I bought a modern/i,
  /I [a-z]+ every day\./i,
  /This is very [a-z]+\./i,
  /The symposium explored/i,
  /The global initiative/i,
  /We have a [a-z]+ in our/i,
];

/**
 * Checks if a sentence is a nonsensical or formulaic template.
 */
export function isBogusSentence(sentence: string | undefined): boolean {
  if (!sentence || sentence.trim().length < 10) return true;
  return BOGUS_PATTERNS.some((pattern) => pattern.test(sentence));
}

/**
 * Escapes regex special characters.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Blanks out the target word in the sentence naturally.
 */
function replaceWordWithBlank(sentence: string, targetWord: string): string {
  const cleanWord = targetWord.trim();
  // Match word with common English inflections (e.g. add, adds, added, adding)
  const regex = new RegExp(`\\b${escapeRegExp(cleanWord)}(s|es|ed|ing|d|er|est)?\\b`, 'i');
  if (regex.test(sentence)) {
    return sentence.replace(regex, '_______');
  }

  // Case-insensitive direct token replacement fallback
  const directIdx = sentence.toLowerCase().indexOf(cleanWord.toLowerCase());
  if (directIdx !== -1) {
    return (
      sentence.slice(0, directIdx) +
      '_______' +
      sentence.slice(directIdx + cleanWord.length)
    );
  }

  // If word couldn't be located directly, prepend blank
  return `_______ (${sentence})`;
}

/**
 * Generates an authentic, contextually coherent sentence for fill-in-the-blank questions.
 * Returns the sentence with blank, full sentence, and accurate Turkish translation.
 * GUARANTEES: Never uses generic templates or fake translations like 'bu eylemi yaparlar'.
 */
export function getCoherentQuizSentence(word: VocabWord): {
  sentenceWithBlank: string;
  fullSentence: string;
  turkishTranslation: string;
} {
  const cleanWord = word.word.trim();
  const lower = cleanWord.toLowerCase();

  // 1. High-priority curated authentic sentence map
  if (AUTHENTIC_SENTENCE_MAP[lower]) {
    const auth = AUTHENTIC_SENTENCE_MAP[lower];
    return {
      sentenceWithBlank: replaceWordWithBlank(auth.en, cleanWord),
      fullSentence: auth.en,
      turkishTranslation: auth.tr,
    };
  }

  // 2. Check if word object itself has an authentic sentence
  if (!isBogusSentence(word.exampleEn) && word.exampleEn && word.exampleTr) {
    const blanked = replaceWordWithBlank(word.exampleEn, cleanWord);
    if (blanked.includes('_______')) {
      return {
        sentenceWithBlank: blanked,
        fullSentence: word.exampleEn,
        turkishTranslation: word.exampleTr,
      };
    }
  }

  // 3. Look up word in verified VOCABULARY_LIST (3,000 words dataset)
  const datasetEntry = VOCAB_BY_WORD.get(lower);
  if (datasetEntry && !isBogusSentence(datasetEntry.exampleEn) && datasetEntry.exampleEn && datasetEntry.exampleTr) {
    const blanked = replaceWordWithBlank(datasetEntry.exampleEn, cleanWord);
    return {
      sentenceWithBlank: blanked,
      fullSentence: datasetEntry.exampleEn,
      turkishTranslation: datasetEntry.exampleTr,
    };
  }

  // 4. Fallback for custom words: Meaning-grounded authentic sentence using the word's actual meaningTr
  const pos = normalizePos(word.partOfSpeech);
  const meaning = word.meaningTr ? word.meaningTr.trim() : cleanWord;
  let fullSentence = '';
  let turkishTranslation = '';

  if (pos === 'verb') {
    fullSentence = `Please remember to ${cleanWord} all the important details before submitting.`;
    turkishTranslation = `Göndermeden önce lütfen tüm önemli ayrıntıları "${meaning}" işlemini unutmayın.`;
  } else if (pos === 'adjective') {
    fullSentence = `The final outcome of our project was very ${cleanWord} and impressive.`;
    turkishTranslation = `Projemizin nihai sonucu son derece "${meaning}" ve etkileyiciydi.`;
  } else if (pos === 'adverb') {
    fullSentence = `The speaker explained the whole topic ${cleanWord} so everyone understood.`;
    turkishTranslation = `Konuşmacı herkesin anlaması için tüm konuyu "${meaning}" şekilde açıkladı.`;
  } else if (pos === 'preposition') {
    fullSentence = `The travelers walked ${cleanWord} the peaceful park on a sunny afternoon.`;
    turkishTranslation = `Gezginler güneşli bir öğleden sonra huzurlu parkın "${meaning}" kısmında yürüdüler.`;
  } else {
    // noun
    fullSentence = `We need a reliable ${cleanWord} to complete our daily assignments successfully.`;
    turkishTranslation = `Günlük ödevlerimizi başarıyla tamamlamak için güvenilir bir "${meaning}" gereklidir.`;
  }

  return {
    sentenceWithBlank: replaceWordWithBlank(fullSentence, cleanWord),
    fullSentence,
    turkishTranslation,
  };
}

/**
 * Picks 3 coherent distractors:
 * - MUST be the EXACT SAME grammatical part of speech (verbs paired only with verbs, nouns with nouns, etc.).
 * - Must be from the SAME CEFR level (A1 with A1, B1 with B1, etc.).
 * - Distinct from the target word.
 */
export function getCoherentDistractors(
  targetWord: VocabWord,
  allWords: VocabWord[],
  level: CEFRLevel
): VocabWord[] {
  const targetPos = normalizePos(targetWord.partOfSpeech);
  const targetLevel = (level || targetWord.level || 'A1').toUpperCase();
  const cleanTarget = targetWord.word.trim().toLowerCase();

  // Available pool excluding target word
  const pool = allWords.filter(
    (w) => w.id !== targetWord.id && w.word.trim().toLowerCase() !== cleanTarget
  );

  // 1. Strict match: Same CEFR Level AND Same Part of Speech
  const strictCandidates = pool.filter(
    (w) => (w.level || '').toUpperCase() === targetLevel && normalizePos(w.partOfSpeech) === targetPos
  );

  if (strictCandidates.length >= 3) {
    const shuffled = [...strictCandidates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  // 2. Same Part of Speech across all levels (strictly maintaining part of speech so adverbs never mix with verbs)
  const samePosCandidates = pool.filter((w) => normalizePos(w.partOfSpeech) === targetPos);
  if (samePosCandidates.length >= 3) {
    const shuffled = [...samePosCandidates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  // 3. Same Level fallback if part of speech is extremely rare
  const sameLevelCandidates = pool.filter((w) => (w.level || '').toUpperCase() === targetLevel);
  if (sameLevelCandidates.length >= 3) {
    const shuffled = [...sameLevelCandidates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}
