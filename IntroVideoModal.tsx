import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  ArrowRight,
  Sparkles,
  Award,
  Layers,
  GraduationCap,
  Users,
  ShieldCheck,
  CheckCircle2,
  Check,
} from 'lucide-react';

export const IntroVideoModal: React.FC = () => {
  const { isIntroVideoOpen, closeIntroVideo } = useApp();

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0); // in seconds (0 to 20)
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const TOTAL_DURATION = 20; // 20 seconds
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Web Audio Synthesizer for pleasant educational background chime
  const playChimeNote = (freq: number, type: OscillatorType = 'sine', duration = 0.4) => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Sound triggers on scene transitions
  const lastSceneRef = useRef<number>(-1);
  useEffect(() => {
    if (!isIntroVideoOpen || !isPlaying) return;
    const currentScene = Math.floor(currentTime / 5);
    if (currentScene !== lastSceneRef.current) {
      lastSceneRef.current = currentScene;
      if (currentScene === 0) {
        playChimeNote(523.25, 'triangle', 0.8); // C5
        setTimeout(() => playChimeNote(659.25, 'sine', 0.8), 120); // E5
      } else if (currentScene === 1) {
        playChimeNote(587.33, 'triangle', 0.8); // D5
        setTimeout(() => playChimeNote(783.99, 'sine', 0.8), 120); // G5
      } else if (currentScene === 2) {
        playChimeNote(659.25, 'triangle', 0.8); // E5
        setTimeout(() => playChimeNote(880.0, 'sine', 0.8), 120); // A5
      } else if (currentScene === 3) {
        playChimeNote(783.99, 'triangle', 0.8); // G5
        setTimeout(() => playChimeNote(1046.5, 'sine', 1.2), 120); // C6
      }
    }
  }, [currentTime, isIntroVideoOpen, isPlaying]);

  // Main high-precision animation loop
  useEffect(() => {
    if (!isIntroVideoOpen) {
      setCurrentTime(0);
      setIsCompleted(false);
      setIsPlaying(true);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (isPlaying && !isCompleted) {
        setCurrentTime((prev) => {
          const next = prev + delta * playbackRate;
          if (next >= TOTAL_DURATION) {
            setIsCompleted(true);
            setIsPlaying(false);
            // Completion fanfare
            playChimeNote(523.25, 'triangle', 0.5);
            setTimeout(() => playChimeNote(659.25, 'triangle', 0.5), 100);
            setTimeout(() => playChimeNote(783.99, 'triangle', 0.5), 200);
            setTimeout(() => playChimeNote(1046.5, 'sine', 1.5), 300);
            return TOTAL_DURATION;
          }
          return next;
        });
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isIntroVideoOpen, isPlaying, playbackRate, isCompleted]);

  if (!isIntroVideoOpen) return null;

  const handleSkip = () => {
    setIsPlaying(false);
    closeIntroVideo();
  };

  const handleContinue = () => {
    setIsPlaying(false);
    closeIntroVideo();
  };

  const handleReplay = () => {
    setCurrentTime(0);
    setIsCompleted(false);
    setIsPlaying(true);
    lastSceneRef.current = -1;
  };

  const progressPercent = Math.min(100, (currentTime / TOTAL_DURATION) * 100);
  const remainingSeconds = Math.max(0, Math.ceil(TOTAL_DURATION - currentTime));
  const currentSceneIndex = Math.min(3, Math.floor(currentTime / 5));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-300">
      {/* Background ambient light effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Video Cinema Container */}
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Video Header Bar */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-0.5 shadow-md shadow-emerald-950">
              <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center text-sm">
                🌸
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-extrabold text-white tracking-tight">
                  My VocaBloom
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Tanıtım Videosu
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Kelime Öğrenimi & Platform Yolculuğu (20s)
              </span>
            </div>
          </div>

          {/* Time indicator and prominent "Skip The Video" button */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-mono text-slate-300">
              <span className="text-emerald-400 font-bold">
                00:{Math.floor(currentTime).toString().padStart(2, '0')}
              </span>
              <span>/</span>
              <span>00:20</span>
              <span className="text-slate-500">·</span>
              <span className="text-amber-400 font-sans text-[11px]">{remainingSeconds}s kaldı</span>
            </div>

            {/* Prominent "Skip The Video" Button */}
            <button
              onClick={handleSkip}
              className="px-4 py-2 bg-slate-800 hover:bg-rose-500/20 text-slate-200 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm group"
              title="Videoyu atlayarak hemen siteye geç"
            >
              <FastForward className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400 transition-colors" />
              <span>Skip The Video</span>
            </button>
          </div>
        </div>

        {/* Video Canvas & Dynamic Animation Stage */}
        <div className="relative aspect-video w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden flex flex-col justify-between p-6 sm:p-10 select-none">
          {/* Animated decorative grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

          {/* Scene 1: 0s - 5s -> "The Seed of Vocabulary" */}
          {currentSceneIndex === 0 && (
            <div className="relative z-10 my-auto flex flex-col items-center text-center space-y-6 animate-in fade-in duration-500">
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-300 flex items-center justify-center text-4xl sm:text-5xl shadow-2xl shadow-emerald-500/40 animate-bounce duration-1000">
                  🌱
                </div>
                <div className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-lg animate-pulse">
                  Tohum
                </div>
              </div>

              <div className="space-y-2 max-w-xl">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  BÖLÜM 1 • KELİMELERİN TOHUMU
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Her Büyük Başarı Bir{' '}
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                    Kelimeden Filizlenir
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  VocaBloom, İngilizce kelimeleri kuru ezber yerine kök salan ve çiçek açan kalıcı bir zihinsel bahçeye dönüştürür.
                </p>
              </div>

              {/* Floating word tags */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['Bloom • Çiçek Açmak', 'Flourish • Gelişmek', 'Mastery • Ustalık', 'Resilience • Direnç'].map(
                  (w, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-emerald-500/30 text-emerald-300 text-xs font-medium shadow-md animate-pulse"
                      style={{ animationDelay: `${i * 200}ms` }}
                    >
                      ✨ {w}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {/* Scene 2: 5s - 10s -> "CEFR Level Journey (A1 to C2 & 3,000 Words)" */}
          {currentSceneIndex === 1 && (
            <div className="relative z-10 my-auto flex flex-col items-center text-center space-y-6 animate-in fade-in duration-500">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                BÖLÜM 2 • CEFR SEVİYE MERDİVENİ
              </span>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                A1&apos;den C2&apos;ye{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
                  3.000 Hedef Kelime
                </span>
              </h2>

              {/* 6 CEFR Badges ladder */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 w-full max-w-2xl">
                {[
                  { lvl: 'A1', name: 'Beginner', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
                  { lvl: 'A2', name: 'Elementary', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
                  { lvl: 'B1', name: 'Intermediate', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
                  { lvl: 'B2', name: 'Upper Int.', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
                  { lvl: 'C1', name: 'Advanced', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
                  { lvl: 'C2', name: 'Mastery', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
                ].map((item, idx) => (
                  <div
                    key={item.lvl}
                    className={`p-3 rounded-2xl border text-center transition-all ${item.color} ${
                      Math.floor(currentTime) >= 5 + idx ? 'scale-105 shadow-lg shadow-indigo-950' : 'opacity-60'
                    }`}
                  >
                    <div className="text-base sm:text-xl font-black">{item.lvl}</div>
                    <div className="text-[10px] font-medium opacity-80">{item.name}</div>
                  </div>
                ))}
              </div>

              {/* Interactive 3D Card Simulation */}
              <div className="p-4 bg-slate-800/90 border border-blue-500/30 rounded-2xl shadow-xl max-w-md w-full flex items-center justify-between text-left">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-black text-white">Epiphany</span>
                    <span className="text-xs text-blue-400 font-mono">/ɪˈpɪf.ən.i/</span>
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold mt-0.5">
                    Ani Aydınlanma, İlham Anı
                  </div>
                  <div className="text-[11px] text-slate-400 italic mt-1">
                    &quot;He experienced an epiphany while reading.&quot;
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  🔊
                </div>
              </div>
            </div>
          )}

          {/* Scene 3: 10s - 15s -> "Gamified Matching & Level-Up Quizzes" */}
          {currentSceneIndex === 2 && (
            <div className="relative z-10 my-auto flex flex-col items-center text-center space-y-6 animate-in fade-in duration-500">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                BÖLÜM 3 • AKILLI OYUN & SEVİYE SINAVLARI
              </span>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Eşleştirme Oyunları &{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-amber-300 to-teal-300 bg-clip-text text-transparent">
                  Seviye Atlama Sınavları
                </span>
              </h2>

              {/* Gamification visual: Matching cards and Level Quiz banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
                {/* Matching Card Box */}
                <div className="p-4 bg-slate-800/80 border border-emerald-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Hafıza Eşleştirme (B1)
                    </span>
                    <span className="font-mono text-amber-300 font-bold">+100 Puan</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 text-center animate-pulse">
                      Accomplish
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 text-center animate-pulse">
                      Başarmak ✨
                    </div>
                  </div>
                </div>

                {/* Level Up Quiz Box */}
                <div className="p-4 bg-slate-800/80 border border-indigo-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-400 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      Boşluk Doldurma Sınavı
                    </span>
                    <span className="font-bold text-emerald-400">100% Doğru</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-left">
                    <span className="text-slate-300">She made great </span>
                    <span className="text-emerald-400 font-bold underline">progress</span>
                    <span className="text-slate-300"> in her studies.</span>
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <span>🔔 Ses Efektleri • Doğru/Yanlış Dönütü • Anlık Seviye Terfisi</span>
              </div>
            </div>
          )}

          {/* Scene 4: 15s - 20s -> "3 Roles Ecosystem & Blooming Garden" */}
          {currentSceneIndex === 3 && (
            <div className="relative z-10 my-auto flex flex-col items-center text-center space-y-6 animate-in fade-in duration-500">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
                BÖLÜM 4 • BÜTÜNSEL EĞİTİM EKOSİSTEMİ
              </span>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                3 Rol, Tek Ekosistem •{' '}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                  Çiçek Açan Bahçeniz
                </span>
              </h2>

              {/* 3 Roles Icons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
                <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-left">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">👑</span>
                    <div className="font-bold text-white text-xs">Yönetici (Manager)</div>
                  </div>
                  <p className="text-[11px] text-purple-300/80 mt-1">Hiyerarşik sınıf ağacı & nakil kontrolü</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-left">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">👩‍🏫</span>
                    <div className="font-bold text-white text-xs">Öğretmen (Teacher)</div>
                  </div>
                  <p className="text-[11px] text-blue-300/80 mt-1">Özel sınıf kodları & öğrenci onayı</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-left">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🎓</span>
                    <div className="font-bold text-white text-xs">Öğrenci (Student)</div>
                  </div>
                  <p className="text-[11px] text-emerald-300/80 mt-1">3D kelimeler & bahçe büyümesi</p>
                </div>
              </div>

              <div className="text-xs text-slate-300 max-w-md">
                Öğretmenler ve yöneticiler öğrencilerin tüm aktivite ve sınav başarılarını anlık izleyebilir.
              </div>
            </div>
          )}

          {/* CELEBRATION OVERLAY UPON 20-SECOND COMPLETION */}
          {isCompleted && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center space-y-5 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-emerald-400 p-1 shadow-2xl shadow-emerald-500/40 animate-pulse">
                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-4xl">
                  🌸
                </div>
              </div>

              <div className="space-y-2 max-w-lg">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  VİDEO TAMAMLANDI • HOŞ GELDİNİZ
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  İngilizce Kelimeleriniz{' '}
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                    Çiçek Açmaya Hazır!
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Artık VocaBloom platformuna giriş yapabilir, sınıfınıza katılabilir ve kelime dünyanızı genişletmeye başlayabilirsiniz.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {/* Prominent "Continue" Button */}
                <button
                  onClick={handleContinue}
                  className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/25 transition-transform hover:scale-105 flex items-center space-x-2 text-sm cursor-pointer select-none"
                >
                  <span>Continue (Siteye Devam Et)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Replay Option */}
                <button
                  onClick={handleReplay}
                  className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl border border-slate-700 transition flex items-center space-x-2 text-sm cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Tekrar İzle</span>
                </button>
              </div>
            </div>
          )}

          {/* Subtitle Bar at Bottom of Video Screen */}
          <div className="relative z-10 w-full text-center py-2 px-4 rounded-xl bg-slate-950/70 backdrop-blur-sm border border-slate-800/80 text-xs text-slate-300">
            {currentSceneIndex === 0 && (
              <span>🌸 <strong>VocaBloom:</strong> Kelime ezberi yerine zihinde kök salan ve çiçek açan kalıcı öğrenim.</span>
            )}
            {currentSceneIndex === 1 && (
              <span>📚 <strong>A1-C2 Hedef Seviyeler:</strong> 3.000 kelime, 3D interaktif kartlar, fonetik ve telaffuz rehberi.</span>
            )}
            {currentSceneIndex === 2 && (
              <span>🎮 <strong>Gamification:</strong> Eşleştirme kartları, sesli seviye atlama quizleri ve anlık geri bildirim.</span>
            )}
            {currentSceneIndex === 3 && (
              <span>👑 <strong>3 Rol & Tek Ekosistem:</strong> Yönetici, Öğretmen ve Öğrenci için entegre sınıf yönetimi.</span>
            )}
          </div>
        </div>

        {/* Video Player Control Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col space-y-3 z-20">
          {/* Progress bar with 4 scene markers */}
          <div className="relative w-full h-2.5 bg-slate-800 rounded-full cursor-pointer overflow-hidden group">
            {/* Scene divider ticks */}
            <div className="absolute left-[25%] top-0 bottom-0 w-0.5 bg-slate-700 z-10" />
            <div className="absolute left-[50%] top-0 bottom-0 w-0.5 bg-slate-700 z-10" />
            <div className="absolute left-[75%] top-0 bottom-0 w-0.5 bg-slate-700 z-10" />

            {/* Filled progress bar */}
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-100 relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md shadow-emerald-500/50 scale-100 group-hover:scale-125 transition-transform" />
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            {/* Play/Pause & Audio & Replay */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (isCompleted) {
                    handleReplay();
                  } else {
                    setIsPlaying(!isPlaying);
                  }
                }}
                className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 flex items-center justify-center transition cursor-pointer"
                title={isPlaying ? 'Durdur' : 'Oynat'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                onClick={handleReplay}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Başa Sar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer ${
                  isMuted
                    ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Time display */}
              <div className="font-mono text-slate-300 px-2">
                <span>00:{Math.floor(currentTime).toString().padStart(2, '0')}</span>
                <span className="text-slate-600 mx-1">/</span>
                <span className="text-slate-500">00:20</span>
              </div>
            </div>

            {/* Speed & Actions */}
            <div className="flex items-center space-x-2">
              {/* Playback rate selector */}
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                {[1, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                      playbackRate === rate
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Skip The Video Button */}
              <button
                onClick={handleSkip}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 rounded-xl font-bold flex items-center space-x-1 cursor-pointer transition"
              >
                <FastForward className="w-3.5 h-3.5 text-slate-400" />
                <span>Skip The Video</span>
              </button>

              {/* Continue button if completed */}
              {isCompleted && (
                <button
                  onClick={handleContinue}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl flex items-center space-x-1 cursor-pointer shadow-md shadow-emerald-900 transition animate-pulse"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
