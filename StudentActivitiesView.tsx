import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentActivity, StudentActivityType, CEFRLevel } from '../../types';
import {
  Clock,
  Search,
  Filter,
  Award,
  GraduationCap,
  Layers,
  HelpCircle,
  BookOpen,
  CheckCircle2,
  XCircle,
  Sparkles,
  Trophy,
  ArrowUpRight,
} from 'lucide-react';

interface StudentActivitiesViewProps {
  filterClassCode?: string; // If provided, limits to this teacher's class
  title?: string;
  subtitle?: string;
}

export const StudentActivitiesView: React.FC<StudentActivitiesViewProps> = ({
  filterClassCode,
  title = 'Öğrenci Hareketleri ve Denetim Kaydı',
  subtitle = 'Öğrencilerin eşleştirme oyunları, seviye atlama sınavları ve çalışma hareketlerinin canlı takibi',
}) => {
  const { activities, students, teachers } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<StudentActivityType | 'ALL'>('ALL');
  const [levelFilter, setLevelFilter] = useState<CEFRLevel | 'ALL'>('ALL');

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    // Class code filter if restricted (e.g. teacher view)
    if (filterClassCode && act.classCode !== filterClassCode) return false;

    // Type filter
    if (typeFilter !== 'ALL' && act.type !== typeFilter) return false;

    // Level filter
    if (levelFilter !== 'ALL' && act.level !== levelFilter) return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        act.studentName.toLowerCase().includes(q) ||
        act.classCode.toLowerCase().includes(q) ||
        act.title.toLowerCase().includes(q) ||
        act.details.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Calculate statistics
  const relevantActivities = filterClassCode
    ? activities.filter((a) => a.classCode === filterClassCode)
    : activities;

  const totalExams = relevantActivities.filter((a) => a.type === 'level_exam').length;
  const totalPromotions = relevantActivities.filter((a) => a.type === 'level_promoted').length;
  const totalMatching = relevantActivities.filter((a) => a.type === 'matching_game').length;

  const getActivityBadge = (type: StudentActivityType) => {
    switch (type) {
      case 'level_promoted':
        return {
          icon: <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'Seviye Terfisi',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
      case 'level_exam':
        return {
          icon: <Award className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Seviye Sınavı',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'matching_game':
        return {
          icon: <Layers className="w-3.5 h-3.5 text-indigo-400" />,
          label: 'Eşleştirme',
          color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        };
      case 'quiz_completed':
        return {
          icon: <Trophy className="w-3.5 h-3.5 text-blue-400" />,
          label: 'Kelime Quizi',
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        };
      case 'word_learned':
        return {
          icon: <BookOpen className="w-3.5 h-3.5 text-teal-400" />,
          label: 'Kelime Öğrenimi',
          color: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>{title}</span>
                {filterClassCode && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono border border-slate-700">
                    {filterClassCode}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>

          <div className="text-xs text-slate-400 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 font-mono">
            {filteredActivities.length} Kayıt Gösteriliyor
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-2xl">
            <div className="text-[11px] text-slate-400">Toplam Hareket</div>
            <div className="text-2xl font-extrabold text-white mt-0.5">
              {relevantActivities.length}
            </div>
          </div>

          <div className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-2xl">
            <div className="text-[11px] text-slate-400">Seviye Sınavı</div>
            <div className="text-2xl font-extrabold text-amber-300 mt-0.5">
              {totalExams}
            </div>
          </div>

          <div className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-2xl">
            <div className="text-[11px] text-slate-400">Seviye Terfisi</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-0.5">
              {totalPromotions}
            </div>
          </div>

          <div className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-2xl">
            <div className="text-[11px] text-slate-400">Eşleştirme Oyunu</div>
            <div className="text-2xl font-extrabold text-indigo-300 mt-0.5">
              {totalMatching}
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="pt-2 border-t border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Öğrenci adı, sınıf kodu veya işlem ara..."
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Type Filters */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 cursor-pointer ${
                  typeFilter === 'ALL'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => setTypeFilter('level_promoted')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 cursor-pointer ${
                  typeFilter === 'level_promoted'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-emerald-300'
                }`}
              >
                Terfiler 🎓
              </button>
              <button
                onClick={() => setTypeFilter('level_exam')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 cursor-pointer ${
                  typeFilter === 'level_exam'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-amber-300'
                }`}
              >
                Seviye Sınavları
              </button>
              <button
                onClick={() => setTypeFilter('matching_game')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 cursor-pointer ${
                  typeFilter === 'matching_game'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-indigo-300'
                }`}
              >
                Eşleştirme
              </button>
              <button
                onClick={() => setTypeFilter('quiz_completed')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 cursor-pointer ${
                  typeFilter === 'quiz_completed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-blue-300'
                }`}
              >
                Quizler
              </button>
            </div>
          </div>

          {/* Level Filter Chips */}
          <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/50 text-xs overflow-x-auto pb-1">
            <span className="text-slate-400 font-semibold shrink-0">CEFR Düzeyi:</span>
            {(['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg font-mono font-bold transition shrink-0 cursor-pointer ${
                  levelFilter === lvl
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Log Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Henüz eşleşen hareket kaydı bulunamadı.</p>
            <p className="text-xs text-slate-500">
              Filtrelerinizi değiştirin veya öğrencilerin aktivite yapmasını bekleyin.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredActivities.map((act) => {
              const badge = getActivityBadge(act.type);
              const student = students.find((s) => s.id === act.studentId);

              return (
                <div
                  key={act.id}
                  className={`p-4 sm:p-5 transition hover:bg-slate-850 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                    act.type === 'level_promoted'
                      ? 'bg-emerald-950/20 border-l-4 border-l-emerald-500'
                      : ''
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    {/* Student Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={
                          student?.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                        }
                        alt={act.studentName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                      />
                      <span className="absolute -bottom-1 -right-1 text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-slate-950 text-emerald-400 border border-slate-700">
                        {act.level}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm sm:text-base">
                          {act.studentName}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded font-mono text-slate-400 bg-slate-800 border border-slate-700">
                          {act.classCode}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${badge.color}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-semibold text-slate-200">
                        {act.title}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                        {act.details}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Score badge & Timestamp */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    {act.score !== undefined && act.total !== undefined && (
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                          act.passed
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {act.score} / {act.total}
                      </span>
                    )}

                    <span className="text-[11px] text-slate-500 font-mono">
                      {act.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
