import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentUser, CEFRLevel, VocabWord } from '../../types';
import { speakWord } from '../../utils/speech';
import { playCorrectSound, playWrongSound, playMatchSound, playLevelUpSound } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Trophy,
  RotateCcw,
  Volume2,
  Clock,
  Flame,
  CheckCircle2,
  Check,
  Zap,
  Award,
  Layers,
} from 'lucide-react';

interface MatchingGameProps {
  student: StudentUser;
  initialLevel?: CEFRLevel;
}

interface MatchCard {
  id: string; // unique card id
  wordId: string;
  type: 'en' | 'tr';
  text: string;
  phonetic?: string;
  partOfSpeech?: string;
  isMatched: boolean;
}

export const MatchingGame: React.FC<MatchingGameProps> = ({ student, initialLevel }) => {
  const { vocabulary, submitMatchingGameResult } = useApp();

  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>(initialLevel || student.currentLevel || 'A1');
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [failedCardIds, setFailedCardIds] = useState<string[]>([]);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);
  const [movesCount, setMovesCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isGameCompleted, setIsGameCompleted] = useState(false);

  const PAIR_COUNT = 8;

  // Initialize a new game round
  const initGame = (level: CEFRLevel) => {
    const levelWords = vocabulary.filter((w) => w.level === level);
    if (levelWords.length === 0) return;

    // Pick 8 random words
    const shuffledWords = [...levelWords].sort(() => Math.random() - 0.5).slice(0, PAIR_COUNT);

    const generatedCards: MatchCard[] = [];
    shuffledWords.forEach((word) => {
      // English card
      generatedCards.push({
        id: `card-en-${word.id}`,
        wordId: word.id,
        type: 'en',
        text: word.word,
        phonetic: word.phonetic,
        partOfSpeech: word.partOfSpeech,
        isMatched: false,
      });

      // Turkish card
      generatedCards.push({
        id: `card-tr-${word.id}`,
        wordId: word.id,
        type: 'tr',
        text: word.meaningTr,
        isMatched: false,
      });
    });

    // Shuffle all 16 cards
    const shuffledCards = generatedCards.sort(() => Math.random() - 0.5);

    setCards(shuffledCards);
    setSelectedCardId(null);
    setFailedCardIds([]);
    setMatchedPairsCount(0);
    setMovesCount(0);
    setStreak(0);
    setBestStreak(0);
    setSeconds(0);
    setIsGameActive(true);
    setIsGameCompleted(false);
  };

  useEffect(() => {
    initGame(selectedLevel);
  }, [selectedLevel]);

  // Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGameActive && !isGameCompleted) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isGameActive, isGameCompleted]);

  // Handle card click
  const handleCardClick = (card: MatchCard) => {
    if (card.isMatched || failedCardIds.length > 0) return;

    // Speak english pronunciation
    if (card.type === 'en') {
      speakWord(card.text);
    }

    // First card selected
    if (!selectedCardId) {
      setSelectedCardId(card.id);
      return;
    }

    // Clicked same card
    if (selectedCardId === card.id) {
      setSelectedCardId(null);
      return;
    }

    // Second card selected -> compare
    const firstCard = cards.find((c) => c.id === selectedCardId);
    if (!firstCard) return;

    setMovesCount((m) => m + 1);

    // Can only match opposite types (EN with TR) and same wordId
    const isPair = firstCard.type !== card.type && firstCard.wordId === card.wordId;

    if (isPair) {
      // MATCH SUCCESS
      playMatchSound();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }

      setCards((prev) =>
        prev.map((c) =>
          c.wordId === card.wordId ? { ...c, isMatched: true } : c
        )
      );
      setSelectedCardId(null);

      const nextCount = matchedPairsCount + 1;
      setMatchedPairsCount(nextCount);

      // Check if all pairs completed
      if (nextCount === PAIR_COUNT) {
        setIsGameCompleted(true);
        setIsGameActive(false);
        playLevelUpSound();
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });

        // Submit to context & activity log for teacher/manager monitoring
        submitMatchingGameResult(
          student.id,
          selectedLevel,
          PAIR_COUNT,
          PAIR_COUNT,
          seconds
        );
      }
    } else {
      // MISMATCH
      playWrongSound();
      setStreak(0);
      setFailedCardIds([firstCard.id, card.id]);

      setTimeout(() => {
        setFailedCardIds([]);
        setSelectedCardId(null);
      }, 650);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header & Level Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Kelime Eşleştirme Pratiği</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  {selectedLevel}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                İngilizce kelimeleri doğru Türkçe anlamlarıyla eşleştirin ve serinizi yükseltin!
              </p>
            </div>
          </div>

          <button
            onClick={() => initGame(selectedLevel)}
            className="hover-lift px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Yeniden Karıştır</span>
          </button>
        </div>

        {/* Level Tabs */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/80 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold shrink-0">Pratik Seviyesi:</span>
          {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-3 py-1.5 rounded-xl font-bold font-mono transition shrink-0 cursor-pointer ${
                selectedLevel === lvl
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-105'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Game Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Eşleşen Çiftler</div>
            <div className="text-base font-extrabold text-white">
              {matchedPairsCount} / {PAIR_COUNT}
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Geçen Süre</div>
            <div className="text-base font-extrabold text-amber-300 font-mono">
              {formatTime(seconds)}
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Hamle Sayısı</div>
            <div className="text-base font-extrabold text-purple-300">
              {movesCount}
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Seri (Streak)</div>
            <div className="text-base font-extrabold text-rose-300">
              {streak}x {streak >= 3 && '🔥'}
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {cards.map((card) => {
          const isSelected = selectedCardId === card.id;
          const isFailed = failedCardIds.includes(card.id);

          return (
            <button
              key={card.id}
              disabled={card.isMatched}
              onClick={() => handleCardClick(card)}
              className={`p-4 rounded-2xl border text-center transition-all duration-200 relative min-h-[110px] flex flex-col items-center justify-center cursor-pointer select-none ${
                card.isMatched
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 opacity-60 cursor-default'
                  : isFailed
                  ? 'bg-rose-950/60 border-rose-500 text-rose-200 scale-95 shadow-lg shadow-rose-900/30'
                  : isSelected
                  ? 'bg-indigo-900/50 border-indigo-400 ring-2 ring-indigo-400 scale-102 text-white shadow-xl shadow-indigo-500/20'
                  : card.type === 'en'
                  ? 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/60 text-slate-100 hover:bg-slate-850 hover:-translate-y-0.5'
                  : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/60 text-slate-100 hover:bg-slate-850 hover:-translate-y-0.5'
              }`}
            >
              {/* Card Type Badge */}
              <div className="absolute top-2 right-2">
                {card.isMatched ? (
                  <Check className="w-4 h-4 text-emerald-400 font-bold" />
                ) : (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      card.type === 'en'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {card.type === 'en' ? 'EN' : 'TR'}
                  </span>
                )}
              </div>

              {/* Word Content */}
              <div className="space-y-1">
                <span className="text-base font-extrabold block tracking-wide">
                  {card.text}
                </span>

                {card.phonetic && card.type === 'en' && (
                  <span className="text-[11px] font-mono text-indigo-400 block">
                    {card.phonetic}
                  </span>
                )}

                {card.partOfSpeech && card.type === 'en' && (
                  <span className="text-[9px] uppercase font-semibold text-slate-400 block">
                    {card.partOfSpeech}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Completion Modal */}
      {isGameCompleted && (
        <div className="p-8 bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-emerald-500/50 rounded-3xl text-center space-y-5 shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white">Harika İş Çıkardınız! 🎉</h3>
            <p className="text-xs text-slate-300">
              {selectedLevel} Seviyesindeki {PAIR_COUNT} kelime çiftini başarıyla tamamladınız.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto py-2">
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="text-[11px] text-slate-400">Toplam Süre</div>
              <div className="text-lg font-bold text-emerald-300 font-mono">{formatTime(seconds)}</div>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="text-[11px] text-slate-400">Toplam Hamle</div>
              <div className="text-lg font-bold text-white">{movesCount}</div>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="text-[11px] text-slate-400">Kazanılan XP</div>
              <div className="text-lg font-bold text-amber-400 font-mono">+{PAIR_COUNT * 8 + 30} XP</div>
            </div>
          </div>

          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 max-w-md mx-auto">
            ✓ Bu başarı ve skorunuz öğretmeniniz ve yönetici denetim kaydına iletildi.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => initGame(selectedLevel)}
              className="hover-lift px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Tekrar Oyna</span>
            </button>

            {selectedLevel !== 'C2' && (
              <button
                onClick={() => {
                  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
                  const nextIdx = levels.indexOf(selectedLevel) + 1;
                  if (nextIdx < levels.length) {
                    setSelectedLevel(levels[nextIdx]);
                  }
                }}
                className="hover-lift px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Bir Sonraki Seviyeye Geç ➔
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
