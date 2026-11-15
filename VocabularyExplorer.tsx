import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentUser, CEFRLevel, VocabWord } from '../../types';
import { speakWord } from '../../utils/speech';
import { generateVocabulary } from '../../services/geminiService';
import {
  Search,
  Volume2,
  CheckCircle2,
  Circle,
  BookOpen,
  Filter,
  Sparkles,
  X,
  Loader2,
} from 'lucide-react';

interface VocabularyExplorerProps {
  student: StudentUser;
}

export const VocabularyExplorer: React.FC<VocabularyExplorerProps> = ({ student }) => {
  const { vocabulary, markWordLearned } = useApp();

  const [levelFilter, setLevelFilter] = useState<CEFRLevel | 'ALL'>('ALL');
  const [learnedFilter, setLearnedFilter] = useState<'all' | 'learned' | 'unlearned'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // AI Explanation state
  const [aiLoadingWord, setAiLoadingWord] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<{ word: string; text: string } | null>(null);

  const learnedSet = new Set(student.progress.wordsLearned);

  const filteredWords = vocabulary.filter((w) => {
    if (levelFilter !== 'ALL' && w.level !== levelFilter) return false;

    const isLearned = learnedSet.has(w.id);
    if (learnedFilter === 'learned' && !isLearned) return false;
    if (learnedFilter === 'unlearned' && isLearned) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        w.word.toLowerCase().includes(q) ||
        w.meaningTr.toLowerCase().includes(q) ||
        w.exampleEn.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const [visibleCount, setVisibleCount] = useState(60);

  // Reset pagination when filter changes
  React.useEffect(() => {
    setVisibleCount(60);
  }, [levelFilter, learnedFilter, searchQuery]);

  const visibleWords = filteredWords.slice(0, visibleCount);

  const toggleLearned = (wordId: string) => {
    const isLearned = learnedSet.has(wordId);
    markWordLearned(student.id, wordId, !isLearned);
  };

  return (
    <div className="space-y-5">
      {/* Search and Filters Header */}
      <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="İngilizce kelime veya Türkçe anlam ara..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm"
            />
          </div>

          {/* Learned Filter Toggle */}
          <div className="flex items-center space-x-1.5 text-xs">
            <button
              onClick={() => setLearnedFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                learnedFilter === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              Tümü ({vocabulary.length})
            </button>
            <button
              onClick={() => setLearnedFilter('learned')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                learnedFilter === 'learned'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-emerald-300'
              }`}
            >
              Öğrendiklerim ({learnedSet.size})
            </button>
            <button
              onClick={() => setLearnedFilter('unlearned')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                learnedFilter === 'unlearned'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-amber-300'
              }`}
            >
              Kalanlar ({vocabulary.length - learnedSet.size})
            </button>
          </div>
        </div>

        {/* CEFR Level Tabs */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-800 text-xs overflow-x-auto pb-1">
          <span className="text-slate-400 font-semibold shrink-0">CEFR Düzeyleri:</span>
          {(['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1 rounded-lg font-bold font-mono transition shrink-0 ${
                levelFilter === lvl
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
          <span className="text-slate-500 ml-auto shrink-0 font-medium">
            {filteredWords.length} kelime listeleniyor
          </span>
        </div>
      </div>

      {/* Words Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleWords.map((word) => {
          const isLearned = learnedSet.has(word.id);
          return (
            <div
              key={word.id}
              className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                isLearned
                  ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/70'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-extrabold text-white">{word.word}</span>
                    <span className="text-xs font-mono text-emerald-400">{word.phonetic}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {word.level}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400">
                      {word.partOfSpeech}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-emerald-300 mt-0.5">
                    {word.meaningTr}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={async () => {
                      setAiLoadingWord(word.id);
                      const res = await generateVocabulary(word.word, word.level);
                      setAiLoadingWord(null);
                      if (res) {
                        setAiExplanation({ word: word.word, text: res });
                      }
                    }}
                    disabled={aiLoadingWord === word.id}
                    title="Gemini AI ile Detaylı Açıklama & 2 Örnek Cümle İste"
                    className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition"
                  >
                    {aiLoadingWord === word.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => speakWord(word.word)}
                    title="Sesli Telaffuz Dinle"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 transition"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => toggleLearned(word.id)}
                    title={isLearned ? 'Öğrendiklerim sekmesinden çıkar' : 'Öğrendiklerim sekmesine ekle'}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                      isLearned
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                        : 'bg-slate-800 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-300 border border-slate-700'
                    }`}
                  >
                    {isLearned ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                        <span>Öğrendiklerimde</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Öğrendiklerime At</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/40 space-y-1">
                <p className="italic text-slate-200">&quot;{word.exampleEn}&quot;</p>
                <p className="text-slate-400 text-[11px]">{word.exampleTr}</p>
              </div>

              {word.collocations && word.collocations.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-slate-500">Kalıp:</span>
                  {word.collocations.map((c, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination / Load More */}
      {visibleCount < filteredWords.length && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl gap-3">
          <p className="text-xs text-slate-400">
            Toplam <span className="font-bold text-white">{filteredWords.length}</span> kelimeden{' '}
            <span className="font-bold text-emerald-400">{visibleWords.length}</span> tanesi gösteriliyor.
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setVisibleCount((prev) => Math.min(prev + 60, filteredWords.length))}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
            >
              Daha Fazla Göster (+60)
            </button>
            <button
              onClick={() => setVisibleCount(filteredWords.length)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
            >
              Tümünü Göster
            </button>
          </div>
        </div>
      )}

      {/* AI Word Explanation Modal */}
      {aiExplanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  ✨
                </div>
                <div>
                  <h3 className="text-base font-bold text-white capitalize">
                    {aiExplanation.word} — Gemini 1.5 Flash Açıklaması
                  </h3>
                  <p className="text-[11px] text-indigo-400">Türkçe Açıklama & 2 Örnek Cümle</p>
                </div>
              </div>
              <button
                onClick={() => setAiExplanation(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
              {aiExplanation.text}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setAiExplanation(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
              >
                Anladım, Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
