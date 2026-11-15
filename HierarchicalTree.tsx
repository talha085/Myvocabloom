import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentUser, TeacherUser } from '../../types';
import {
  FolderTree,
  ChevronRight,
  ChevronDown,
  User,
  GraduationCap,
  Sparkles,
  ArrowRightLeft,
  UserPlus,
  Settings,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  Trash2,
} from 'lucide-react';

interface HierarchicalTreeProps {
  onOpenAddTeacher: () => void;
  onOpenDirectAddStudent: (classCode?: string) => void;
  onOpenTransferStudent: (studentId?: string) => void;
  onOpenReassignTeacher: (teacherId: string) => void;
}

export const HierarchicalTree: React.FC<HierarchicalTreeProps> = ({
  onOpenAddTeacher,
  onOpenDirectAddStudent,
  onOpenTransferStudent,
  onOpenReassignTeacher,
}) => {
  const { manager, teachers, students, deleteTeacher, deleteStudent } = useApp();

  const [teacherToDelete, setTeacherToDelete] = useState<TeacherUser | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentUser | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const [expandedTeachers, setExpandedTeachers] = useState<Record<string, boolean>>(() => {
    // Expand all teachers by default
    const map: Record<string, boolean> = {};
    teachers.forEach((t) => {
      map[t.id] = true;
    });
    return map;
  });

  const [isRootExpanded, setIsRootExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const toggleTeacher = (teacherId: string) => {
    setExpandedTeachers((prev) => ({
      ...prev,
      [teacherId]: !prev[teacherId],
    }));
  };

  const expandAll = () => {
    const map: Record<string, boolean> = {};
    teachers.forEach((t) => {
      map[t.id] = true;
    });
    setExpandedTeachers(map);
    setIsRootExpanded(true);
  };

  const collapseAll = () => {
    setExpandedTeachers({});
  };

  // Filter teachers/students by search query and level
  const filteredTeachers = teachers.filter((teacher) => {
    if (filterLevel !== 'ALL' && teacher.level !== filterLevel) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchTeacher =
      teacher.name.toLowerCase().includes(q) ||
      teacher.classCode.toLowerCase().includes(q) ||
      teacher.className.toLowerCase().includes(q);

    const hasMatchingStudents = students.some(
      (s) =>
        s.classCode === teacher.classCode &&
        (s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
    );

    return matchTeacher || hasMatchingStudents;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Top Tree Controls Bar */}
      <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FolderTree className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Hiyerarşik Akademi Ağacı</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Canlı Görünüm
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Okul &rarr; Öğretmen Kadrosu ({teachers.length}) &rarr; Sınıflar &rarr; Kayıtlı Öğrenciler ({students.length})
          </p>
        </div>

        {/* Global Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddTeacher}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Yeni Öğretmen Ekle</span>
          </button>

          <button
            onClick={() => onOpenDirectAddStudent()}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Doğrudan Öğrenci Ekle</span>
          </button>

          <button
            onClick={() => onOpenTransferStudent()}
            className="px-3 py-1.5 bg-amber-600/80 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Öğrenci Nakil Et</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-4 sm:px-6 py-3 bg-slate-800/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[200px] max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Öğretmen, sınıf kodu veya öğrenci ara..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400 text-xs">Seviye Filtrele:</span>
          {['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition ${
                filterLevel === lvl
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={expandAll}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
          >
            Hepsini Aç
          </button>
          <button
            onClick={collapseAll}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
          >
            Hepsini Kapat
          </button>
        </div>
      </div>

      {/* The Hierarchical Tree Canvas */}
      <div className="p-4 sm:p-6 overflow-x-auto">
        {/* ROOT NODE: School & Manager */}
        <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 before:top-4 before:bottom-0 before:w-0.5 before:bg-slate-700">
          <div className="flex items-start sm:items-center justify-between p-3.5 bg-slate-800/90 border border-slate-700 rounded-xl mb-4 shadow-sm hover:border-emerald-500/50 transition">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsRootExpanded(!isRootExpanded)}
                className="p-1 rounded hover:bg-slate-700 text-slate-400"
              >
                {isRootExpanded ? (
                  <ChevronDown className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
                🏫
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-white text-sm">
                    My VocaBloom Akademi (Merkez Kampüs)
                  </span>
                  <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                    👑 Yönetici: {manager.name}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {manager.department} • Toplam {teachers.length} Öğretmen • {students.length} Kayıtlı Öğrenci
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-2 text-xs">
              <span className="px-2 py-1 bg-slate-700/60 rounded text-slate-300 font-medium">
                {teachers.length} Aktif Sınıf
              </span>
            </div>
          </div>

          {/* TEACHERS (Branch Nodes) */}
          {isRootExpanded && (
            <div className="space-y-4 pl-4 sm:pl-6 border-l-2 border-slate-800 ml-2">
              {filteredTeachers.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs bg-slate-800/30 rounded-xl">
                  Arama kriterlerine uygun öğretmen veya sınıf bulunamadı.
                </div>
              ) : (
                filteredTeachers.map((teacher) => {
                  const classStudents = students.filter(
                    (s) =>
                      s.classCode === teacher.classCode &&
                      (!searchQuery ||
                        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.email.toLowerCase().includes(searchQuery.toLowerCase()))
                  );
                  const approvedCount = classStudents.filter((s) => s.status === 'approved').length;
                  const pendingCount = classStudents.filter((s) => s.status === 'pending').length;
                  const isExpanded = !!expandedTeachers[teacher.id];

                  return (
                    <div key={teacher.id} className="relative">
                      {/* Teacher / Class Node Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 rounded-xl transition gap-3">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleTeacher(teacher.id)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 shrink-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-blue-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <img
                            src={teacher.avatar}
                            alt={teacher.name}
                            className="w-9 h-9 rounded-lg object-cover border border-blue-500/40 shrink-0"
                          />
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="font-bold text-white text-sm">
                                {teacher.name}
                              </span>
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                {teacher.classCode}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                {teacher.level}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {teacher.className} • {teacher.email}
                            </div>
                          </div>
                        </div>

                        {/* Node Action Buttons */}
                        <div className="flex items-center space-x-2 pl-7 sm:pl-0">
                          {/* Student count pill */}
                          <div className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700">
                            <span className="text-slate-300 font-semibold">{approvedCount} Onaylı</span>
                            {pendingCount > 0 && (
                              <span className="text-amber-400 font-bold ml-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {pendingCount} Bekleyen
                              </span>
                            )}
                          </div>

                          {/* Quick Add Student directly to this teacher's class */}
                          <button
                            onClick={() => onOpenDirectAddStudent(teacher.classCode)}
                            title="Bu sınıfa doğrudan öğrenci ekle"
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition flex items-center space-x-1"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">+ Doğrudan Ekle</span>
                          </button>

                          {/* Reassign teacher button */}
                          <button
                            onClick={() => onOpenReassignTeacher(teacher.id)}
                            title="Öğretmen atamasını ve sınıf kodunu değiştir"
                            className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 border border-purple-500/30 rounded-lg text-xs font-medium transition flex items-center space-x-1"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Atama Değiştir</span>
                          </button>

                          {/* Delete Teacher button */}
                          <button
                            onClick={() => setTeacherToDelete(teacher)}
                            title="Öğretmeni ve sınıfı kadrodan sil"
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium transition flex items-center space-x-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Öğretmeni Sil</span>
                          </button>
                        </div>
                      </div>

                      {/* STUDENTS (Leaf Nodes under Teacher) */}
                      {isExpanded && (
                        <div className="mt-2 ml-6 pl-4 border-l-2 border-dashed border-slate-700/80 space-y-2">
                          {classStudents.length === 0 ? (
                            <div className="p-3 text-xs text-slate-500 bg-slate-850 rounded-lg italic">
                              Bu sınıfta henüz kayıtlı öğrenci bulunmuyor. Yukarıdaki "+ Doğrudan Ekle" butonu ile
                              ekleyebilirsiniz.
                            </div>
                          ) : (
                            classStudents.map((student) => {
                              const isApproved = student.status === 'approved';
                              return (
                                <div
                                  key={student.id}
                                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl border transition gap-2 ${
                                    isApproved
                                      ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                                      : 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2.5">
                                    <div
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                        isApproved
                                          ? 'bg-emerald-500/20 text-emerald-400'
                                          : 'bg-amber-500/20 text-amber-400'
                                      }`}
                                    >
                                      {isApproved ? '🎓' : '⏳'}
                                    </div>
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <span className="font-semibold text-slate-100 text-xs">
                                          {student.name}
                                        </span>
                                        {isApproved ? (
                                          <span className="inline-flex items-center text-[10px] text-emerald-400 font-medium">
                                            <CheckCircle2 className="w-3 h-3 mr-0.5" /> Onaylı
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center text-[10px] text-amber-400 font-bold bg-amber-500/20 px-1.5 py-0.5 rounded">
                                            <Clock className="w-3 h-3 mr-0.5" /> Onay Bekliyor
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-400">
                                        {student.email} • Kayıt:{' '}
                                        <span className="text-slate-300">{student.enrolledDate}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Student Progress & Actions */}
                                  <div className="flex items-center space-x-2 text-xs pl-9 sm:pl-0">
                                    {isApproved && (
                                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 mr-1">
                                        <span className="text-emerald-400 font-semibold">
                                          {student.progress.wordsLearned.length} Kelime
                                        </span>
                                        <span>•</span>
                                        <span className="text-amber-400 font-medium">
                                          🌸 {student.progress.bloomScore} XP
                                        </span>
                                      </div>
                                    )}

                                    {/* Transfer Student action */}
                                    <button
                                      onClick={() => onOpenTransferStudent(student.id)}
                                      title="Öğrenciyi başka bir sınıfa naklet"
                                      className="px-2.5 py-1 bg-slate-800 hover:bg-amber-600/20 hover:text-amber-300 text-slate-300 border border-slate-700 hover:border-amber-500/40 rounded-lg text-xs transition flex items-center space-x-1 cursor-pointer"
                                    >
                                      <ArrowRightLeft className="w-3 h-3 text-amber-400" />
                                      <span>Naklet</span>
                                    </button>

                                    {/* Delete Student action */}
                                    <button
                                      onClick={() => setStudentToDelete(student)}
                                      title="Öğrenciyi sil"
                                      className="px-2 py-1 bg-slate-800 hover:bg-rose-600/20 hover:text-rose-300 text-slate-400 hover:border-rose-500/40 border border-slate-700 rounded-lg text-xs transition flex items-center space-x-1 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3 text-rose-400" />
                                      <span>Sil</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action feedback banner */}
      {actionFeedback && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center space-x-3 text-xs sm:text-sm animate-fade-in border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span className="font-medium">{actionFeedback}</span>
          <button
            onClick={() => setActionFeedback(null)}
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
                <p className="text-xs text-slate-400">Yönetici yetkisi ile kalıcı silme</p>
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
              Bu öğretmeni silmek istediğinize emin misiniz? Öğretmenin sınıfına bağlı öğrenciler silinmez, atamasız duruma geçirilerek başka sınıfa nakledilmeleri sağlanır.
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
                  setActionFeedback(res.message);
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
              Bu öğrenciyi okul kütüğünden ve sistemden kalıcı olarak silmek istediğinize emin misiniz? Tüm çalışma verileri kaldırılacaktır.
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
                  setActionFeedback(res.message);
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
    </div>
  );
};
