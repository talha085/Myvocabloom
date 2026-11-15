import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentUser } from '../../types';
import { PendingApprovalScreen } from './PendingApprovalScreen';
import { VocaBloomGarden } from './VocaBloomGarden';
import { FlashcardPlayer } from './FlashcardPlayer';
import { MatchingGame } from './MatchingGame';
import { LevelExamPlayer } from './LevelExamPlayer';
import { QuizPlayer } from './QuizPlayer';
import { VocabularyExplorer } from './VocabularyExplorer';
import { LearnedWordsView } from './LearnedWordsView';
import { MandatoryAnnouncementModal } from '../Shared/MandatoryAnnouncementModal';
import { ContextualParagraphGenerator } from './ContextualParagraphGenerator';
import { speakWord } from '../../utils/speech';
import {
  Sparkles,
  BookOpen,
  BookCheck,
  Layers,
  Award,
  Users,
  AlertCircle,
  HelpCircle,
  Flower2,
  Volume2,
  RefreshCw,
  GraduationCap,
  Gamepad2,
  KeyRound,
  Megaphone,
  Bell,
  Calendar,
  CheckCircle2,
  Info,
  AlertTriangle,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const {
    currentUser,
    teachers,
    vocabulary,
    announcements,
    acknowledgeAnnouncement,
    openChangePasswordModal,
    studentActiveTab,
    setStudentActiveTab,
    scrollToStudentTabNonce,
    suppressAnnouncementModal,
  } = useApp();

  const student = currentUser as StudentUser;
  const activeTab = (studentActiveTab as 'garden' | 'learned' | 'flashcards' | 'matching' | 'quiz' | 'exam' | 'explorer' | 'ai-story' | 'class' | 'announcements') || 'garden';
  const setActiveTab = (tab: 'garden' | 'learned' | 'flashcards' | 'matching' | 'quiz' | 'exam' | 'explorer' | 'ai-story' | 'class' | 'announcements') => setStudentActiveTab(tab);
  const tabContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollToStudentTabNonce > 0) {
      const timer = setTimeout(() => {
        tabContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [scrollToStudentTabNonce, activeTab]);

  // Unacknowledged teacher announcements for this student
  const unacknowledgedAnnouncements = announcements.filter(
    (a) =>
      a.targetRole === 'students' &&
      (a.targetClassCode === student.classCode || a.targetClassCode === 'ALL') &&
      !a.acknowledgedBy.includes(student.id)
  );

  // All announcements for this student's class
  const myClassAnnouncements = announcements.filter(
    (a) =>
      a.targetRole === 'students' &&
      (a.targetClassCode === student.classCode || a.targetClassCode === 'ALL')
  );

  if (!student || student.role !== 'student') return null;

  // 1. Pending Approval State Screen
  if (student.status === 'pending') {
    return <PendingApprovalScreen student={student} />;
  }

  // 2. Rejected State Screen
  if (student.status === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-slate-900 border border-rose-500/40 rounded-3xl text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Başvurunuz Onaylanmadı</h2>
        <p className="text-sm text-slate-300">
          <strong className="font-mono text-rose-400">{student.classCode}</strong> sınıfı için yaptığınız kayıt başvurusu
          öğretmen tarafından reddedildi.
        </p>
        {student.rejectionReason && (
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs text-rose-300">
            <strong>Öğretmen Notu:</strong> {student.rejectionReason}
          </div>
        )}
      </div>
    );
  }

  // 3. Approved Student State: Full Access!
  const myTeacher = teachers.find(
    (t) => t.classCode === student.classCode || t.id === student.teacherId
  );

  return (
    <div className="space-y-6">
      {/* Mandatory Announcement from Teacher (Must click "Anladım." to proceed) */}
      {!suppressAnnouncementModal && (
        <MandatoryAnnouncementModal
          unacknowledgedAnnouncements={unacknowledgedAnnouncements}
          currentUserId={student.id}
          onAcknowledge={acknowledgeAnnouncement}
          userRoleName="Öğrenci"
        />
      )}

      {/* Student Profile & Security Quick Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/30">
            🎓
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{student.name}</span>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {student.classCode}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {myTeacher ? `${myTeacher.name} • ${myTeacher.level} Seviyesi` : student.email}
            </div>
          </div>
        </div>

        <button
          onClick={openChangePasswordModal}
          className="hover-lift self-start sm:self-auto px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 hover:border-amber-400 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
        >
          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          <span>Şifremi Değiştir</span>
        </button>
      </div>

      {/* Visual Gamified Garden Banner */}
      <VocaBloomGarden progress={student.progress} />

      {/* High-Contrast Navigation Tabs Container (Crisp & Readable on Vivid, Balanced, and Dark backgrounds) */}
      <div className="p-2 sm:p-2.5 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-xl shadow-slate-950/60 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('garden')}
          className={`py-2 px-3.5 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'garden'
              ? 'bg-emerald-500/25 text-emerald-300 border-2 border-emerald-400 shadow-md shadow-emerald-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <Flower2 className={`w-4 h-4 ${activeTab === 'garden' ? 'text-emerald-400' : 'text-emerald-400/80'}`} />
          <span>VocaBloom Bahçem</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('learned')}
          className={`py-2 px-3.5 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'learned'
              ? 'bg-emerald-500/25 text-emerald-300 border-2 border-emerald-400 shadow-md shadow-emerald-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <BookCheck className={`w-4 h-4 ${activeTab === 'learned' ? 'text-emerald-400' : 'text-emerald-400/80'}`} />
          <span>Öğrendiklerim</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'learned'
                ? 'bg-emerald-400 text-slate-950'
                : 'bg-slate-950 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {student.progress.wordsLearned.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('flashcards')}
          className={`py-2 px-3.5 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'flashcards'
              ? 'bg-cyan-500/25 text-cyan-300 border-2 border-cyan-400 shadow-md shadow-cyan-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <Layers className={`w-4 h-4 ${activeTab === 'flashcards' ? 'text-cyan-400' : 'text-cyan-400/80'}`} />
          <span>3D Flashcard Pratiği</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matching')}
          className={`py-2 px-3.5 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'matching'
              ? 'bg-purple-500/25 text-purple-300 border-2 border-purple-400 shadow-md shadow-purple-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <Gamepad2 className={`w-4 h-4 ${activeTab === 'matching' ? 'text-purple-400' : 'text-purple-400/80'}`} />
          <span>Kelime Eşleştirme</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('quiz')}
          className={`py-2 px-3.5 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'quiz'
              ? 'bg-emerald-500/25 text-emerald-300 border-2 border-emerald-400 shadow-md shadow-emerald-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <Award className={`w-4 h-4 ${activeTab === 'quiz' ? 'text-emerald-400' : 'text-emerald-400/80'}`} />
          <span>CEFR Test & Quiz</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('exam')}
          className={`py-2 px-3.5 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'exam'
              ? 'bg-amber-500/25 text-amber-300 border-2 border-amber-400 shadow-md shadow-amber-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <GraduationCap className={`w-4 h-4 ${activeTab === 'exam' ? 'text-amber-400' : 'text-amber-400/80'}`} />
          <span>Seviye Atlama Sınavı 🎓</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('explorer')}
          className={`py-2 px-3.5 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'explorer'
              ? 'bg-blue-500/25 text-blue-300 border-2 border-blue-400 shadow-md shadow-blue-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <BookOpen className={`w-4 h-4 ${activeTab === 'explorer' ? 'text-blue-400' : 'text-blue-400/80'}`} />
          <span>Kelime Sözlüğü (A1-C2)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai-story')}
          className={`py-2 px-3.5 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'ai-story'
              ? 'bg-indigo-500/25 text-indigo-300 border-2 border-indigo-400 shadow-md shadow-indigo-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <Sparkles className={`w-4 h-4 ${activeTab === 'ai-story' ? 'text-indigo-400' : 'text-indigo-400/80'}`} />
          <span>AI ile Bağlamsal Paragraf Oluştur</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('class')}
          className={`py-2 px-3.5 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'class'
              ? 'bg-teal-500/25 text-teal-300 border-2 border-teal-400 shadow-md shadow-teal-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <Users className={`w-4 h-4 ${activeTab === 'class' ? 'text-teal-400' : 'text-teal-400/80'}`} />
          <span>Sınıfım & Öğretmenim</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`py-2 px-3.5 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'announcements'
              ? 'bg-cyan-500/25 text-cyan-300 border-2 border-cyan-400 shadow-md shadow-cyan-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <Megaphone className={`w-4 h-4 ${activeTab === 'announcements' ? 'text-cyan-400' : 'text-cyan-400/80'}`} />
          <span>Duyurular</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'announcements'
                ? 'bg-cyan-400 text-slate-950'
                : 'bg-slate-950 text-cyan-300 border border-cyan-500/40'
            }`}
          >
            {myClassAnnouncements.length}
          </span>
        </button>
      </div>

      <div id="student-tab-content" ref={tabContentRef} className="scroll-mt-24">
      {/* Tab 1: Garden Overview */}
      {activeTab === 'garden' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Gelişim Özeti & Başarılar</span>
            </h3>
            <p className="text-xs text-slate-400">
              VocaBloom sisteminde aktif olarak öğrendiğin kelimeler ve tamamladığın CEFR seviyeleri
            </p>

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-300">Öğrenilen Kelime Dağarcığı:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {student.progress.wordsLearned.length} Kelime
                </span>
              </div>
              <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-300">Toplam Doğru Cevap:</span>
                <span className="font-bold text-white text-sm">
                  {student.progress.totalCorrect} / {student.progress.testsTaken * 5 || 1}
                </span>
              </div>
              <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-300">Kayıtlı Sınıf Kodu:</span>
                <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {student.classCode}
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setActiveTab('flashcards')}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                Flashcard Çalışmaya Başla
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition"
              >
                Test Çöz
              </button>
            </div>
          </div>

          {/* Teacher Info Card */}
          {myTeacher && (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Sınıf Eğitmeniniz</span>
              </h3>
              <div className="flex items-center space-x-3.5">
                <img
                  src={myTeacher.avatar}
                  alt={myTeacher.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500/40"
                />
                <div>
                  <h4 className="font-extrabold text-white text-base">{myTeacher.name}</h4>
                  <p className="text-xs text-blue-400 font-mono font-semibold">{myTeacher.classCode}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{myTeacher.className}</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 italic">
                &quot;{myTeacher.bio || 'Düzenli kelime tekrarları ve telaffuz çalışmaları başarıyı getirir.'}&quot;
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Learned Words */}
      {activeTab === 'learned' && (
        <LearnedWordsView
          student={student}
          onNavigateToFlashcards={() => setActiveTab('flashcards')}
          onNavigateToExplorer={() => setActiveTab('explorer')}
        />
      )}

      {/* Tab 2: 3D Flashcards */}
      {activeTab === 'flashcards' && (
        <FlashcardPlayer
          student={student}
          initialLevel={student.currentLevel || myTeacher?.level || 'A1'}
        />
      )}

      {/* Tab: Matching Game */}
      {activeTab === 'matching' && (
        <MatchingGame
          student={student}
          initialLevel={student.currentLevel || myTeacher?.level || 'A1'}
        />
      )}

      {/* Tab: Quiz & Tests */}
      {activeTab === 'quiz' && (
        <QuizPlayer
          student={student}
          initialLevel={student.currentLevel || myTeacher?.level || 'A1'}
        />
      )}

      {/* Tab: Level Advancement Gateway Exam */}
      {activeTab === 'exam' && (
        <LevelExamPlayer
          student={student}
          initialExamLevel={student.currentLevel || myTeacher?.level || 'A1'}
        />
      )}

      {/* Tab 4: Vocabulary Explorer */}
      {activeTab === 'explorer' && <VocabularyExplorer student={student} />}

      {/* Tab: AI Contextual Paragraph Generator (50-60 words with 5-10 selected words) */}
      {activeTab === 'ai-story' && (
        <ContextualParagraphGenerator
          student={student}
          vocabulary={vocabulary}
          teacherLevel={myTeacher?.level || 'A1'}
        />
      )}

      {/* Tab 5: Class Info */}
      {activeTab === 'class' && (
        <div className="max-w-xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white">Sınıfım ve Kayıt Bilgileri</h3>
          {myTeacher ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Sınıf Adı:</span>
                <span className="font-bold text-white">{myTeacher.className}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Öğretmen:</span>
                <span className="font-bold text-white">{myTeacher.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Öğretmen Sınıf Kodu:</span>
                <span className="font-mono font-bold text-emerald-400">{student.classCode}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Kayıt Statüsü:</span>
                <span className="font-bold text-emerald-400">✓ Onaylandı</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Katılım Tarihi:</span>
                <span className="text-slate-300">{student.enrolledDate}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Sınıf bilgisi yükleniyor...</p>
          )}
        </div>
      )}

      {/* Tab 6: Class Announcements */}
      {activeTab === 'announcements' && (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Megaphone className="w-4 h-4" />
              <span>Sınıf İletişim Panosu</span>
              <span>•</span>
              <span className="font-mono text-emerald-400">{student.classCode}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">
              Öğretmen Duyuruları
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {myTeacher ? `${myTeacher.name} (${myTeacher.className})` : 'Sınıf öğretmeniniz'} tarafından iletilen
              duyurular, sınav takvimi ve haftalık hedefler.
            </p>
          </div>

          {myClassAnnouncements.length === 0 ? (
            <div className="p-12 text-center space-y-3 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 mx-auto flex items-center justify-center">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Henüz Yeni Duyuru Yok</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Öğretmeniniz sınıfınıza duyuru yaptığında hem giriş ekranınızda açılacak hem de bu sekmeden tekrar
                okunabilecektir.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myClassAnnouncements.map((ann) => {
                const isAcknowledged = ann.acknowledgedBy.includes(student.id);

                return (
                  <div
                    key={ann.id}
                    className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-4 transition hover:border-slate-750"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2 border-b border-slate-800/80">
                      <div className="space-y-1">
                        <div className="flex items-center flex-wrap gap-2 text-xs">
                          {ann.priority === 'urgent' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              <span>Acil</span>
                            </span>
                          )}
                          {ann.priority === 'important' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center space-x-1">
                              <Bell className="w-3 h-3 text-amber-400" />
                              <span>Önemli</span>
                            </span>
                          )}
                          {ann.priority === 'normal' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold flex items-center space-x-1">
                              <Info className="w-3 h-3 text-slate-400" />
                              <span>Bilgilendirme</span>
                            </span>
                          )}

                          <span className="text-slate-400 flex items-center space-x-1 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{ann.createdAt}</span>
                          </span>

                          <span className="text-slate-400 text-xs">
                            Yazan: <strong className="text-slate-200">{ann.authorName}</strong>
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-white pt-1">
                          {ann.title}
                        </h3>
                      </div>

                      {/* Status indicator */}
                      <div className="shrink-0 pt-1">
                        {isAcknowledged ? (
                          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>«Anladım.» Dendi</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => acknowledgeAnnouncement(ann.id, student.id)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center space-x-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Anladım.</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                      {ann.content}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};
