import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentUser } from '../../types';
import { speakWord } from '../../utils/speech';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  Lock,
} from 'lucide-react';

interface PendingApprovalScreenProps {
  student: StudentUser;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({ student }) => {
  const { teachers, vocabulary, openChangePasswordModal } = useApp();

  const assignedTeacher = teachers.find(
    (t) => t.classCode === student.classCode || t.id === student.teacherId
  );

  // Demo preview card while waiting
  const previewWords = vocabulary.slice(0, 3);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentWord = previewWords[currentIdx];

  const handleNextPreview = () => {
    setIsFlipped(false);
    setCurrentIdx((prev) => (prev + 1) % previewWords.length);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Pending Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/40 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>Kaydınız Alındı • Öğretmen Onayı Bekliyor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Hoş Geldin, {student.name}!
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              <strong className="text-amber-400 font-mono">{student.classCode}</strong> sınıf koduyla kaydınız
              başarıyla oluşturuldu. Sınıf öğretmeniniz başvurunuzu inceleyip onayladığında platformun tüm CEFR
              testleri ve VocaBloom bahçesi aktifleşecektir.
            </p>
          </div>

          {/* Student account settings button */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-left shrink-0 max-w-xs space-y-2.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Hesap Güvenliği</span>
            </div>
            <p className="text-xs text-slate-300">
              Onay sürecini beklerken hesap şifrenizi istediğiniz zaman güncelleyebilirsiniz:
            </p>
            <button
              onClick={openChangePasswordModal}
              className="hover-lift w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Şifremi Değiştir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Teacher Information Card */}
      {assignedTeacher && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Başvurduğunuz Eğitmen & Sınıf
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <img
                src={assignedTeacher.avatar}
                alt={assignedTeacher.name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white text-base">{assignedTeacher.name}</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {assignedTeacher.classCode}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{assignedTeacher.className}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{assignedTeacher.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Öğretmeninizin onay listesinde sıradasınız</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Demo Flashcard while waiting */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>🌸 Beklerken Birkaç Kelime Keşfet (Önizleme)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Onaylanırken sistemi deneyimlemeniz için örnek kelime kartı:
            </p>
          </div>
          <button
            onClick={handleNextPreview}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sıradaki Kelime</span>
          </button>
        </div>

        {currentWord && (
          <div className="perspective-1000">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="cursor-pointer relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-850 border border-slate-700/80 hover:border-emerald-500/40 transition-all text-center min-h-[190px] flex flex-col justify-center items-center group shadow-md"
            >
              {!isFlipped ? (
                <div className="space-y-2">
                  <div className="inline-block text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase">
                    {currentWord.level} • {currentWord.partOfSpeech}
                  </div>
                  <h2 className="text-3xl font-extrabold text-white tracking-wide">
                    {currentWord.word}
                  </h2>
                  <p className="text-sm font-mono text-emerald-400">{currentWord.phonetic}</p>
                  <div className="pt-2 flex items-center justify-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakWord(currentWord.word);
                      }}
                      className="p-2 rounded-xl bg-slate-700 hover:bg-emerald-600 text-white transition flex items-center space-x-1 text-xs"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Telaffuzu Dinle</span>
                    </button>
                    <span className="text-xs text-slate-400">(Anlamı görmek için karta tıkla)</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 animate-fade-in">
                  <h2 className="text-2xl font-bold text-emerald-300">{currentWord.meaningTr}</h2>
                  <p className="text-xs text-slate-300 italic max-w-md">
                    &quot;{currentWord.exampleEn}&quot;
                  </p>
                  <p className="text-xs text-slate-400">{currentWord.exampleTr}</p>
                  <p className="text-[11px] text-slate-500 pt-1">
                    (İngilizce kelimeye dönmek için tıkla)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
