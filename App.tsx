/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { IntroVideoModal } from './components/IntroVideoModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { ManagerDashboard } from './components/ManagerView/ManagerDashboard';
import { TeacherDashboard } from './components/TeacherView/TeacherDashboard';
import { StudentDashboard } from './components/StudentView/StudentDashboard';
import { VocaBloomGuideAgent } from './components/AIAgent/VocaBloomGuideAgent';
import {
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Users,
  LogIn,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    currentUser,
    openLoginModal,
    openIntroVideo,
    openGuideAgent,
    bgMode,
    activeView,
    goToDashboard,
  } = useApp();

  const overlayClasses = {
    vivid: 'bg-slate-950/30 backdrop-blur-[0.5px]',
    balanced: 'bg-slate-950/55 backdrop-blur-[1.5px]',
    dark: 'bg-slate-950/78 backdrop-blur-[2px]',
  };

  return (
    <div className="min-h-screen app-doodle-bg text-slate-100 flex flex-col relative selection:bg-emerald-500 selection:text-white">
      {/* Dynamic ambient overlay to balance the pastel illustration with UI contrast */}
      <div
        className={`fixed inset-0 pointer-events-none transition-colors duration-500 z-0 ${overlayClasses[bgMode] || overlayClasses.balanced}`}
      />

      {/* Main app surface */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        {/* Main Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentUser && activeView === 'dashboard' ? (
          /* Role-based dashboard view */
          <div>
            {currentUser.role === 'manager' && <ManagerDashboard />}
            {currentUser.role === 'teacher' && <TeacherDashboard />}
            {currentUser.role === 'student' && <StudentDashboard />}
          </div>
        ) : (
          /* Guest or Logged-In Welcome Landing (Anasayfa) */
          <div className="max-w-4xl mx-auto py-12 space-y-10">
            {/* If user is logged in while viewing Anasayfa */}
            {currentUser && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 border border-emerald-500/50 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl shrink-0 border border-emerald-500/30">
                    {currentUser.role === 'manager' ? '👑' : currentUser.role === 'teacher' ? '👩‍🏫' : '🎓'}
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 flex-wrap">
                      <span>{currentUser.name}</span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                        {currentUser.role === 'manager'
                          ? '👑 Yönetici Portalı'
                          : currentUser.role === 'teacher'
                          ? `👩‍🏫 Öğretmen · ${(currentUser as any).classCode}`
                          : `🎓 Öğrenci · ${(currentUser as any).classCode}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Şu anda genel anasayfadasınız. Kendi çalışma panelinize dilediğiniz an dönebilirsiniz.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={goToDashboard}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-950/50 border border-emerald-400/50 transition flex items-center justify-center space-x-2 cursor-pointer shrink-0"
                >
                  <span>Çalışma Panelime Dön</span>
                  <span>➔</span>
                </button>
              </div>
            )}

            <div className="text-center space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <span>🌸 My VocaBloom Platformu</span>
                <span>•</span>
                <span>3 Rol, Tek Ekosistem</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                İngilizce Kelimeleriniz{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                  Çiçek Açsın
                </span>
              </h1>
              <p className="text-base text-slate-300 max-w-2xl mx-auto">
                Yönetici hiyerarşik sınıf ağacı, öğretmen özel sınıf kodları ve CEFR (A1-C1) tabanlı akıllı kelime
                pratikleriyle modern dil eğitimi yönetim platformu.
              </p>

              <div className="pt-2 flex flex-wrap justify-center gap-3">
                {currentUser ? (
                  <button
                    onClick={goToDashboard}
                    className="btn-primary-bloom px-6 py-3 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-2xl shadow-xl border border-emerald-400/40 flex items-center space-x-2 text-sm cursor-pointer select-none"
                  >
                    <span>Çalışma Panelime Git</span>
                    <span>➔</span>
                  </button>
                ) : (
                  <button
                    onClick={() => openLoginModal('login')}
                    className="btn-primary-bloom px-6 py-3 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-2xl shadow-xl border border-emerald-400/40 flex items-center space-x-2 text-sm cursor-pointer select-none"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Tek Noktadan Giriş Yap</span>
                  </button>
                )}
                <button
                  onClick={() => openLoginModal('register')}
                  className="hover-lift px-6 py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-2xl border border-slate-700 hover:border-slate-500 transition flex items-center space-x-2 text-sm cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  <span>Öğrenci Kaydı (Sınıf Kodu İle)</span>
                </button>
                <button
                  onClick={openIntroVideo}
                  className="hover-lift px-5 py-3 bg-slate-900/90 hover:bg-slate-800 text-amber-300 font-bold rounded-2xl border border-amber-500/30 hover:border-amber-400/60 transition flex items-center space-x-2 text-sm cursor-pointer shadow-lg shadow-amber-950/20"
                >
                  <span>🎬 20sn Tanıtım Videosu</span>
                </button>
                <button
                  onClick={() => openGuideAgent()}
                  className="hover-lift px-5 py-3 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 hover:from-emerald-900 hover:to-teal-900 text-emerald-300 font-bold rounded-2xl border border-emerald-500/40 hover:border-emerald-400 transition flex items-center space-x-2 text-sm cursor-pointer shadow-lg shadow-emerald-950/30"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span>🌸 VocabBloom AI Destek</span>
                </button>
              </div>
            </div>

            {/* 3 Role Cards for quick overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Role 1: Manager */}
              <div className="hover-lift p-6 bg-slate-900/90 border border-purple-500/30 hover:border-purple-400/70 rounded-3xl space-y-3 relative overflow-hidden group transition">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                  👑
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                  Yönetici (Manager)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tüm sınıfları, 4 kişilik öğretmen kadrosunu ve öğrencileri hiyerarşik ağaç yapısında görür. Yeni öğretmen ekler, doğrudan öğrenci atar ve nakil işlemlerini yürütür.
                </p>
                <button
                  onClick={() => (currentUser?.role === 'manager' ? goToDashboard() : openLoginModal('manager'))}
                  className="hover-lift w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-purple-950/40"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{currentUser?.role === 'manager' ? 'Yönetici Paneline Dön' : 'Yönetici Girişi'}</span>
                </button>
              </div>

              {/* Role 2: Teacher */}
              <div className="hover-lift p-6 bg-slate-900/90 border border-blue-500/30 hover:border-blue-400/70 rounded-3xl space-y-3 relative overflow-hidden group transition">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                  👩‍🏫
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                  Öğretmen (Teacher)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Kendine ait özel sınıf koduna sahiptir. Kodla başvuran öğrencileri onaylar veya reddeder, sınıfına doğrudan öğrenci ekleyebilir ve silebilir. Sınıf kodları yalnızca öğretmen veya yönetici girişi yapıldığında görüntülenir.
                </p>
                <button
                  onClick={() => (currentUser?.role === 'teacher' ? goToDashboard() : openLoginModal('teacher'))}
                  className="hover-lift w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-blue-950/40"
                >
                  <Users className="w-4 h-4" />
                  <span>{currentUser?.role === 'teacher' ? 'Öğretmen Paneline Dön' : 'Öğretmen Girişi'}</span>
                </button>
              </div>

              {/* Role 3: Student */}
              <div className="hover-lift p-6 bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400/70 rounded-3xl space-y-3 relative overflow-hidden group transition">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                  🎓
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Öğrenci (Student)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Öğretmen sınıf koduyla kayıt olur ve onay bekler. Onay sonrasında CEFR (A1-C2 • 3.000 Kelime) 3D flashcard&apos;lar, sesli testler çözer ve VocaBloom bahçesini büyütür.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => (currentUser?.role === 'student' ? goToDashboard() : openLoginModal('student'))}
                    className="hover-lift flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-950/40"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>{currentUser?.role === 'student' ? 'Öğrenci Paneline Dön' : 'Öğrenci Girişi'}</span>
                  </button>
                  <button
                    onClick={() => openLoginModal('register')}
                    className="hover-lift py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer"
                  >
                    Kayıt Ol
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 20-Second Intro Animation Video Modal */}
      <IntroVideoModal />

      {/* Unified Login / Register Modal */}
      <LoginModal />

      {/* Account Password Change Modal */}
      <ChangePasswordModal />

      {/* VocaBloom AI Guide Agent (Floating Copilot) */}
      <VocaBloomGuideAgent />

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-900/60 py-6 text-center text-xs text-slate-400">
          <p>My VocaBloom • Çok Rollü İngilizce Kelime & Eğitim Yönetim Platformu</p>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
