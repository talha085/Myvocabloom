/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { GuideAgentMessage } from '../../types';
import { askGuideAgent } from '../../services/geminiService';
import { speakWord } from '../../utils/speech';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Volume2,
  VolumeX,
  RotateCcw,
  Copy,
  Check,
  ArrowRight,
  HelpCircle,
  GraduationCap,
  Users,
  ShieldCheck,
  BookOpen,
  Trophy,
  Mic,
  MicOff,
  ChevronDown,
  Layers,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

const QUICK_CATEGORIES = [
  {
    id: 'student',
    label: '🎓 Öğrenci Rehberi',
    prompts: [
      'Öğrenci olarak nasıl kayıt olurum?',
      'Seviye Atlama Sınavı (Level Exam) nasıl çalışır?',
      'AI ile Bağlamsal Paragraf nasıl oluşturulur?',
      'VocaBloom Bahçemdeki ağaç ve çiçekler nasıl büyür?',
      'Kelime Kartları ve Eşleştirme Oyunu nasıl oynanır?',
    ],
  },
  {
    id: 'teacher',
    label: '👩‍🏫 Öğretmen Rehberi',
    prompts: [
      'Sınıf kodumu nereden bulurum ve nasıl paylaşırım?',
      'Bekleyen öğrenci kayıtlarını nasıl onaylarım?',
      'Yapay zekâ (AI) ile müfredata nasıl yeni kelime eklerim?',
      'Öğrenci aktivitelerini nereden takip edebilirim?',
      'Sınıfıma nasıl zorunlu duyuru gönderirim?',
    ],
  },
  {
    id: 'manager',
    label: '👑 Yönetici Rehberi',
    prompts: [
      'Hiyerarşik sınıf ağacı (Organizasyon Şeması) nedir?',
      'Öğrencileri sınıflar arası nasıl transfer ederim?',
      'Yeni öğretmen ekleme ve sınıf atama nasıl yapılır?',
      'Okul geneli duyuru nasıl yayınlanır?',
    ],
  },
  {
    id: 'general',
    label: '💡 Giriş & Hesap',
    prompts: [
      'Hızlı giriş için demo hesap bilgileri nelerdir?',
      'Şifremi nasıl değiştirebilirim?',
      'VocaBloom Academy nedir ve ne amaçla kullanılır?',
    ],
  },
];

export const VocaBloomGuideAgent: React.FC = () => {
  const {
    currentUser,
    isGuideAgentOpen,
    openGuideAgent,
    closeGuideAgent,
    guideAgentInitialQuery,
    openLoginModal,
    openChangePasswordModal,
    openIntroVideo,
    navigateToTab,
    activeView,
    goToDashboard,
  } = useApp();

  const [messages, setMessages] = useState<GuideAgentMessage[]>(() => {
    return [
      {
        id: 'msg-welcome',
        sender: 'agent',
        text: `Merhaba! Ben **VocabBloom AI Destek**. 🌸

Sadece bu sitenin elverişli kullanımı ve özellikleri konusunda size yardımcı olabilirim. Öğrenci kaydı, seviye sınavları, kelime kartları, sanal bahçe, öğretmen veya yönetici araçları hakkında sormak istediğiniz adımları yazabilirsiniz.`,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Öğrenci olarak nasıl kayıt olurum?',
          'Seviye Atlama Sınavı nasıl çalışır?',
          'Kelime Kartları nasıl kullanılır?',
        ],
      },
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('student');
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (isGuideAgentOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGuideAgentOpen, isLoading]);

  // Handle initial query if triggered externally
  useEffect(() => {
    if (guideAgentInitialQuery && isGuideAgentOpen) {
      handleSendMessage(guideAgentInitialQuery);
    }
  }, [guideAgentInitialQuery, isGuideAgentOpen]);

  // Setup Web Speech Recognition if available
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputQuery(transcript);
          handleSendMessage(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Tarayıcınız sesli girişi desteklemiyor. Lütfen Chrome veya Edge kullanın.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMsg: GuideAgentMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const chatHistory = messages.map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        text: m.text,
      }));

      const res = await askGuideAgent({
        message: textToSend,
        chatHistory,
        userRole: currentUser?.role || 'guest',
        userName: currentUser?.name || '',
        userClassCode: (currentUser as any)?.classCode || '',
        currentView: activeView,
      });

      // Parse shortcut action if returned
      let actionShortcut: GuideAgentMessage['actionShortcut'] = undefined;
      const rawShortcut = (res.shortcutAction || '').trim().toLowerCase();
      if (rawShortcut) {
        if (rawShortcut === 'open_register') {
          actionShortcut = {
            label: '🎓 Öğrenci Kayıt Formunu Aç',
            actionType: 'open_register',
          };
        } else if (rawShortcut === 'open_login') {
          actionShortcut = {
            label: '🔑 Giriş Penceresini Aç',
            actionType: 'open_login',
          };
        } else if (rawShortcut === 'change_password') {
          actionShortcut = {
            label: '🔒 Şifre Değiştirme Penceresini Aç',
            actionType: 'change_password',
          };
        } else if (rawShortcut === 'intro_video') {
          actionShortcut = {
            label: '🎬 Tanıtım Videosunu Aç',
            actionType: 'intro_video',
          };
        } else {
          const cleanTab = rawShortcut
            .replace(/^navigate_/, '')
            .replace(/^level[-_]?exam$/, 'exam')
            .replace(/^ai_story$/, 'ai-story');

          const TAB_LABELS: Record<string, string> = {
            exam: '🏆 Seviye Sınavına Git',
            flashcards: '🗂️ Kelime Kartlarına Git',
            garden: '🌸 Bahçeme Git',
            'ai-story': '✨ AI Okuma Sekmesine Git',
            quiz: '📝 Quiz Modülüne Git',
            matching: '🎮 Eşleştirme Oyununa Git',
            explorer: '🔍 Kelime Gezginine Git',
            learned: '📖 Öğrendiklerime Git',
            class: '👥 Sınıfıma Git',
            announcements: '📢 Duyurulara Git',
          };

          if (TAB_LABELS[cleanTab]) {
            actionShortcut = {
              label: TAB_LABELS[cleanTab],
              actionType: 'navigate_tab',
              targetTab: cleanTab,
            };
          } else if (rawShortcut.startsWith('navigate_')) {
            actionShortcut = {
              label: 'İlgili Sekmeye Git',
              actionType: 'navigate_tab',
              targetTab: cleanTab,
            };
          }
        }
      }

      const agentMsg: GuideAgentMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        suggestions: res.suggestions,
        actionShortcut,
      };

      setMessages((prev) => [...prev, agentMsg]);

      // If audio is enabled, read summary out loud
      if (isAudioEnabled && res.answer) {
        const cleanSpeechText = res.answer
          .replace(/[#*`_~]/g, '')
          .replace(/\[.*?\]/g, '')
          .slice(0, 150);
        speakWord(cleanSpeechText);
      }
    } catch (err) {
      console.error('Guide agent error:', err);
      const fallbackMsg: GuideAgentMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: 'Üzgünüm, şu an bağlantıda kısa bir gecikme yaşandı. Sorunuzu yanıtlamak için sol üstteki hızlı konu başlıklarını inceleyebilir veya sorunuzu tekrar deneyebilirsiniz.',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'msg-welcome-reset',
        sender: 'agent',
        text: 'Sohbet geçmişi temizlendi. Sitenin elverişli kullanımıyla ilgili sorularınızı yanıtlayabilirim.',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Öğrenci olarak nasıl kayıt olurum?',
          'Seviye Atlama Sınavı nasıl çalışır?',
          'Kelime Kartları nasıl kullanılır?',
        ],
      },
    ]);
  };

  const handleExecuteShortcut = (shortcut: NonNullable<GuideAgentMessage['actionShortcut']>) => {
    if (shortcut.actionType === 'open_register') {
      openLoginModal('register');
      closeGuideAgent();
    } else if (shortcut.actionType === 'open_login') {
      openLoginModal('login');
      closeGuideAgent();
    } else if (shortcut.actionType === 'change_password') {
      openChangePasswordModal();
      closeGuideAgent();
    } else if (shortcut.actionType === 'intro_video') {
      openIntroVideo();
      closeGuideAgent();
    } else if (shortcut.actionType === 'navigate_tab' && shortcut.targetTab) {
      navigateToTab(shortcut.targetTab);
      closeGuideAgent();
    }
  };

  // Helper to render markdown-like bold and bullet lists
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      // Header 3
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm font-extrabold text-emerald-300 mt-2 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Header 2
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-base font-black text-white mt-3 mb-1">
            {line.replace('## ', '')}
          </h3>
        );
      }
      // Bullet list item
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const itemContent = line.trim().replace(/^[-*]\s+/, '');
        return (
          <li key={idx} className="ml-4 list-disc text-slate-200 text-xs my-0.5 leading-relaxed">
            {renderBoldSpans(itemContent)}
          </li>
        );
      }
      // Numbered list item
      if (/^\d+\.\s+/.test(line.trim())) {
        return (
          <div key={idx} className="text-slate-200 text-xs my-1 pl-2 border-l-2 border-emerald-500/40">
            {renderBoldSpans(line.trim())}
          </div>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      // Normal paragraph
      return (
        <p key={idx} className="text-xs text-slate-200 leading-relaxed my-0.5">
          {renderBoldSpans(line)}
        </p>
      );
    });
  };

  // Helper for **bold** text
  const renderBoldSpans = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-extrabold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-750 font-mono text-[11px] text-emerald-300">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* FLOATING ACTION BUTTON (Always accessible at bottom-right) */}
      {!isGuideAgentOpen && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 animate-bounce-in">
          {/* Tooltip Pill */}
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900/95 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-xl backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>VocabBloom AI Destek</span>
          </div>

          <button
            type="button"
            onClick={() => openGuideAgent()}
            title="VocabBloom AI Destek Sohbet Penceresini Aç"
            className="group relative p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white shadow-2xl shadow-emerald-950/80 border border-emerald-400/40 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
          >
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-900 flex items-center justify-center text-[9px] font-black text-slate-950">
              AI
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl group-hover:rotate-12 transition-transform duration-300">🌸</span>
              <Sparkles className="w-5 h-5 text-emerald-100 group-hover:animate-spin" />
            </div>
          </button>
        </div>
      )}

      {/* EXPANDED ASSISTANT CHAT DRAWER */}
      {isGuideAgentOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[480px] sm:h-[650px] z-50 flex flex-col bg-slate-900/98 sm:rounded-3xl border border-emerald-500/40 shadow-2xl backdrop-blur-xl animate-fade-in overflow-hidden">
          {/* HEADER */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shadow-emerald-950 flex items-center justify-center text-xl shrink-0">
                🌸
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-extrabold text-white">VocabBloom AI Destek</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Site Kullanımı
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Sadece Sitenin Elverişli Kullanımı Konusunda Destek
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center space-x-1">
              {/* Toggle Audio Output */}
              <button
                type="button"
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                title={isAudioEnabled ? 'Sesli Yanıtı Kapat' : 'Sesli Yanıtı Aç'}
                className={`p-2 rounded-xl transition cursor-pointer text-xs ${
                  isAudioEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Reset Chat */}
              <button
                type="button"
                onClick={handleClearHistory}
                title="Sohbeti Temizle"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeGuideAgent}
                title="Asistanı Kapat"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* USER CONTEXT BADGE & CATEGORY SELECTOR */}
          <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800/80 shrink-0 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>
                  {currentUser
                    ? `${currentUser.name} (${currentUser.role === 'manager' ? '👑 Yönetici' : currentUser.role === 'teacher' ? '👩‍🏫 Öğretmen' : '🎓 Öğrenci'})`
                    : '👋 Misafir Ziyaretçi'}
                </span>
              </div>
              <span className="text-slate-400">Türkçe Yapay Zekâ Rehberi</span>
            </div>

            {/* Category Quick Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {QUICK_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer border ${
                    activeCategory === cat.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* ACTIVE CATEGORY PROMPTS CAROUSEL */}
          <div className="px-3 py-1.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center space-x-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0 pl-1">Öneriler:</span>
            {QUICK_CATEGORIES.find((c) => c.id === activeCategory)?.prompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(p)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-emerald-300 text-[11px] whitespace-nowrap transition cursor-pointer border border-slate-700/60 flex items-center space-x-1"
              >
                <span>{p}</span>
                <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
              </button>
            ))}
          </div>

          {/* MESSAGES SCROLL AREA */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl text-xs shadow-lg space-y-2 ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-bl-none'
                  }`}
                >
                  {/* Sender title if agent */}
                  {msg.sender === 'agent' && (
                    <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-700/60 text-[10px] text-slate-400">
                      <span className="flex items-center space-x-1 text-emerald-400 font-bold">
                        <span>🌸</span>
                        <span>VocabBloom AI Destek</span>
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                  )}

                  {/* Body */}
                  <div className="space-y-1">
                    {msg.sender === 'agent' ? renderFormattedText(msg.text) : msg.text}
                  </div>

                  {/* Action Shortcut Button (If agent recommends a specific screen) */}
                  {msg.actionShortcut && (
                    <div className="pt-2 border-t border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => handleExecuteShortcut(msg.actionShortcut!)}
                        className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-md shadow-emerald-950/40 border border-emerald-400/40 transition flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <span>{msg.actionShortcut.label}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Footer actions for agent response */}
                  {msg.sender === 'agent' && (
                    <div className="pt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center space-x-2">
                        {/* Audio play */}
                        <button
                          type="button"
                          onClick={() => {
                            const cleanText = msg.text.replace(/[#*`_~]/g, '').slice(0, 200);
                            speakWord(cleanText);
                          }}
                          title="Cevabı Sesli Dinle"
                          className="hover:text-emerald-300 transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Dinle</span>
                        </button>

                        {/* Copy text */}
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          title="Cevabı Kopyala"
                          className="hover:text-emerald-300 transition flex items-center space-x-1 cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Kopyalandı</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Kopyala</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Follow-up Question Suggestion Chips */}
                {msg.sender === 'agent' && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2 pl-2 flex flex-wrap gap-1.5 max-w-[90%]">
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendMessage(sug)}
                        className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-emerald-950/60 border border-slate-700/80 hover:border-emerald-500/50 text-[11px] text-emerald-300 hover:text-emerald-200 transition cursor-pointer flex items-center space-x-1 shadow-sm"
                      >
                        <span>{sug}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-emerald-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start space-x-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm shrink-0 border border-emerald-500/30">
                  🌸
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-100" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-200" />
                  </div>
                  <span className="italic text-slate-400">VocaBloom rehber cevabı hazırlanıyor...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0 space-y-1.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              {/* Voice Input Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                title={isListening ? 'Dinlemeyi Durdur' : 'Sesinizle Soru Sorun'}
                className={`p-2.5 rounded-xl border transition cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-750'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text Input Field */}
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Sitenin kullanımı hakkında bir soru sorun..."
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!inputQuery.trim() || isLoading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 text-white transition shadow-md shadow-emerald-950/40 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
              <span>💡 Örn: &quot;Öğretmen sınıf kodumu nerede bulurum?&quot;</span>
              <span>VocaBloom AI Destek</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
