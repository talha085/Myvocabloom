import React, { useState } from 'react';
import { Announcement } from '../../types';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  Calendar,
  User,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { playSuccessSound } from '../../utils/soundEffects';

interface MandatoryAnnouncementModalProps {
  unacknowledgedAnnouncements: Announcement[];
  currentUserId: string;
  onAcknowledge: (announcementId: string, userId: string) => void;
  userRoleName: string; // e.g. "Öğrenci" or "Öğretmen"
}

export const MandatoryAnnouncementModal: React.FC<MandatoryAnnouncementModalProps> = ({
  unacknowledgedAnnouncements,
  currentUserId,
  onAcknowledge,
  userRoleName,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // If no unacknowledged announcements left, do not render
  if (!unacknowledgedAnnouncements || unacknowledgedAnnouncements.length === 0) {
    return null;
  }

  // Ensure current index is within bounds
  const activeAnnouncement =
    unacknowledgedAnnouncements[currentIndex] || unacknowledgedAnnouncements[0];

  const handleAcknowledge = () => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}
    setIsSpeaking(false);
    playSuccessSound();
    onAcknowledge(activeAnnouncement.id, currentUserId);
    // When an announcement is acknowledged, the unacknowledged list will shorten.
    // If there were multiple, reset currentIndex to 0 or stay in range
    setCurrentIndex(0);
  };

  const toggleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const textToRead = `${activeAnnouncement.title}. ${activeAnnouncement.content}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'tr-TR';
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  const getPriorityBadge = (priority: Announcement['priority']) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-black uppercase tracking-wider animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Acil Duyuru</span>
          </span>
        );
      case 'important':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Önemli Duyuru</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bilgilendirme</span>
          </span>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Zorunlu Duyuru"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md select-none overflow-y-auto"
    >
      <div className="relative w-full max-w-xl my-auto bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-3xl shadow-2xl shadow-emerald-950/50 p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Glowing aura */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-20 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header section with notification badge */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-600/30 text-white">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-extrabold flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Yeni Bildirim</span>
                </span>
                <h3 className="text-sm font-semibold text-slate-300">
                  {userRoleName} Özel Duyurusu
                </h3>
              </div>
            </div>

            {getPriorityBadge(activeAnnouncement.priority)}
          </div>

          {/* Multiple announcements indicator */}
          {unacknowledgedAnnouncements.length > 1 && (
            <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300">
              <span className="font-semibold text-emerald-400">
                Okunmamış Duyuru: {currentIndex + 1} / {unacknowledgedAnnouncements.length}
              </span>
              <span className="text-slate-400">
                (Her biri için «Anladım.» butonuna basarak devam edin)
              </span>
            </div>
          )}

          {/* Title */}
          <div className="pt-1">
            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
              {activeAnnouncement.title}
            </h2>
          </div>

          {/* Author and Date Meta */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium">{activeAnnouncement.authorName}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-emerald-300">
                {activeAnnouncement.authorRole === 'manager' ? 'Yönetici' : 'Öğretmen'}
              </span>
            </div>
            <div className="flex items-center space-x-1 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{activeAnnouncement.createdAt}</span>
            </div>
            {'speechSynthesis' in window && (
              <button
                type="button"
                onClick={toggleSpeak}
                className="ml-auto inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs cursor-pointer"
                title={isSpeaking ? 'Durdur' : 'Sesli Dinle'}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    <span>Durdur</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sesli Dinle</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Content Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line shadow-inner max-h-60 overflow-y-auto custom-scrollbar">
          {activeAnnouncement.content}
        </div>

        {/* Mandatory Proceed Action */}
        <div className="space-y-3 pt-2">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300/90 text-xs flex items-center space-x-2">
            <Info className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>
              Sisteme devam edebilmek için bu duyuruyu okuyup aşağıdaki{' '}
              <strong className="text-amber-200">«Anladım.»</strong> butonuna tıklamanız
              gerekmektedir.
            </span>
          </div>

          <button
            type="button"
            onClick={handleAcknowledge}
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-950/60 border border-emerald-400/50 hover:border-emerald-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center space-x-2 select-none group"
          >
            <CheckCircle2 className="w-6 h-6 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span className="tracking-wide">Anladım.</span>
          </button>
        </div>
      </div>
    </div>
  );
};
