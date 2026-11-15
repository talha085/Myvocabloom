import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import {
  X,
  Lock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  Key,
} from 'lucide-react';

export const ChangePasswordModal: React.FC = () => {
  const {
    currentUser,
    isChangePasswordModalOpen,
    closeChangePasswordModal,
    changePassword,
  } = useApp();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isChangePasswordModalOpen || !currentUser) return null;

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setStatusMessage(null);
    setIsSuccess(false);
    closeChangePasswordModal();
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: 'Girilmedi', color: 'text-slate-500', width: '0%' };
    if (pwd.length < 6) return { label: 'Çok Kısa (En az 6 karakter)', color: 'text-rose-400', width: '25%' };
    const hasLetters = /[a-zA-Z]/.test(pwd);
    const hasNumbers = /[0-9]/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

    if (pwd.length >= 8 && hasLetters && hasNumbers && hasSpecial) {
      return { label: 'Çok Güçlü', color: 'text-emerald-400', width: '100%' };
    }
    if (pwd.length >= 6 && hasLetters && hasNumbers) {
      return { label: 'Güçlü', color: 'text-teal-400', width: '75%' };
    }
    return { label: 'Orta', color: 'text-amber-400', width: '50%' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!currentPassword) {
      setStatusMessage({ text: 'Lütfen mevcut şifrenizi girin.', isError: true });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setStatusMessage({ text: 'Yeni şifreniz en az 6 karakter uzunluğunda olmalıdır.', isError: true });
      return;
    }

    if (newPassword === currentPassword) {
      setStatusMessage({ text: 'Yeni şifreniz mevcut şifrenizle aynı olamaz.', isError: true });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ text: 'Yeni şifre ve şifre tekrarı birbiriyle eşleşmiyor.', isError: true });
      return;
    }

    setIsSubmitting(true);

    const result = changePassword(currentPassword, newPassword);

    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      setStatusMessage({ text: result.message, isError: false });
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        handleClose();
      }, 2000);
    } else {
      setStatusMessage({ text: result.message, isError: true });
    }
  };

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'manager':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
            <span>👑</span>
            <span>Yönetici Hesabı</span>
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
            <span>👩‍🏫</span>
            <span>Öğretmen Hesabı</span>
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            <span>🎓</span>
            <span>Öğrenci Hesabı</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top gradient stripe */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400" />

        {/* Modal Top Bar */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shadow-md">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Şifre Değiştir</h3>
              <p className="text-xs text-slate-400">Hesabınızın güvenliği için yeni şifrenizi belirleyin</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {/* Active Account Identity Card */}
          <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Aktif Kullanıcı</div>
              <div className="text-sm font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-xs text-slate-400 font-mono truncate">{currentUser.email}</div>
            </div>
            <div className="shrink-0">{getRoleBadge()}</div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs sm:text-sm flex items-start space-x-3 ${
                statusMessage.isError
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              }`}
            >
              {statusMessage.isError ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 animate-bounce">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white">Şifreniz Güncellendi!</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Yeni şifreniz başarıyla kaydedildi. Gelecek tüm girişlerinizde bu şifreyi kullanabilirsiniz.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Current Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Mevcut Şifreniz *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Mevcut şifrenizi girin"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Field 2: New Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Yeni Şifre (En az 6 karakter) *
                  </label>
                  <span className={`text-[11px] font-bold ${strength.color}`}>
                    {strength.label}
                  </span>
                </div>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Yeni güçlü bir şifre belirleyin"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Bar */}
                {newPassword && (
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden border border-slate-700">
                    <div
                      className={`h-full transition-all duration-300 ${
                        newPassword.length < 6
                          ? 'bg-rose-500'
                          : strength.width === '50%'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: strength.width }}
                    />
                  </div>
                )}
              </div>

              {/* Field 3: Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Yeni Şifre Tekrarı *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Yeni şifrenizi tekrar girin"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Şifreler uyuşmuyor</span>
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Şifreler eşleşiyor</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-2xl border border-slate-700 transition text-sm cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="hover-lift flex-[2] py-3 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-2xl shadow-lg border border-emerald-400/40 flex items-center justify-center space-x-2 text-sm cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>Şifremi Güncelle</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
