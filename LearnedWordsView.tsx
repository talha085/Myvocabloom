import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentUser, CEFRLevel, VocabWord } from '../../types';
import { speakWord } from '../../utils/speech';
import confetti from 'canvas-confetti';
import {
  BookCheck,
  Search,
  Volume2,
  Trash2,
  Plus,
  Sparkles,
  Filter,
  CheckCircle2,
  X,
  BookOpen,
  ArrowRight,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface LearnedWordsViewProps {
  student: StudentUser;
  onNavigateToFlashcards?: () => void;
  onNavigateToExplorer?: () => void;
}

export const LearnedWordsView: React.FC<LearnedWordsViewProps> = ({
  student,
  onNavigateToFlashcards,
  onNavigateToExplorer,
}) => {
  const { vocabulary, markWordLearned } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<CEFRLevel | 'ALL'>('ALL');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddSearch, setQuickAddSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const learnedWordIds = useMemo(
    () => new Set(student.progress.wordsLearned),
    [student.progress.wordsLearned]
  );

  // Get full VocabWord objects for learned words
  const learnedWords = useMemo(() => {
    return vocabulary.filter((w) => learnedWordIds.has(w.id));
  }, [vocabulary, learnedWordIds]);

  // Level counts
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    learnedWords.forEach((w) => {
      if (counts[w.level] !== undefined) {
        counts[w.level]++;
      }
    });
    return counts;
  }, [learnedWords]);

  // Filtered learned words
  const filteredWords = useMemo(() => {
    return learnedWords.filter((w) => {
      if (levelFilter !== 'ALL' && w.level !== levelFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          w.word.toLowerCase().includes(q) ||
          w.meaningTr.toLowerCase().includes(q) ||
          w.exampleEn.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [learnedWords, levelFilter, searchQuery]);

  // Quick add search candidates (words not yet learned)
  const quickAddCandidates = useMemo(() => {
    if (!quickAddSearch.trim()) return [];
    const q = quickAddSearch.toLowerCase().trim();
    return vocabulary
      .filter(
        (w) =>
          !learnedWordIds.has(w.id) &&
          (w.word.toLowerCase().includes(q) || w.meaningTr.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [vocabulary, learnedWordIds, quickAddSearch]);

  const handleRemoveWord = (word: VocabWord) => {
    markWordLearned(student.id, word.id, false);
    setToastMessage(`"${word.word}" Öğrendiklerim sekmesinden çıkarıldı.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddWord = (word: VocabWord) => {
    markWordLearned(student.id, word.id, true);
    setToastMessage(`"${word.word}" başarıyla Öğrendiklerim sekmesine eklendi! 🎉`);
    setTimeout(() => setToastMessage(null), 3000);
    confetti({
      particleCount: 20,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#10b981', '#34d399', '#fef08a'],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border border-emerald-500/30 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <BookCheck className="w-4 h-4" />
              <span>Kişisel Kelime Dağarcığım</span>
              <span>•</span>
              <span>{learnedWords.length} Kelime</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Öğrendiklerim</h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Bildiginiz veya VocaBloom ile öğrendiğiniz tüm İngilizce kelimeler burada toplanır.
              İstediğiniz an telaffuzlarını dinleyebilir, anlamlarını tazeleyebilir veya yeni kelimeler ekleyebilirsiniz.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition flex items-center space-x-2 cursor-pointer select-none"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yeni Kelime Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Toplam Öğrenilen
          </span>
          <div className="text-2xl font-black text-emerald-400">{learnedWords.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">3.000 CEFR Kelimesi İçinden</div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            VocaBloom Bahçe Skoru
          </span>
          <div className="text-2xl font-black text-amber-400">🌸 {student.progress.bloomScore} XP</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Kelime başarı çarpanı</div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Temel Düzey (A1-A2)
          </span>
          <div className="text-2xl font-black text-cyan-400">
            {levelCounts['A1'] + levelCounts['A2']} Kelime
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            A1: {levelCounts['A1']} • A2: {levelCounts['A2']}
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            İleri Düzey (B1-C2)
          </span>
          <div className="text-2xl font-black text-indigo-400">
            {levelCounts['B1'] + levelCounts['B2'] + levelCounts['C1'] + levelCounts['C2']} Kelime
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            B1-B2: {levelCounts['B1'] + levelCounts['B2']} • C1-C2: {levelCounts['C1'] + levelCounts['C2']}
          </div>
        </div>
      </div>

      {/* Toast alert */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm rounded-2xl flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-white font-bold ml-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Öğrendiklerin arasında ara (İngilizce veya Türkçe)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <span>Listelenen:</span>
            <span className="font-bold text-white">{filteredWords.length}</span>
            <span>/ {learnedWords.length} Kelime</span>
          </div>
        </div>

        {/* CEFR Level filter pills */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-800 text-xs overflow-x-auto pb-1">
          <span className="text-slate-400 font-semibold shrink-0">CEFR Filtresi:</span>
          {(['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((lvl) => {
            const count = lvl === 'ALL' ? learnedWords.length : levelCounts[lvl] || 0;
            return (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-3 py-1 rounded-lg font-bold font-mono transition shrink-0 flex items-center space-x-1 cursor-pointer ${
                  levelFilter === lvl
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{lvl}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Words Grid or Empty State */}
      {filteredWords.length === 0 ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center text-2xl">
            🌸
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {learnedWords.length === 0
                ? 'Henüz Öğrendiğiniz Bir Kelime Bulunmuyor'
                : 'Arama Kriterine Uygun Kelime Bulunamadı'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {learnedWords.length === 0
                ? 'Kelime Sözlüğü veya 3D Flashcard pratiklerinde bildiğiniz kelimeleri "Öğrendiklerime Ekle" butonu ile buraya kaydedebilirsiniz.'
                : 'Filtreleri temizleyebilir veya yukarıdaki "+ Yeni Kelime Ekle" butonu ile aradığınız kelimeyi listeye katabilirsiniz.'}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>+ Hızlı Kelime Ekle</span>
            </button>
            {onNavigateToFlashcards && (
              <button
                onClick={onNavigateToFlashcards}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>3D Flashcard Pratiğine Git</span>
              </button>
            )}
            {onNavigateToExplorer && (
              <button
                onClick={onNavigateToExplorer}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>3.000 Kelimelik Sözlüğe Git</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWords.map((word) => (
            <div
              key={word.id}
              className="p-4 sm:p-5 bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl shadow-lg transition-all space-y-3 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors">
                      {word.word}
                    </span>
                    <span className="text-xs font-mono text-emerald-400">{word.phonetic}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                      {word.level}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400">
                      {word.partOfSpeech}
                    </span>
                  </div>

                  <div className="text-base font-bold text-emerald-400 mt-1">
                    {word.meaningTr}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => speakWord(word.word)}
                    title="Sesli Telaffuz Dinle"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 transition cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveWord(word)}
                    title="Öğrendiklerim sekmesinden çıkar"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Definition and Examples */}
              <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800/80">
                <p className="text-slate-400 leading-relaxed italic">
                  &ldquo;{word.definitionEn}&rdquo;
                </p>
                <div className="p-2.5 bg-slate-800/60 rounded-xl space-y-1">
                  <div className="text-white font-medium flex items-center space-x-1.5">
                    <span className="text-emerald-400">•</span>
                    <span>{word.exampleEn}</span>
                  </div>
                  <div className="text-slate-400 text-[11px] pl-3">
                    {word.exampleTr}
                  </div>
                </div>
              </div>

              {/* Footer status */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="inline-flex items-center text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Öğrenildi Olarak Kayıtlı
                </span>
                <button
                  onClick={() => handleRemoveWord(word)}
                  className="text-slate-500 hover:text-rose-400 transition cursor-pointer"
                >
                  Listeden Çıkar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QUICK ADD MODAL */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Öğrendiklerime Kelime Ekle</h3>
                  <p className="text-xs text-slate-400">3.000 CEFR kelimesi arasından arayın ve tek tıkla ekleyin</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setQuickAddSearch('');
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  autoFocus
                  value={quickAddSearch}
                  onChange={(e) => setQuickAddSearch(e.target.value)}
                  placeholder="Kelime veya Türkçe anlam yazın (Örn: achieve, explore, book)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              {!quickAddSearch.trim() ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                  <Sparkles className="w-8 h-8 text-emerald-400 mx-auto opacity-60" />
                  <p className="text-white font-semibold">Aramak için bir kelime yazın</p>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    A1'den C2'ye kadar 3.000 kelimelik müfredatta bildiğiniz kelimeleri aratıp tek tıkla
                    &ldquo;Öğrendiklerim&rdquo; listenize ekleyebilirsiniz.
                  </p>
                </div>
              ) : quickAddCandidates.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  &ldquo;{quickAddSearch}&rdquo; ile eşleşen veya henüz öğrenilmemiş kelime bulunamadı.
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {quickAddCandidates.map((word) => (
                    <div
                      key={word.id}
                      className="py-3 px-2 hover:bg-slate-800/40 rounded-xl transition flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{word.word}</span>
                          <span className="text-xs font-mono text-emerald-400">{word.phonetic}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {word.level}
                          </span>
                        </div>
                        <div className="text-xs text-emerald-300 font-medium mt-0.5">
                          {word.meaningTr}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-md">
                          {word.exampleEn}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          onClick={() => speakWord(word.word)}
                          title="Telaffuz Dinle"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAddWord(word)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-md"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Öğrendiklerime Ekle</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setQuickAddSearch('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
