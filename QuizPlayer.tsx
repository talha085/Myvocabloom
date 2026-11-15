import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentUser, CEFRLevel, QuizQuestion, VocabWord } from '../../types';
import { speakWord } from '../../utils/speech';
import { playCorrectSound, playWrongSound, playLevelUpSound } from '../../utils/soundEffects';
import { getCoherentQuizSentence, getCoherentDistractors } from '../../utils/quizSentenceEngine';
import confetti from 'canvas-confetti';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  RotateCcw,
  HelpCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface QuizPlayerProps {
  student: StudentUser;
  initialLevel?: CEFRLevel;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ student, initialLevel }) => {
  const { vocabulary, submitQuizResult } = useApp();

  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>(initialLevel || 'A1');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  // Generate 5 questions for selected level
  const generateQuestions = (level: CEFRLevel) => {
    const levelWords = vocabulary.filter((w) => w.level === level);
    if (levelWords.length === 0) return [];

    // Shuffle words
    const shuffledWords = [...levelWords].sort(() => Math.random() - 0.5);
    const selected = shuffledWords.slice(0, Math.min(5, shuffledWords.length));

    const generated: QuizQuestion[] = selected.map((word, index) => {
      // Pick 3 plausible distractors from the SAME CEFR level & part of speech
      const distractors = getCoherentDistractors(word, vocabulary, level);

      const typePick = index % 3;
      if (typePick === 0) {
        // Type 1: English to Turkish
        const options = [word.meaningTr, ...distractors.map((d) => d.meaningTr)].sort(
          () => Math.random() - 0.5
        );
        return {
          id: `q-${index}`,
          wordId: word.id,
          type: 'multiple-choice',
          question: `"${word.word.toUpperCase()}" kelimesinin Türkçe karşılığı nedir?`,
          options,
          correctAnswer: word.meaningTr,
          explanation: `"${word.word}" (${word.phonetic}) -> ${word.meaningTr}`,
          targetWord: word,
        };
      } else if (typePick === 1) {
        // Type 2: Audio listening
        const options = [word.word, ...distractors.map((d) => d.word)].sort(() => Math.random() - 0.5);
        return {
          id: `q-${index}`,
          wordId: word.id,
          type: 'audio-listening',
          question: `Telaffuzu dinleyin ve telaffuz edilen kelimeyi seçin:`,
          options,
          correctAnswer: word.word,
          explanation: `Telaffuz edilen: "${word.word}" (${word.meaningTr})`,
          targetWord: word,
        };
      } else {
        // Type 3: Fill in the blank - Authentic, context-rich sentence
        const { sentenceWithBlank, fullSentence, turkishTranslation } = getCoherentQuizSentence(word);
        const options = [word.word, ...distractors.map((d) => d.word)].sort(() => Math.random() - 0.5);
        return {
          id: `q-${index}`,
          wordId: word.id,
          type: 'fill-blank',
          question: `Cümledeki boşluğa hangi kelime gelmelidir?`,
          options,
          correctAnswer: word.word,
          sentenceWithBlank,
          turkishTranslation,
          explanation: `Doğru cümle: "${fullSentence}" (${turkishTranslation})`,
          targetWord: word,
        };
      }
    });

    return generated;
  };

  useEffect(() => {
    const qs = generateQuestions(selectedLevel);
    setQuestions(qs);
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsQuizCompleted(false);
  }, [selectedLevel]);

  const currentQ = questions[currentIdx];

  const handleSelectOption = (opt: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(opt);
  };

  const handleConfirmAnswer = () => {
    if (!selectedOption || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);

    const isCorrect = selectedOption.toLowerCase() === currentQ.correctAnswer.toLowerCase();
    if (isCorrect) {
      playCorrectSound();
      setScore((prev) => prev + 1);
    } else {
      playWrongSound();
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      // Finish Quiz
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsQuizCompleted(true);
    const finalScore = score + (selectedOption === currentQ.correctAnswer ? 1 : 0);
    const xpEarned = finalScore * 25 + 50; // XP formula

    if (finalScore >= 4) {
      playLevelUpSound();
    }

    submitQuizResult(student.id, {
      date: new Date().toISOString().slice(0, 10),
      level: selectedLevel,
      score: finalScore,
      total: questions.length,
      xpEarned,
    });

    // Celebration Confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const restartQuiz = () => {
    const qs = generateQuestions(selectedLevel);
    setQuestions(qs);
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsQuizCompleted(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Level Selection Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400">Test Seviyesi:</span>
          {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition ${
                selectedLevel === lvl
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {!isQuizCompleted && questions.length > 0 && (
          <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
            Soru {currentIdx + 1} / {questions.length}
          </div>
        )}
      </div>

      {/* QUIZ COMPLETED SCREEN */}
      {isQuizCompleted ? (
        <div className="p-8 bg-slate-900 border border-emerald-500/40 rounded-3xl text-center space-y-6 shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center text-3xl shadow-lg">
            🌸
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {selectedLevel} Testi Tamamlandı!
            </span>
            <h2 className="text-3xl font-extrabold text-white">Harika Bir Pratik!</h2>
            <p className="text-xs text-slate-400">
              Başarın VocaBloom bahçene eklendi ve seviye gelişim puanın arttı.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="text-xs text-slate-400">Doğru Sayısı</div>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">
                {score} / {questions.length}
              </div>
            </div>
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="text-xs text-slate-400">Kazanılan XP</div>
              <div className="text-2xl font-black text-amber-400 mt-0.5">
                +{score * 25 + 50} XP
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-center space-x-3">
            <button
              onClick={restartQuiz}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Tekrar Çöz</span>
            </button>
          </div>
        </div>
      ) : currentQ ? (
        /* ACTIVE QUESTION CARD */
        <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
          {/* Question Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {currentQ.type === 'multiple-choice'
                  ? 'Kelime Anlamı'
                  : currentQ.type === 'audio-listening'
                  ? 'Sesli Dinleme Testi'
                  : 'Cümle Tamamlama'}
              </span>
              <span className="text-xs text-slate-400 font-mono">Skor: {score}</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
              {currentQ.question}
            </h3>

            {/* Audio Button if listening test */}
            {currentQ.type === 'audio-listening' && (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => speakWord(currentQ.targetWord.word)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition flex items-center space-x-2 shadow-lg shadow-emerald-950/40"
                >
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span>Kelimeyi Dinle (Sesli)</span>
                </button>
              </div>
            )}

            {/* Blank sentence display if fill-blank */}
            {currentQ.type === 'fill-blank' && (
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-center font-serif text-base text-slate-100">
                &quot;{currentQ.sentenceWithBlank || currentQ.targetWord.exampleEn.replace(new RegExp(`\\b${currentQ.targetWord.word}\\b`, 'gi'), '_____')}&quot;
                <p className="text-xs font-sans text-slate-400 mt-1">
                  ({currentQ.turkishTranslation || currentQ.targetWord.exampleTr})
                </p>
              </div>
            )}
          </div>

          {/* Options Grid */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, i) => {
              const isSelected = selectedOption === opt;
              let optionStyle = 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-750';

              if (isAnswerSubmitted) {
                if (opt.toLowerCase() === currentQ.correctAnswer.toLowerCase()) {
                  optionStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                } else if (isSelected) {
                  optionStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 line-through';
                } else {
                  optionStyle = 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-50';
                }
              } else if (isSelected) {
                optionStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold shadow-md';
              }

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  disabled={isAnswerSubmitted}
                  className={`w-full p-4 rounded-2xl border text-left text-sm transition-all flex items-center justify-between ${optionStyle}`}
                >
                  <span className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-700/60 text-slate-300 text-xs flex items-center justify-center font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                  </span>

                  {isAnswerSubmitted && opt.toLowerCase() === currentQ.correctAnswer.toLowerCase() && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  {isAnswerSubmitted && isSelected && opt.toLowerCase() !== currentQ.correctAnswer.toLowerCase() && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation if submitted */}
          {isAnswerSubmitted && (
            <div className="p-4 rounded-2xl bg-slate-850 border border-slate-700/80 space-y-1 text-xs animate-fade-in">
              <span className="font-bold text-emerald-400">Açıklama:</span>
              <p className="text-slate-300">{currentQ.explanation}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex justify-end">
            {!isAnswerSubmitted ? (
              <button
                type="button"
                onClick={handleConfirmAnswer}
                disabled={!selectedOption}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                Cevabı Onayla
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
              >
                <span>{currentIdx < questions.length - 1 ? 'Sonraki Soru' : 'Sonucu Gör'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
