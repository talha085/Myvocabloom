import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { VocabWord, CEFRLevel, StudentUser } from '../../types';
import { speakWord } from '../../utils/speech';
import { playCorrectSound, playWrongSound } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Volume2,
  RotateCw,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Sparkles,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Award,
} from 'lucide-react';

interface FlashcardPlayerProps {
  student: StudentUser;
  initialLevel?: CEFRLevel;
}

export const FlashcardPlayer: React.FC<FlashcardPlayerProps> = ({ student, initialLevel }) => {
  const { vocabulary, markWordLearned } = useApp();

  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | 'ALL'>(initialLevel || 'A1');
  const [deck, setDeck] = useState<VocabWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionLearnedCount, setSessionLearnedCount] = useState(0);

  // Filter deck based on selected level
  useEffect(() => {
    let filtered = vocabulary;
    if (selectedLevel !== 'ALL') {
      filtered = vocabulary.filter((w) => w.level === selectedLevel);
    }
    // Prioritize unlearned or shuffled
    setDeck(filtered);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedLevel, vocabulary]);

  const currentWord = deck[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < deck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Loop or finish
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleResponse = (type: 'known' | 'repeat' | 'hard') => {
    if (!currentWord) return;

    if (type === 'known') {
      playCorrectSound();
      markWordLearned(student.id, currentWord.id, true);
      setSessionLearnedCount((prev) => prev + 1);

      // Trigger small festive burst
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#fef08a'],
      });
    } else {
      playWrongSound();
      markWordLearned(student.id, currentWord.id, false);
    }

    handleNext();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, deck.length]);

  const isWordLearned = currentWord && student.progress.wordsLearned.includes(currentWord.id);

  return (
    <div className="space-y-6">
      {/* Level Selection Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400">CEFR Seviyesi:</span>
          {(['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition font-mono ${
                selectedLevel === lvl
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={handleShuffle}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center space-x-1.5"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Karıştır</span>
          </button>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-bold">
            {currentIndex + 1} / {deck.length} Kart
          </span>
        </div>
      </div>

      {/* Progress Bar for Current Deck */}
      {deck.length > 0 && (
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
          />
        </div>
      )}

      {/* 3D Flashcard Display */}
      {currentWord ? (
        <div className="perspective-1000 max-w-2xl mx-auto">
          <div
            onClick={handleFlip}
            className={`relative w-full min-h-[340px] cursor-pointer rounded-3xl p-8 border transition-all duration-500 select-none flex flex-col justify-between shadow-2xl ${
              isFlipped
                ? 'bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/50'
                : 'bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border-slate-700/80 hover:border-emerald-500/50'
            }`}
          >
            {/* Top metadata row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentWord.level}
                </span>
                <span className="text-xs uppercase font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                  {currentWord.partOfSpeech}
                </span>
                {isWordLearned && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    ✓ Öğrenildi
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakWord(currentWord.word);
                  }}
                  title="Sesli Dinle (Pronunciation)"
                  className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Çevir</span>
                </span>
              </div>
            </div>

            {/* Middle Main Content */}
            {!isFlipped ? (
              /* FRONT OF CARD (English Word) */
              <div className="text-center py-8 space-y-3">
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-wide">
                  {currentWord.word}
                </h2>
                <p className="text-lg font-mono text-emerald-400 tracking-wider">
                  {currentWord.phonetic}
                </p>
                <p className="text-xs text-slate-400 pt-3">
                  (Türkçe anlamı ve örnek cümleleri görmek için karta tıklayın veya Boşluk tuşuna basın)
                </p>
              </div>
            ) : (
              /* BACK OF CARD (Turkish Meaning & Examples) */
              <div className="text-center py-4 space-y-4 animate-fade-in">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Türkçe Anlamı</div>
                  <h3 className="text-3xl font-extrabold text-emerald-300">
                    {currentWord.meaningTr}
                  </h3>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 text-left space-y-2">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">İngilizce Tanım:</div>
                    <p className="text-xs text-slate-200">{currentWord.definitionEn}</p>
                  </div>

                  <div className="pt-1 border-t border-slate-700/60">
                    <div className="text-[11px] font-semibold text-emerald-400 uppercase">Örnek Cümle:</div>
                    <p className="text-xs text-white italic">&quot;{currentWord.exampleEn}&quot;</p>
                    <p className="text-[11px] text-slate-400">{currentWord.exampleTr}</p>
                  </div>
                </div>

                {currentWord.collocations && currentWord.collocations.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-400">Kalıplar:</span>
                    {currentWord.collocations.map((c, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Card Navigation Arrows */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                disabled={currentIndex === 0}
                className="hover:text-slate-300 disabled:opacity-30 flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Önceki Kart</span>
              </button>

              <span className="text-[11px] text-slate-400">
                Bu Oturumda Öğrenilen: <strong className="text-emerald-400">{sessionLearnedCount}</strong>
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="hover:text-slate-300 flex items-center space-x-1"
              >
                <span>Sonraki Kart</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3 Spaced Repetition Action Buttons */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <button
              onClick={() => handleResponse('hard')}
              className="py-3 px-3 bg-slate-900 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-slate-800 hover:border-rose-500/40 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Zorlandım</span>
            </button>

            <button
              onClick={() => handleResponse('repeat')}
              className="py-3 px-3 bg-slate-900 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-slate-800 hover:border-amber-500/40 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2"
            >
              <RotateCw className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Tekrar Et</span>
            </button>

            <button
              onClick={() => handleResponse('known')}
              className="py-3 px-3 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>Öğrendim (+20 XP)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-3xl">
          Bu seviyede henüz kelime bulunmuyor.
        </div>
      )}
    </div>
  );
};
