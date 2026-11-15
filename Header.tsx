import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Users,
  LogOut,
  LogIn,
  ChevronDown,
  RotateCcw,
  Bell,
  Layers,
  BookOpen,
  KeyRound,
  Lock,
  Palette,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    manager,
    teachers,
    students,
    openLoginModal,
    openIntroVideo,
    openGuideAgent,
    logout,
    openChangePasswordModal,
    resetToDemoData,
    bgMode,
    setBgMode,
    activeView,
    goHome,
    goToDashboard,
  } = useApp();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [resetConfirmed, setResetConfirmed] = useState(false);

  const pendingStudents = students.filter((s) => s.status === 'pending');

  const handleReset = () => {
    if (resetConfirmed) {
      resetToDemoData();
      setResetConfirmed(false);
    } else {
      setResetConfirmed(true);
      setTimeout(() => setResetConfirmed(false), 3000);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Tagline - Clicking navigates to Homepage */}
          <button
            type="button"
            onClick={goHome}
            title="Anasayfaya Git"
            className="flex items-center space-x-3 text-left cursor-pointer group select-none transition-all p-1 -m-1 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-emerald-950 group-hover:shadow-emerald-500/40 group-hover:scale-105 transition-all duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-xl group-hover:rotate-6 transition-transform duration-300">
                🌸
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:via-teal-200 group-hover:to-cyan-200 transition-all">
                  My VocaBloom
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30 group-hover:border-emerald-400/60 transition-colors">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors hidden sm:block">
                İngilizce Kelime & Eğitim Yönetim Platformu
              </p>
            </div>
          </button>

          {/* Quick Role Switcher & User Profile Menu */}
          <div className="flex items-center space-x-3">
            {/* Pending count alert pill if teacher or manager */}
            {pendingStudents.length > 0 && (
              <div
                title={`${pendingStudents.length} öğrenci öğretmen onayı bekliyor`}
                className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium animate-pulse"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>{pendingStudents.length} Onay Bekleyen</span>
              </div>
            )}

            {/* AI Guide Agent Trigger Button */}
            <button
              type="button"
              onClick={() => openGuideAgent()}
              title="VocabBloom AI Destek: Sitenin Elverişli Kullanımı"
              className="hover-lift flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-400 rounded-xl transition cursor-pointer shadow-sm select-none"
            >
              <span className="text-sm">🌸</span>
              <span className="hidden sm:inline">VocabBloom AI Destek</span>
            </button>

            {/* User Profile / Auth Actions */}
            {currentUser ? (
              <div className="flex items-center space-x-2">
                {/* Back to Dashboard Button when viewing home */}
                {activeView === 'home' && (
                  <button
                    type="button"
                    onClick={goToDashboard}
                    title="Çalışma panelinize geri dönün"
                    className="hover-lift flex items-center space-x-1.5 px-3 py-1.5 text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl transition cursor-pointer shadow-md shadow-emerald-950/40 border border-emerald-400/50"
                  >
                    <span>Panelime Dön</span>
                    <span>➔</span>
                  </button>
                )}

                {/* Direct Change Password Header Button */}
                <button
                  type="button"
                  onClick={openChangePasswordModal}
                  title="Hesap şifrenizi değiştirin"
                  className="hover-lift flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 rounded-xl transition cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Şifre Değiştir</span>
                </button>

                {/* Profile dropdown trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="hover-lift flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500/80 text-left transition-all cursor-pointer select-none"
                  >
                    {currentUser.role === 'manager' && (
                      <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                        👑
                      </div>
                    )}
                    {currentUser.role === 'teacher' && (
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                        👩‍🏫
                      </div>
                    )}
                    {currentUser.role === 'student' && (
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          (currentUser as any).status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {(currentUser as any).status === 'pending' ? '⏳' : '🎓'}
                      </div>
                    )}

                    <div className="min-w-0 max-w-[140px] sm:max-w-[180px]">
                      <div className="text-xs font-bold text-slate-100 truncate">{currentUser.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {currentUser.role === 'manager' && <span className="text-purple-400">👑 Yönetici</span>}
                        {currentUser.role === 'teacher' && (
                          <span className="text-blue-400 font-mono">{(currentUser as any).classCode}</span>
                        )}
                        {currentUser.role === 'student' && (
                          <span
                            className={
                              (currentUser as any).status === 'pending' ? 'text-amber-400' : 'text-emerald-400'
                            }
                          >
                            {(currentUser as any).status === 'pending'
                              ? 'Onay Bekliyor'
                              : `Öğrenci · ${(currentUser as any).classCode}`}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 text-xs animate-in fade-in zoom-in-95"
                      onMouseLeave={() => setIsDropdownOpen(false)}
                    >
                      <div className="pb-2.5 mb-2 border-b border-slate-800">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Giriş Yapılan Hesap
                        </div>
                        <div className="font-bold text-white text-sm mt-0.5 truncate">{currentUser.name}</div>
                        <div className="text-xs text-slate-400 font-mono truncate">{currentUser.email}</div>
                      </div>

                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            openChangePasswordModal();
                          }}
                          className="w-full p-2.5 rounded-xl flex items-center space-x-2 text-slate-200 hover:bg-slate-800 hover:text-amber-300 transition cursor-pointer text-left font-semibold"
                        >
                          <KeyRound className="w-4 h-4 text-amber-400" />
                          <span>Şifre Değiştir</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            logout();
                          }}
                          className="w-full p-2.5 rounded-xl flex items-center space-x-2 text-rose-300 hover:bg-rose-500/10 transition cursor-pointer text-left font-semibold"
                        >
                          <LogOut className="w-4 h-4 text-rose-400" />
                          <span>Çıkış Yap</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Guest Actions: Log in or Register */
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => openLoginModal('login')}
                  className="btn-primary-bloom px-4 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 rounded-xl shadow-md border border-emerald-400/40 hover:border-emerald-300 flex items-center space-x-1.5 cursor-pointer select-none"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="tracking-wide">GİRİŞ YAP</span>
                </button>
                <button
                  type="button"
                  onClick={() => openLoginModal('register')}
                  className="hover-lift hidden sm:flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kayıt Ol</span>
                </button>
              </div>
            )}

            {/* Background Theme Switcher Button */}
            <button
              type="button"
              onClick={() => {
                const nextMode: Record<string, 'vivid' | 'balanced' | 'dark'> = {
                  balanced: 'vivid',
                  vivid: 'dark',
                  dark: 'balanced',
                };
                setBgMode(nextMode[bgMode] || 'balanced');
              }}
              title={`Arka Plan: ${
                bgMode === 'vivid'
                  ? 'Canlı Pastel (Doodle Çizimleri Çok Belirgin)'
                  : bgMode === 'dark'
                  ? 'Koyu Cam (Gece Modu)'
                  : 'Dengeli Pastel (Varsayılan)'
              }`}
              className="hover-lift flex items-center space-x-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all border border-slate-700/80 bg-slate-800/80 hover:bg-slate-850 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 cursor-pointer shadow-sm"
            >
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">
                {bgMode === 'vivid' ? 'Canlı Pastel' : bgMode === 'dark' ? 'Koyu Cam' : 'Dengeli Arka Plan'}
              </span>
            </button>

            {/* Reset Demo State button */}
            <button
              type="button"
              onClick={handleReset}
              title="İlk demo durumuna sıfırla"
              className={`hover-lift p-2 rounded-xl text-xs transition-all border cursor-pointer ${
                resetConfirmed
                  ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-900/30'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-600 border-slate-700'
              }`}
            >
              <RotateCcw className={`w-4 h-4 ${resetConfirmed ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
