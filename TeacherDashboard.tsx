import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentUser, TeacherUser, VocabWord, Announcement, AnnouncementPriority } from '../../types';
import { DirectAddStudentModal } from '../ManagerView/DirectAddStudentModal';
import { StudentActivitiesView } from '../Shared/StudentActivitiesView';
import { MandatoryAnnouncementModal } from '../Shared/MandatoryAnnouncementModal';
import { speakWord } from '../../utils/speech';
import { generateVocabularyWithAI } from '../../services/geminiService';
import {
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  Users,
  BookOpen,
  Volume2,
  Sparkles,
  Plus,
  Award,
  Search,
  AlertCircle,
  HelpCircle,
  Activity,
  KeyRound,
  Trash2,
  Megaphone,
  Send,
  Eye,
  CheckCheck,
  Calendar,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const {
    currentUser,
    students,
    vocabulary,
    announcements,
    reviewStudent,
    deleteStudent,
    addVocabWord,
    openChangePasswordModal,
    createAnnouncement,
    deleteAnnouncement,
    acknowledgeAnnouncement,
  } = useApp();

  const teacher = currentUser as TeacherUser;

  const [activeTab, setActiveTab] = useState<'pending' | 'students' | 'vocab' | 'activities' | 'announcements'>('pending');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddVocabOpen, setIsAddVocabOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentUser | null>(null);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);

  // Announcement state
  const [isCreateAnnOpen, setIsCreateAnnOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState<AnnouncementPriority>('normal');
  const [annFeedback, setAnnFeedback] = useState<string | null>(null);
  const [selectedAnnouncementForAuditing, setSelectedAnnouncementForAuditing] = useState<Announcement | null>(null);
  const [annToDelete, setAnnToDelete] = useState<Announcement | null>(null);

  // New vocabulary word state
  const [newWord, setNewWord] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [newMeaningTr, setNewMeaningTr] = useState('');
  const [newDefEn, setNewDefEn] = useState('');
  const [newExEn, setNewExEn] = useState('');
  const [newExTr, setNewExTr] = useState('');

  // Reject modal state
  const [rejectingStudentId, setRejectingStudentId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Bu sınıf için uygun seviyede değilsiniz veya kontenjan dolu.');

  if (!teacher || teacher.role !== 'teacher') return null;

  // Unacknowledged manager announcements targeting teachers
  const unacknowledgedManagerAnnouncements = announcements.filter(
    (a) =>
      a.targetRole === 'teachers' &&
      (a.targetClassCode === 'ALL' || a.targetClassCode === teacher.classCode) &&
      !a.acknowledgedBy.includes(teacher.id)
  );

  // Announcements created for this teacher's class
  const myClassAnnouncements = announcements.filter(
    (a) => a.authorId === teacher.id || (a.targetRole === 'students' && a.targetClassCode === teacher.classCode)
  );

  // Students belonging to this teacher's classCode
  const myStudents = students.filter((s) => s.classCode === teacher.classCode);
  const pendingStudents = myStudents.filter((s) => s.status === 'pending');
  const approvedStudents = myStudents.filter((s) => s.status === 'approved');

  // Vocabulary search & pagination
  const [vocabSearch, setVocabSearch] = useState('');
  const [visibleVocabCount, setVisibleVocabCount] = useState(40);

  // Vocabulary for this teacher's level
  const classVocabulary = vocabulary.filter((w) => w.level === teacher.level);
  const filteredClassVocabulary = classVocabulary.filter((w) => {
    if (!vocabSearch) return true;
    const q = vocabSearch.toLowerCase();
    return w.word.toLowerCase().includes(q) || w.meaningTr.toLowerCase().includes(q);
  });
  const visibleClassVocab = filteredClassVocabulary.slice(0, visibleVocabCount);

  const copyClassCode = () => {
    navigator.clipboard.writeText(teacher.classCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleApprove = (studentId: string) => {
    reviewStudent(studentId, 'approved');
  };

  const handleConfirmReject = () => {
    if (rejectingStudentId) {
      reviewStudent(rejectingStudentId, 'rejected', rejectReason);
      setRejectingStudentId(null);
    }
  };

  const handleSaveWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord || !newMeaningTr || !newExEn) return;

    addVocabWord({
      word: newWord.toLowerCase().trim(),
      phonetic: newPhonetic || '/ˈwɜːd/',
      partOfSpeech: 'noun',
      level: teacher.level,
      meaningTr: newMeaningTr.trim(),
      definitionEn: newDefEn || 'Definition added by teacher',
      exampleEn: newExEn.trim(),
      exampleTr: newExTr.trim() || 'Örnek çevirisi',
    });

    setNewWord('');
    setNewPhonetic('');
    setNewMeaningTr('');
    setNewDefEn('');
    setNewExEn('');
    setNewExTr('');
    setIsAddVocabOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Mandatory Announcement from Manager to Teachers (Must click "Anladım." to proceed) */}
      <MandatoryAnnouncementModal
        unacknowledgedAnnouncements={unacknowledgedManagerAnnouncements}
        currentUserId={teacher.id}
        onAcknowledge={acknowledgeAnnouncement}
        userRoleName="Öğretmen"
      />

      {/* Teacher Hero Card with Prominent Class Code */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/70 to-slate-900 border border-blue-500/30 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-4">
            <img
              src={teacher.avatar}
              alt={teacher.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-blue-500/50 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
                <span>👩‍🏫 Öğretmen Paneli</span>
                <span>•</span>
                <span className="bg-blue-500/20 px-2 py-0.5 rounded text-blue-300">
                  {teacher.level} Müfredatı
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{teacher.name}</h1>
              <p className="text-sm text-slate-300 mt-1">{teacher.className}</p>
              <p className="text-xs text-slate-400 mt-0.5">{teacher.bio}</p>
            </div>
          </div>

          {/* Special Class Code Box (Hero element) */}
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:items-center justify-center shrink-0 min-w-[260px]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Özel Sınıf Kodunuz</span>
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-black font-mono tracking-widest text-white px-3 py-1 bg-slate-950 rounded-xl border border-slate-700">
                {teacher.classCode}
              </span>
              <button
                onClick={copyClassCode}
                title="Kodu Kopyala"
                className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                  copiedCode
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="text-xs">{copiedCode ? 'Kopyalandı' : 'Kopyala'}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Öğrencileriniz kayıt olurken bu kodu girerek sınıfınıza dahil olurlar.
            </p>
            <div className="mt-2.5 pt-2.5 border-t border-slate-800 w-full flex justify-center">
              <button
                type="button"
                onClick={openChangePasswordModal}
                className="hover-lift w-full py-2 px-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 hover:border-amber-400 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Hesap Şifremi Değiştir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending approvals */}
        <div
          onClick={() => setActiveTab('pending')}
          className={`p-4 bg-slate-900/80 border rounded-2xl cursor-pointer transition ${
            pendingStudents.length > 0
              ? 'border-amber-500/50 hover:bg-amber-950/20'
              : 'border-slate-800 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Onay Bekleyenler</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 flex items-center space-x-2">
            <span>{pendingStudents.length} Öğrenci</span>
            {pendingStudents.length > 0 && (
              <span className="text-xs font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full animate-pulse">
                İşlem Bekliyor
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Sınıf kodunuzla başvuranlar</div>
        </div>

        {/* Approved active students */}
        <div
          onClick={() => setActiveTab('students')}
          className="p-4 bg-slate-900/80 border border-slate-800 hover:bg-slate-850 rounded-2xl cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Aktif Sınıf Mevcudu</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{approvedStudents.length} Onaylı Öğrenci</div>
          <div className="text-[11px] text-slate-400 mt-1">Kelime ve test pratikleri açık</div>
        </div>

        {/* Level Vocabulary Count */}
        <div
          onClick={() => setActiveTab('vocab')}
          className="p-4 bg-slate-900/80 border border-slate-800 hover:bg-slate-850 rounded-2xl cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {teacher.level} Müfredat Kelimeleri
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{classVocabulary.length} Kelime</div>
          <div className="text-[11px] text-slate-400 mt-1">Sesli telaffuz ve flashcard destekli</div>
        </div>
      </div>

      {/* High-Contrast Navigation Tabs Container (Crisp & Readable on Vivid, Balanced, and Dark backgrounds) */}
      <div className="p-2 sm:p-2.5 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-xl shadow-slate-950/60 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`py-2 px-3.5 sm:px-4 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'pending'
              ? 'bg-amber-500/25 text-amber-300 border-2 border-amber-400 shadow-md shadow-amber-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <Clock className={`w-4 h-4 ${activeTab === 'pending' ? 'text-amber-400' : 'text-amber-400/80'}`} />
          <span>Onay Bekleyenler</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'pending'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-950 text-amber-300 border border-amber-500/40'
            }`}
          >
            {pendingStudents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`py-2 px-3.5 sm:px-4 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'students'
              ? 'bg-emerald-500/25 text-emerald-300 border-2 border-emerald-400 shadow-md shadow-emerald-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <Users className={`w-4 h-4 ${activeTab === 'students' ? 'text-emerald-400' : 'text-emerald-400/80'}`} />
          <span>Sınıfımdaki Öğrenciler</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'students'
                ? 'bg-emerald-400 text-slate-950'
                : 'bg-slate-950 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {approvedStudents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vocab')}
          className={`py-2 px-3.5 sm:px-4 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'vocab'
              ? 'bg-blue-500/25 text-blue-300 border-2 border-blue-400 shadow-md shadow-blue-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <BookOpen className={`w-4 h-4 ${activeTab === 'vocab' ? 'text-blue-400' : 'text-blue-400/80'}`} />
          <span>{teacher.level} Seviye Kelimeleri</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'vocab'
                ? 'bg-blue-400 text-slate-950'
                : 'bg-slate-950 text-blue-300 border border-blue-500/40'
            }`}
          >
            {classVocabulary.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activities')}
          className={`py-2 px-3.5 sm:px-4 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'activities'
              ? 'bg-indigo-500/25 text-indigo-300 border-2 border-indigo-400 shadow-md shadow-indigo-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <Activity className={`w-4 h-4 ${activeTab === 'activities' ? 'text-indigo-400' : 'text-indigo-400/80'}`} />
          <span>Öğrenci Hareketleri & Sınavlar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`py-2 px-3.5 sm:px-4 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'announcements'
              ? 'bg-teal-500/25 text-teal-300 border-2 border-teal-400 shadow-md shadow-teal-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <Megaphone className={`w-4 h-4 ${activeTab === 'announcements' ? 'text-teal-400' : 'text-teal-400/80'}`} />
          <span>Duyurular</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'announcements'
                ? 'bg-teal-400 text-slate-950'
                : 'bg-slate-950 text-teal-300 border border-teal-500/40'
            }`}
          >
            {myClassAnnouncements.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PENDING APPROVAL QUEUE */}
      {activeTab === 'pending' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Sınıf Koduyla Kayıt Olanlar (Onay / Red)</h3>
              <p className="text-xs text-slate-400">
                {teacher.classCode} koduyla kaydolan öğrencilerin başvurularını buradan onaylayabilir veya
                reddedebilirsiniz.
              </p>
            </div>
            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Manuel Öğrenci Ekle</span>
            </button>
          </div>

          {pendingStudents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center text-xl">
                🌸
              </div>
              <h4 className="text-base font-bold text-white">Bekleyen Başvuru Bulunmuyor</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Tüm kayıt başvuruları işlenmiş durumda. Öğrencileriniz <span className="font-mono text-emerald-400 font-bold">{teacher.classCode}</span> koduyla
                kayıt olduklarında burada listelenecektir.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {pendingStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-4 sm:p-5 hover:bg-slate-850/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-10 h-10 rounded-xl object-cover border border-amber-500/40 shrink-0"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{student.name}</span>
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                          Onay Bekliyor
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {student.email} • Başvuru Tarihi:{' '}
                        <span className="text-slate-300 font-medium">{student.enrolledDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleApprove(student.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Onayla</span>
                    </button>
                    <button
                      onClick={() => setRejectingStudentId(student.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500/40 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reddet</span>
                    </button>
                    <button
                      onClick={() => setStudentToDelete(student)}
                      title="Başvuruyu ve öğrenci kaydını sil"
                      className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Sil</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: APPROVED CLASS STUDENTS */}
      {activeTab === 'students' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Sınıfımdaki Onaylı Öğrenciler ({approvedStudents.length})</h3>
              <p className="text-xs text-slate-400">
                Sınıfınızdaki öğrencilerin kelime öğrenme ve CEFR test ilerlemeleri
              </p>
            </div>
            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-950/30"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Manuel Öğrenci Ekle</span>
            </button>
          </div>

          {deleteFeedback && (
            <div className="m-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
              <span>{deleteFeedback}</span>
              <button
                onClick={() => setDeleteFeedback(null)}
                className="text-emerald-400 hover:text-white font-bold ml-2 cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}

          {approvedStudents.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs">
              Bu sınıfta henüz onaylanmış öğrenci bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Öğrenci</th>
                    <th className="py-3 px-4">Öğrenilen Kelime</th>
                    <th className="py-3 px-4">Bloom XP / Bahçe</th>
                    <th className="py-3 px-4">Çözülen Test</th>
                    <th className="py-3 px-4">Kayıt Tarihi</th>
                    <th className="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {approvedStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={s.avatar}
                            alt={s.name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                          />
                          <div>
                            <div className="font-bold text-white">{s.name}</div>
                            <div className="text-[11px] text-slate-400">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-400 text-sm">
                          {s.progress.wordsLearned.length}
                        </span>{' '}
                        Kelime
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-amber-400 text-sm">
                          🌸 {s.progress.bloomScore} XP
                        </span>
                        <div className="text-[10px] text-slate-500">🔥 {s.progress.streakDays} Gün Seri</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-200">{s.progress.testsTaken} Test</span>
                        <div className="text-[10px] text-slate-500">
                          {s.progress.totalCorrect} Doğru Cevap
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{s.enrolledDate}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setStudentToDelete(s)}
                          title="Öğrenciyi sınıftan ve sistemden sil"
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Öğrenciyi Sil</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CURATED VOCABULARY FOR THIS LEVEL */}
      {activeTab === 'vocab' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">{teacher.level} Müfredat Kelimeleri</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">
                  {classVocabulary.length} Kelime
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Öğrencilerinizin flashcard ve testlerde pratik yaptığı kelime havuzu
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={vocabSearch}
                  onChange={(e) => {
                    setVocabSearch(e.target.value);
                    setVisibleVocabCount(40);
                  }}
                  placeholder="Kelime ara..."
                  className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setIsAddVocabOpen(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Yeni Kelime Ekle</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
            {visibleClassVocab.map((word) => (
              <div
                key={word.id}
                className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl hover:border-emerald-500/40 transition space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-extrabold text-white">{word.word}</span>
                      <span className="text-xs font-mono text-emerald-400">{word.phonetic}</span>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 px-1.5 py-0.5 bg-slate-800 rounded">
                        {word.partOfSpeech}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-emerald-300 mt-0.5">
                      {word.meaningTr}
                    </div>
                  </div>
                  <button
                    onClick={() => speakWord(word.word)}
                    title="Sesli Dinle"
                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 italic">&quot;{word.exampleEn}&quot;</p>
                <p className="text-[11px] text-slate-400">{word.exampleTr}</p>

                {word.collocations && word.collocations.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {word.collocations.map((c, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {visibleVocabCount < filteredClassVocabulary.length && (
            <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-800/20 text-xs">
              <span className="text-slate-400">
                {filteredClassVocabulary.length} kelimeden {visibleClassVocab.length} gösteriliyor
              </span>
              <button
                onClick={() => setVisibleVocabCount((prev) => Math.min(prev + 40, filteredClassVocabulary.length))}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition"
              >
                Daha Fazla Göster (+40)
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: STUDENT ACTIVITIES & EXAM AUDIT */}
      {activeTab === 'activities' && (
        <StudentActivitiesView
          filterClassCode={teacher.classCode}
          title={`${teacher.classCode} Öğrenci Hareketleri`}
          subtitle="Sınıfınızdaki öğrencilerin kelime eşleştirme oyunları, seviye sınavları ve çalışma kayıtları"
        />
      )}

      {/* TAB 5: CLASS ANNOUNCEMENTS (DUYURULAR) */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {/* Header & Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                <Megaphone className="w-4 h-4" />
                <span>Sınıf İçi Duyuru Sistemi</span>
                <span>•</span>
                <span>{teacher.className} ({teacher.classCode})</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Öğrenci Sınıf Duyuruları
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Yayınladığınız duyurular sınıfınızdaki tüm öğrencilerin ({approvedStudents.length} onaylı öğrenci) ekranında
                otomatik olarak açılır ve öğrenciler <strong className="text-teal-300">«Anladım.»</strong> butonuna basana kadar
                platformu kullanmaya devam edemezler.
              </p>
            </div>

            <button
              onClick={() => setIsCreateAnnOpen(true)}
              className="hover-lift px-5 py-3 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-teal-950/40 border border-teal-400/40 transition flex items-center justify-center space-x-2 text-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yeni Duyuru Yayınla</span>
            </button>
          </div>

          {/* Feedback message if any */}
          {annFeedback && (
            <div className="p-4 bg-teal-500/15 border border-teal-500/30 rounded-2xl text-teal-300 text-sm flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0" />
              <span>{annFeedback}</span>
            </div>
          )}

          {/* Announcements List */}
          {myClassAnnouncements.length === 0 ? (
            <div className="p-12 text-center space-y-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-400 mx-auto flex items-center justify-center">
                <Megaphone className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Henüz Bir Sınıf Duyurusu Bulunmuyor</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Haftalık ödevler, sınav takvimi veya kelime pratik hedefleri hakkında öğrencilerinizi bilgilendirmek için
                hemen ilk duyurunuzu oluşturabilirsiniz.
              </p>
              <button
                onClick={() => setIsCreateAnnOpen(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                + İlk Duyuruyu Yayınla
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myClassAnnouncements.map((ann) => {
                const readCount = approvedStudents.filter((s) => ann.acknowledgedBy.includes(s.id)).length;
                const totalTarget = approvedStudents.length;
                const readPercent = totalTarget > 0 ? Math.round((readCount / totalTarget) * 100) : 0;

                return (
                  <div
                    key={ann.id}
                    className="p-5 sm:p-6 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl shadow-lg transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center flex-wrap gap-2 text-xs">
                          {ann.priority === 'urgent' && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              <span>Acil Duyuru</span>
                            </span>
                          )}
                          {ann.priority === 'important' && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                              <Megaphone className="w-3 h-3 text-amber-400" />
                              <span>Önemli Duyuru</span>
                            </span>
                          )}
                          {ann.priority === 'normal' && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold">
                              <Info className="w-3 h-3 text-slate-400" />
                              <span>Bilgilendirme</span>
                            </span>
                          )}

                          <span className="text-slate-400 flex items-center space-x-1 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{ann.createdAt}</span>
                          </span>

                          <span className="text-slate-400 text-xs">
                            Hedef: <strong className="text-emerald-400 font-mono">{ann.targetClassCode || teacher.classCode}</strong>
                          </span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-bold text-white pt-1">
                          {ann.title}
                        </h3>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => setSelectedAnnouncementForAuditing(ann)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-teal-400" />
                          <span>Okuma Raporu ({readCount}/{totalTarget})</span>
                        </button>
                        <button
                          onClick={() => setAnnToDelete(ann)}
                          title="Duyuruyu Sil"
                          className="p-2 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700 hover:border-rose-500/40 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Announcement Content */}
                    <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                      {ann.content}
                    </div>

                    {/* Student Reading Progress Bar */}
                    <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-3 flex-1 max-w-md">
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/60">
                          <div
                            className={`h-full transition-all duration-500 ${
                              readPercent === 100
                                ? 'bg-emerald-500'
                                : readPercent > 50
                                ? 'bg-teal-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${readPercent}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-200 shrink-0 font-mono">%{readPercent}</span>
                      </div>

                      <div className="flex items-center space-x-4 text-slate-400">
                        <span className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                          <CheckCheck className="w-4 h-4" />
                          <span>{readCount} Öğrenci «Anladım.» Dedi</span>
                        </span>
                        {totalTarget - readCount > 0 && (
                          <span className="flex items-center space-x-1.5 text-amber-400/90 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{totalTarget - readCount} Öğrenci Bekliyor</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-base">
              <AlertCircle className="w-5 h-5" />
              <span>Öğrenci Kaydını Reddet</span>
            </div>
            <p className="text-xs text-slate-300">
              Öğrenciye gösterilecek red gerekçesini belirleyin:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRejectingStudentId(null)}
                className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
              >
                Reddet ve Bildir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Add Student Modal (Scoped to Teacher's own class) */}
      <DirectAddStudentModal
        isOpen={isAddStudentOpen}
        defaultClassCode={teacher.classCode}
        onClose={() => setIsAddStudentOpen(false)}
      />

      {/* Add Custom Word Modal */}
      {isAddVocabOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">+ {teacher.level} Seviyesine Yeni Kelime Ekle</h3>
            <form onSubmit={handleSaveWord} className="space-y-3 text-xs">
              {/* AI Auto-generate button */}
              <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 rounded-xl">
                <div className="flex items-center space-x-2 text-[11px] text-blue-300">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Gemini AI ({teacher.level} Müfredatına Uygun)</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const aiResults = await generateVocabularyWithAI(teacher.level);
                    if (aiResults && aiResults.length > 0) {
                      const item = aiResults[0];
                      if (item.word) setNewWord(item.word);
                      if (item.phonetic) setNewPhonetic(item.phonetic);
                      if (item.meaningTr) setNewMeaningTr(item.meaningTr);
                      if (item.definitionEn) setNewDefEn(item.definitionEn);
                      if (item.exampleEn) setNewExEn(item.exampleEn);
                      if (item.exampleTr) setNewExTr(item.exampleTr);
                    }
                  }}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-[11px] transition flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>AI ile Otomatik Doldur</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">İngilizce Kelime *</label>
                  <input
                    type="text"
                    required
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="Örn: accomplish"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fonetik Telaffuz</label>
                  <input
                    type="text"
                    value={newPhonetic}
                    onChange={(e) => setNewPhonetic(e.target.value)}
                    placeholder="/əˈkʌm.plɪʃ/"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Türkçe Anlamı *</label>
                <input
                  type="text"
                  required
                  value={newMeaningTr}
                  onChange={(e) => setNewMeaningTr(e.target.value)}
                  placeholder="başarmak, tamamlamak"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">İngilizce Örnek Cümle *</label>
                <input
                  type="text"
                  required
                  value={newExEn}
                  onChange={(e) => setNewExEn(e.target.value)}
                  placeholder="She accomplished her target in time."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Türkçe Örnek Çevirisi</label>
                <input
                  type="text"
                  value={newExTr}
                  onChange={(e) => setNewExTr(e.target.value)}
                  placeholder="Hedefini zamanında başardı."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddVocabOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold"
                >
                  Kelimeyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Öğrenciyi Sil</h3>
                <p className="text-xs text-slate-400">Bu işlem kalıcıdır ve geri alınamaz</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1 text-xs">
              <div className="text-white font-bold">{studentToDelete.name}</div>
              <div className="text-slate-400">{studentToDelete.email}</div>
              <div className="text-slate-400">
                Sınıf: <span className="font-mono text-emerald-400 font-bold">{studentToDelete.classCode}</span> • Durum:{' '}
                <span className={studentToDelete.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}>
                  {studentToDelete.status === 'approved' ? 'Onaylı' : 'Onay Bekliyor'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bu öğrenciyi sınıftan ve platformdan silmek istediğinize emin misiniz? Öğrencinin tüm kelime çalışmaları ve aktivite geçmişi silinecektir.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = deleteStudent(studentToDelete.id);
                  setDeleteFeedback(res.message);
                  setStudentToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-950/40 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Evet, Öğrenciyi Sil</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Create Announcement Modal */}
      {isCreateAnnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-teal-500/40 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 my-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-teal-400 font-extrabold text-lg">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-teal-400" />
                </div>
                <span>Sınıfa Yeni Duyuru Yayınla</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateAnnOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!annTitle.trim() || !annContent.trim()) return;
                const res = createAnnouncement({
                  title: annTitle.trim(),
                  content: annContent.trim(),
                  priority: annPriority,
                  targetRole: 'students',
                  targetClassCode: teacher.classCode,
                });
                if (res.success) {
                  setAnnFeedback(res.message);
                  setAnnTitle('');
                  setAnnContent('');
                  setAnnPriority('normal');
                  setIsCreateAnnOpen(false);
                  setTimeout(() => setAnnFeedback(null), 4000);
                }
              }}
              className="space-y-4 text-xs"
            >
              {/* Target Notice */}
              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-300 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-teal-400" />
                  <span>Hedef Kitle: {teacher.className} ({teacher.classCode})</span>
                </div>
                <p className="text-[11px] text-teal-300/80">
                  Bu duyuru sınıfınızdaki tüm öğrencilerin ({approvedStudents.length} öğrenci) ekranında açılır ve öğrenciler
                  <strong> «Anladım.»</strong> butonuna tıklayana kadar devam edemezler.
                </p>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Öncelik Seviyesi</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAnnPriority('normal')}
                    className={`p-2.5 rounded-xl border text-center transition font-semibold cursor-pointer ${
                      annPriority === 'normal'
                        ? 'bg-slate-800 border-teal-400 text-teal-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Bilgilendirme</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnPriority('important')}
                    className={`p-2.5 rounded-xl border text-center transition font-semibold cursor-pointer ${
                      annPriority === 'important'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>⚠️ Önemli</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnPriority('urgent')}
                    className={`p-2.5 rounded-xl border text-center transition font-semibold cursor-pointer ${
                      annPriority === 'urgent'
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🚨 Acil</span>
                  </button>
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Duyuru Başlığı <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Örn: Cuma Günü Seviye Atlama Sınavı ve Kelime Tekrarı"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              {/* Content textarea */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Duyuru İçeriği <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Sevgili öğrencilerim, bu hafta Cuma saat 15:00'te sistem üzerinden A1 seviye atlama sınavı yapılacaktır. Lütfen öğrendiğiniz kelimeleri 'Öğrendiklerim' sekmesinden tekrar ediniz..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm leading-relaxed"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateAnnOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-semibold transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Duyuruyu Yayınla</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Announcement Audit & Acknowledgement List Modal */}
      {selectedAnnouncementForAuditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-teal-400 font-bold">
                <Eye className="w-5 h-5 text-teal-400" />
                <span className="text-base sm:text-lg text-white">Öğrenci Okuma Raporu</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnnouncementForAuditing(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm line-clamp-1">
                {selectedAnnouncementForAuditing.title}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Yayınlanma: {selectedAnnouncementForAuditing.createdAt}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                <span>Sınıf Öğrencileri ({approvedStudents.length})</span>
                <span className="text-teal-400">
                  {
                    approvedStudents.filter((s) =>
                      selectedAnnouncementForAuditing.acknowledgedBy.includes(s.id)
                    ).length
                  }{' '}
                  / {approvedStudents.length} Okundu
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5 p-1 custom-scrollbar">
                {approvedStudents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Sınıfta henüz onaylı öğrenci bulunmuyor.
                  </div>
                ) : (
                  approvedStudents.map((s) => {
                    const hasRead = selectedAnnouncementForAuditing.acknowledgedBy.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          hasRead
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={s.avatar}
                            alt={s.name}
                            className="w-7 h-7 rounded-lg object-cover border border-slate-700"
                          />
                          <div>
                            <div className="font-bold text-white">{s.name}</div>
                            <div className="text-[10px] text-slate-400">{s.email}</div>
                          </div>
                        </div>

                        {hasRead ? (
                          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>«Anladım.» Dedi</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Giriş Bekleniyor</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedAnnouncementForAuditing(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delete Announcement Confirmation Modal */}
      {annToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Duyuruyu Sil</h3>
                <p className="text-xs text-slate-400">Bu duyuru sistemden kaldırılacaktır</p>
              </div>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs">
              <div className="text-white font-bold">{annToDelete.title}</div>
              <div className="text-slate-400 mt-1 line-clamp-2">{annToDelete.content}</div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bu duyuruyu silmek istediğinize emin misiniz? Öğrencilerin ekranından kaldırılacaktır.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setAnnToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAnnouncement(annToDelete.id);
                  setAnnToDelete(null);
                  setAnnFeedback('Duyuru başarıyla silindi.');
                  setTimeout(() => setAnnFeedback(null), 3000);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-950/40 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Evet, Duyuruyu Sil</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
