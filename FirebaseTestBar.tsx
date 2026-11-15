import React, { useState, useEffect } from 'react';
import {
  signInWithGoogle,
  testKayit,
  saveUserSpecificData,
  subscribeUserSpecificData,
  auth,
  signOut,
} from '../firebase';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  X,
  UserCheck,
  User,
  PlusCircle,
  LogOut,
  FolderLock,
  Layers,
} from 'lucide-react';

export const FirebaseTestBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingDb, setLoadingDb] = useState(false);
  const [loadingUserSave, setLoadingUserSave] = useState(false);
  const [customTitle, setCustomTitle] = useState('Hedef İngilizce Kelimelerim');
  const [customNote, setCustomNote] = useState('Bugün A1 ve A2 seviyesinden 10 kelime başarıyla tamamlandı.');
  const [log, setLog] = useState<{ type: 'success' | 'error' | 'info'; text: string; details?: string } | null>(null);
  const [userState, setUserState] = useState<{ email: string | null; uid: string; name?: string | null } | null>(() => {
    return auth.currentUser
      ? { email: auth.currentUser.email, uid: auth.currentUser.uid, name: auth.currentUser.displayName }
      : null;
  });
  const [userRecords, setUserRecords] = useState<any[]>([]);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserState({ email: user.email, uid: user.uid, name: user.displayName });
      } else {
        setUserState(null);
        setUserRecords([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to user-specific real-time Firestore collection
  useEffect(() => {
    if (!userState) return;
    const unsubscribeSnapshot = subscribeUserSpecificData((records) => {
      setUserRecords(records);
    });

    return () => unsubscribeSnapshot();
  }, [userState?.uid]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs rounded-full shadow-2xl flex items-center space-x-2 border border-amber-300 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Firebase Test Butonlarını Göster</span>
        </button>
      </div>
    );
  }

  // 1. Google ile Giriş Yap
  const handleGoogleClick = async () => {
    setLoadingGoogle(true);
    setLog({ type: 'info', text: 'Google giriş penceresi açılıyor...' });
    console.log('🔄 [Firebase Auth] signInWithGoogle() tetiklendi...');

    const res = await signInWithGoogle();
    setLoadingGoogle(false);

    if (res.success && res.user) {
      console.log('✅ [Firebase Auth] Başarıyla giriş yapıldı:', res.user);
      setUserState({ email: res.user.email, uid: res.user.uid, name: res.user.displayName });
      setLog({
        type: 'success',
        text: 'Google ile başarıyla giriş yapıldı!',
        details: `Kullanıcı: ${res.user.displayName || 'İsimsiz'} (${res.user.email}) | UID: ${res.user.uid}`,
      });
    } else {
      console.error('❌ [Firebase Auth] Google giriş hatası:', res.error);
      setLog({
        type: 'error',
        text: 'Google girişi sırasında hata oluştu:',
        details: String(res.error),
      });
    }
  };

  // 2. Çıkış Yap
  const handleSignOut = async () => {
    await signOut(auth);
    setUserState(null);
    setLog({ type: 'info', text: 'Oturum kapatıldı.' });
  };

  // 3. Genel Test Verisi Ekle
  const handleDbClick = async () => {
    setLoadingDb(true);
    setLog({ type: 'info', text: 'Firestore "test_collection" koleksiyonuna yazılıyor...' });
    console.log('🔄 [Firestore] testKayit() tetiklendi...');

    const res = await testKayit();
    setLoadingDb(false);

    if (res.success && res.docId) {
      console.log('✅ [Firestore] Veritabanına kayıt eklendi! Döküman ID:', res.docId);
      setLog({
        type: 'success',
        text: 'Firestore "test_collection" koleksiyonuna genel kayıt eklendi!',
        details: `Koleksiyon: "test_collection" | Döküman ID: ${res.docId}`,
      });
    } else {
      console.error('❌ [Firestore] Kayıt hatası:', res.error);
      setLog({
        type: 'error',
        text: 'Veritabanına yazılırken hata oluştu:',
        details: res.error instanceof Error ? res.error.message : String(res.error),
      });
    }
  };

  // 4. Giriş Yapan Kullanıcıya Özel Veri Kaydet (users/{uid}/user_records)
  const handleUserSpecificSave = async () => {
    if (!auth.currentUser) {
      setLog({
        type: 'error',
        text: 'Lütfen önce yukarıdaki "Google ile Giriş Yap" butonuna basarak giriş yapınız!',
      });
      return;
    }

    setLoadingUserSave(true);
    setLog({ type: 'info', text: `Giriş yapan kullanıcıya (${auth.currentUser.email}) özel veri yazılıyor...` });

    const payload = {
      title: customTitle,
      note: customNote,
      level: 'A1-A2',
      category: 'Student Study Record',
      app: 'VocaBloom Academy',
    };

    console.log('🔄 [Firestore User-Specific] saveUserSpecificData() tetiklendi...', payload);
    const res = await saveUserSpecificData(payload);
    setLoadingUserSave(false);

    if (res.success && res.docId) {
      console.log('✅ [Firestore User-Specific] Kullanıcıya özel kayıt oluşturuldu:', res);
      setLog({
        type: 'success',
        text: 'Veri, giriş yapan kullanıcıya özel olarak Firestore\'a kaydedildi!',
        details: `Yol (Path): ${res.path}\nDöküman ID: ${res.docId}\nKullanıcı UID: ${res.userId}`,
      });
    } else {
      console.error('❌ [Firestore User-Specific] Hata:', res.error);
      setLog({
        type: 'error',
        text: 'Kullanıcıya özel kayıt kaydedilemedi:',
        details: String(res.error),
      });
    }
  };

  return (
    <div className="mb-6 p-4 sm:p-6 rounded-3xl bg-slate-900/95 border-2 border-emerald-500/60 shadow-2xl backdrop-blur-md animate-fade-in relative text-slate-100">
      {/* Panel Başlığı */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30">
            🔒
          </div>
          <div>
            <h4 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Kullanıcıya Özel Veri Kayıt & Test Paneli</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Firestore User Isolation
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Veriler genel bir havuz yerine doğrudan oturum açmış kullanıcının özel yoluna (<code>users/{'{uid}'}/user_records</code>) kaydedilir.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          title="Paneli Gizle"
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Kullanıcı Durum Bilgisi */}
      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {userState ? (
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{userState.name || 'Giriş Yapmış Kullanıcı'}</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-700">
                  Aktif Oturum
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {userState.email} | UID: <span className="text-slate-300 font-semibold">{userState.uid}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2.5 text-xs text-amber-300">
            <User className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Henüz Google oturumu açılmadı. Lütfen aşağıdaki butondan giriş yapın.</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {!userState ? (
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loadingGoogle}
              className="py-2 px-3.5 rounded-xl font-bold text-xs bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 shadow flex items-center space-x-2 transition cursor-pointer"
            >
              {loadingGoogle ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Google ile Giriş Yap</span>}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSignOut}
              className="py-2 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Çıkış Yap</span>
            </button>
          )}
        </div>
      </div>

      {/* Kaydedilecek Veri Formu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
            Kayıt Başlığı (Veri Alanı: title)
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Kayıt başlığı..."
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
            Kullanıcı Notu / Açıklama (Veri Alanı: note)
          </label>
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Kullanıcı notu..."
          />
        </div>
      </div>

      {/* Eylem Butonları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Buton: Kullanıcıya Özel Kaydet */}
        <button
          type="button"
          onClick={handleUserSpecificSave}
          disabled={loadingUserSave || !userState}
          className="py-3 px-4 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg border border-emerald-300 flex items-center justify-center space-x-2.5 transition active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loadingUserSave ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <FolderLock className="w-5 h-5 shrink-0" />
          )}
          <span>Verileri Giriş Yapan Kullanıcıya Özel Kaydet</span>
        </button>

        {/* Buton: Genel test_collection Kaydet */}
        <button
          type="button"
          onClick={handleDbClick}
          disabled={loadingDb}
          className="py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 flex items-center justify-center space-x-2 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          {loadingDb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4 shrink-0 text-amber-400" />}
          <span>Genel Kayıt Yap (test_collection)</span>
        </button>
      </div>

      {/* Canlı Log / Geri Bildirim */}
      {log && (
        <div
          className={`mt-4 p-3.5 rounded-2xl border text-xs sm:text-sm flex items-start space-x-3 animate-fade-in ${
            log.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
              : log.type === 'error'
              ? 'bg-rose-950/60 border-rose-500 text-rose-200'
              : 'bg-blue-950/60 border-blue-500 text-blue-200'
          }`}
        >
          {log.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : log.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Loader2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5 animate-spin" />
          )}
          <div className="flex-1 space-y-1">
            <div className="font-bold">{log.text}</div>
            {log.details && (
              <pre className="text-xs font-mono bg-black/40 p-2.5 rounded-xl whitespace-pre-wrap break-all border border-slate-800 text-slate-300">
                {log.details}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Kullanıcının Canlı Kayıtları (Real-Time Firestore List) */}
      {userState && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Giriş Yapan Kullanıcının Firestore Kayıtları ({userRecords.length}):</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              users/{userState.uid}/user_records
            </span>
          </div>

          {userRecords.length === 0 ? (
            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-center text-xs text-slate-500 italic">
              Henüz bu kullanıcı için özel bir kayıt eklenmedi. Yukarıdaki yeşil butona basarak ilk kaydınızı oluşturabilirsiniz.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {userRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start justify-between text-xs hover:border-emerald-500/50 transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{rec.title || 'Başlıksız Kayıt'}</span>
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                        ID: {rec.id}
                      </span>
                    </div>
                    <div className="text-slate-300 text-[11px]">{rec.note}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Yazar: {rec.userEmail} | Kategori: {rec.category || 'Özel'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
