import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ArrowRightLeft, BookOpen, AlertCircle, CheckCircle2, User, FileText } from 'lucide-react';

interface TransferStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStudentId?: string;
}

export const TransferStudentModal: React.FC<TransferStudentModalProps> = ({
  isOpen,
  onClose,
  defaultStudentId,
}) => {
  const { students, teachers, transferStudent } = useApp();

  const [studentId, setStudentId] = useState(defaultStudentId || students[0]?.id || '');
  const [toClassCode, setToClassCode] = useState(teachers[1]?.classCode || teachers[0]?.classCode || '');
  const [note, setNote] = useState('Seviye atlama ve kur değişikliği sebebiyle nakil yapıldı.');
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);

  React.useEffect(() => {
    if (defaultStudentId) {
      setStudentId(defaultStudentId);
    }
  }, [defaultStudentId, isOpen]);

  if (!isOpen) return null;

  const selectedStudent = students.find((s) => s.id === studentId);
  const currentTeacher = selectedStudent ? teachers.find((t) => t.id === selectedStudent.teacherId) : null;
  const targetTeacher = teachers.find((t) => t.classCode === toClassCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !toClassCode) {
      setStatus({ message: 'Lütfen öğrenci ve hedef sınıfı seçin.', isError: true });
      return;
    }

    if (selectedStudent?.classCode === toClassCode) {
      setStatus({ message: 'Öğrenci zaten bu sınıfta kayıtlı.', isError: true });
      return;
    }

    const res = transferStudent(studentId, toClassCode, note);
    if (res.success) {
      setStatus({ message: res.message, isError: false });
      setTimeout(() => {
        onClose();
        setStatus(null);
      }, 1200);
    } else {
      setStatus({ message: res.message, isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Öğrenci Sınıf Nakli (Transfer)</h3>
              <p className="text-xs text-slate-400">Öğrenciyi başka bir öğretmen ve sınıfa aktar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {status && (
            <div
              className={`p-3 rounded-xl text-sm flex items-start space-x-2.5 ${
                status.isError
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              }`}
            >
              {status.isError ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nakledilecek Öğrenci *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email}) — Şu anki Sınıf: {s.classCode} [{s.status === 'pending' ? 'Bekliyor' : 'Onaylı'}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Current Class Pill */}
          {selectedStudent && (
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Şu Anki Öğretmen:</span>
              <span className="font-semibold text-slate-200">
                {currentTeacher ? currentTeacher.name : 'Bilinmiyor'} ({selectedStudent.classCode})
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Hedef Yeni Sınıf & Öğretmen *
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <select
                value={toClassCode}
                onChange={(e) => setToClassCode(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.classCode}>
                    {t.classCode} — {t.name} ({t.className})
                  </option>
                ))}
              </select>
            </div>
            {targetTeacher && (
              <p className="mt-1 text-xs text-amber-400">
                Hedef Eğitmen: <strong>{targetTeacher.name}</strong> • Seviye: {targetTeacher.level}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nakil Gerekçesi / Not
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nakil sebebi..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-900/30 transition flex items-center space-x-2"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Nakil İşlemini Onayla</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
