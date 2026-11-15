import React from 'react';
import { StudentProgress } from '../../types';
import { Sparkles, Flame, Award, BookOpen, Droplets, Sun } from 'lucide-react';

interface VocaBloomGardenProps {
  progress: StudentProgress;
}

export const VocaBloomGarden: React.FC<VocaBloomGardenProps> = ({ progress }) => {
  const { bloomScore, wordsLearned, streakDays, testsTaken } = progress;

  // Determine stage
  let stageName = 'Filiz Aşaması';
  let stageNumber = 1;
  let flowerScale = 0.8;
  let petalColor = '#34d399'; // Emerald

  if (bloomScore >= 1200) {
    stageName = 'Efsanevi VocaBloom Bahçesi';
    stageNumber = 5;
    flowerScale = 1.3;
    petalColor = '#ec4899'; // Rose / Pink
  } else if (bloomScore >= 700) {
    stageName = 'Tam Çiçeklenme (Full Bloom)';
    stageNumber = 4;
    flowerScale = 1.15;
    petalColor = '#a855f7'; // Purple
  } else if (bloomScore >= 350) {
    stageName = 'Çiçek Açan Tomurcuk';
    stageNumber = 3;
    flowerScale = 1.0;
    petalColor = '#38bdf8'; // Sky blue
  } else if (bloomScore >= 150) {
    stageName = 'Gelişen Filiz';
    stageNumber = 2;
    flowerScale = 0.9;
    petalColor = '#10b981'; // Emerald
  } else {
    stageName = 'Tohum Aşaması';
    stageNumber = 1;
    flowerScale = 0.75;
    petalColor = '#84cc16'; // Lime
  }

  const nextMilestone =
    stageNumber === 1
      ? 150
      : stageNumber === 2
      ? 350
      : stageNumber === 3
      ? 700
      : stageNumber === 4
      ? 1200
      : 2500;
  const progressPercent = Math.min(100, Math.round((bloomScore / nextMilestone) * 100));

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/30 p-6 shadow-2xl">
      {/* Background ambient botanical glow */}
      <div className="absolute -right-20 -top-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Column: Visual Flower SVG that blooms */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Ambient sun rays */}
            <div className="absolute inset-0 flex items-center justify-center animate-spin-slow opacity-40">
              <div className="w-40 h-40 border border-emerald-500/30 rounded-full" />
              <div className="w-48 h-48 border border-dashed border-teal-500/20 rounded-full absolute" />
            </div>

            {/* Botanical Flower SVG */}
            <svg
              viewBox="0 0 100 100"
              className="w-40 h-40 transition-transform duration-700 ease-out drop-shadow-[0_0_20px_rgba(16,185,129,0.35)]"
              style={{ transform: `scale(${flowerScale})` }}
            >
              {/* Stem */}
              <path
                d="M50 55 Q52 75 50 95"
                stroke="#059669"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              {/* Leaves on stem */}
              <path
                d="M50 75 Q35 70 40 85 Q48 85 50 75"
                fill="#10b981"
                opacity="0.9"
              />
              <path
                d="M50 68 Q65 62 60 78 Q52 78 50 68"
                fill="#10b981"
                opacity="0.9"
              />

              {/* Petals radiating around center (6 petals) */}
              {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <ellipse
                  key={i}
                  cx="50"
                  cy="32"
                  rx="10"
                  ry="18"
                  fill={petalColor}
                  opacity="0.85"
                  transform={`rotate(${angle} 50 50)`}
                  className="transition-all duration-500 hover:opacity-100"
                />
              ))}

              {/* Inner Petal Ring for full bloom */}
              {stageNumber >= 3 &&
                [30, 90, 150, 210, 270, 330].map((angle, i) => (
                  <ellipse
                    key={`inner-${i}`}
                    cx="50"
                    cy="38"
                    rx="6"
                    ry="12"
                    fill="#fef08a"
                    opacity="0.9"
                    transform={`rotate(${angle} 50 50)`}
                  />
                ))}

              {/* Golden Center Bulb */}
              <circle cx="50" cy="50" r="11" fill="#f59e0b" />
              <circle cx="50" cy="50" r="7" fill="#fbbf24" />
              <circle cx="48" cy="48" r="2.5" fill="#ffffff" opacity="0.8" />
            </svg>

            {/* Stage badge underneath flower */}
            <div className="absolute -bottom-2 px-3 py-1 bg-slate-900/90 border border-emerald-500/40 rounded-full text-[11px] font-bold text-emerald-300 shadow-md">
              Aşama {stageNumber}: {stageName}
            </div>
          </div>
        </div>

        {/* Right Column: Garden Metrics & XP Progress */}
        <div className="md:col-span-7 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>VocaBloom Bahçesi & Gelişim İlerlemesi</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono border border-amber-500/30 flex items-center gap-1">
                🎓 Seviye: {progress.currentLevel || 'A1'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Kelime Dağarcığın Çiçek Açıyor!
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Her öğrendiğin kelime ve tamamladığın test bahçene su ve güneş vererek VocaBloom çiçeğini büyütür.
            </p>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-1.5 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Bloom Puanı: <strong className="text-emerald-400 font-mono text-sm">{bloomScore} XP</strong></span>
              </span>
              <span className="text-[11px] text-slate-400">
                Hedef: {nextMilestone} XP (%{progressPercent})
              </span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 3 Quick Pill Metrics */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-center">
              <div className="flex items-center justify-center text-emerald-400 text-xs mb-0.5">
                <BookOpen className="w-3.5 h-3.5 mr-1" />
                <span className="font-semibold">Öğrenilen</span>
              </div>
              <div className="text-lg font-black text-white">{wordsLearned.length}</div>
              <div className="text-[10px] text-slate-400">Kelime Haznesi</div>
            </div>

            <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-center">
              <div className="flex items-center justify-center text-amber-400 text-xs mb-0.5">
                <Flame className="w-3.5 h-3.5 mr-1" />
                <span className="font-semibold">Günlük Seri</span>
              </div>
              <div className="text-lg font-black text-white">{streakDays} Gün</div>
              <div className="text-[10px] text-slate-400">Düzenli Pratik</div>
            </div>

            <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-center">
              <div className="flex items-center justify-center text-blue-400 text-xs mb-0.5">
                <Droplets className="w-3.5 h-3.5 mr-1" />
                <span className="font-semibold">Çözülen Test</span>
              </div>
              <div className="text-lg font-black text-white">{testsTaken}</div>
              <div className="text-[10px] text-slate-400">Quiz & Sınav</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
