import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CEFRLevel } from '../../types';
import { X, Settings, Hash, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TeacherReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
}

export const TeacherReassignModal: React.FC<TeacherReassignModalProps> = ({
  isOpen,
  onClose,
  teacherId,
}) => {
  const { teachers, updateTeacherAssignment } = useApp();

  const teacher = teachers.find((t) => t.id === teacherId);

  const [classCode, setClassCode] = useState(teacher?.classCode || '');
  const [className, setClassName] = useState(teacher?.className || '');
  const [level, setLevel] = useState<CEFRLevel>(teacher?.level || 'A1');
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);

  React.useEffect(() => {
    if (teacher) {
      setClassCode(teacher.classCode);
      setClassName(teacher.className);
      setLevel(teacher.level);
    }
  }, [teacher, isOpen]);

  if (!isOpen || !teacher) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode || !className) {
      setStatus({ message: 'Tüm alanları doldurmanız gerekmektedir.', isError: true });
      return;
    }

    const res = updateTeacherAssignment(teacher.id, {
      classCode,
      className,
      level,
    });

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
        <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />

        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Öğretmen Atamasını Değiştir</h3>
              <p className="text-xs text-slate-400">{teacher.name} için sınıf kodu ve seviye güncellemesi</p>
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
          <div className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            ℹ️ Sınıf kodu güncellendiğinde, bu öğretmene daha önce kayıt olmuş öğrencilerin kodları da otomatik
            olarak yeni kodla senkronize edilecektir.
          </div>

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
              Öğretmen
            </label>
            <input
              type="text"
              disabled
              value={`${teacher.name} (${teacher.email})`}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/60 rounded-xl text-slate-400 text-sm cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Yeni Seviye (CEFR) *
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as CEFRLevel)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper-Intermediate</option>
                <option value="C1">C1 - Advanced</option>
                <option value="C2">C2 - Mastery / Proficient</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Yeni Sınıf Kodu *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  placeholder="ENG-A1-SELIN"
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-purple-500/50 rounded-xl text-white font-mono uppercase text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sınıf Başlığı / Adı *
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Örn: Temel Seviye A1"
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
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
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-900/30 transition flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Atamayı Güncelle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
