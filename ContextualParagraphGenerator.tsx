/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { StudentUser, CEFRLevel, VocabWord } from '../../types';
import { speakWord } from '../../utils/speech';
import { playSuccessSound } from '../../utils/soundEffects';
import {
  generateContextualParagraph,
  ContextualParagraphResult,
} from '../../services/geminiService';
import {
  Sparkles,
  BookOpen,
  Volume2,
  RefreshCw,
  Copy,
  Check,
  X,
  Search,
  Shuffle,
  CheckCircle2,
  AlertCircle,
  Wand2,
  FileText,
  Lightbulb,
  SlidersHorizontal,
  BookmarkCheck,
  Languages,
} from 'lucide-react';

interface ContextualParagraphGeneratorProps {
  student: StudentUser;
  vocabulary: VocabWord[];
  teacherLevel: CEFRLevel;
}

const TOPICS = [
  { id: 'general', label: 'Genel & Günlük', icon: '🌱' },
  { id: 'school', label: 'Okul & Eğitim', icon: '🎓' },
  { id: 'daily', label: 'Günlük Rutinler', icon: '☕' },
  { id: 'nature', label: 'Doğa & Macera', icon: '🌲' },
  { id: 'friendship', label: 'Dostluk & Sosyal', icon: '🤝' },
  { id: 'technology', label: 'Bilim & Keşif', icon: '🚀' },
];

export const ContextualParagraphGenerator: React.FC<ContextualParagraphGeneratorProps> = ({
  student,
  vocabulary,
  teacherLevel,
}) => {
  // Learned word IDs
  const learnedIds = useMemo(() => new Set(student.progress.wordsLearned), [student.progress.wordsLearned]);

  // Learned words list
  const learnedWords = useMemo(
    () => vocabulary.filter((w) => learnedIds.has(w.id)),
    [vocabulary, learnedIds]
  );

  // Curriculum words for current student/teacher level
  const curriculumWords = useMemo(
    () => vocabulary.filter((w) => w.level === teacherLevel),
    [vocabulary, teacherLevel]
  );

  // State: Source list mode ('learned' vs 'curriculum')
  const [sourceMode, setSourceMode] = useState<'learned' | 'curriculum'>(
    learnedWords.length >= 5 ? 'learned' : 'curriculum'
  );

  // State: Selected words (target 5-10 words)
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>(() => {
    // default pick up to 5 learned words or curriculum words
    const baseList = learnedWords.length >= 5 ? learnedWords : curriculumWords;
    return baseList.slice(0, 5).map((w) => w.id);
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('general');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ContextualParagraphResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Selected VocabWord objects
  const selectedWords = useMemo(
    () =>
      selectedWordIds
        .map((id) => vocabulary.find((w) => w.id === id))
        .filter((w): w is VocabWord => Boolean(w)),
    [selectedWordIds, vocabulary]
  );

  // Source list to pick from based on active mode
  const activeSourceList = sourceMode === 'learned' ? learnedWords : curriculumWords;

  // Filtered available words
  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return activeSourceList;
    const q = searchQuery.toLowerCase().trim();
    return activeSourceList.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.meaningTr.toLowerCase().includes(q) ||
        w.level.toLowerCase().includes(q)
    );
  }, [activeSourceList, searchQuery]);

  // Toggle selection
  const toggleWord = (wordId: string) => {
    if (selectedWordIds.includes(wordId)) {
      setSelectedWordIds((prev) => prev.filter((id) => id !== wordId));
    } else {
      if (selectedWordIds.length >= 10) return; // Cap at 10
      setSelectedWordIds((prev) => [...prev, wordId]);
    }
  };

  // Quick selection helpers
  const handleSelectFirst = (count: number) => {
    const list = activeSourceList.length > 0 ? activeSourceList : vocabulary;
    const ids = list.slice(0, count).map((w) => w.id);
    setSelectedWordIds(ids);
  };

  const handleSelectRandom = (count: number) => {
    const list = activeSourceList.length >= count ? activeSourceList : vocabulary;
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    setSelectedWordIds(shuffled.slice(0, count).map((w) => w.id));
  };

  const handleClear = () => {
    setSelectedWordIds([]);
  };

  // Generate contextual paragraph
  const handleGenerate = async () => {
    if (selectedWordIds.length < 5 || selectedWordIds.length > 10 || isGenerating) return;

    setIsGenerating(true);
    setResult(null);

    const targetWordsList = selectedWords.map((w) => w.word);

    try {
      const res = await generateContextualParagraph(
        targetWordsList,
        teacherLevel,
        selectedTopic
      );
      setResult(res);
      playSuccessSound();
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.error('Error generating contextual paragraph:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = `${result.title}\n\n${result.paragraphEn}\n\nTürkçe Çevirisi:\n${result.paragraphTr}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayAudio = () => {
    if (!result?.paragraphEn) return;
    setIsPlayingAudio(true);
    speakWord(result.paragraphEn, 0.85);
    // Rough estimate of speech duration based on word count
    const wordsCount = result.paragraphEn.split(/\s+/).length;
    const estimatedMs = Math.max(3000, wordsCount * 450);
    setTimeout(() => setIsPlayingAudio(false), estimatedMs);
  };

  // Highlight words inside paragraph
  const renderHighlightedParagraph = (paragraph: string, wordsToHighlight: string[]) => {
    if (!wordsToHighlight.length) return paragraph;

    const escaped = wordsToHighlight
      .filter(Boolean)
      .map((w) => w.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .sort((a, b) => b.length - a.length);

    if (escaped.length === 0) return paragraph;

    const regex = new RegExp(`\\b(${escaped.join('|')})(s|es|ed|ing|d|ly)?\\b`, 'gi');
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(paragraph)) !== null) {
      if (match.index > lastIndex) {
        parts.push(paragraph.substring(lastIndex, match.index));
      }
      parts.push(
        <span
          key={match.index}
          className="inline font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 shadow-sm"
          title="Seçtiğiniz kelime bağlam içinde kullanıldı"
        >
          {match[0]}
        </span>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < paragraph.length) {
      parts.push(paragraph.substring(lastIndex));
    }
    return parts;
  };

  const isWordInText = (word: string, text: string): boolean => {
    if (!word || !text) return false;
    const escaped = word.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}(s|es|ed|ing|d|ly)?\\b`, 'i').test(text);
  };

  const countValid = selectedWordIds.length >= 5 && selectedWordIds.length <= 10;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden p-6 sm:p-7 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Google Gemini AI • Doğal Dil Üretimi</span>
              <span>•</span>
              <span className="font-mono text-emerald-400">{teacherLevel} Seviyesi</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              AI ile Bağlamsal Paragraf Oluştur
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Öğrendiğiniz veya müfredatınızdaki kelimelerden{' '}
              <strong className="text-white">5 ile 10 kelime</strong> seçin; yapay zekâ bu kelimeleri
              doğal ve anlamlı bir hikaye akışı içinde kullanarak{' '}
              <strong className="text-emerald-400 font-bold">50-60 kelimelik</strong> akıcı bir İngilizce paragraf ve Türkçe çevirisini hazırlasın.
            </p>
          </div>

          {/* Word Count Indicator Badge */}
          <div className="p-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl flex flex-col items-center justify-center shrink-0 min-w-[200px] shadow-lg">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Seçilen Kelime Sayısı
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span
                className={`text-3xl font-black font-mono ${
                  selectedWordIds.length < 5
                    ? 'text-amber-400'
                    : selectedWordIds.length <= 10
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {selectedWordIds.length}
              </span>
              <span className="text-slate-400 font-bold text-sm">/ 10</span>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full mt-1.5 flex items-center space-x-1 ${
                selectedWordIds.length < 5
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {selectedWordIds.length < 5 ? (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                  <span>En az {5 - selectedWordIds.length} kelime daha seçin</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Üretime Hazır ({selectedWordIds.length} Kelime)</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Selected Words Tray (Visible when words are selected) */}
      {selectedWords.length > 0 && (
        <div className="p-4 sm:p-5 bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <BookmarkCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-extrabold text-white">
                Seçilen Kelimeler ({selectedWords.length}/10)
              </h3>
              <span className="text-xs text-slate-400">
                (Kaldırmak istediğiniz kelimenin yanındaki çarpıya tıklayın)
              </span>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 transition cursor-pointer flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Seçimi Sıfırla</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {selectedWords.map((word, idx) => (
              <span
                key={word.id}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-emerald-500/40 text-slate-100 text-xs font-semibold shadow-sm group hover:border-emerald-400 transition"
              >
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="font-bold text-emerald-300">{word.word}</span>
                <span className="text-[11px] text-slate-400">({word.meaningTr})</span>
                <button
                  type="button"
                  onClick={() => toggleWord(word.id)}
                  className="text-slate-400 hover:text-rose-400 transition ml-1 cursor-pointer"
                  title="Listeden Çıkar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Selection & Configuration Card */}
      <div className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-5">
        {/* Topic Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Paragraf Teması / Bağlamı Seçin:</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => setSelectedTopic(topic.id)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  selectedTopic === topic.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50 border border-indigo-400'
                    : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700/80'
                }`}
              >
                <span>{topic.icon}</span>
                <span>{topic.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Source Toggle & Quick Action Bar */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Source Tabs */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSourceMode('learned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                sourceMode === 'learned'
                  ? 'bg-emerald-500/25 text-emerald-300 border-2 border-emerald-400'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Öğrendiklerim ({learnedWords.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceMode('curriculum')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                sourceMode === 'curriculum'
                  ? 'bg-blue-500/25 text-blue-300 border-2 border-blue-400'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>{teacherLevel} Müfredatı ({curriculumWords.length})</span>
            </button>
          </div>

          {/* Quick Helper Buttons */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Hızlı Seçim:</span>
            <button
              type="button"
              onClick={() => handleSelectFirst(5)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              İlk 5
            </button>
            <button
              type="button"
              onClick={() => handleSelectRandom(7)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center space-x-1 cursor-pointer"
            >
              <Shuffle className="w-3 h-3 text-indigo-400" />
              <span>Rastgele 7</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectRandom(10)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center space-x-1 cursor-pointer"
            >
              <Shuffle className="w-3 h-3 text-cyan-400" />
              <span>Rastgele 10</span>
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kelime ara veya Türkçe karşılığına göre filtrele..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
          />
        </div>

        {/* Available Words Clickable Pills Grid */}
        <div className="max-h-60 overflow-y-auto p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
          {filteredWords.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              {sourceMode === 'learned'
                ? 'Henüz "Öğrendiklerim" listenize eklenmiş kelime bulunmuyor. Yukarıdan müfredat kelimelerini seçebilir veya arama filtresini temizleyebilirsiniz.'
                : 'Aradığınız kritere uygun kelime bulunamadı.'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredWords.map((w) => {
                const isSelected = selectedWordIds.includes(w.id);
                const isMaxReached = selectedWordIds.length >= 10 && !isSelected;

                return (
                  <button
                    key={w.id}
                    type="button"
                    disabled={isMaxReached}
                    onClick={() => toggleWord(w.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950/50 scale-[1.02]'
                        : isMaxReached
                        ? 'bg-slate-900 text-slate-500 border border-slate-800 opacity-50 cursor-not-allowed'
                        : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span className="font-extrabold">{w.word}</span>
                    <span
                      className={`text-[10px] ${
                        isSelected ? 'text-slate-900/80 font-bold' : 'text-slate-400'
                      }`}
                    >
                      ({w.meaningTr})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Generate Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center space-x-1.5">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Hedef uzunluk: <strong className="text-white">50 - 60 İngilizce Kelime</strong>. Paragraf yapay zekâ tarafından oluşturulur ve seçilen tüm kelimeler vurgulanır.
            </span>
          </div>

          <button
            type="button"
            disabled={!countValid || isGenerating}
            onClick={handleGenerate}
            className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition cursor-pointer shrink-0 shadow-xl ${
              countValid && !isGenerating
                ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-emerald-950/50 border border-emerald-400/40 hover:scale-[1.01]'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>50-60 Kelimelik Paragraf Oluşturuluyor...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-emerald-300" />
                <span>50-60 Kelimelik Bağlamsal Paragraf Üret</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* GENERATED RESULT SECTION */}
      {result && (
        <div className="p-6 sm:p-7 bg-slate-900/95 border-2 border-indigo-500/50 rounded-3xl shadow-2xl space-y-6 animate-fade-in">
          {/* Result Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 flex-wrap gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold">
                  ✨ Gemini ile Bağlamsal Hikaye
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold">
                  📊 {result.wordCount} Kelime (Hedef: 50-60)
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>
                    {selectedWords.filter((w) => isWordInText(w.word, result.paragraphEn)).length} / {selectedWords.length} Hedef Kelime Dahil Edildi
                  </span>
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">{result.title}</h3>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handlePlayAudio}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm ${
                  isPlayingAudio
                    ? 'bg-emerald-500 text-slate-950 font-extrabold animate-pulse'
                    : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40'
                }`}
                title="Sesli Telaffuz Dinle"
              >
                <Volume2 className="w-4 h-4" />
                <span>{isPlayingAudio ? 'Okunuyor...' : 'Paragrafı Dinle'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                title="Metni Kopyala"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
                title="Yeniden Oluştur"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* English Paragraph Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>İngilizce Paragraf (50-60 Kelime):</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Yeşil vurgulu kelimeler seçtiğiniz hedef kelimelerdir.
              </span>
            </div>

            <div className="p-5 sm:p-6 bg-slate-950/80 border border-slate-800 rounded-2xl text-slate-100 text-sm sm:text-base leading-relaxed font-serif italic shadow-inner">
              &quot;{renderHighlightedParagraph(result.paragraphEn, selectedWords.map((w) => w.word))}&quot;
            </div>
          </div>

          {/* Turkish Translation Display */}
          <div className="space-y-2">
            <span className="font-bold text-slate-300 flex items-center space-x-1.5 text-xs">
              <Languages className="w-4 h-4 text-cyan-400" />
              <span>Türkçe Anlamı & Çevirisi:</span>
            </span>

            <div className="p-4 sm:p-5 bg-slate-950/50 border border-slate-800/80 rounded-2xl text-slate-300 text-xs sm:text-sm leading-relaxed">
              {result.paragraphTr}
            </div>
          </div>

          {/* Detailed Context Breakdown: How each word was used in context */}
          <div className="pt-4 border-t border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-0.5">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Kelimelerin Bağlamsal Kullanım ve Cümle Analizi</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  Seçtiğiniz her kelimenin paragraf içindeki gerçek kullanımını, Türkçe karşılığını ve bağlamsal ipucunu inceleyin:
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {selectedWords.length} Hedef Kelime
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {selectedWords.map((word) => {
                const breakdown = result.contextBreakdown?.find(
                  (b) => b.word.toLowerCase() === word.word.toLowerCase()
                );

                // Fallback to sentence extraction if breakdown wasn't returned for this specific word
                const sentences = result.paragraphEn.split(/(?<=[.?!])\s+/);
                const matchedSentence =
                  breakdown?.sentenceEn ||
                  sentences.find((s) => isWordInText(word.word, s)) ||
                  result.paragraphEn;

                const matchedTr = breakdown?.sentenceTr || result.paragraphTr;
                const tip = breakdown?.usageTip || `Bu kelime doğal İngilizce cümle yapısı ve akışında kullanılmıştır.`;

                return (
                  <div
                    key={word.id}
                    className="p-4 bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 rounded-2xl transition space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-extrabold text-xs border border-emerald-500/35">
                          {word.word}
                        </span>
                        <span className="text-xs text-slate-300 font-semibold">({word.meaningTr})</span>
                        {word.partOfSpeech && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 uppercase font-mono">
                            {word.partOfSpeech}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => speakWord(matchedSentence)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 transition cursor-pointer"
                        title="Bu Cümlenin Telaffuzunu Dinle"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Sentence in context */}
                    <div className="space-y-1.5 text-xs">
                      <p className="text-slate-200 font-serif leading-relaxed">
                        &quot;{renderHighlightedParagraph(matchedSentence, [word.word])}&quot;
                      </p>
                      <p className="text-slate-400 italic">
                        {matchedTr}
                      </p>
                    </div>

                    {/* Usage note / tip */}
                    <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-start space-x-1.5">
                      <BookmarkCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
