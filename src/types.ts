export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  isInstructor: boolean;
  level: "Beginner" | "Intermediate" | "Advanced" | "All";
  bio?: string;
  isAdmin?: boolean;
  signatureType?: "text" | "drawn";
  signatureText?: string;
  signatureImage?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // 0-based index
  explanation: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string; // Markdown format
  videoUrl?: string;
  order: number;
  quiz?: QuizQuestion[];
}

export interface CourseProgressConfig {
  requireReading: boolean;
  requireQuiz: boolean;
  minQuizScore: number; // e.g. 70
  requireVideo: boolean;
}

export interface CourseCertificateConfig {
  primaryColor?: string;
  iconUrl?: string;
  bgStyle?: 'vintage-parchment' | 'dark-velvet' | 'clean-light';
  frameStyle?: 'medieval-gothic' | 'classic-imperial' | 'modern-border';
  detailColor?: 'gold' | 'silver' | 'bronze' | 'ruby' | 'emerald' | 'theme';
}

export interface Course {
  id: string;
  title: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  creatorId: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  progressConfig?: CourseProgressConfig;
  certificateConfig?: CourseCertificateConfig;
  isTransferred?: boolean;
}

export interface ClassTurma {
  id: string;
  courseId: string;
  courseTitle: string;
  instructorId: string;
  instructorName: string;
  scheduledAt: string; // format "YYYY-MM-DD HH:mm" or localized text
  maxStudents: number;
  studentIds: string[];
  status: "scheduled" | "completed" | "cancelled";
  callUrl?: string;
  presentStudentIds?: string[];
  eventType?: "aula" | "encontro" | "conversacao";
  aulaType?: "curso" | "avulsa";
}

export interface Progress {
  id: string; // userId + "_" + courseId
  userId: string;
  courseId: string;
  completedLessons: string[]; // list of lessonIds
  quizScores: Record<string, number>; // lessonId -> max score got (percentage or correct count)
  certified: boolean;
  certifiedAt?: string;
  certificateId?: string;
  completedReadings?: string[];
  completedVideos?: string[];
  completedQuizzes?: string[];
}

export interface ChatRoom {
  id: string;
  studentId: string;
  studentName: string;
  instructorId?: string;
  courseId: string;
  courseTitle: string;
  topic: string;
  status: "open" | "resolved";
  createdAt: string;
  updatedAt: string;
  totalMessages?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface CourseReview {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number; // 1 to 5 stars
  comment: string;
  createdAt: string; // "YYYY-MM-DD" or localized ISO
}

