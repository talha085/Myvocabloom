import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentUser, CEFRLevel, VocabWord, LevelExamQuestion } from '../../types';
import { speakWord } from '../../utils/speech';
import { playCorrectSound, playWrongSound, playLevelUpSound } from '../../utils/soundEffects';
import { getCoherentQuizSentence, getCoherentDistractors } from '../../utils/quizSentenceEngine';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Volume2,
  TrendingUp,
  ShieldCheck,
  Check,
  Flame,
  GraduationCap,
} from 'lucide-react';

interface LevelExamPlayerProps {
  student: StudentUser;
  initialExamLevel?: CEFRLevel;
}

const NEXT_LEVEL_MAP: Record<CEFRLevel, CEFRLevel | 'MASTERY'> = {
  A1: 'A2',
  A2: 'B1',
  B1: 'B2',
  B2: 'C1',
  C1: 'C2',
  C2: 'MASTERY',
};

export const LevelExamPlayer: React.FC<LevelExamPlayerProps> = ({
  student,
  initialExamLevel,
}) => {
  const { vocabulary, submitLevelExamResult } = useApp();

  const currentStudentLevel = student.currentLevel || student.progress.currentLevel || 'A1';
  const [selectedExamLevel, setSelectedExamLevel] = useState<CEFRLevel>(
    initialExamLevel || currentStudentLevel
  );

  const [questions, setQuestions] = useState<LevelExamQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isExamCompleted, setIsExamCompleted] = useState(false);
  const [examResultOutcome, setExamResultOutcome] = useState<{
    passed: boolean;
    message: string;
    promotedTo?: CEFRLevel;
  } | null>(null);

  // Generate 10 fill-in-the-blank questions for the selected exam level
  const generateExamQuestions = (level: CEFRLevel) => {
    const levelWords = vocabulary.filter((w) => w.level === level);
    if (levelWords.length === 0) return [];

    // Shuffle and pick 10 words
    const shuffled = [...levelWords].sort(() => Math.random() - 0.5);
    const chosenWords = shuffled.slice(0, Math.min(10, shuffled.length));

    const generated: LevelExamQuestion[] = chosenWords.map((targetWord, index) => {
      // Pick 3 distractors of same level & part of speech
      const distractors = getCoherentDistractors(targetWord, vocabulary, level);

      // Create authentic sentence with blank
      const { sentenceWithBlank, fullSentence, turkishTranslation } = getCoherentQuizSentence(targetWord);

      // Shuffle 4 options
      const options = [targetWord.word, ...distractors.map((d) => d.word)].sort(
        () => Math.random() - 0.5
      );

      return {
        id: `exam-q-${index + 1}`,
        sentenceWithBlank,
        turkishTranslation,
        correctAnswer: targetWord.word,
        options,
        targetWord,
        explanation: `Doğru cevap: "${targetWord.word}" (${targetWord.phonetic}) -> ${targetWord.meaningTr} | Cümle: "${fullSentence}"`,
      };
    });

    return generated;
  };

  const startExam = (level: CEFRLevel) => {
    const qs = generateExamQuestions(level);
    setQuestions(qs);
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsExamCompleted(false);
    setExamResultOutcome(null);
  };

  useEffect(() => {
    startExam(selectedExamLevel);
  }, [selectedExamLevel]);

  const currentQ = questions[currentIdx];
  const isLastQuestion = currentIdx === questions.length - 1;

  const handleSelectOption = (opt: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(opt);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || isAnswerSubmitted || !currentQ) return;

    setIsAnswerSubmitted(true);
    const isCorrect = selectedOption.toLowerCase() === currentQ.correctAnswer.toLowerCase();

    if (isCorrect) {
      playCorrectSound();
      setScore((s) => s + 1);
    } else {
      playWrongSound();
    }
  };

  const handleNextQuestion = () => {
    if (!isLastQuestion) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      finishExam();
    }
  };

  const finishExam = () => {
    setIsExamCompleted(true);
    const finalScore = score + (selectedOption === currentQ.correctAnswer ? 1 : 0);
    const total = questions.length;
    const passed = finalScore >= Math.ceil(total * 0.8); // 80% passing threshold (8/10)

    const nextLevelTarget = NEXT_LEVEL_MAP[selectedExamLevel];
    const promotedTo = nextLevelTarget === 'MASTERY' ? 'C2' : nextLevelTarget;

    if (passed) {
      playLevelUpSound();
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.55 },
      });
    }

    const outcome = submitLevelExamResult(student.id, {
      examLevel: selectedExamLevel,
      score: finalScore,
      total,
      passed,
      promotedTo,
      date: new Date().toISOString().slice(0, 10),
    });

    setExamResultOutcome(outcome);
  };

  const passedLevels = student.progress.passedLevels || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Level Selection & Readiness Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Seviye Atlama Sınavı</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  {selectedExamLevel} ➔ {NEXT_LEVEL_MAP[selectedExamLevel]}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Boşluk doldurma sorularını en az %80 başarıyla geçin, resmi olarak bir üst kura terfi edin!
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="text-xs text-slate-400">Mevcut Seviyeniz:</span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xs border border-emerald-500/30">
              {currentStudentLevel}
            </span>
          </div>
        </div>

        {/* Level Tabs */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/80 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold shrink-0">Sınav Düzeyi:</span>
          {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((lvl) => {
            const isCompleted = passedLevels.includes(lvl);
            return (
              <button
                key={lvl}
                onClick={() => setSelectedExamLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl font-bold font-mono transition shrink-0 flex items-center space-x-1 cursor-pointer ${
                  selectedExamLevel === lvl
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
                }`}
              >
                <span>{lvl}</span>
                {isCompleted && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* EXAM IN PROGRESS */}
      {!isExamCompleted && currentQ && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Header & Progress */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
              <span>Soru {currentIdx + 1} / {questions.length}</span>
              <span>•</span>
              <span className="text-amber-400 font-mono">Geçme Barajı: 8/10 (%80)</span>
            </div>
            <div className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-500/30">
              Skor: {score} Doğru
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Sentence with Blank */}
          <div className="space-y-3 py-2">
            <span className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Boşluğa En Uygun Kelimeyi Seçin</span>
            </span>

            <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-3 shadow-inner">
              <p className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                {currentQ.sentenceWithBlank}
              </p>

              {/* Context clue / Turkish meaning */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/60">
                <span className="italic">&quot;{currentQ.turkishTranslation}&quot;</span>
                <button
                  type="button"
                  onClick={() => speakWord(currentQ.sentenceWithBlank.replace('_______', currentQ.correctAnswer))}
                  title="Cümleyi Dinle"
                  className="p-1.5 text-slate-400 hover:text-emerald-300 transition"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 4 Fill-in-the-blank Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrectAnswer = option.toLowerCase() === currentQ.correctAnswer.toLowerCase();

              let btnStyle =
                'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-750 hover:border-slate-600';

              if (isAnswerSubmitted) {
                if (isCorrectAnswer) {
                  btnStyle = 'bg-emerald-600/30 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-600/30 border-rose-500 text-rose-200 ring-2 ring-rose-500/50';
                } else {
                  btnStyle = 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-50';
                }
              } else if (isSelected) {
                btnStyle = 'bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-400/50';
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswerSubmitted}
                  onClick={() => handleSelectOption(option)}
                  className={`p-4 rounded-2xl border text-left font-bold transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                >
                  <span className="text-base tracking-wide font-mono">{option}</span>
                  {isAnswerSubmitted && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  {isAnswerSubmitted && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Answer Feedback Box */}
          {isAnswerSubmitted && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-1.5 animate-fade-in ${
                selectedOption?.toLowerCase() === currentQ.correctAnswer.toLowerCase()
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              }`}
            >
              <div className="flex items-center space-x-2 font-bold">
                {selectedOption?.toLowerCase() === currentQ.correctAnswer.toLowerCase() ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Harika! Doğru Yanıt</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Yanlış Yanıt</span>
                  </>
                )}
              </div>
              <p className="text-slate-300 text-xs">{currentQ.explanation}</p>
            </div>
          )}

          {/* Bottom Action Button */}
          <div className="flex items-center justify-end pt-2">
            {!isAnswerSubmitted ? (
              <button
                disabled={!selectedOption}
                onClick={handleSubmitAnswer}
                className="hover-lift px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Cevabı Onayla
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="hover-lift px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs sm:text-sm transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <span>{isLastQuestion ? 'Sınavı Tamamla' : 'Sonraki Soru'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* EXAM COMPLETED SUMMARY SCREEN */}
      {isExamCompleted && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-fade-in">
          {score >= 8 ? (
            // PASSED SCREEN
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center font-bold shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/30">
                <GraduationCap className="w-10 h-10 text-emerald-400" />
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">
                  Resmi Seviye Başarısı
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Tebrikler! Seviye Sınavını Geçtiniz! 🎓
                </h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  {selectedExamLevel} seviyesini <strong className="text-emerald-400 font-mono">{score}/10 (%{score * 10})</strong> başarıyla tamamlayarak bir üst seviyeye yükseldiniz!
                </p>
              </div>

              <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl max-w-md mx-auto text-xs text-emerald-300 space-y-1">
                <div className="font-bold flex items-center justify-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Öğretmeniniz ve Yönetici Bilgilendirildi</span>
                </div>
                <p className="text-slate-400">
                  Başarı kaydınız ve terfi durumunuz öğretmen ve yönetici denetim ekranına işlendi.
                </p>
              </div>
            </div>
          ) : (
            // NOT PASSED SCREEN
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center font-bold shadow-xl shadow-rose-500/20">
                <RotateCcw className="w-10 h-10 text-rose-400" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white">
                  Biraz Daha Pratik Gerekiyor
                </h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Skorunuz: <strong className="text-amber-400 font-mono">{score}/10 (%{score * 10})</strong>. Seviye atlamak için en az <strong className="text-emerald-400 font-mono">8/10 (%80)</strong> doğru yapmanız gerekmektedir.
                </p>
              </div>

              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl max-w-md mx-auto text-xs text-slate-300">
                💡 İpucu: Eşleştirme oyunu ve 3D flashcard sekmesinde eksik kelimeleri tekrar çalışıp istediğiniz zaman yeniden deneyebilirsiniz!
              </div>
            </div>
          )}

          {/* Stats breakdown */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="text-[11px] text-slate-400">Toplam Soru</div>
              <div className="text-lg font-bold text-white">{questions.length}</div>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="text-[11px] text-slate-400">Doğru Sayısı</div>
              <div className={`text-lg font-bold font-mono ${score >= 8 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {score}
              </div>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="text-[11px] text-slate-400">Kazanılan XP</div>
              <div className="text-lg font-bold text-amber-400 font-mono">
                +{score >= 8 ? 250 : 50} XP
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => startExam(selectedExamLevel)}
              className="hover-lift px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Sınavı Tekrarla</span>
            </button>

            {score >= 8 && selectedExamLevel !== 'C2' && (
              <button
                onClick={() => {
                  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
                  const nextIdx = levels.indexOf(selectedExamLevel) + 1;
                  if (nextIdx < levels.length) {
                    setSelectedExamLevel(levels[nextIdx]);
                  }
                }}
                className="hover-lift px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Sonraki Seviye Sınavına Geç ➔
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
