import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CEFRLevel } from '../../types';
import { X, UserPlus, Mail, User, BookOpen, Hash, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTeacherModal: React.FC<AddTeacherModalProps> = ({ isOpen, onClose }) => {
  const { addTeacher } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState<CEFRLevel>('C1');
  const [classCode, setClassCode] = useState('');
  const [className, setClassName] = useState('İleri Seviye C1 (Advanced)');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  // Auto update suggested class code when name or level changes
  const handleNameChange = (val: string) => {
    setName(val);
    const firstName = val.trim().split(' ')[0]?.toUpperCase().replace(/[^A-Z]/g, '') || 'KOD';
    setClassCode(`ENG-${level}-${firstName}`);
  };

  const handleLevelChange = (newLevel: CEFRLevel) => {
    setLevel(newLevel);
    const firstName = name.trim().split(' ')[0]?.toUpperCase().replace(/[^A-Z]/g, '') || 'KOD';
    setClassCode(`ENG-${newLevel}-${firstName}`);

    const levelDescriptions: Record<CEFRLevel, string> = {
      A1: 'Temel Seviye A1 (Beginner)',
      A2: 'Temel Üstü A2 (Elementary)',
      B1: 'Orta Seviye B1 (Intermediate)',
      B2: 'İleri Seviye B2 (Upper-Intermediate)',
      C1: 'Usta Seviye C1 (Advanced)',
      C2: 'Uzman Seviye C2 (Mastery / Proficient)',
    };
    setClassName(levelDescriptions[newLevel]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !classCode || !className) {
      setStatus({ message: 'Lütfen zorunlu alanları doldurun.', isError: true });
      return;
    }

    const res = addTeacher({
      name,
      email,
      classCode,
      className,
      level,
      bio,
    });

    if (res.success) {
      setStatus({ message: res.message, isError: false });
      setTimeout(() => {
        onClose();
        setName('');
        setEmail('');
        setBio('');
        setStatus(null);
      }, 1200);
    } else {
      setStatus({ message: res.message, isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">+ Yeni Öğretmen Ekle</h3>
              <p className="text-xs text-slate-400">Öğretmen kadrosuna yeni eğitmen ve sınıf kodu tanımla</p>
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
              Öğretmen Adı Soyadı *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Burak Deniz"
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                placeholder="burak@vocabloom.com"
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Eğitim Seviyesi (CEFR) *
              </label>
              <select
                value={level}
                onChange={(e) => handleLevelChange(e.target.value as CEFRLevel)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                Özel Sınıf Kodu *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  placeholder="ENG-C1-BURAK"
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-blue-500/50 rounded-xl text-white font-mono uppercase text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                placeholder="İleri Seviye C1 (Advanced)"
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Eğitmen Biyografisi & Uzmanlık (İsteğe Bağlı)
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Akademik kelime dağarcığı ve ileri seviye dilbilgisi..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/30 transition flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Öğretmeni Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
