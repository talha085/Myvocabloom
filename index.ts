export type UserRole = 'manager' | 'teacher' | 'student';

export type StudentStatus = 'approved' | 'pending' | 'rejected';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  password?: string;
}

export interface ManagerUser extends BaseUser {
  role: 'manager';
  title: string;
  department: string;
}

export interface TeacherUser extends BaseUser {
  role: 'teacher';
  classCode: string; // e.g. ENG-A1-SELIN
  className: string; // e.g. "Temel İngilizce A1"
  level: CEFRLevel;
  bio?: string;
}

export interface StudentProgress {
  wordsLearned: string[]; // word IDs
  wordsStruggled: string[]; // word IDs
  testsTaken: number;
  totalCorrect: number;
  bloomScore: number; // Garden growth score (XP)
  streakDays: number;
  lastActiveDate: string;
  currentLevel?: CEFRLevel; // Current demonstrated CEFR mastery
  passedLevels?: CEFRLevel[]; // Levels successfully graduated from
  matchingGamesPlayed?: number;
  matchingBestScore?: number;
}

export interface StudentUser extends BaseUser {
  role: 'student';
  classCode: string; // e.g. ENG-A1-SELIN
  teacherId: string;
  status: StudentStatus;
  enrolledDate: string;
  rejectionReason?: string;
  progress: StudentProgress;
  currentLevel?: CEFRLevel;
}

export type AppUser = ManagerUser | TeacherUser | StudentUser;

export interface VocabWord {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'idiom' | 'phrase';
  level: CEFRLevel;
  meaningTr: string;
  definitionEn: string;
  exampleEn: string;
  exampleTr: string;
  collocations?: string[];
  synonyms?: string[];
}

export interface TransferRecord {
  id: string;
  studentId: string;
  studentName: string;
  fromClassCode: string;
  toClassCode: string;
  transferredBy: string;
  date: string;
  note?: string;
}

export interface QuizQuestion {
  id: string;
  wordId: string;
  type: 'multiple-choice' | 'audio-listening' | 'fill-blank';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  targetWord: VocabWord;
  sentenceWithBlank?: string;
  turkishTranslation?: string;
}

export interface QuizResult {
  date: string;
  level: CEFRLevel;
  score: number;
  total: number;
  xpEarned: number;
}

export type StudentActivityType =
  | 'matching_game'
  | 'level_exam'
  | 'level_promoted'
  | 'quiz_completed'
  | 'word_learned';

export interface StudentActivity {
  id: string;
  studentId: string;
  studentName: string;
  classCode: string;
  type: StudentActivityType;
  level: CEFRLevel;
  title: string;
  details: string;
  score?: number;
  total?: number;
  passed?: boolean;
  promotedTo?: CEFRLevel;
  timestamp: string;
}

export interface LevelExamQuestion {
  id: string;
  sentenceWithBlank: string;
  turkishTranslation: string;
  correctAnswer: string;
  options: string[];
  targetWord: VocabWord;
  explanation: string;
}

export interface LevelExamResult {
  examLevel: CEFRLevel;
  score: number;
  total: number;
  passed: boolean;
  promotedTo?: CEFRLevel;
  date: string;
}

export type AnnouncementPriority = 'normal' | 'important' | 'urgent';

export interface Announcement {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'manager' | 'teacher';
  targetRole: 'teachers' | 'students';
  targetClassCode?: string; // specific classCode like ENG-A1-SELIN or 'ALL'
  title: string;
  content: string;
  priority: AnnouncementPriority;
  createdAt: string;
  acknowledgedBy: string[]; // List of user IDs who clicked "Anladım."
}

export interface GuideAgentActionShortcut {
  label: string;
  actionType: 'navigate_tab' | 'open_login' | 'open_register' | 'change_password' | 'intro_video';
  targetTab?: string;
}

export interface GuideAgentMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  suggestions?: string[];
  actionShortcut?: GuideAgentActionShortcut;
}
