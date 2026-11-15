import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, UserCheck, Mail, User, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DirectAddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClassCode?: string;
}

export const DirectAddStudentModal: React.FC<DirectAddStudentModalProps> = ({
  isOpen,
  onClose,
  defaultClassCode,
}) => {
  const { currentUser, teachers, addStudentDirect } = useApp();

  const isTeacher = currentUser?.role === 'teacher';
  const teacherClassCode = isTeacher ? (currentUser as any).classCode : defaultClassCode;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [classCode, setClassCode] = useState(
    teacherClassCode || defaultClassCode || teachers[0]?.classCode || ''
  );
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);

  React.useEffect(() => {
    if (teacherClassCode) {
      setClassCode(teacherClassCode);
    } else if (defaultClassCode) {
      setClassCode(defaultClassCode);
    }
  }, [teacherClassCode, defaultClassCode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !classCode) {
      setStatus({ message: 'Lütfen tüm alanları doldurun.', isError: true });
      return;
    }

    const res = addStudentDirect({ name, email, classCode });
    if (res.success) {
      setStatus({ message: res.message, isError: false });
      setTimeout(() => {
        onClose();
        setName('');
        setEmail('');
        setStatus(null);
      }, 1200);
    } else {
      setStatus({ message: res.message, isError: true });
    }
  };

  const selectedTeacher = teachers.find((t) => t.classCode === classCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Doğrudan Öğrenci Ekle</h3>
              <p className="text-xs text-slate-400">Onay beklemeden anında aktif olarak sınıfa kaydet</p>
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
          <div className="text-xs text-emerald-300/90 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
            ⚡ <strong>Doğrudan Kayıt:</strong> Bu işlem öğrenciyi bekleme kuyruğuna almadan hemen{' '}
            <strong>"Onaylandı"</strong> statüsünde sınıfa yerleştirir.
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
              Öğrenci Adı Soyadı *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örnek: Gizem Arslan"
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              E-Posta Adresi *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gizem@okul.com"
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Hedef Sınıf & Öğretmen *
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <select
                disabled={isTeacher}
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm ${
                  isTeacher
                    ? 'bg-slate-800/50 border-slate-700/60 text-slate-300 cursor-not-allowed'
                    : 'bg-slate-800 border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                }`}
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.classCode}>
                    {t.classCode} — {t.name} ({t.className})
                  </option>
                ))}
              </select>
            </div>
            {selectedTeacher && (
              <p className="mt-1.5 text-xs text-slate-400">
                Eğitmen: <strong className="text-emerald-400">{selectedTeacher.name}</strong> • Sınıf:{' '}
                <span className="font-semibold text-white">{selectedTeacher.className}</span> • Seviye:{' '}
                <span className="font-mono text-emerald-300 font-bold">{selectedTeacher.level}</span>
              </p>
            )}
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/30 transition flex items-center space-x-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Doğrudan Sınıfa Ekle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
