import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HierarchicalTree } from './HierarchicalTree';
import { AddTeacherModal } from './AddTeacherModal';
import { DirectAddStudentModal } from './DirectAddStudentModal';
import { TransferStudentModal } from './TransferStudentModal';
import { TeacherReassignModal } from './TeacherReassignModal';
import { StudentActivitiesView } from '../Shared/StudentActivitiesView';
import {
  Users,
  GraduationCap,
  Sparkles,
  ArrowRightLeft,
  Clock,
  BookOpen,
  FolderTree,
  History,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Activity,
  KeyRound,
  Trash2,
  Search,
  Megaphone,
  Send,
  Eye,
  CheckCheck,
  AlertTriangle,
  Info,
  Plus,
} from 'lucide-react';
import { StudentUser, TeacherUser, Announcement, AnnouncementPriority } from '../../types';

export const ManagerDashboard: React.FC = () => {
  const {
    manager,
    teachers,
    students,
    transfers,
    vocabulary,
    announcements,
    deleteTeacher,
    deleteStudent,
    openChangePasswordModal,
    createAnnouncement,
    deleteAnnouncement,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'tree' | 'teachers' | 'students' | 'transfers' | 'activities' | 'announcements'>('tree');

  // Modal states
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isDirectAddStudentOpen, setIsDirectAddStudentOpen] = useState(false);
  const [directAddDefaultClass, setDirectAddDefaultClass] = useState<string | undefined>(undefined);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferDefaultStudentId, setTransferDefaultStudentId] = useState<string | undefined>(undefined);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignTeacherId, setReassignTeacherId] = useState<string>('');
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherUser | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentUser | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Announcement state for manager
  const [isCreateAnnOpen, setIsCreateAnnOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState<AnnouncementPriority>('important');
  const [annTargetTeacher, setAnnTargetTeacher] = useState<string>('ALL');
  const [selectedAnnouncementForAuditing, setSelectedAnnouncementForAuditing] = useState<Announcement | null>(null);
  const [annToDelete, setAnnToDelete] = useState<Announcement | null>(null);

  // Manager announcements targeting teachers
  const managerAnnouncements = announcements.filter(
    (a) => a.targetRole === 'teachers' || a.authorRole === 'manager'
  );

  // Student tab filters
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('ALL');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'ALL' | 'approved' | 'pending'>('ALL');

  const approvedStudents = students.filter((s) => s.status === 'approved');
  const pendingStudents = students.filter((s) => s.status === 'pending');

  const handleOpenDirectAdd = (classCode?: string) => {
    setDirectAddDefaultClass(classCode);
    setIsDirectAddStudentOpen(true);
  };

  const handleOpenTransfer = (studentId?: string) => {
    setTransferDefaultStudentId(studentId);
    setIsTransferModalOpen(true);
  };

  const handleOpenReassign = (teacherId: string) => {
    setReassignTeacherId(teacherId);
    setIsReassignModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>👑 Yönetici Portalı</span>
              <span>•</span>
              <span>{manager.department}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {manager.name}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Öğretmen kadrosu (4+), sınıflar ve öğrencilerin tüm idari süreçlerini, sınıf kodu atamalarını ve
              öğrenci nakil işlemlerini hiyerarşik yapı üzerinden yönetin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openChangePasswordModal}
              className="hover-lift px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 hover:border-amber-400 font-bold rounded-xl text-xs sm:text-sm transition flex items-center space-x-1.5 cursor-pointer shadow-md"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Şifre Değiştir</span>
            </button>
            <button
              onClick={() => setIsAddTeacherOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-blue-900/30 transition flex items-center space-x-2"
            >
              <span>+ Yeni Öğretmen Ekle</span>
            </button>
            <button
              onClick={() => handleOpenDirectAdd()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition flex items-center space-x-2"
            >
              <span>+ Doğrudan Öğrenci Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Teachers */}
        <div className="p-4 sm:p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Öğretmen Kadrosu</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{teachers.length} Eğitmen</div>
          <div className="text-xs text-blue-400 mt-1">4 Temel CEFR Branşı</div>
        </div>

        {/* Total Students */}
        <div className="p-4 sm:p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Toplam Öğrenci</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{students.length} Kayıtlı</div>
          <div className="text-xs text-slate-400 mt-1">
            {approvedStudents.length} Onaylı • {pendingStudents.length} Bekleyen
          </div>
        </div>

        {/* Pending Student Registrations */}
        <div className="p-4 sm:p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Onay Bekleyenler</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
            {pendingStudents.length} Öğrenci
          </div>
          <div className="text-xs text-slate-400 mt-1">Öğretmen onayı bekleniyor</div>
        </div>

        {/* Total Transfers Conducted */}
        <div className="p-4 sm:p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Öğrenci Nakilleri</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">
            {transfers.length} İşlem
          </div>
          <div className="text-xs text-slate-400 mt-1">Sınıflar arası aktarım kaydı</div>
        </div>
      </div>

      {/* High-Contrast Navigation Tabs Container (Crisp & Readable on Vivid, Balanced, and Dark backgrounds) */}
      <div className="p-2 sm:p-2.5 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-xl shadow-slate-950/60 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('tree')}
          className={`py-2 px-3.5 sm:px-4 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'tree'
              ? 'bg-emerald-500/25 text-emerald-300 border-2 border-emerald-400 shadow-md shadow-emerald-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <FolderTree className={`w-4 h-4 ${activeTab === 'tree' ? 'text-emerald-400' : 'text-emerald-400/80'}`} />
          <span>Hiyerarşik Ağaç Yapısı</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('teachers')}
          className={`py-2 px-3.5 sm:px-4 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'teachers'
              ? 'bg-blue-500/25 text-blue-300 border-2 border-blue-400 shadow-md shadow-blue-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <Users className={`w-4 h-4 ${activeTab === 'teachers' ? 'text-blue-400' : 'text-blue-400/80'}`} />
          <span>Öğretmen Kadrosu</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'teachers'
                ? 'bg-blue-400 text-slate-950'
                : 'bg-slate-950 text-blue-300 border border-blue-500/40'
            }`}
          >
            {teachers.length}
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
          <GraduationCap className={`w-4 h-4 ${activeTab === 'students' ? 'text-emerald-400' : 'text-emerald-400/80'}`} />
          <span>Öğrenci Yönetimi</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'students'
                ? 'bg-emerald-400 text-slate-950'
                : 'bg-slate-950 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {students.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transfers')}
          className={`py-2 px-3.5 sm:px-4 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'transfers'
              ? 'bg-purple-500/25 text-purple-300 border-2 border-purple-400 shadow-md shadow-purple-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <History className={`w-4 h-4 ${activeTab === 'transfers' ? 'text-purple-400' : 'text-purple-400/80'}`} />
          <span>Nakil Kayıtları</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'transfers'
                ? 'bg-purple-400 text-slate-950'
                : 'bg-slate-950 text-purple-300 border border-purple-500/40'
            }`}
          >
            {transfers.length}
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
          <span>Öğrenci Hareketleri & Denetim</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`py-2 px-3.5 sm:px-4 text-xs sm:text-sm font-extrabold flex items-center space-x-2 rounded-xl transition cursor-pointer select-none ${
            activeTab === 'announcements'
              ? 'bg-indigo-500/25 text-indigo-300 border-2 border-indigo-400 shadow-md shadow-indigo-950/50'
              : 'bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700/80 shadow-sm'
          }`}
        >
          <Megaphone className={`w-4 h-4 ${activeTab === 'announcements' ? 'text-indigo-400' : 'text-indigo-400/80'}`} />
          <span>Duyurular</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'announcements'
                ? 'bg-indigo-400 text-slate-950'
                : 'bg-slate-950 text-indigo-300 border border-indigo-500/40'
            }`}
          >
            {managerAnnouncements.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Hierarchical Tree View */}
      {activeTab === 'tree' && (
        <HierarchicalTree
          onOpenAddTeacher={() => setIsAddTeacherOpen(true)}
          onOpenDirectAddStudent={handleOpenDirectAdd}
          onOpenTransferStudent={handleOpenTransfer}
          onOpenReassignTeacher={handleOpenReassign}
        />
      )}

      {/* Tab 2: Teachers Staff Table */}
      {activeTab === 'teachers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Öğretmen Kadrosu & Sınıf Kodları</h3>
              <p className="text-xs text-slate-400">
                Her öğretmenin kendine özel sınıf kodu ve seviye ataması bulunmaktadır.
              </p>
            </div>
            <button
              onClick={() => setIsAddTeacherOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
            >
              <span>+ Yeni Öğretmen Ekle</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Öğretmen</th>
                  <th className="py-3 px-4">Sınıf Kodu</th>
                  <th className="py-3 px-4">Seviye & Sınıf</th>
                  <th className="py-3 px-4">Öğrenci Sayısı</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {teachers.map((t) => {
                  const classStudents = students.filter((s) => s.classCode === t.classCode);
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={t.avatar}
                            alt={t.name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                          />
                          <div>
                            <div className="font-bold text-white">{t.name}</div>
                            <div className="text-[11px] text-slate-400">{t.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                          {t.classCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{t.className}</div>
                        <div className="text-[11px] text-slate-500">CEFR: {t.level}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white">{classStudents.length}</span> Öğrenci
                        {classStudents.some((s) => s.status === 'pending') && (
                          <span className="ml-1 text-[10px] text-amber-400 font-semibold">
                            ({classStudents.filter((s) => s.status === 'pending').length} Onay Bekliyor)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenReassign(t.id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg text-xs font-medium transition cursor-pointer"
                        >
                          Atamayı Değiştir
                        </button>
                        <button
                          onClick={() => handleOpenDirectAdd(t.classCode)}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg text-xs font-medium transition cursor-pointer"
                        >
                          + Öğrenci Ekle
                        </button>
                        <button
                          onClick={() => setTeacherToDelete(t)}
                          title="Öğretmeni sil"
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium transition cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Sil</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: All Students Management */}
      {activeTab === 'students' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Tüm Akademi Öğrenci Yönetimi</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {students.length} Kayıtlı
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Yönetici yetkisiyle tüm sınıflara doğrudan öğrenci ekleyin, öğrencileri silin veya nakil edin.
              </p>
            </div>
            <button
              onClick={() => handleOpenDirectAdd()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/40 transition flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
            >
              <GraduationCap className="w-4 h-4" />
              <span>+ Doğrudan Öğrenci Ekle</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="px-5 pb-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Öğrenci adı veya e-posta ara..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1">
                <span className="text-slate-400 text-xs">Sınıf:</span>
                <select
                  value={studentClassFilter}
                  onChange={(e) => setStudentClassFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="ALL">Tüm Sınıflar</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.classCode}>
                      {t.classCode} ({t.name})
                    </option>
                  ))}
                  <option value="ATANMAMIŞ">Atanmamış Öğrenciler</option>
                </select>
              </div>

              <div className="flex items-center space-x-1">
                <span className="text-slate-400 text-xs">Durum:</span>
                <select
                  value={studentStatusFilter}
                  onChange={(e) => setStudentStatusFilter(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="ALL">Tümü ({students.length})</option>
                  <option value="approved">Onaylı ({approvedStudents.length})</option>
                  <option value="pending">Onay Bekleyen ({pendingStudents.length})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto">
            {(() => {
              const filtered = students.filter((s) => {
                if (studentClassFilter !== 'ALL' && s.classCode !== studentClassFilter) return false;
                if (studentStatusFilter !== 'ALL' && s.status !== studentStatusFilter) return false;
                if (studentSearch) {
                  const q = studentSearch.toLowerCase();
                  return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-8 text-center text-slate-500 text-xs italic">
                    Arama kriterlerine uygun öğrenci bulunamadı.
                  </div>
                );
              }

              return (
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/60 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Öğrenci</th>
                      <th className="py-3 px-4">Sınıf Kodu</th>
                      <th className="py-3 px-4">Sorumlu Öğretmen</th>
                      <th className="py-3 px-4">Durum</th>
                      <th className="py-3 px-4">Kelime & XP</th>
                      <th className="py-3 px-4">Kayıt Tarihi</th>
                      <th className="py-3 px-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filtered.map((s) => {
                      const teacher = teachers.find((t) => t.classCode === s.classCode);
                      const isApproved = s.status === 'approved';
                      return (
                        <tr key={s.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4">
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
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {s.classCode || 'Atanmamış'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {teacher ? (
                              <div>
                                <div className="font-semibold text-white">{teacher.name}</div>
                                <div className="text-[10px] text-slate-500">{teacher.className}</div>
                              </div>
                            ) : (
                              <span className="text-amber-400 text-xs">Atama Bekleniyor</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {isApproved ? (
                              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Onaylı
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[11px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                                <Clock className="w-3 h-3 mr-1" /> Onay Bekliyor
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-emerald-400 font-bold">{s.progress.wordsLearned.length}</span> Kelime
                            <span className="text-slate-500 mx-1">•</span>
                            <span className="text-amber-400 font-semibold">{s.progress.bloomScore} XP</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">{s.enrolledDate}</td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenTransfer(s.id)}
                              title="Başka sınıfa naklet"
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-medium transition cursor-pointer"
                            >
                              Naklet
                            </button>
                            <button
                              onClick={() => setStudentToDelete(s)}
                              title="Öğrenciyi sil"
                              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium transition cursor-pointer inline-flex items-center space-x-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Sil</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      )}

      {/* Tab 3: Student Transfers Log */}
      {activeTab === 'transfers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Öğrenci Nakil & Transfer Denetim Kayıtları</h3>
              <p className="text-xs text-slate-400">
                Sınıflar arası yapılan tüm öğrenci transferleri ve yönetici notları
              </p>
            </div>
            <button
              onClick={() => handleOpenTransfer()}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Yeni Nakil İşlemi</span>
            </button>
          </div>

          {transfers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Henüz gerçekleşmiş bir nakil kaydı bulunmamaktadır.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {transfers.map((tr) => (
                <div key={tr.id} className="p-4 sm:p-5 hover:bg-slate-800/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{tr.studentName}</span>
                        <span className="text-slate-400">nakledildi:</span>
                        <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-rose-300 font-semibold line-through">
                          {tr.fromClassCode}
                        </span>
                        <span>&rarr;</span>
                        <span className="font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300 font-bold">
                          {tr.toClassCode}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1 italic">
                        &quot;{tr.note || 'Yönetici tarafından onaylandı'}&quot;
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-slate-400 text-[11px] shrink-0">
                    <div>İşlemi Yapan: <strong className="text-slate-200">{tr.transferredBy}</strong></div>
                    <div className="flex items-center sm:justify-end gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{tr.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Student Activities & Institution-wide Exam Audit */}
      {activeTab === 'activities' && (
        <StudentActivitiesView
          title="Platform Genel Öğrenci Hareketleri ve Denetim Kaydı"
          subtitle="Tüm öğretmen ve sınıflardaki öğrencilerin kelime eşleştirme oyunları, seviye sınavları ve terfi durumları"
        />
      )}

      {/* Tab 5: Manager to Teachers Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {/* Header & Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Megaphone className="w-4 h-4" />
                <span>Yönetimsel Duyuru Sistemi</span>
                <span>•</span>
                <span>Öğretmen Kadrosu Bilgilendirme</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Öğretmen Duyuruları & Bildirim Yönetimi
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Buradan yayınlayacağınız duyurular öğretmenler sisteme giriş yaptıklarında tam ekran olarak karşılarına
                çıkacaktır. Öğretmenler <strong className="text-indigo-300">«Anladım.»</strong> butonuna tıklayana kadar
                sistemde işlem yapmaya devam edemezler.
              </p>
            </div>

            <button
              onClick={() => setIsCreateAnnOpen(true)}
              className="hover-lift px-5 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-950/40 border border-indigo-400/40 transition flex items-center justify-center space-x-2 text-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yeni Öğretmen Duyurusu Yayınla</span>
            </button>
          </div>

          {/* Announcements List */}
          {managerAnnouncements.length === 0 ? (
            <div className="p-12 text-center space-y-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
                <Megaphone className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Henüz Öğretmenlere Yapılmış Bir Duyuru Yok</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Dönem müfredatı, haftalık sınav politikaları veya zümre toplantı kararlarını öğretmenlerinizle anında
                paylaşmak için ilk duyurunuzu oluşturun.
              </p>
              <button
                onClick={() => setIsCreateAnnOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                + İlk Duyuruyu Yayınla
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {managerAnnouncements.map((ann) => {
                const targetTeachers =
                  !ann.targetClassCode || ann.targetClassCode === 'ALL'
                    ? teachers
                    : teachers.filter((t) => t.classCode === ann.targetClassCode);

                const readCount = targetTeachers.filter((t) => ann.acknowledgedBy.includes(t.id)).length;
                const totalTarget = targetTeachers.length;
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
                              <span>Genel Bilgilendirme</span>
                            </span>
                          )}

                          <span className="text-slate-400 flex items-center space-x-1 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{ann.createdAt}</span>
                          </span>

                          <span className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold">
                            {ann.targetClassCode === 'ALL' || !ann.targetClassCode
                              ? 'Tüm Öğretmenler'
                              : `Sadece ${ann.targetClassCode}`}
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
                          <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Öğretmen Raporu ({readCount}/{totalTarget})</span>
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

                    {/* Teacher Reading Progress Bar */}
                    <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-3 flex-1 max-w-md">
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/60">
                          <div
                            className={`h-full transition-all duration-500 ${
                              readPercent === 100
                                ? 'bg-emerald-500'
                                : readPercent > 50
                                ? 'bg-indigo-500'
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
                          <span>{readCount} Öğretmen «Anladım.» Dedi</span>
                        </span>
                        {totalTarget - readCount > 0 && (
                          <span className="flex items-center space-x-1.5 text-amber-400/90 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{totalTarget - readCount} Öğretmen Bekleniyor</span>
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

      {/* Modals */}
      <AddTeacherModal
        isOpen={isAddTeacherOpen}
        onClose={() => setIsAddTeacherOpen(false)}
      />

      <DirectAddStudentModal
        isOpen={isDirectAddStudentOpen}
        defaultClassCode={directAddDefaultClass}
        onClose={() => setIsDirectAddStudentOpen(false)}
      />

      <TransferStudentModal
        isOpen={isTransferModalOpen}
        defaultStudentId={transferDefaultStudentId}
        onClose={() => setIsTransferModalOpen(false)}
      />

      <TeacherReassignModal
        isOpen={isReassignModalOpen}
        teacherId={reassignTeacherId}
        onClose={() => setIsReassignModalOpen(false)}
      />

      {/* Notice Message Toast */}
      {noticeMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center space-x-3 text-xs sm:text-sm animate-fade-in border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span className="font-medium">{noticeMessage}</span>
          <button
            onClick={() => setNoticeMessage(null)}
            className="text-white/80 hover:text-white font-bold ml-2 cursor-pointer text-base"
          >
            &times;
          </button>
        </div>
      )}

      {/* Delete Teacher Confirmation Modal */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Öğretmeni Kadrodan Sil</h3>
                <p className="text-xs text-slate-400">Yönetici yetkisi ile silme</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1 text-xs">
              <div className="text-white font-bold text-sm">{teacherToDelete.name}</div>
              <div className="text-slate-400">{teacherToDelete.email}</div>
              <div className="text-slate-400">
                Sınıf Kodu: <span className="font-mono text-blue-400 font-bold">{teacherToDelete.classCode}</span> • {teacherToDelete.className} ({teacherToDelete.level})
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bu öğretmeni silmek istediğinize emin misiniz? Öğretmenin sınıfına bağlı öğrenciler silinmez, atamasız duruma geçirilerek başka bir sınıfa aktarılabilirler.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = deleteTeacher(teacherToDelete.id);
                  setNoticeMessage(res.message);
                  setTeacherToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-950/40 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Evet, Öğretmeni Sil</span>
              </button>
            </div>
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
                <p className="text-xs text-slate-400">Yönetici yetkisi ile kalıcı silme</p>
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
              Bu öğrenciyi okul kütüğünden ve sistemden kalıcı olarak silmek istediğinize emin misiniz? Öğrencinin tüm kayıt ve ilerleme verileri kaldırılacaktır.
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
                  setNoticeMessage(res.message);
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

      {/* 1. Manager Create Announcement Modal */}
      {isCreateAnnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 my-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-400 font-extrabold text-lg">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-indigo-400" />
                </div>
                <span>Öğretmen Kadrosuna Duyuru Yayınla</span>
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
                  targetRole: 'teachers',
                  targetClassCode: annTargetTeacher,
                });
                if (res.success) {
                  setNoticeMessage(res.message);
                  setAnnTitle('');
                  setAnnContent('');
                  setAnnPriority('important');
                  setAnnTargetTeacher('ALL');
                  setIsCreateAnnOpen(false);
                  setTimeout(() => setNoticeMessage(null), 4000);
                }
              }}
              className="space-y-4 text-xs"
            >
              {/* Target Selector */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Hedef Öğretmen Grubu
                </label>
                <select
                  value={annTargetTeacher}
                  onChange={(e) => setAnnTargetTeacher(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs cursor-pointer font-medium"
                >
                  <option value="ALL">📢 Tüm Öğretmenler ({teachers.length} Öğretmen - Genel Akademik)</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.classCode}>
                      👤 {t.name} ({t.className} - {t.classCode})
                    </option>
                  ))}
                </select>
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
                        ? 'bg-slate-800 border-indigo-400 text-indigo-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Genel Bilgi</span>
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

              {/* Info notice */}
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Zorunlu Onay Kuralı:</span>
                </div>
                <p className="text-[11px] text-indigo-300/80">
                  Öğretmenler sisteme girdiklerinde bu duyuru tam ekran olarak belirecek ve devam edebilmek için
                  <strong> «Anladım.»</strong> butonuna tıklamak zorunda olacaklardır.
                </p>
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
                  placeholder="Örn: 2026 Bahar Dönemi CEFR Kelime Hedefleri ve Zümre Kararı"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              {/* Content textarea */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Duyuru Metni <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Değerli Öğretmenlerimiz, bu dönem tüm sınıflarımızda 3.000 kelimelik CEFR kelime havuzu aktif olarak kullanılacaktır..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed"
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
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Duyuruyu Yayınla</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Manager Teacher Audit Modal */}
      {selectedAnnouncementForAuditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold">
                <Eye className="w-5 h-5 text-indigo-400" />
                <span className="text-base sm:text-lg text-white">Öğretmen Okuma Denetim Raporu</span>
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
              {(() => {
                const targetTeachers =
                  !selectedAnnouncementForAuditing.targetClassCode ||
                  selectedAnnouncementForAuditing.targetClassCode === 'ALL'
                    ? teachers
                    : teachers.filter(
                        (t) => t.classCode === selectedAnnouncementForAuditing.targetClassCode
                      );
                const readCount = targetTeachers.filter((t) =>
                  selectedAnnouncementForAuditing.acknowledgedBy.includes(t.id)
                ).length;

                return (
                  <>
                    <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                      <span>Hedef Öğretmenler ({targetTeachers.length})</span>
                      <span className="text-indigo-400">
                        {readCount} / {targetTeachers.length} Okundu
                      </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1.5 p-1 custom-scrollbar">
                      {targetTeachers.map((t) => {
                        const hasRead = selectedAnnouncementForAuditing.acknowledgedBy.includes(t.id);
                        return (
                          <div
                            key={t.id}
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                              hasRead
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                                : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <img
                                src={t.avatar}
                                alt={t.name}
                                className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                              />
                              <div>
                                <div className="font-bold text-white">{t.name}</div>
                                <div className="text-[10px] text-slate-400">
                                  {t.className} • <span className="font-mono">{t.classCode}</span>
                                </div>
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
                      })}
                    </div>
                  </>
                );
              })()}
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
              Bu duyuruyu silmek istediğinize emin misiniz? Öğretmenlerin ekranından kaldırılacaktır.
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
                  setNoticeMessage('Duyuru başarıyla silindi.');
                  setTimeout(() => setNoticeMessage(null), 3000);
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
