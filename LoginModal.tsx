import React, { useState, useEffect } from 'react';
import { useApp, LoginTab } from '../context/AppContext';
import { signInWithGoogle } from '../firebase';
import {
  X,
  Lock,
  Mail,
  User,
  KeyRound,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
  Users,
  Check,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  HelpCircle,
  Key,
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    closeLoginModal,
    loginModalTab,
    prefilledEmail,
    login,
    loginWithGoogleUser,
    registerStudent,
    resetPassword,
    findUserByEmail,
    teachers,
    manager,
    students,
  } = useApp();

  const [activeTab, setActiveTab] = useState<LoginTab>(loginModalTab);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Student register states
  const [name, setName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [classCode, setClassCode] = useState('');

  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Forgot password flow states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [foundAccount, setFoundAccount] = useState<{ name: string; email: string; role: string } | null>(null);
  const [forgotStatus, setForgotStatus] = useState<{ text: string; isError: boolean } | null>(null);

  // Sync tab with external caller - manual input only
  useEffect(() => {
    setActiveTab(loginModalTab);
    setStatusMessage(null);
    setIsForgotPassword(false);

    if (prefilledEmail) {
      setEmail(prefilledEmail);
    } else {
      setEmail('');
    }
    setPassword('');
    setName('');
    setRegisterPassword('');
    setClassCode('');
  }, [loginModalTab, isLoginModalOpen, prefilledEmail]);

  if (!isLoginModalOpen) return null;

  const handleTabChange = (tab: LoginTab) => {
    setActiveTab(tab);
    setStatusMessage(null);
    setIsForgotPassword(false);
    setEmail('');
    setPassword('');
    setName('');
    setRegisterPassword('');
    setClassCode('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setStatusMessage({ text: 'Lütfen e-posta adresinizi girin.', isError: true });
      return;
    }
    if (!password) {
      setStatusMessage({ text: 'Lütfen şifrenizi girin.', isError: true });
      return;
    }

    const res = login(email, password);
    if (!res.success) {
      setStatusMessage({ text: res.message, isError: true });
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !classCode) {
      setStatusMessage({ text: 'Lütfen tüm alanları doldurun.', isError: true });
      return;
    }
    if (!registerPassword || registerPassword.length < 6) {
      setStatusMessage({ text: 'Şifreniz en az 6 karakter uzunluğunda olmalıdır.', isError: true });
      return;
    }

    const res = registerStudent({ name, email, password: registerPassword, classCode });
    if (!res.success) {
      setStatusMessage({ text: res.message, isError: true });
    }
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setStatusMessage(null);
    setIsGoogleLoading(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        setStatusMessage({ text: `Google ile giriş başarısız: ${res.error}`, isError: true });
        return;
      }
      if (res.user?.email) {
        const loginRes = loginWithGoogleUser(
          {
            email: res.user.email,
            displayName: res.user.displayName,
            uid: res.user.uid,
            photoURL: res.user.photoURL,
          },
          {
            classCode: activeTab === 'register' && classCode.trim() ? classCode.trim() : undefined,
          }
        );
        if (loginRes.success) {
          setStatusMessage({ text: loginRes.message || 'Google ile başarıyla giriş yapıldı!', isError: false });
        } else {
          setName(res.user.displayName || '');
          setEmail(res.user.email);
          setStatusMessage({
            text: loginRes.message || 'Google hesabınızla giriş tamamlanamadı. Lütfen sınıf kodunu kontrol edin.',
            isError: true,
          });
        }
      } else {
        setStatusMessage({
          text: 'Google hesabından e-posta bilgisi alınamadı. Lütfen tekrar deneyin.',
          isError: true,
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Open Forgot Password mode
  const openForgotPassword = () => {
    setIsForgotPassword(true);
    setForgotStep(1);
    setForgotEmail(email);
    setGeneratedCode('');
    setEnteredCode('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setForgotStatus(null);
    setFoundAccount(null);
  };

  // Step 1: Request code
  const handleRequestVerificationCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotStatus({ text: 'Lütfen e-posta adresinizi girin.', isError: true });
      return;
    }

    const search = findUserByEmail(forgotEmail);
    if (!search.exists || !search.user) {
      setForgotStatus({
        text: 'Bu e-posta adresi ile kayıtlı yönetici, öğretmen veya öğrenci hesabı bulunamadı.',
        isError: true,
      });
      return;
    }

    // Account found -> generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setFoundAccount(search.user);
    setForgotStep(2);
    setForgotStatus({
      text: `Doğrulama kodu ${search.user.email} adresine simüle edildi: ${code}`,
      isError: false,
    });
  };

  // Step 2: Confirm new password
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredCode.trim() !== generatedCode.trim()) {
      setForgotStatus({ text: 'Girdiğiniz doğrulama kodu hatalı. Lütfen kontrol edin.', isError: true });
      return;
    }

    if (newPassword.length < 6) {
      setForgotStatus({ text: 'Yeni şifreniz en az 6 karakterden oluşmalıdır.', isError: true });
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setForgotStatus({ text: 'Girdiğiniz yeni şifreler birbiriyle eşleşmiyor.', isError: true });
      return;
    }

    const res = resetPassword(forgotEmail, newPassword);
    if (res.success) {
      // Success! Update login fields and switch back
      setEmail(forgotEmail);
      setPassword(newPassword);
      setIsForgotPassword(false);
      setStatusMessage({
        text: 'Şifreniz başarıyla yenilendi! Yeni şifrenizle giriş yapabilirsiniz.',
        isError: false,
      });
    } else {
      setForgotStatus({ text: res.message, isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header gradient banner */}
        <div className="h-2 bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-400" />

        {/* Modal Top Bar */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl shadow-md">
              🌸
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">My VocaBloom</h3>
              <p className="text-xs text-slate-400">
                {isForgotPassword ? 'Şifre Sıfırlama & Hesap Kurtarma' : 'Kullanıcı Girişi & Hesap Yönetimi'}
              </p>
            </div>
          </div>
          <button
            onClick={closeLoginModal}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* IF IN FORGOT PASSWORD FLOW */}
        {isForgotPassword ? (
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Giriş Ekranına Geri Dön</span>
              </button>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/30">
                Adım {forgotStep} / 2
              </span>
            </div>

            {forgotStatus && (
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm flex items-start space-x-3 ${
                  forgotStatus.isError
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                }`}
              >
                {forgotStatus.isError ? (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <span>{forgotStatus.text}</span>
              </div>
            )}

            {/* STEP 1: Enter registered email */}
            {forgotStep === 1 && (
              <form onSubmit={handleRequestVerificationCode} className="space-y-4 pt-2">
                <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-2 text-white font-bold text-sm">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>Şifrenizi mi Unuttunuz?</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Yönetici, Öğretmen veya Öğrenci hesabınıza kayıtlı e-posta adresinizi girin. Size 6 haneli güvenlik doğrulama kodu üreteceğiz.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Kayıtlı E-Posta Adresiniz
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="ornek@eposta.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="hover-lift w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Doğrulama Kodu Gönder</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: Enter code & set new password */}
            {forgotStep === 2 && foundAccount && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-2">
                {/* Account card */}
                <div className="p-3.5 bg-slate-800/80 border border-indigo-500/30 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                      Doğrulanan Hesap
                    </span>
                    <div className="text-sm font-bold text-white">{foundAccount.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{foundAccount.email}</div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                    {foundAccount.role}
                  </span>
                </div>

                {/* Simulated code notice */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-300">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Güvenlik Kodu: <strong className="font-mono text-white text-sm tracking-widest">{generatedCode}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnteredCode(generatedCode)}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] transition cursor-pointer"
                  >
                    Kodu Doldur
                  </button>
                </div>

                {/* Verification code input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    6 Haneli Doğrulama Kodu *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center tracking-widest font-mono text-lg py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* New password input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Yeni Şifre (En az 6 karakter) *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Yeni şifreniz"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm new password input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Yeni Şifre Tekrarı *
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      placeholder="Yeni şifrenizi tekrar girin"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="hover-lift w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Şifremi Güncelle ve Girişe Dön</span>
                </button>
              </form>
            )}
          </div>
        ) : (
          /* STANDARD LOGIN & REGISTER TABS */
          <>
            {/* 4 Dedicated Tabs: "Yönetici Girişi", "Öğretmen Girişi", "Öğrenci Girişi", "Öğrenci Kayıt" */}
            <div className="p-3 bg-slate-950/60 border-b border-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800">
                {/* Tab 1: Yönetici Girişi */}
                <button
                  type="button"
                  onClick={() => handleTabChange('manager')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'manager'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50 scale-[1.02]'
                      : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800/60'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Yönetici Girişi</span>
                </button>

                {/* Tab 2: Öğretmen Girişi */}
                <button
                  type="button"
                  onClick={() => handleTabChange('teacher')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'teacher'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/50 scale-[1.02]'
                      : 'text-slate-400 hover:text-blue-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Öğretmen Girişi</span>
                </button>

                {/* Tab 3: Öğrenci Girişi */}
                <button
                  type="button"
                  onClick={() => handleTabChange('student')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'student'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 scale-[1.02]'
                      : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800/60'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Öğrenci Girişi</span>
                </button>

                {/* Tab 4: Öğrenci Kayıt */}
                <button
                  type="button"
                  onClick={() => handleTabChange('register')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-teal-600 text-white shadow-lg shadow-teal-950/50 scale-[1.02]'
                      : 'text-slate-400 hover:text-teal-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Öğrenci Kayıt</span>
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-4">
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

              {/* TAB 1: YÖNETİCİ GİRİŞİ */}
              {activeTab === 'manager' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="p-3.5 bg-purple-950/30 border border-purple-500/30 rounded-2xl flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-lg font-bold">
                      👑
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Yönetici Giriş Portalı</h4>
                      <p className="text-xs text-purple-300/80">Lütfen yönetici e-posta adresinizi ve şifrenizi giriniz.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Yönetici E-Posta *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yonetici@eposta.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Yönetici Şifresi *
                      </label>
                      <button
                        type="button"
                        onClick={openForgotPassword}
                        className="text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer transition hover:underline"
                      >
                        Şifremi Unuttum?
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="hover-lift w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-lg border border-purple-400/40 flex items-center justify-center space-x-2 cursor-pointer select-none"
                  >
                    <Lock className="w-4 h-4" />
                    <span className="tracking-wide">YÖNETİCİ GİRİŞİ YAP</span>
                  </button>
                </form>
              )}

              {/* TAB 2: ÖĞRETMEN GİRİŞİ */}
              {activeTab === 'teacher' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="p-3.5 bg-blue-950/30 border border-blue-500/30 rounded-2xl flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center text-lg font-bold">
                      👩‍🏫
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Öğretmen Giriş Portalı</h4>
                      <p className="text-xs text-blue-300/80">Lütfen kurumsal öğretmen e-posta adresinizi ve şifrenizi giriniz.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Öğretmen E-Posta *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ogretmen@eposta.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Öğretmen Şifresi *
                      </label>
                      <button
                        type="button"
                        onClick={openForgotPassword}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer transition hover:underline"
                      >
                        Şifremi Unuttum?
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="hover-lift w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-lg border border-blue-400/40 flex items-center justify-center space-x-2 cursor-pointer select-none"
                  >
                    <Lock className="w-4 h-4" />
                    <span className="tracking-wide">ÖĞRETMEN GİRİŞİ YAP</span>
                  </button>
                </form>
              )}

              {/* TAB 3: ÖĞRENCİ GİRİŞİ */}
              {activeTab === 'student' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-lg font-bold">
                      🎓
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Öğrenci Giriş Portalı</h4>
                      <p className="text-xs text-emerald-300/80">Kayıtlı e-posta adresinizi ve şifrenizi giriniz.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Öğrenci E-Posta *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ogrenci@eposta.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Öğrenci Şifresi *
                      </label>
                      <button
                        type="button"
                        onClick={openForgotPassword}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer transition hover:underline"
                      >
                        Şifremi Unuttum?
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="hover-lift w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-2xl shadow-lg border border-emerald-400/40 flex items-center justify-center space-x-2 cursor-pointer select-none"
                  >
                    <Lock className="w-4 h-4" />
                    <span className="tracking-wide">ÖĞRENCİ GİRİŞİ YAP</span>
                  </button>
                </form>
              )}

              {/* TAB 4: ÖĞRENCİ KAYIT */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="text-xs text-amber-300/90 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30">
                    ⏳ <strong>Kayıt Prosedürü:</strong> Kayıt olduğunuzda hesabınız otomatik olarak{' '}
                    <strong>"Onay Bekliyor"</strong> statüsünde başlar. Sınıf öğretmeniniz onayladığında CEFR içerikleri
                    tam erişime açılır.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Ad Soyad *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Adınızı ve soyadınızı giriniz"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      E-Posta Adresi *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ogrenci@eposta.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Hesap Şifresi (En az 6 karakter) *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="Güçlü bir şifre belirleyin"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Öğretmen Sınıf Kodu *
                      </label>
                      <span className="text-[11px] text-teal-400">Öğretmeninizden aldığınız kod</span>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                        placeholder="Örn: ENG-A1-..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Sınıfınıza katılmak için öğretmeninizin sizinle paylaştığı sınıf kodunu giriniz.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="hover-lift w-full py-3.5 px-4 bg-gradient-to-r from-teal-500 via-emerald-600 to-teal-500 hover:from-teal-400 hover:to-emerald-500 text-white font-extrabold rounded-2xl shadow-lg border border-teal-400/40 flex items-center justify-center space-x-2 cursor-pointer select-none"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="tracking-wide">KAYIT OL (ONAY BEKLEME BAŞVURUSU)</span>
                  </button>
                </form>
              )}

              {/* GOOGLE SIGN-IN BUTTON */}
              <div className="pt-2">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-slate-500 text-xs font-semibold uppercase tracking-wider">veya</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-100 disabled:opacity-60 disabled:cursor-wait text-slate-900 font-bold rounded-2xl shadow-lg border border-slate-300 flex items-center justify-center space-x-3 transition cursor-pointer text-sm"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{isGoogleLoading ? 'Google Penceresi Açılıyor...' : 'Google ile Hızlı Giriş Yap'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
