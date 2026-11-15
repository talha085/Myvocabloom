import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  addDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

// Initialize Firebase App using provisioned config
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore with dedicated Database ID
// CRITICAL: Passing firestoreDatabaseId is mandatory for provisioned database
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firebase Analytics only if measurementId is configured
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  isSupported()
    .then((supported) => {
      if (supported && firebaseConfig.measurementId) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics not supported in this environment
    });
}

// Boot connection check
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or database initializing.');
    }
  }
}

testConnection();

// Sync signed-in Firebase user profile into /users/{uid}
export async function syncFirebaseUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}) {
  if (!user?.uid) return;
  const userPath = `users/${user.uid}`;
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Kullanıcı',
        photoURL: user.photoURL || '',
        lastActive: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('permission')) {
      handleFirestoreError(error, OperationType.WRITE, userPath);
    } else {
      console.warn('Firestore profil senkronizasyonu atlandı:', error);
    }
  }
}

// Google Sign-In helper function (uses signInWithPopup for AI Studio iframe compatibility)
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      // Best-effort Firestore profile sync without blocking login flow
      syncFirebaseUserProfile(result.user).catch((err) => {
        console.warn('Profil Firestore kaydı başarısız:', err);
      });
    }
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error('Google Giriş Hatası:', error);
    const code = error?.code || '';
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
    let friendlyError = error?.message || 'Giriş yapılamadı';

    if (code === 'auth/unauthorized-domain') {
      friendlyError = `Bu alan adı (${currentHost}) Firebase Yetkili Alan Adları listesinde tanımlı değil. Firebase Console > Authentication > Settings > Authorized domains bölümüne "${currentHost}" adresini ekleyin.`;
    } else if (code === 'auth/operation-not-allowed') {
      friendlyError =
        'Google ile giriş sağlayıcısı Firebase projesinde etkin değil. Firebase Console > Authentication > Sign-in method bölümünden Google sağlayıcısını etkinleştirin.';
    } else if (code === 'auth/popup-closed-by-user') {
      friendlyError = 'Google giriş penceresi tamamlanmadan kapatıldı.';
    } else if (code === 'auth/popup-blocked') {
      friendlyError =
        'Tarayıcı açılır pencereyi (popup) engelledi. Lütfen tarayıcı ayarlarından açılır pencerelere izin verip tekrar deneyin.';
    } else if (code === 'auth/cancelled-popup-request') {
      friendlyError = 'Giriş penceresi isteği iptal edildi. Lütfen tekrar deneyin.';
    } else if (code === 'auth/network-request-failed') {
      friendlyError = 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.';
    } else if (code === 'auth/internal-error') {
      friendlyError = 'Google kimlik doğrulama penceresi başlatılamadı. Lütfen çerezlere ve açılır pencerelere izin verip tekrar deneyin.';
    }

    return { success: false, error: friendlyError, code };
  }
};

// Test database write helper
export const testKayit = async () => {
  const path = 'test_collection';
  try {
    const docRef = await addDoc(collection(db, path), {
      message: 'Firebase başarıyla bağlandı!',
      timestamp: new Date(),
    });
    console.log('✅ Veri Firestore veritabanına eklendi! Döküman ID:', docRef.id);
    return { success: true, docId: docRef.id };
  } catch (e) {
    if (e instanceof Error && e.message.toLowerCase().includes('permission')) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
    console.error('❌ Firestore test kayıt hatası:', e);
    return { success: false, error: e };
  }
};

// Save data specific to the authenticated user
export const saveUserSpecificData = async (payload: { title?: string; note?: string; [key: string]: any }) => {
  const user = auth.currentUser;
  if (!user) {
    const errMsg = 'Kullanıcı oturumu bulunamadı. Lütfen önce Google ile giriş yapın.';
    console.error('❌', errMsg);
    return { success: false, error: errMsg };
  }

  const userRecordsPath = `users/${user.uid}/user_records`;
  try {
    await syncFirebaseUserProfile(user);

    const userRecordsRef = collection(db, 'users', user.uid, 'user_records');
    const docRef = await addDoc(userRecordsRef, {
      ...payload,
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || 'Kullanıcı',
      createdAt: serverTimestamp(),
    });

    const fullPath = `${userRecordsPath}/${docRef.id}`;
    console.log(`✅ [Kullanıcıya Özel Kayıt] Başarıyla eklendi! Yol: ${fullPath}`);
    return { success: true, docId: docRef.id, path: fullPath, userId: user.uid };
  } catch (e: any) {
    if (e instanceof Error && e.message.toLowerCase().includes('permission')) {
      handleFirestoreError(e, OperationType.WRITE, userRecordsPath);
    }
    console.error('❌ [Kullanıcıya Özel Kayıt Hatası]:', e);
    return { success: false, error: e?.message || String(e) };
  }
};

// Real-time listener for current user's specific records
export const subscribeUserSpecificData = (callback: (records: any[]) => void) => {
  const user = auth.currentUser;
  if (!user) {
    callback([]);
    return () => {};
  }

  const userRecordsPath = `users/${user.uid}/user_records`;
  const userRecordsRef = collection(db, 'users', user.uid, 'user_records');
  const q = query(userRecordsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      callback(records);
    },
    (err) => {
      if (err instanceof Error && err.message.toLowerCase().includes('permission')) {
        handleFirestoreError(err, OperationType.LIST, userRecordsPath);
      }
      console.error('❌ [Firestore Dinleme Hatası]:', err);
    }
  );
};

// Expose on window for easy DevTools console testing
if (typeof window !== 'undefined') {
  (window as any).testKayit = testKayit;
  (window as any).saveUserSpecificData = saveUserSpecificData;
}

export { app, analytics, signInWithPopup, signOut, onAuthStateChanged };
