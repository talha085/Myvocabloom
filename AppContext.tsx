import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AppUser,
  ManagerUser,
  TeacherUser,
  StudentUser,
  VocabWord,
  TransferRecord,
  CEFRLevel,
  QuizResult,
  StudentStatus,
  StudentActivity,
  LevelExamResult,
  UserRole,
  Announcement,
  AnnouncementPriority,
} from '../types';
import {
  INITIAL_MANAGER,
  INITIAL_TEACHERS,
  INITIAL_STUDENTS,
  INITIAL_TRANSFERS,
  VOCABULARY_LIST,
  INITIAL_ACTIVITIES,
  INITIAL_ANNOUNCEMENTS,
} from '../data/initialData';
import { auth, signOut, onAuthStateChanged } from '../firebase';

export type LoginTab = 'manager' | 'teacher' | 'student' | 'register';
export type BgMode = 'vivid' | 'balanced' | 'dark';

interface AppContextType {
  bgMode: BgMode;
  setBgMode: (mode: BgMode) => void;
  currentUser: AppUser | null;
  manager: ManagerUser;
  teachers: TeacherUser[];
  students: StudentUser[];
  transfers: TransferRecord[];
  vocabulary: VocabWord[];
  isLoginModalOpen: boolean;
  loginModalTab: LoginTab;
  prefilledEmail: string;
  openLoginModal: (tab?: LoginTab | 'login', prefillEmail?: string) => void;
  closeLoginModal: () => void;
  isIntroVideoOpen: boolean;
  openIntroVideo: () => void;
  closeIntroVideo: () => void;
  isChangePasswordModalOpen: boolean;
  openChangePasswordModal: () => void;
  closeChangePasswordModal: () => void;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => { success: boolean; message: string };
  login: (email: string, password?: string) => { success: boolean; message: string; user?: AppUser };
  loginWithGoogleUser: (
    googleUser: string | { email: string; displayName?: string | null; uid?: string; photoURL?: string | null },
    options?: { classCode?: string }
  ) => { success: boolean; message: string; user?: AppUser };
  logout: () => void;
  switchUser: (userId: string) => void;
  registerStudent: (data: {
    name: string;
    email: string;
    password?: string;
    classCode: string;
  }) => { success: boolean; message: string; student?: StudentUser };
  addTeacher: (data: {
    name: string;
    email: string;
    classCode: string;
    className: string;
    level: CEFRLevel;
    bio?: string;
  }) => { success: boolean; message: string };
  addStudentDirect: (data: {
    name: string;
    email: string;
    classCode: string;
  }) => { success: boolean; message: string };
  transferStudent: (
    studentId: string,
    toClassCode: string,
    note?: string
  ) => { success: boolean; message: string };
  updateTeacherAssignment: (
    teacherId: string,
    updates: { classCode: string; className: string; level: CEFRLevel }
  ) => { success: boolean; message: string };
  reviewStudent: (
    studentId: string,
    status: 'approved' | 'rejected',
    reason?: string
  ) => { success: boolean; message: string };
  deleteTeacher: (teacherId: string) => { success: boolean; message: string };
  deleteStudent: (studentId: string) => { success: boolean; message: string };
  addVocabWord: (word: Omit<VocabWord, 'id'>) => void;
  markWordLearned: (studentId: string, wordId: string, known: boolean) => void;
  submitQuizResult: (studentId: string, result: QuizResult) => void;
  activities: StudentActivity[];
  logStudentActivity: (activity: Omit<StudentActivity, 'id' | 'timestamp'>) => void;
  submitMatchingGameResult: (
    studentId: string,
    level: CEFRLevel,
    score: number,
    total: number,
    timeSeconds: number
  ) => void;
  submitLevelExamResult: (
    studentId: string,
    result: LevelExamResult
  ) => { passed: boolean; message: string; promotedTo?: CEFRLevel };
  resetPassword: (
    email: string,
    newPassword: string
  ) => { success: boolean; message: string; role?: UserRole };
  findUserByEmail: (
    email: string
  ) => { exists: boolean; user?: { name: string; email: string; role: UserRole } };
  resetToDemoData: () => void;
  getTeacherByClassCode: (code: string) => TeacherUser | undefined;
  getStudentsByClassCode: (code: string) => StudentUser[];
  announcements: Announcement[];
  createAnnouncement: (data: {
    title: string;
    content: string;
    priority?: AnnouncementPriority;
    targetRole: 'teachers' | 'students';
    targetClassCode?: string;
  }) => { success: boolean; message: string; announcement?: Announcement };
  deleteAnnouncement: (id: string) => { success: boolean; message: string };
  acknowledgeAnnouncement: (announcementId: string, userId: string) => void;
  activeView: 'home' | 'dashboard';
  goHome: () => void;
  goToDashboard: () => void;
  isGuideAgentOpen: boolean;
  openGuideAgent: (initialQuery?: string) => void;
  closeGuideAgent: () => void;
  toggleGuideAgent: () => void;
  guideAgentInitialQuery: string | null;
  studentActiveTab: string;
  setStudentActiveTab: (tab: string) => void;
  navigateToTab: (tab: string) => void;
  scrollToStudentTabNonce: number;
  suppressAnnouncementModal: boolean;
}

const STORAGE_KEY = 'my_vocabloom_storage_v1';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load persistent state or fall back to seed data
  const [manager, setManager] = useState<ManagerUser>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_manager`);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.name = 'Dr. Talha ERDALI';
        return parsed;
      }
      return INITIAL_MANAGER;
    } catch {
      return INITIAL_MANAGER;
    }
  });

  const [teachers, setTeachers] = useState<TeacherUser[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_teachers`);
      return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
    } catch {
      return INITIAL_TEACHERS;
    }
  });

  const [students, setStudents] = useState<StudentUser[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_students`);
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [transfers, setTransfers] = useState<TransferRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_transfers`);
      return saved ? JSON.parse(saved) : INITIAL_TRANSFERS;
    } catch {
      return INITIAL_TRANSFERS;
    }
  });

  const VOCAB_DATA_VERSION = 'v5_authentic_sentences_2026';
  const [vocabulary, setVocabulary] = useState<VocabWord[]>(() => {
    try {
      const savedVersion = localStorage.getItem(`${STORAGE_KEY}_vocab_version`);
      const saved = localStorage.getItem(`${STORAGE_KEY}_vocabulary`);
      if (saved && savedVersion === VOCAB_DATA_VERSION) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 3000) {
          return parsed;
        }
      }
      // If version is missing or outdated, refresh standard words with VOCABULARY_LIST
      // while preserving any custom words added by teachers (id not starting with 'w-')
      let customWords: VocabWord[] = [];
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            customWords = parsed.filter((w: VocabWord) => !w.id.startsWith('w-'));
          }
        } catch {
          // ignore error
        }
      }
      const updatedVocab = [...VOCABULARY_LIST, ...customWords];
      localStorage.setItem(`${STORAGE_KEY}_vocabulary`, JSON.stringify(updatedVocab));
      localStorage.setItem(`${STORAGE_KEY}_vocab_version`, VOCAB_DATA_VERSION);
      return updatedVocab;
    } catch {
      return VOCABULARY_LIST;
    }
  });

  const [activities, setActivities] = useState<StudentActivity[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_activities`);
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
    } catch {
      return INITIAL_ACTIVITIES;
    }
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_announcements`);
      return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  });

  // Current logged in user (start as null or restored from session)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const savedId = localStorage.getItem(`${STORAGE_KEY}_current_user_id`);
      if (savedId) {
        if (savedId === manager.id) return manager;
        const foundT = teachers.find((t) => t.id === savedId);
        if (foundT) return foundT;
        const foundS = students.find((s) => s.id === savedId);
        if (foundS) return foundS;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [bgMode, setBgModeState] = useState<BgMode>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_bg_mode`);
      if (saved === 'vivid' || saved === 'balanced' || saved === 'dark') return saved;
      return 'balanced';
    } catch {
      return 'balanced';
    }
  });

  const setBgMode = (mode: BgMode) => {
    setBgModeState(mode);
    try {
      localStorage.setItem(`${STORAGE_KEY}_bg_mode`, mode);
    } catch {}
  };

  const [activeView, setActiveView] = useState<'home' | 'dashboard'>(() => {
    try {
      const savedId = localStorage.getItem(`${STORAGE_KEY}_current_user_id`);
      return savedId ? 'dashboard' : 'home';
    } catch {
      return 'home';
    }
  });

  const goHome = () => {
    setActiveView('home');
    setIsLoginModalOpen(false);
    setIsChangePasswordModalOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToDashboard = () => {
    setActiveView('dashboard');
    setIsLoginModalOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalTab, setLoginModalTab] = useState<LoginTab>('manager');
  const [prefilledEmail, setPrefilledEmail] = useState<string>('');
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const openChangePasswordModal = () => setIsChangePasswordModalOpen(true);
  const closeChangePasswordModal = () => setIsChangePasswordModalOpen(false);

  // 20-second animated intro video on initial site visit
  const [isIntroVideoOpen, setIsIntroVideoOpen] = useState<boolean>(() => {
    try {
      const seen = sessionStorage.getItem('vocabloom_intro_seen');
      return seen !== 'true';
    } catch {
      return true;
    }
  });

  const openIntroVideo = () => setIsIntroVideoOpen(true);
  const closeIntroVideo = () => {
    setIsIntroVideoOpen(false);
    try {
      sessionStorage.setItem('vocabloom_intro_seen', 'true');
    } catch (e) {
      console.error('Session storage error', e);
    }
  };

  // VocaBloom AI Guide Agent state
  const [isGuideAgentOpen, setIsGuideAgentOpen] = useState(false);
  const [guideAgentInitialQuery, setGuideAgentInitialQuery] = useState<string | null>(null);
  const [studentActiveTab, setStudentActiveTab] = useState<string>('garden');
  const [scrollToStudentTabNonce, setScrollToStudentTabNonce] = useState<number>(0);
  const [suppressAnnouncementModal, setSuppressAnnouncementModal] = useState<boolean>(false);

  const openGuideAgent = (initialQuery?: string) => {
    if (initialQuery) {
      setGuideAgentInitialQuery(initialQuery);
    }
    setIsGuideAgentOpen(true);
  };
  const closeGuideAgent = () => {
    setIsGuideAgentOpen(false);
    setGuideAgentInitialQuery(null);
  };
  const toggleGuideAgent = () => {
    setIsGuideAgentOpen((prev) => !prev);
  };

  const navigateToTab = (rawTab: string) => {
    const normalized = rawTab
      .trim()
      .toLowerCase()
      .replace(/^navigate_/, '')
      .replace(/^ai_story$/, 'ai-story')
      .replace(/^level[-_]?exam$/, 'exam');

    const studentTabs = [
      'flashcards',
      'matching',
      'quiz',
      'exam',
      'garden',
      'ai-story',
      'explorer',
      'learned',
      'class',
      'announcements',
    ];

    setIsLoginModalOpen(false);
    setIsChangePasswordModalOpen(false);
    setIsIntroVideoOpen(false);

    if (studentTabs.includes(normalized)) {
      if (!currentUser || currentUser.role !== 'student' || (currentUser as any).status !== 'approved') {
        const studentUser = students.find((s) => s.status === 'approved') || students[0];
        if (studentUser) {
          setCurrentUser(studentUser);
          try {
            localStorage.setItem(`${STORAGE_KEY}_current_user_id`, studentUser.id);
          } catch {}
        }
      }
      setSuppressAnnouncementModal(true);
      setStudentActiveTab(normalized);
      setActiveView('dashboard');
      setScrollToStudentTabNonce((n) => n + 1);
    } else {
      goToDashboard();
    }
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_manager`, JSON.stringify(manager));
      localStorage.setItem(`${STORAGE_KEY}_teachers`, JSON.stringify(teachers));
      localStorage.setItem(`${STORAGE_KEY}_students`, JSON.stringify(students));
      localStorage.setItem(`${STORAGE_KEY}_transfers`, JSON.stringify(transfers));
      localStorage.setItem(`${STORAGE_KEY}_vocabulary`, JSON.stringify(vocabulary));
      localStorage.setItem(`${STORAGE_KEY}_activities`, JSON.stringify(activities));
      localStorage.setItem(`${STORAGE_KEY}_announcements`, JSON.stringify(announcements));
      if (currentUser) {
        localStorage.setItem(`${STORAGE_KEY}_current_user_id`, currentUser.id);
      } else {
        localStorage.removeItem(`${STORAGE_KEY}_current_user_id`);
      }
    } catch (e) {
      console.error('Storage sync error', e);
    }
  }, [manager, teachers, students, transfers, vocabulary, activities, announcements, currentUser]);

  const openLoginModal = (tab: LoginTab | 'login' = 'manager', prefillEmail?: string) => {
    if (tab === 'login') {
      setLoginModalTab('manager');
    } else {
      setLoginModalTab(tab);
    }
    if (prefillEmail) {
      setPrefilledEmail(prefillEmail);
    } else {
      setPrefilledEmail('');
    }
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => setIsLoginModalOpen(false);

  // Helper lookups
  const getTeacherByClassCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    return teachers.find((t) => t.classCode.toUpperCase() === cleanCode);
  };

  const getStudentsByClassCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    return students.filter((s) => s.classCode.toUpperCase() === cleanCode);
  };

  // Helper to find any user by email for password reset
  const findUserByEmail = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (manager.email.toLowerCase() === cleanEmail) {
      return { exists: true, user: { name: manager.name, email: manager.email, role: 'manager' as UserRole } };
    }
    const teacher = teachers.find((t) => t.email.toLowerCase() === cleanEmail);
    if (teacher) {
      return { exists: true, user: { name: teacher.name, email: teacher.email, role: 'teacher' as UserRole } };
    }
    const student = students.find((s) => s.email.toLowerCase() === cleanEmail);
    if (student) {
      return { exists: true, user: { name: student.name, email: student.email, role: 'student' as UserRole } };
    }
    return { exists: false };
  };

  // Reset password handler for Manager, Teacher, or Student
  const resetPassword = (
    email: string,
    newPassword: string
  ): { success: boolean; message: string; role?: UserRole } => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = newPassword.trim();

    if (cleanPassword.length < 6) {
      return { success: false, message: 'Yeni şifreniz en az 6 karakterden oluşmalıdır.' };
    }

    // 1. Manager reset
    if (manager.email.toLowerCase() === cleanEmail) {
      const updatedManager: ManagerUser = { ...manager, password: cleanPassword };
      setManager(updatedManager);
      if (currentUser?.id === manager.id) {
        setCurrentUser(updatedManager);
      }
      return {
        success: true,
        message: 'Yönetici şifreniz başarıyla yenilendi. Yeni şifrenizle giriş yapabilirsiniz.',
        role: 'manager',
      };
    }

    // 2. Teacher reset
    const teacherIndex = teachers.findIndex((t) => t.email.toLowerCase() === cleanEmail);
    if (teacherIndex !== -1) {
      const updatedTeachers = [...teachers];
      updatedTeachers[teacherIndex] = { ...updatedTeachers[teacherIndex], password: cleanPassword };
      setTeachers(updatedTeachers);
      if (currentUser?.id === updatedTeachers[teacherIndex].id) {
        setCurrentUser(updatedTeachers[teacherIndex]);
      }
      return {
        success: true,
        message: `${updatedTeachers[teacherIndex].name} öğretmen hesabınızın şifresi başarıyla yenilendi.`,
        role: 'teacher',
      };
    }

    // 3. Student reset
    const studentIndex = students.findIndex((s) => s.email.toLowerCase() === cleanEmail);
    if (studentIndex !== -1) {
      const updatedStudents = [...students];
      updatedStudents[studentIndex] = { ...updatedStudents[studentIndex], password: cleanPassword };
      setStudents(updatedStudents);
      if (currentUser?.id === updatedStudents[studentIndex].id) {
        setCurrentUser(updatedStudents[studentIndex]);
      }
      return {
        success: true,
        message: `${updatedStudents[studentIndex].name} öğrenci hesabınızın şifresi başarıyla yenilendi.`,
        role: 'student',
      };
    }

    return {
      success: false,
      message: 'Bu e-posta adresi ile kayıtlı bir hesap bulunamadı.',
    };
  };

  // Change password for the currently logged-in account
  const changePassword = (
    currentPassword: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    if (!currentUser) {
      return { success: false, message: 'İşlem için önce bir kullanıcı girişi yapmalısınız.' };
    }

    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();

    if (!cleanCurrent) {
      return { success: false, message: 'Lütfen mevcut şifrenizi girin.' };
    }

    if (cleanNew.length < 6) {
      return { success: false, message: 'Yeni şifreniz en az 6 karakter olmalıdır.' };
    }

    if (cleanCurrent === cleanNew) {
      return { success: false, message: 'Yeni şifreniz mevcut şifrenizle aynı olamaz.' };
    }

    // 1. Manager password change
    if (currentUser.role === 'manager') {
      const activePassword = manager.password || '123456';
      if (cleanCurrent !== activePassword) {
        return { success: false, message: 'Girdiğiniz mevcut şifre hatalı. Lütfen kontrol edip tekrar deneyin.' };
      }
      const updatedManager: ManagerUser = { ...manager, password: cleanNew };
      setManager(updatedManager);
      setCurrentUser(updatedManager);
      return { success: true, message: 'Yönetici şifreniz başarıyla değiştirildi!' };
    }

    // 2. Teacher password change
    if (currentUser.role === 'teacher') {
      const teacherIndex = teachers.findIndex((t) => t.id === currentUser.id);
      if (teacherIndex === -1) {
        return { success: false, message: 'Öğretmen hesabı bulunamadı.' };
      }
      const activePassword = teachers[teacherIndex].password || '123456';
      if (cleanCurrent !== activePassword) {
        return { success: false, message: 'Girdiğiniz mevcut şifre hatalı. Lütfen kontrol edip tekrar deneyin.' };
      }
      const updatedTeachers = [...teachers];
      const updatedTeacher = { ...updatedTeachers[teacherIndex], password: cleanNew };
      updatedTeachers[teacherIndex] = updatedTeacher;
      setTeachers(updatedTeachers);
      setCurrentUser(updatedTeacher);
      return { success: true, message: `${updatedTeacher.name} öğretmen hesabı şifreniz başarıyla değiştirildi!` };
    }

    // 3. Student password change
    if (currentUser.role === 'student') {
      const studentIndex = students.findIndex((s) => s.id === currentUser.id);
      if (studentIndex === -1) {
        return { success: false, message: 'Öğrenci hesabı bulunamadı.' };
      }
      const activePassword = students[studentIndex].password || '123456';
      if (cleanCurrent !== activePassword) {
        return { success: false, message: 'Girdiğiniz mevcut şifre hatalı. Lütfen kontrol edip tekrar deneyin.' };
      }
      const updatedStudents = [...students];
      const updatedStudent = { ...updatedStudents[studentIndex], password: cleanNew };
      updatedStudents[studentIndex] = updatedStudent;
      setStudents(updatedStudents);
      setCurrentUser(updatedStudent);
      return { success: true, message: 'Öğrenci hesabınızın şifresi başarıyla değiştirildi!' };
    }

    return { success: false, message: 'Kullanıcı rolü doğrulanamadı.' };
  };

  // Unified login for Manager, Teacher, or Student with strict email & password verification
  const login = (email: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail) {
      return {
        success: false,
        message: 'Lütfen e-posta adresinizi girin.',
      };
    }

    if (!cleanPassword) {
      return {
        success: false,
        message: 'Lütfen şifrenizi girin.',
      };
    }

    // 1. Check Manager
    if (manager.email.toLowerCase() === cleanEmail) {
      const expectedPassword = manager.password || '123456';
      if (cleanPassword !== expectedPassword) {
        return {
          success: false,
          message: 'Girdiğiniz şifre hatalı. Lütfen kontrol edip tekrar deneyin veya "Şifremi Unuttum" kısmından şifrenizi sıfırlayın.',
        };
      }
      setCurrentUser(manager);
      setActiveView('dashboard');
      closeLoginModal();
      return { success: true, message: `Hoş geldiniz, ${manager.name} (Yönetici)`, user: manager };
    }

    // 2. Check Teachers
    const matchedTeacher = teachers.find((t) => t.email.toLowerCase() === cleanEmail);
    if (matchedTeacher) {
      const expectedPassword = matchedTeacher.password || '123456';
      if (cleanPassword !== expectedPassword) {
        return {
          success: false,
          message: 'Girdiğiniz şifre hatalı. Lütfen kontrol edip tekrar deneyin veya "Şifremi Unuttum" kısmından şifrenizi sıfırlayın.',
        };
      }
      setCurrentUser(matchedTeacher);
      setActiveView('dashboard');
      closeLoginModal();
      return { success: true, message: `Hoş geldiniz, ${matchedTeacher.name} (Öğretmen)`, user: matchedTeacher };
    }

    // 3. Check Students
    const matchedStudent = students.find((s) => s.email.toLowerCase() === cleanEmail);
    if (matchedStudent) {
      const expectedPassword = matchedStudent.password || '123456';
      if (cleanPassword !== expectedPassword) {
        return {
          success: false,
          message: 'Girdiğiniz şifre hatalı. Lütfen kontrol edip tekrar deneyin veya "Şifremi Unuttum" kısmından şifrenizi sıfırlayın.',
        };
      }
      setSuppressAnnouncementModal(false);
      setCurrentUser(matchedStudent);
      setActiveView('dashboard');
      closeLoginModal();
      if (matchedStudent.status === 'pending') {
        return {
          success: true,
          message: `Giriş yapıldı. Kaydınız öğretmen onayı bekliyor.`,
          user: matchedStudent,
        };
      }
      return { success: true, message: `Hoş geldin, ${matchedStudent.name}!`, user: matchedStudent };
    }

    return {
      success: false,
      message: 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı. Lütfen kontrol edip tekrar deneyin.',
    };
  };

  // Passwordless login for already-verified Firebase Google Auth users
  const loginWithGoogleUser = (
    googleUser: string | { email: string; displayName?: string | null; uid?: string; photoURL?: string | null },
    options?: { classCode?: string }
  ) => {
    const email = typeof googleUser === 'string' ? googleUser : googleUser.email;
    const displayName = typeof googleUser === 'string' ? undefined : googleUser.displayName;
    const photoURL = typeof googleUser === 'string' ? undefined : googleUser.photoURL;
    const uid = typeof googleUser === 'string' ? undefined : googleUser.uid;

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Google hesap e-postası alınamadı.' };
    }

    if (manager.email.toLowerCase() === cleanEmail) {
      const updatedManager = photoURL && !manager.avatar ? { ...manager, avatar: photoURL } : manager;
      setCurrentUser(updatedManager);
      setActiveView('dashboard');
      closeLoginModal();
      return { success: true, message: `Hoş geldiniz, ${updatedManager.name} (Yönetici)`, user: updatedManager };
    }

    const matchedTeacher = teachers.find((t) => t.email.toLowerCase() === cleanEmail);
    if (matchedTeacher) {
      setCurrentUser(matchedTeacher);
      setActiveView('dashboard');
      closeLoginModal();
      return { success: true, message: `Hoş geldiniz, ${matchedTeacher.name} (Öğretmen)`, user: matchedTeacher };
    }

    const matchedStudent = students.find((s) => s.email.toLowerCase() === cleanEmail);
    if (matchedStudent) {
      setSuppressAnnouncementModal(false);
      setCurrentUser(matchedStudent);
      setActiveView('dashboard');
      closeLoginModal();
      return {
        success: true,
        message:
          matchedStudent.status === 'pending'
            ? 'Giriş yapıldı. Kaydınız öğretmen onayı bekliyor.'
            : `Hoş geldiniz, ${matchedStudent.name}!`,
        user: matchedStudent,
      };
    }

    // New Google user: resolve target class (either user-provided classCode or default starter class)
    const requestedCode = options?.classCode?.trim().toUpperCase();
    let targetTeacher = teachers[0];
    let initialStatus: StudentStatus = 'approved';

    if (requestedCode) {
      const foundTeacher = teachers.find((t) => t.classCode.toUpperCase() === requestedCode);
      if (!foundTeacher) {
        return {
          success: false,
          message: `"${requestedCode}" koduna sahip aktif bir sınıf bulunamadı. Lütfen sınıf kodunu kontrol edin veya boş bırakarak doğrudan giriş yapın.`,
        };
      }
      targetTeacher = foundTeacher;
      initialStatus = 'pending';
    }

    const fallbackName = cleanEmail.split('@')[0].replace(/[._-]+/g, ' ');
    const resolvedName = (displayName || '').trim() || fallbackName;
    const newStudent: StudentUser = {
      id: uid ? `stu-google-${uid.slice(0, 12)}` : `stu-google-${Date.now()}`,
      name: resolvedName,
      email: cleanEmail,
      role: 'student',
      classCode: targetTeacher?.classCode || 'ENG-A1-SELIN',
      teacherId: targetTeacher?.id || 'tch-1',
      status: initialStatus,
      enrolledDate: new Date().toISOString().split('T')[0],
      avatar:
        photoURL ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(resolvedName)}`,
      createdAt: new Date().toISOString().split('T')[0],
      progress: {
        wordsLearned: [],
        wordsStruggled: [],
        testsTaken: 0,
        totalCorrect: 0,
        bloomScore: 50,
        streakDays: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
      },
    };

    setStudents((prev) => {
      if (prev.some((s) => s.email.toLowerCase() === cleanEmail)) return prev;
      return [newStudent, ...prev];
    });
    setSuppressAnnouncementModal(false);
    setCurrentUser(newStudent);
    setActiveView('dashboard');
    closeLoginModal();

    return {
      success: true,
      message:
        initialStatus === 'pending'
          ? `Google hesabınızla başvuru alındı (${newStudent.classCode}). Öğretmen onayı bekleniyor.`
          : `Google ile hoş geldiniz, ${newStudent.name}! (${newStudent.classCode})`,
      user: newStudent,
    };
  };

  // Keep Firebase Google Auth session synced on page reload when no local session is active
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser?.email && !currentUser) {
        loginWithGoogleUser({
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          uid: firebaseUser.uid,
          photoURL: firebaseUser.photoURL,
        });
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    setSuppressAnnouncementModal(false);
    setCurrentUser(null);
    setActiveView('home');
    signOut(auth).catch(() => {});
  };

  const switchUser = (userId: string) => {
    if (manager.id === userId) {
      openLoginModal('manager', manager.email);
      return;
    }
    const teacher = teachers.find((t) => t.id === userId);
    if (teacher) {
      openLoginModal('teacher', teacher.email);
      return;
    }
    const student = students.find((s) => s.id === userId);
    if (student) {
      openLoginModal('student', student.email);
      return;
    }
  };

  // Student registration with Teacher Class Code -> starts as 'pending'
  const registerStudent = (data: {
    name: string;
    email: string;
    password?: string;
    classCode: string;
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanCode = data.classCode.trim().toUpperCase();

    // Check if email already registered
    const exists =
      manager.email.toLowerCase() === cleanEmail ||
      teachers.some((t) => t.email.toLowerCase() === cleanEmail) ||
      students.some((s) => s.email.toLowerCase() === cleanEmail);

    if (exists) {
      return { success: false, message: 'Bu e-posta adresi zaten kullanımda.' };
    }

    // Check class code validity
    const teacher = getTeacherByClassCode(cleanCode);
    if (!teacher) {
      return {
        success: false,
        message: `Geçersiz sınıf kodu: "${cleanCode}". Lütfen öğretmeninizin size verdiği geçerli kodu girin (Örn: ENG-A1-SELIN).`,
      };
    }

    const newStudent: StudentUser = {
      id: `stu-${Date.now()}`,
      name: data.name.trim(),
      email: cleanEmail,
      role: 'student',
      password: data.password?.trim() || '123456',
      classCode: teacher.classCode,
      teacherId: teacher.id,
      status: 'pending', // Starts in "Onay Bekliyor" status per requirements!
      enrolledDate: new Date().toISOString().slice(0, 10),
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      createdAt: new Date().toISOString(),
      progress: {
        wordsLearned: [],
        wordsStruggled: [],
        testsTaken: 0,
        totalCorrect: 0,
        bloomScore: 50,
        streakDays: 1,
        lastActiveDate: new Date().toISOString().slice(0, 10),
      },
    };

    setStudents((prev) => [newStudent, ...prev]);
    setCurrentUser(newStudent);
    setActiveView('dashboard');
    closeLoginModal();

    return {
      success: true,
      message: `Tebrikler! Kaydınız alındı. Sınıf öğretmeniniz (${teacher.name}) onayladıktan sonra tam erişim açılacaktır.`,
      student: newStudent,
    };
  };

  // Manager action: Add new Teacher (+ Yeni Öğretmen Ekle modal)
  const addTeacher = (data: {
    name: string;
    email: string;
    classCode: string;
    className: string;
    level: CEFRLevel;
    bio?: string;
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanCode = data.classCode.trim().toUpperCase();

    const emailExists =
      manager.email.toLowerCase() === cleanEmail ||
      teachers.some((t) => t.email.toLowerCase() === cleanEmail) ||
      students.some((s) => s.email.toLowerCase() === cleanEmail);

    if (emailExists) {
      return { success: false, message: 'Bu e-posta adresi ile zaten bir kullanıcı mevcut.' };
    }

    const codeExists = teachers.some((t) => t.classCode.toUpperCase() === cleanCode);
    if (codeExists) {
      return { success: false, message: `"${cleanCode}" sınıf kodu başka bir öğretmene atanmış.` };
    }

    const newTeacher: TeacherUser = {
      id: `tch-${Date.now()}`,
      name: data.name.trim(),
      email: cleanEmail,
      role: 'teacher',
      classCode: cleanCode,
      className: data.className.trim(),
      level: data.level,
      bio: data.bio || 'My VocaBloom kadrosunda İngilizce öğretmeni.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setTeachers((prev) => [...prev, newTeacher]);
    return { success: true, message: `${newTeacher.name} başarıyla öğretmen kadrosuna eklendi!` };
  };

  // Manager or Teacher direct student addition (Bypasses pending approval)
  const addStudentDirect = (data: {
    name: string;
    email: string;
    classCode: string;
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanCode = data.classCode.trim().toUpperCase();

    const teacher = getTeacherByClassCode(cleanCode);
    if (!teacher) {
      return { success: false, message: `"${cleanCode}" koduna ait öğretmen/sınıf bulunamadı.` };
    }

    const emailExists =
      manager.email.toLowerCase() === cleanEmail ||
      teachers.some((t) => t.email.toLowerCase() === cleanEmail) ||
      students.some((s) => s.email.toLowerCase() === cleanEmail);

    if (emailExists) {
      return { success: false, message: 'Bu e-posta ile kayıtlı öğrenci zaten var.' };
    }

    const newStudent: StudentUser = {
      id: `stu-${Date.now()}`,
      name: data.name.trim(),
      email: cleanEmail,
      role: 'student',
      classCode: teacher.classCode,
      teacherId: teacher.id,
      status: 'approved', // Directly approved!
      enrolledDate: new Date().toISOString().slice(0, 10),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      progress: {
        wordsLearned: [],
        wordsStruggled: [],
        testsTaken: 0,
        totalCorrect: 0,
        bloomScore: 100,
        streakDays: 1,
        lastActiveDate: new Date().toISOString().slice(0, 10),
      },
    };

    setStudents((prev) => [newStudent, ...prev]);
    return {
      success: true,
      message: `${newStudent.name} doğrudan onaylı olarak ${teacher.className} (${teacher.classCode}) sınıfına eklendi.`,
    };
  };

  // Manager action: Transfer student to another class/teacher
  const transferStudent = (studentId: string, toClassCode: string, note?: string) => {
    const cleanCode = toClassCode.trim().toUpperCase();
    const targetTeacher = getTeacherByClassCode(cleanCode);

    if (!targetTeacher) {
      return { success: false, message: 'Hedef sınıf/öğretmen kodu bulunamadı.' };
    }

    const targetStudent = students.find((s) => s.id === studentId);
    if (!targetStudent) {
      return { success: false, message: 'Öğrenci bulunamadı.' };
    }

    if (targetStudent.classCode === cleanCode) {
      return { success: false, message: 'Öğrenci zaten bu sınıfta kayıtlı.' };
    }

    const fromCode = targetStudent.classCode;

    // Record transfer audit log
    const transferLog: TransferRecord = {
      id: `tr-${Date.now()}`,
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      fromClassCode: fromCode,
      toClassCode: cleanCode,
      transferredBy: currentUser?.name || 'Yönetici',
      date: new Date().toISOString().slice(0, 10),
      note: note || 'Yönetici tarafından sınıf nakli yapıldı.',
    };

    setTransfers((prev) => [transferLog, ...prev]);

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            classCode: cleanCode,
            teacherId: targetTeacher.id,
            status: 'approved', // If pending, automatically approved on manager reassignment
          };
        }
        return s;
      })
    );

    // Update active user if student itself is current user
    if (currentUser && currentUser.id === studentId) {
      setCurrentUser((prev) =>
        prev
          ? ({
              ...prev,
              classCode: cleanCode,
              teacherId: targetTeacher.id,
              status: 'approved',
            } as StudentUser)
          : null
      );
    }

    return {
      success: true,
      message: `${targetStudent.name} başarıyla ${targetTeacher.name} öğretmeninin ${cleanCode} sınıfına nakledildi.`,
    };
  };

  // Manager action: Update teacher class assignment and class code
  const updateTeacherAssignment = (
    teacherId: string,
    updates: { classCode: string; className: string; level: CEFRLevel }
  ) => {
    const oldTeacher = teachers.find((t) => t.id === teacherId);
    if (!oldTeacher) {
      return { success: false, message: 'Öğretmen bulunamadı.' };
    }

    const cleanCode = updates.classCode.trim().toUpperCase();
    const oldCode = oldTeacher.classCode;

    // Check code duplication with other teachers
    const codeConflict = teachers.some((t) => t.id !== teacherId && t.classCode.toUpperCase() === cleanCode);
    if (codeConflict) {
      return { success: false, message: `"${cleanCode}" kodu zaten başka bir öğretmende kayıtlı.` };
    }

    // Update teacher
    setTeachers((prev) =>
      prev.map((t) => (t.id === teacherId ? { ...t, classCode: cleanCode, className: updates.className, level: updates.level } : t))
    );

    // Also update existing students registered to old class code to follow the teacher
    setStudents((prev) =>
      prev.map((s) => (s.teacherId === teacherId ? { ...s, classCode: cleanCode } : s))
    );

    if (currentUser?.id === teacherId) {
      setCurrentUser((prev) =>
        prev ? ({ ...prev, classCode: cleanCode, className: updates.className, level: updates.level } as TeacherUser) : null
      );
    }

    return {
      success: true,
      message: `${oldTeacher.name} için sınıf ataması ${cleanCode} (${updates.className}) olarak güncellendi.`,
    };
  };

  // Teacher action: Approve or reject student
  const reviewStudent = (
    studentId: string,
    status: 'approved' | 'rejected',
    reason?: string
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      return { success: false, message: 'Öğrenci bulunamadı.' };
    }

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            status,
            rejectionReason: reason,
          };
        }
        return s;
      })
    );

    // If current logged in student is reviewed, sync state
    if (currentUser && currentUser.id === studentId) {
      setCurrentUser((prev) => (prev ? ({ ...prev, status, rejectionReason: reason } as StudentUser) : null));
    }

    const actionText = status === 'approved' ? 'onaylandı' : 'reddedildi';
    return {
      success: true,
      message: `${student.name} isimli öğrencinin kaydı ${actionText}.`,
    };
  };

  // Manager action: Delete teacher
  const deleteTeacher = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) {
      return { success: false, message: 'Silinecek öğretmen bulunamadı.' };
    }

    // Remove teacher from list
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId));

    // Handle students who were in this teacher's class
    setStudents((prev) =>
      prev.map((s) => {
        if (s.teacherId === teacherId || s.classCode === teacher.classCode) {
          return {
            ...s,
            teacherId: '',
            classCode: 'ATANMAMIŞ',
            status: 'pending' as const,
          };
        }
        return s;
      })
    );

    // If current logged-in user was this teacher, logout
    if (currentUser?.id === teacherId) {
      setCurrentUser(null);
    }

    return {
      success: true,
      message: `${teacher.name} (${teacher.className}) başarıyla öğretmen kadrosundan silindi.`,
    };
  };

  // Manager or Teacher action: Delete student
  const deleteStudent = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      return { success: false, message: 'Silinecek öğrenci bulunamadı.' };
    }

    setStudents((prev) => prev.filter((s) => s.id !== studentId));

    // If current logged-in user was this student, logout
    if (currentUser?.id === studentId) {
      setCurrentUser(null);
    }

    return {
      success: true,
      message: `${student.name} başarıyla sistemden silindi.`,
    };
  };

  // Teacher/Admin action: Add vocabulary word
  const addVocabWord = (wordData: Omit<VocabWord, 'id'>) => {
    const newWord: VocabWord = {
      ...wordData,
      id: `w-custom-${Date.now()}`,
    };
    setVocabulary((prev) => [newWord, ...prev]);
  };

  // Student action: Flashcard / practice marking
  const markWordLearned = (studentId: string, wordId: string, known: boolean) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;

        const learnedSet = new Set(s.progress.wordsLearned);
        const struggledSet = new Set(s.progress.wordsStruggled);

        if (known) {
          learnedSet.add(wordId);
          struggledSet.delete(wordId);
        } else {
          learnedSet.delete(wordId);
          struggledSet.add(wordId);
        }

        const newBloom = Math.min(2500, Math.max(0, s.progress.bloomScore + (known ? 20 : -5)));

        const updatedProgress = {
          ...s.progress,
          wordsLearned: Array.from(learnedSet),
          wordsStruggled: Array.from(struggledSet),
          bloomScore: newBloom,
          lastActiveDate: new Date().toISOString().slice(0, 10),
        };

        return {
          ...s,
          progress: updatedProgress,
        };
      })
    );

    if (currentUser?.id === studentId) {
      setCurrentUser((prev) => {
        if (!prev || prev.role !== 'student') return prev;
        const currentStudent = prev as StudentUser;
        const learnedSet = new Set(currentStudent.progress.wordsLearned);
        const struggledSet = new Set(currentStudent.progress.wordsStruggled);
        if (known) {
          learnedSet.add(wordId);
          struggledSet.delete(wordId);
        } else {
          learnedSet.delete(wordId);
          struggledSet.add(wordId);
        }
        return {
          ...currentStudent,
          progress: {
            ...currentStudent.progress,
            wordsLearned: Array.from(learnedSet),
            wordsStruggled: Array.from(struggledSet),
            bloomScore: Math.min(2500, Math.max(0, currentStudent.progress.bloomScore + (known ? 20 : -5))),
            lastActiveDate: new Date().toISOString().slice(0, 10),
          },
        };
      });
    }
  };

  // Student action: Finish quiz
  const submitQuizResult = (studentId: string, result: QuizResult) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const updated = {
          ...s,
          progress: {
            ...s.progress,
            testsTaken: s.progress.testsTaken + 1,
            totalCorrect: s.progress.totalCorrect + result.score,
            bloomScore: s.progress.bloomScore + result.xpEarned,
            lastActiveDate: new Date().toISOString().slice(0, 10),
          },
        };
        return updated;
      })
    );

    if (currentUser?.id === studentId) {
      setCurrentUser((prev) => {
        if (!prev || prev.role !== 'student') return prev;
        const s = prev as StudentUser;
        return {
          ...s,
          progress: {
            ...s.progress,
            testsTaken: s.progress.testsTaken + 1,
            totalCorrect: s.progress.totalCorrect + result.score,
            bloomScore: s.progress.bloomScore + result.xpEarned,
            lastActiveDate: new Date().toISOString().slice(0, 10),
          },
        };
      });
    }

    const targetStudent = students.find((s) => s.id === studentId);
    if (targetStudent) {
      logStudentActivity({
        studentId: targetStudent.id,
        studentName: targetStudent.name,
        classCode: targetStudent.classCode,
        type: 'quiz_completed',
        level: result.level,
        title: `${result.level} Hızlı Kelime Quizi`,
        details: `${result.total} sorudan ${result.score} doğru cevaplandı. (+${result.xpEarned} XP)`,
        score: result.score,
        total: result.total,
        passed: result.score >= Math.ceil(result.total * 0.6),
      });
    }
  };

  // Activity logging handler
  const logStudentActivity = (data: Omit<StudentActivity, 'id' | 'timestamp'>) => {
    const newAct: StudentActivity = {
      ...data,
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  // Student action: Submit Matching Game Result
  const submitMatchingGameResult = (
    studentId: string,
    level: CEFRLevel,
    score: number,
    total: number,
    timeSeconds: number
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const xpEarned = score * 8 + 30;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const currentPlayed = s.progress.matchingGamesPlayed || 0;
        const currentBest = s.progress.matchingBestScore || 0;
        return {
          ...s,
          progress: {
            ...s.progress,
            bloomScore: s.progress.bloomScore + xpEarned,
            matchingGamesPlayed: currentPlayed + 1,
            matchingBestScore: Math.max(currentBest, score),
            lastActiveDate: new Date().toISOString().slice(0, 10),
          },
        };
      })
    );

    if (currentUser?.id === studentId) {
      setCurrentUser((prev) => {
        if (!prev || prev.role !== 'student') return prev;
        const s = prev as StudentUser;
        const currentPlayed = s.progress.matchingGamesPlayed || 0;
        const currentBest = s.progress.matchingBestScore || 0;
        return {
          ...s,
          progress: {
            ...s.progress,
            bloomScore: s.progress.bloomScore + xpEarned,
            matchingGamesPlayed: currentPlayed + 1,
            matchingBestScore: Math.max(currentBest, score),
            lastActiveDate: new Date().toISOString().slice(0, 10),
          },
        };
      });
    }

    logStudentActivity({
      studentId: student.id,
      studentName: student.name,
      classCode: student.classCode,
      type: 'matching_game',
      level,
      title: `${level} Kelime Eşleştirme Oyunu`,
      details: `${score}/${total} kelime çifti ${timeSeconds} saniyede eşleştirildi. (+${xpEarned} XP)`,
      score,
      total,
      passed: score === total,
    });
  };

  // Student action: Submit Level Gateway Exam Result
  const submitLevelExamResult = (
    studentId: string,
    result: LevelExamResult
  ): { passed: boolean; message: string; promotedTo?: CEFRLevel } => {
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      return { passed: false, message: 'Öğrenci bulunamadı.' };
    }

    const { examLevel, score, total, passed, promotedTo } = result;
    const xpEarned = passed ? 250 : 50;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const passedList = s.progress.passedLevels || [];
        const updatedPassedList =
          passed && !passedList.includes(examLevel) ? [...passedList, examLevel] : passedList;

        const updatedLevel = passed && promotedTo ? promotedTo : s.currentLevel || s.progress.currentLevel;

        return {
          ...s,
          currentLevel: updatedLevel,
          progress: {
            ...s.progress,
            bloomScore: s.progress.bloomScore + xpEarned,
            currentLevel: updatedLevel,
            passedLevels: updatedPassedList,
            lastActiveDate: new Date().toISOString().slice(0, 10),
          },
        };
      })
    );

    if (currentUser?.id === studentId) {
      setCurrentUser((prev) => {
        if (!prev || prev.role !== 'student') return prev;
        const s = prev as StudentUser;
        const passedList = s.progress.passedLevels || [];
        const updatedPassedList =
          passed && !passedList.includes(examLevel) ? [...passedList, examLevel] : passedList;
        const updatedLevel = passed && promotedTo ? promotedTo : s.currentLevel || s.progress.currentLevel;

        return {
          ...s,
          currentLevel: updatedLevel,
          progress: {
            ...s.progress,
            bloomScore: s.progress.bloomScore + xpEarned,
            currentLevel: updatedLevel,
            passedLevels: updatedPassedList,
            lastActiveDate: new Date().toISOString().slice(0, 10),
          },
        };
      });
    }

    // 1. Log exam completion
    logStudentActivity({
      studentId: student.id,
      studentName: student.name,
      classCode: student.classCode,
      type: 'level_exam',
      level: examLevel,
      title: `${examLevel} Seviye Atlama Sınavı (Boşluk Doldurma)`,
      details: `${total} sorudan ${score} doğru cevaplandı (%${Math.round((score / total) * 100)}). Sonuç: ${passed ? 'BAŞARILI' : 'YETERSİZ'} (+${xpEarned} XP)`,
      score,
      total,
      passed,
      promotedTo: passed ? promotedTo : undefined,
    });

    // 2. If passed and promoted, log promotion
    if (passed && promotedTo) {
      logStudentActivity({
        studentId: student.id,
        studentName: student.name,
        classCode: student.classCode,
        type: 'level_promoted',
        level: examLevel,
        title: `${examLevel} ➔ ${promotedTo} Seviyesine Başarıyla Yükseldi! 🎓`,
        details: `Öğrenci ${examLevel} müfredatını başarıyla tamamlayarak ${promotedTo} düzeyine resmi olarak terfi etti.`,
        score,
        total,
        passed: true,
        promotedTo,
      });
    }

    if (passed) {
      return {
        passed: true,
        message: `Tebrikler! %${Math.round((score / total) * 100)} başarı ile ${examLevel} seviyesini tamamlayarak ${promotedTo} düzeyine yükseldiniz!`,
        promotedTo,
      };
    } else {
      return {
        passed: false,
        message: `Sınav sonucu %${Math.round((score / total) * 100)} (Gereken: %80). Lütfen kelimeleri tekrar çalışıp yeniden deneyin.`,
      };
    }
  };

  // Announcement Handlers
  const createAnnouncement = (data: {
    title: string;
    content: string;
    priority?: AnnouncementPriority;
    targetRole: 'teachers' | 'students';
    targetClassCode?: string;
  }) => {
    if (!currentUser) {
      return { success: false, message: 'Duyuru paylaşmak için giriş yapmalısınız.' };
    }
    const cleanTitle = data.title.trim();
    const cleanContent = data.content.trim();
    if (!cleanTitle || !cleanContent) {
      return { success: false, message: 'Lütfen duyuru başlığı ve duyuru içeriğini doldurun.' };
    }

    let resolvedClassCode = data.targetClassCode;
    if (!resolvedClassCode) {
      if (currentUser.role === 'teacher') {
        const teacher = currentUser as TeacherUser;
        resolvedClassCode = teacher.classCode;
      } else {
        resolvedClassCode = 'ALL';
      }
    }

    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role as 'manager' | 'teacher',
      targetRole: data.targetRole,
      targetClassCode: resolvedClassCode,
      title: cleanTitle,
      content: cleanContent,
      priority: data.priority || 'normal',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      acknowledgedBy: [],
    };

    setAnnouncements((prev) => [newAnn, ...prev]);
    return { success: true, message: 'Duyuru başarıyla yayımlandı!', announcement: newAnn };
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    return { success: true, message: 'Duyuru başarıyla silindi.' };
  };

  const acknowledgeAnnouncement = (announcementId: string, userId: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id === announcementId) {
          if (!a.acknowledgedBy.includes(userId)) {
            return {
              ...a,
              acknowledgedBy: [...a.acknowledgedBy, userId],
            };
          }
        }
        return a;
      })
    );
  };

  // Reset to initial demo state
  const resetToDemoData = () => {
    localStorage.removeItem(`${STORAGE_KEY}_manager`);
    localStorage.removeItem(`${STORAGE_KEY}_teachers`);
    localStorage.removeItem(`${STORAGE_KEY}_students`);
    localStorage.removeItem(`${STORAGE_KEY}_transfers`);
    localStorage.removeItem(`${STORAGE_KEY}_vocabulary`);
    localStorage.removeItem(`${STORAGE_KEY}_activities`);
    localStorage.removeItem(`${STORAGE_KEY}_announcements`);
    localStorage.removeItem(`${STORAGE_KEY}_current_user_id`);

    setManager(INITIAL_MANAGER);
    setTeachers(INITIAL_TEACHERS);
    setStudents(INITIAL_STUDENTS);
    setTransfers(INITIAL_TRANSFERS);
    setVocabulary(VOCABULARY_LIST);
    setActivities(INITIAL_ACTIVITIES);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setCurrentUser(INITIAL_MANAGER);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        manager,
        teachers,
        students,
        transfers,
        vocabulary,
        activities,
        announcements,
        isLoginModalOpen,
        loginModalTab,
        prefilledEmail,
        openLoginModal,
        closeLoginModal,
        isIntroVideoOpen,
        openIntroVideo,
        closeIntroVideo,
        isChangePasswordModalOpen,
        openChangePasswordModal,
        closeChangePasswordModal,
        changePassword,
        login,
        loginWithGoogleUser,
        logout,
        switchUser,
        registerStudent,
        addTeacher,
        addStudentDirect,
        transferStudent,
        updateTeacherAssignment,
        reviewStudent,
        deleteTeacher,
        deleteStudent,
        addVocabWord,
        markWordLearned,
        submitQuizResult,
        logStudentActivity,
        submitMatchingGameResult,
        submitLevelExamResult,
        resetPassword,
        findUserByEmail,
        resetToDemoData,
        getTeacherByClassCode,
        getStudentsByClassCode,
        createAnnouncement,
        deleteAnnouncement,
        acknowledgeAnnouncement,
        activeView,
        goHome,
        goToDashboard,
        isGuideAgentOpen,
        openGuideAgent,
        closeGuideAgent,
        toggleGuideAgent,
        guideAgentInitialQuery,
        studentActiveTab,
        setStudentActiveTab,
        navigateToTab,
        scrollToStudentTabNonce,
        suppressAnnouncementModal,
        bgMode,
        setBgMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
