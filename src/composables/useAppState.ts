import { ref, computed, watch } from "vue";
import { 
  collection, 
  onSnapshot, 
  setDoc, 
  doc, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  arrayUnion, 
  arrayRemove,
  writeBatch,
  increment
} from "firebase/firestore";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { db, auth, loginWithGoogle, logoutUser, handleFirestoreError, OperationType, activeEnvMode } from "../firebase";
import { UserProfile, Course, Lesson, ClassTurma, Progress, ChatRoom, ChatMessage, CourseReview } from "../types";
import { getAlmostWhiteVariant, hexToHsl, hslToHex, generateShades } from "../utils/theme";
import { 
  sendClassMeetingNotificationEmail 
} from "../utils/emailService";

// Cache Utility helper
const getCachedVal = <T>(key: string, backup: T): T => {
  if (typeof window === "undefined") return backup;
  try {
    const item = localStorage.getItem(key);
    if (!item) return backup;
    const parsed = JSON.parse(item);
    if (Array.isArray(backup)) {
      if (Array.isArray(parsed)) {
        return parsed as unknown as T;
      } else if (parsed && typeof parsed === "object") {
        return Object.values(parsed) as unknown as T;
      }
      return backup;
    }
    return parsed as unknown as T;
  } catch {
    return backup;
  }
};

const getCachedAuthUser = (): any => {
  if (typeof window === "undefined") return null;
  const cached = localStorage.getItem("cached_auth_user");
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }
  return null;
};

const getCachedUserProfile = (): UserProfile | null => {
  if (typeof window === "undefined") return null;
  const cached = localStorage.getItem("cached_user_profile");
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }
  return null;
};

const getCachedIsDemoUser = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("cached_is_demo_user") === "true";
};

// Global Shared State (singleton reactive references)
const currentUser = ref<any>(getCachedAuthUser());
const userProfile = ref<UserProfile | null>(getCachedUserProfile());
const isOnboarding = ref(false);
const isDemoUser = ref(getCachedIsDemoUser());
const currentEnvMode = ref<"emulators" | "offline" | "production">(activeEnvMode);

const primaryColor = ref(localStorage.getItem("theme_primaryColor") || "#2563EB");
const secondaryColor = ref(localStorage.getItem("theme_secondaryColor") || "#4F46E5");
const bgColor = ref(localStorage.getItem("theme_bgColor") || "#f8fafc");
const isDarkMode = ref(localStorage.getItem("theme_isDarkMode") === "true");
const autoBg = ref(true);

const isMasterEnabled = computed(() => {
  const email = userProfile.value?.email || currentUser.value?.email || "";
  const isEmailMaster = email === "janyel.lima2809@outlook.com" || email === "kibedasppk@gmail.com" || email === "admin@englishvolunteer.org";
  return isEmailMaster || !!(userProfile.value?.isInstructor && userProfile.value?.isAdmin);
});

// Onboarding form values
const onboardName = ref("");
const onboardRole = ref<"student" | "instructor">("student");
const onboardLevel = ref<UserProfile["level"]>("Beginner");
const onboardCode = ref("");

// Master Admin login states
const isAdminLoginForm = ref(false);
const adminEmail = ref("");
const adminPassword = ref("");
const adminError = ref("");
const adminLoading = ref(false);

// Unified datasets
const activeTab = ref<"courses" | "scheduler" | "chats" | "instructor" | "master" | "tracking">("courses");
const courses = ref<Course[]>(getCachedVal<Course[]>("all_courses_cache", []));
const lessons = ref<Lesson[]>(getCachedVal<Lesson[]>("all_lessons_cache", []));
const classes = ref<ClassTurma[]>(getCachedVal<ClassTurma[]>("all_classes_cache", []));
const progressList = ref<Progress[]>(getCachedVal<Progress[]>("all_progress_snapshots", []));
const reviews = ref<CourseReview[]>(getCachedVal<CourseReview[]>("all_reviews_cache", []));
const chatRooms = ref<ChatRoom[]>([]);
const allUsers = ref<UserProfile[]>([]);

// Simulated Offline Mode/Demo Mode dataset linking student & teacher
const demoChatRooms = ref<ChatRoom[]>([]);
const demoChatMessages = ref<Record<string, ChatMessage[]>>({});

// View states detailed panels
const activeCourseId = ref<string | null>(null);
const selectedRoomId = ref<string | null>(null);
const chatMessagesLimit = ref(15);
const activeMessages = ref<ChatMessage[]>([]);
const showCertificateData = ref<{ studentName: string; courseTitle: string; id: string; primaryColor?: string; iconUrl?: string; creatorId?: string } | null>(null);

const isDbLoading = ref(true);
const isUsingFallback = ref(false);

// Offline, Sync & PWA prompt states
const isOnline = ref(typeof window !== "undefined" ? window.navigator.onLine : true);
const deferredPrompt = ref<any>(null);
const showInstallBanner = ref(false);

// Theme watcher for injection
watch([primaryColor, secondaryColor, isDarkMode, autoBg, bgColor], () => {
  localStorage.setItem("theme_primaryColor", primaryColor.value);
  localStorage.setItem("theme_secondaryColor", secondaryColor.value);
  localStorage.setItem("theme_isDarkMode", String(isDarkMode.value));
  localStorage.setItem("theme_autoBg", String(autoBg.value));

  if (autoBg.value) {
    bgColor.value = getAlmostWhiteVariant(primaryColor.value, isDarkMode.value);
    localStorage.setItem("theme_bgColor", bgColor.value);
  } else {
    localStorage.setItem("theme_bgColor", bgColor.value);
  }

  const root = document.documentElement;
  const primaryShades = generateShades(primaryColor.value);
  Object.entries(primaryShades).forEach(([sh, hex]) => {
    root.style.setProperty(`--color-blue-${sh}`, hex);
    root.style.setProperty(`--color-indigo-${sh}`, hex);
  });

  const neutralS = isDarkMode.value ? Math.min(hexToHsl(primaryColor.value).s, 8) : Math.min(hexToHsl(primaryColor.value).s, 5);
  const neutralShades: Record<number, string> = {
    50: hslToHex(hexToHsl(primaryColor.value).h, neutralS, isDarkMode.value ? 12 : 96),
    100: hslToHex(hexToHsl(primaryColor.value).h, neutralS, isDarkMode.value ? 16 : 92),
    150: hslToHex(hexToHsl(primaryColor.value).h, neutralS, isDarkMode.value ? 20 : 88),
    200: hslToHex(hexToHsl(primaryColor.value).h, neutralS, isDarkMode.value ? 24 : 83),
    250: hslToHex(hexToHsl(primaryColor.value).h, neutralS, isDarkMode.value ? 28 : 77),
    300: hslToHex(hexToHsl(primaryColor.value).h, neutralS, isDarkMode.value ? 34 : 64),
    400: hslToHex(hexToHsl(primaryColor.value).h, neutralS, isDarkMode.value ? 45 : 49),
    500: hslToHex(hexToHsl(primaryColor.value).h, neutralS, isDarkMode.value ? 60 : 40),
    650: hslToHex(hexToHsl(primaryColor.value).h, neutralS, isDarkMode.value ? 74 : 32),
    600: hslToHex(hexToHsl(primaryColor.value).h, neutralS, isDarkMode.value ? 74 : 32),
    700: hslToHex(hexToHsl(primaryColor.value).h, neutralS, isDarkMode.value ? 85 : 24),
    800: hslToHex(hexToHsl(primaryColor.value).h, neutralS, isDarkMode.value ? 92 : 15),
    900: hslToHex(hexToHsl(primaryColor.value).h, neutralS, isDarkMode.value ? 95 : 9),
    950: hslToHex(hexToHsl(primaryColor.value).h, neutralS, isDarkMode.value ? 97 : 5),
  };

  Object.entries(neutralShades).forEach(([sh, hex]) => {
    root.style.setProperty(`--color-slate-${sh}`, hex);
    root.style.setProperty(`--color-gray-${sh}`, hex);
  });

  const cardBgValue = isDarkMode.value ? hslToHex(hexToHsl(primaryColor.value).h, Math.min(hexToHsl(primaryColor.value).s, 14), 13) : "#ffffff";
  root.style.setProperty('--card-background', cardBgValue);
  root.style.setProperty('--primary-color', primaryColor.value);
  root.style.setProperty('--secondary-color', secondaryColor.value);
  root.style.setProperty('--bg-color', bgColor.value);

  if (isDarkMode.value) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}, { immediate: true });

// Shared reactive last-seen timestamps to make badging instant and 100% reactive
const lastSeenTimestamps = ref<Record<string, number>>({});
const lastSeenMessageCounts = ref<Record<string, number>>({});

const getRoomLastSeen = (roomId: string): number => {
  const uid = currentUser.value?.uid || "guest";
  const key = `${uid}_${roomId}`;
  if (lastSeenTimestamps.value[key] !== undefined) {
    return lastSeenTimestamps.value[key];
  }
  const str = localStorage.getItem("chat_room_last_seen_" + key);
  const val = str ? Number(str) : 0;
  lastSeenTimestamps.value[key] = val;
  return val;
};

const setRoomLastSeen = (roomId: string, timestamp: number) => {
  const uid = currentUser.value?.uid || "guest";
  const key = `${uid}_${roomId}`;
  localStorage.setItem("chat_room_last_seen_" + key, String(timestamp));
  lastSeenTimestamps.value[key] = timestamp;
};

const getRoomLastSeenCount = (roomId: string): number => {
  const uid = currentUser.value?.uid || "guest";
  const key = `${uid}_${roomId}`;
  if (lastSeenMessageCounts.value[key] !== undefined) {
    return lastSeenMessageCounts.value[key];
  }
  const str = localStorage.getItem("chat_room_last_seen_count_" + key);
  const val = str ? Number(str) : 0;
  lastSeenMessageCounts.value[key] = val;
  return val;
};

const setRoomLastSeenCount = (roomId: string, messageCount: number) => {
  const uid = currentUser.value?.uid || "guest";
  const key = `${uid}_${roomId}`;
  localStorage.setItem("chat_room_last_seen_count_" + key, String(messageCount));
  lastSeenMessageCounts.value[key] = messageCount;
};

const parseToTimestamp = (val: any): number => {
  if (!val) return 0;
  if (val && typeof val.toDate === "function") {
    return val.toDate().getTime();
  }
  if (val && typeof val.seconds === "number") {
    return val.seconds * 1000;
  }
  const d = new Date(val);
  const time = d.getTime();
  return isNaN(time) ? 0 : time;
};

// Local unread messages count tracker based on localStorage last read timestamp on a room (extreme saving bounds)
const unreadChatsCount = computed(() => {
  if (!currentUser.value) return 0;
  const uid = currentUser.value.uid;
  let count = 0;

  chatRooms.value.forEach(room => {
    if (room.status !== "open") return;

    // Se o usuário está na aba de chats e visualizando este canal específico ativamente agora mesmo, marca auto como lido
    if (selectedRoomId.value === room.id && activeTab.value === 'chats') {
      const currentUpdate = parseToTimestamp(room.updatedAt) || Date.now();
      setRoomLastSeen(room.id, currentUpdate + 1000);
      setRoomLastSeenCount(room.id, room.totalMessages || 0);
      return;
    }

    const lastSenderId = (room as any).lastSenderId;
    if (lastSenderId === uid) {
      // Nós enviamos a última mensagem, portanto não está não lido para nós!
      return;
    }

    // Se é um canal recém-criado pelo estudante em que não há mensagens ainda, o estudante não deve ver badge unread
    if (!lastSenderId && room.studentId === uid) {
      return;
    }

    const lastSeen = getRoomLastSeen(room.id);
    const updatedAtTime = parseToTimestamp(room.updatedAt) || parseToTimestamp(room.createdAt);

    if (updatedAtTime > lastSeen) {
      if (room.totalMessages !== undefined) {
        const lastSeenCount = getRoomLastSeenCount(room.id);
        const diff = room.totalMessages - lastSeenCount;
        count += (diff > 0 ? diff : 1);
      } else {
        count += 1;
      }
    }
  });

  return count;
});

// Watch para limpar as notificações da sala aberta na troca de sala, atualização dos chats ou na aba selecionada
watch([selectedRoomId, activeTab, chatRooms], () => {
  if (selectedRoomId.value && activeTab.value === "chats") {
    setRoomLastSeen(selectedRoomId.value, Date.now());
    const room = chatRooms.value.find(r => r.id === selectedRoomId.value);
    if (room) {
      setRoomLastSeenCount(selectedRoomId.value, room.totalMessages || 0);
    }
  }
}, { deep: true, immediate: true });

// Sync & queue functions
const queueProgressForSync = (progress: Progress) => {
  if (progress.userId === "demo-student-uid") return;
  try {
    let queue: Progress[] = [];
    const rawQueue = localStorage.getItem("offline_progress_queue");
    if (rawQueue) {
      try {
        queue = JSON.parse(rawQueue);
      } catch (e) {
        queue = [];
      }
    }
    queue = queue.filter(q => q.id !== progress.id);
    queue.push(progress);
    localStorage.setItem("offline_progress_queue", JSON.stringify(queue));
  } catch (err) {
    console.error("Erro enfileirando progresso offline:", err);
  }
};

const syncOfflineProgress = async () => {
  if (typeof window === "undefined" || !window.navigator.onLine) return;
  if (!currentUser.value || isDemoUser.value) return;

  const rawQueue = localStorage.getItem("offline_progress_queue");
  if (!rawQueue) return;

  try {
    const queue: Progress[] = JSON.parse(rawQueue);
    if (queue.length === 0) return;

    const userQueue = queue.filter(p => p.userId === currentUser.value?.uid);
    if (userQueue.length === 0) {
      const remainingQueue = queue.filter(p => p.userId !== currentUser.value?.uid && p.userId !== "demo-student-uid");
      if (queue.length !== remainingQueue.length) {
        if (remainingQueue.length > 0) {
          localStorage.setItem("offline_progress_queue", JSON.stringify(remainingQueue));
        } else {
          localStorage.removeItem("offline_progress_queue");
        }
      }
      return;
    }

    console.log(`Sincronizando ${userQueue.length} atualizações de progresso offline...`);
    for (const progress of userQueue) {
      await setDoc(doc(db, "progress", progress.id), progress);
    }

    const remainingQueue = queue.filter(p => p.userId !== currentUser.value?.uid && p.userId !== "demo-student-uid");
    if (remainingQueue.length > 0) {
      localStorage.setItem("offline_progress_queue", JSON.stringify(remainingQueue));
    } else {
      localStorage.removeItem("offline_progress_queue");
    }

    console.log("Todos os progressos offline foram sincronizados com sucesso!");
    showToast("Progresso offline sincronizado com sucesso com a nuvem!", "success");
  } catch (error) {
    console.error("Erro sincronizando progresso offline:", error);
  }
};

const syncOfflineClassActions = async () => {
  if (typeof window === "undefined" || !window.navigator.onLine) return;
  if (!currentUser.value || isDemoUser.value) return;

  const rawQueue = localStorage.getItem("offline_class_actions_queue");
  if (!rawQueue) return;

  try {
    const queue = JSON.parse(rawQueue);
    if (!Array.isArray(queue) || queue.length === 0) return;

    console.log(`Sincronizando ${queue.length} ações de turma offline...`);
    const remainingQueue = [];

    for (const action of queue) {
      if (action.userId !== currentUser.value.uid) {
        remainingQueue.push(action);
        continue;
      }

      const classRef = doc(db, "classes", action.classId);
      const snap = await getDoc(classRef);
      if (snap.exists()) {
        const cl = snap.data() as ClassTurma;
        if (action.type === "join") {
          const currentStudents = cl.studentIds || [];
          if (currentStudents.includes(action.userId)) {
            console.log("Usuário já matriculado offline sync.");
          } else if (currentStudents.length >= cl.maxStudents) {
            // SAFEGUARD: The class is full! Remove user from local state and alert them
            showToast(`Atenção: A turma de "${cl.courseTitle}" atingiu o limite de ${cl.maxStudents} vagas enquanto você estava offline. Sua inscrição offline foi cancelada automaticamente.`, "warning", 8000);
            
            classes.value = classes.value.map(c => {
              if (c.id === action.classId) {
                return { ...c, studentIds: (c.studentIds || []).filter(id => id !== action.userId) };
              }
              return c;
            });
          } else {
            // Success
            await updateDoc(classRef, {
              studentIds: arrayUnion(action.userId)
            });
            showToast(`Sua inscrição offline na turma de "${cl.courseTitle}" foi confirmada com sucesso!`, "success");
          }
        } else if (action.type === "leave") {
          await updateDoc(classRef, {
            studentIds: arrayRemove(action.userId)
          });
        }
      }
    }

    if (remainingQueue.length > 0) {
      localStorage.setItem("offline_class_actions_queue", JSON.stringify(remainingQueue));
    } else {
      localStorage.removeItem("offline_class_actions_queue");
    }
  } catch (error) {
    console.error("Erro sincronizando ações de turmas offline:", error);
  }
};

export interface AppNotification {
  id: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
  duration?: number;
}

const appNotifications = ref<AppNotification[]>([]);

export function showToast(message: string, type: "success" | "info" | "warning" | "error" = "info", duration = 4050) {
  const id = Math.random().toString(36).substring(2, 9);
  const notif: AppNotification = { id, message, type, duration };
  appNotifications.value.push(notif);
  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }
}

export function dismissToast(id: string) {
  appNotifications.value = appNotifications.value.filter(n => n.id !== id);
}

// State setup composable entry point
export function useAppState() {
  const getProgressForCourse = (courseId: string) => {
    const uid = currentUser.value?.uid || "demo-student-uid";
    return progressList.value.find(p => p.courseId === courseId && p.userId === uid) || null;
  };

  const completedCountGlobal = computed(() => {
    const uid = currentUser.value?.uid || "demo-student-uid";
    const activeCourseIds = new Set(courses.value.map(c => c.id));
    return progressList.value.filter(p => p.userId === uid && p.certified && activeCourseIds.has(p.courseId)).length;
  });

  const completedCoursesWithCertificates = computed(() => {
    if (!currentUser.value) return [];
    const uid = currentUser.value.uid;
    const userProgresses = progressList.value.filter(p => p.userId === uid && p.certified);
    
    const verifiedList = [];
    for (const p of userProgresses) {
      const course = courses.value.find(c => c.id === p.courseId);
      if (course) {
        verifiedList.push({
          progress: p,
          course
        });
      }
    }
    return verifiedList;
  });

  const handleSaveProgress = async (completedLessonId: string, score: number, activityType?: 'reading' | 'video' | 'quiz') => {
    const uid = currentUser.value?.uid || "demo-student-uid";
    const courseId = activeCourseId.value || (courses.value[0]?.id || "");
    const progressId = `${uid}_${courseId}`;

    const existingProgress = progressList.value.find(p => p.id === progressId);
    
    let completedReadings = existingProgress?.completedReadings ? [...existingProgress.completedReadings] : [];
    let completedVideos = existingProgress?.completedVideos ? [...existingProgress.completedVideos] : [];
    let completedQuizzes = existingProgress?.completedQuizzes ? [...existingProgress.completedQuizzes] : [];
    let updatedScores = existingProgress?.quizScores ? { ...existingProgress.quizScores } : {};

    if (activityType === 'reading') {
      if (!completedReadings.includes(completedLessonId)) {
        completedReadings.push(completedLessonId);
      }
    } else if (activityType === 'video') {
      if (!completedVideos.includes(completedLessonId)) {
        completedVideos.push(completedLessonId);
      }
    } else if (activityType === 'quiz') {
      updatedScores[completedLessonId] = Math.max(Number(updatedScores[completedLessonId] || 0), Number(score));
      const currentCourse = courses.value.find(c => c.id === courseId);
      const minScore = Number(currentCourse?.progressConfig?.minQuizScore ?? 70);
      if (Number(score) >= Number(minScore)) {
        if (!completedQuizzes.includes(completedLessonId)) {
          completedQuizzes.push(completedLessonId);
        }
      }
    } else {
      if (!completedReadings.includes(completedLessonId)) completedReadings.push(completedLessonId);
      if (!completedVideos.includes(completedLessonId)) completedVideos.push(completedLessonId);
      if (!completedQuizzes.includes(completedLessonId)) completedQuizzes.push(completedLessonId);
      updatedScores[completedLessonId] = Math.max(Number(updatedScores[completedLessonId] || 0), Number(score));
    }

    const currentCourse = courses.value.find(c => c.id === courseId);
    const config = currentCourse?.progressConfig || {
      requireReading: true,
      requireQuiz: false,
      minQuizScore: 70,
      requireVideo: false
    };

    const matchingCourseLessons = lessons.value.filter(l => l.courseId === courseId);
    const completedList: string[] = [];

    matchingCourseLessons.forEach(lesson => {
      let isReadingOk = true;
      let isVideoOk = true;
      let isQuizOk = true;

      if (config.requireReading) {
        isReadingOk = completedReadings.includes(lesson.id);
      }
      if (config.requireVideo && lesson.videoUrl) {
        isVideoOk = completedVideos.includes(lesson.id);
      }
      if (config.requireQuiz && lesson.quiz && lesson.quiz.length > 0) {
        isQuizOk = completedQuizzes.includes(lesson.id) && (Number(updatedScores[lesson.id] || 0) >= Number(config.minQuizScore));
      }

      const canPass = completedQuizzes.includes(lesson.id) && (Number(updatedScores[lesson.id] || 0) >= Number(config.minQuizScore));
      if (lesson.quiz && lesson.quiz.length > 0 && canPass) {
        isReadingOk = true;
        isVideoOk = true;
        isQuizOk = true;
        if (!completedReadings.includes(lesson.id)) completedReadings.push(lesson.id);
        if (lesson.videoUrl && !completedVideos.includes(lesson.id)) completedVideos.push(lesson.id);
      }

      if (isReadingOk && isVideoOk && isQuizOk) {
        completedList.push(lesson.id);
      }
    });

    const isNowCertified = completedList.length >= matchingCourseLessons.length && matchingCourseLessons.length > 0;

    const newProgress: Progress = {
      id: progressId,
      userId: uid,
      courseId,
      completedLessons: completedList,
      quizScores: updatedScores,
      certified: isNowCertified,
      completedReadings,
      completedVideos,
      completedQuizzes
    };

    if (isNowCertified) {
      newProgress.certifiedAt = existingProgress?.certifiedAt || new Date().toLocaleDateString("pt-BR");
      newProgress.certificateId = existingProgress?.certificateId || `CERT-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    }

    const progressCopy = [...progressList.value];
    const saveIdx = progressCopy.findIndex(p => p.id === progressId);
    if (saveIdx > -1) {
      progressCopy[saveIdx] = newProgress;
    } else {
      progressCopy.push(newProgress);
    }
    progressList.value = progressCopy;

    try {
      const snapshots = JSON.parse(localStorage.getItem("all_progress_snapshots") || "{}");
      snapshots[progressId] = newProgress;
      localStorage.setItem("all_progress_snapshots", JSON.stringify(snapshots));
    } catch (err) {
      console.error("Erro cacheando progresso local:", err);
    }

    if (isOnline.value && !isDemoUser.value) {
      try {
        await setDoc(doc(db, "progress", progressId), newProgress);
      } catch (error) {
        queueProgressForSync(newProgress);
        handleFirestoreError(error, OperationType.WRITE, `progress/${progressId}`);
      }
    } else {
      if (!isDemoUser.value) {
        queueProgressForSync(newProgress);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser.value) return;
    try {
      const updatedName = onboardName.value.trim();
      const updatedLevel = onboardLevel.value;
      const updatedBio = "";
      
      if (!isDemoUser.value) {
        const profileRef = doc(db, "users", currentUser.value.uid);
        await setDoc(profileRef, {
          displayName: updatedName,
          level: updatedLevel,
          bio: updatedBio
        }, { merge: true });
      }

      if (userProfile.value) {
        userProfile.value.displayName = updatedName;
        userProfile.value.level = updatedLevel;
        userProfile.value.bio = updatedBio;
      }
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
    }
  };

  const handleUploadCourse = async (newCourse: Course, newLessons: Lesson[]) => {
    const teacherLevel = userProfile.value?.level || "Beginner";
    const isAdmin = userProfile.value?.isAdmin || false;
    
    if (!isAdmin && teacherLevel !== "All") {
      const levelRank: Record<string, number> = { Beginner: 1, Intermediate: 2, Advanced: 3, All: 4 };
      const teacherPower = levelRank[teacherLevel] || 1;
      const coursePower = levelRank[newCourse.level] || 1;
      
      if (coursePower > teacherPower) {
        showToast(`Erro de Permissão: Seu nível atual voluntário é "${teacherLevel}". Você só pode publicar cursos de nível "${teacherLevel}" ou inferior. Atualize seu progresso no seu perfil para "${newCourse.level}" ou "All".`, "error", 6000);
        throw new Error("Instructor English level is below the required course difficulty level.");
      }
    }

    newCourse.creatorId = currentUser.value?.uid || "system-volunteer";
    if (!isDemoUser.value) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, "courses", newCourse.id), newCourse);
        for (const lesson of newLessons) {
          batch.set(doc(db, "lessons", lesson.id), lesson);
        }
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `courses/${newCourse.id}`);
      }
    } else {
      if (!courses.value.some(c => c.id === newCourse.id)) {
        courses.value = [newCourse, ...courses.value];
      }
      const uniqueNewLessons = newLessons.filter(nl => !lessons.value.some(l => l.id === nl.id));
      if (uniqueNewLessons.length > 0) {
        lessons.value = [...lessons.value, ...uniqueNewLessons];
      }
    }
  };

  const handleJoinClass = async (classId: string) => {
    const uid = currentUser.value?.uid || "demo-student-uid";
    
    // Client-side capacity safeguard check first
    const cl = classes.value.find(c => c.id === classId);
    if (cl && (cl.studentIds || []).length >= cl.maxStudents) {
      showToast("Não foi possível participar: Esta turma já está cheia!", "error");
      return;
    }

    // Client-side level safeguard check
    const isTeacher = userProfile.value?.isInstructor || userProfile.value?.isAdmin || false;
    const isAdm = userProfile.value?.isAdmin || false;
    if (!isTeacher && !isAdm && cl) {
      const associatedCourse = courses.value.find(c => c.id === cl.courseId);
      if (associatedCourse) {
        const levelRank: Record<string, number> = { Beginner: 1, Intermediate: 2, Advanced: 3, All: 4 };
        const uLevel = userProfile.value?.level || "Beginner";
        const userPower = levelRank[uLevel] || 1;
        const coursePower = levelRank[associatedCourse.level] || 1;
        if (coursePower > userPower) {
          showToast(`Não foi possível participar: Esta aula exige o nível de inglês "${associatedCourse.level}", mas o seu nível atual é "${uLevel}".`, "error");
          return;
        }
      }
    }

    if (!isDemoUser.value) {
      if (typeof window !== "undefined" && !window.navigator.onLine) {
        // Queue join offline
        try {
          let queue: any[] = [];
          const rawQueue = localStorage.getItem("offline_class_actions_queue");
          if (rawQueue) {
            try { queue = JSON.parse(rawQueue); } catch (e) { queue = []; }
          }
          queue = queue.filter(q => !(q.classId === classId && q.userId === uid));
          queue.push({
            type: "join",
            classId,
            userId: uid,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem("offline_class_actions_queue", JSON.stringify(queue));
          
          classes.value = classes.value.map(c => c.id === classId ? { ...c, studentIds: [...new Set([...(c.studentIds || []), uid])] } : c);
          showToast("Você se inscreveu nesta aula de forma offline! Sua vaga será validada com o servidor assim que você se conectar.", "info", 6000);
        } catch (err) {
          console.error("Erro ao enfileirar matrícula offline:", err);
        }
        return;
      }

      // Online join execution
      try {
        const classRef = doc(db, "classes", classId);
        // Direct server double-check safeguard
        const snap = await getDoc(classRef);
        if (snap.exists()) {
          const freshClass = snap.data() as ClassTurma;
          if ((freshClass.studentIds || []).length >= freshClass.maxStudents) {
            showToast("Não foi possível participar: Esta turma acabou de lotar!", "error");
            return;
          }
        }
        await updateDoc(classRef, {
          studentIds: arrayUnion(uid)
        });
        showToast("Você se inscreveu na aula com sucesso!", "success");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `classes/${classId}`);
      }
    } else {
      classes.value = classes.value.map(c => c.id === classId ? { ...c, studentIds: [...new Set([...(c.studentIds || []), uid])] } : c);
    }
  };

  const handleLeaveClass = async (classId: string) => {
    const uid = currentUser.value?.uid || "demo-student-uid";
    if (!isDemoUser.value) {
      if (typeof window !== "undefined" && !window.navigator.onLine) {
        // Queue leave offline
        try {
          let queue: any[] = [];
          const rawQueue = localStorage.getItem("offline_class_actions_queue");
          if (rawQueue) {
            try { queue = JSON.parse(rawQueue); } catch (e) { queue = []; }
          }
          queue = queue.filter(q => !(q.classId === classId && q.userId === uid));
          queue.push({
            type: "leave",
            classId,
            userId: uid,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem("offline_class_actions_queue", JSON.stringify(queue));
          
          classes.value = classes.value.map(c => c.id === classId ? { ...c, studentIds: (c.studentIds || []).filter(id => id !== uid) } : c);
          showToast("Você saiu desta aula offline.", "info");
        } catch (err) {
          console.error("Erro ao enfileirar desmatricula offline:", err);
        }
        return;
      }

      // Online leave execution
      try {
        const classRef = doc(db, "classes", classId);
        await updateDoc(classRef, {
          studentIds: arrayRemove(uid)
        });
        showToast("Você saiu da aula com sucesso.", "success");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `classes/${classId}`);
      }
    } else {
      classes.value = classes.value.map(c => c.id === classId ? { ...c, studentIds: (c.studentIds || []).filter(id => id !== uid) } : c);
    }
  };

  const handleCreateClass = async (newClass: Omit<ClassTurma, "id" | "studentIds">) => {
    const classId = `class-${Math.random().toString(36).substring(2, 9)}`;
    const fullClass: ClassTurma = {
      ...newClass,
      id: classId,
      studentIds: []
    };
    if (!isDemoUser.value) {
      try {
        await setDoc(doc(db, "classes", classId), fullClass);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `classes/${classId}`);
      }
    } else {
      if (!classes.value.some(c => c.id === classId)) {
        classes.value = [fullClass, ...classes.value];
      }
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!isDemoUser.value) {
      try {
        await deleteDoc(doc(db, "classes", classId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `classes/${classId}`);
      }
    } else {
      classes.value = classes.value.filter(c => c.id !== classId);
    }
  };

  const handleUpdateClass = async (updatedClass: ClassTurma) => {
    // Notificar alunos matriculados se o link da aula foi publicado pelo professor (Agrupado em 1 só request de e-mail para preservação de quota)
    if (updatedClass.callUrl && updatedClass.studentIds && updatedClass.studentIds.length > 0) {
      const callUrl = updatedClass.callUrl;
      const classTitle = updatedClass.courseTitle;
      const scheduledAt = updatedClass.scheduledAt;
      const instructorName = updatedClass.instructorName;

      Promise.all(
        updatedClass.studentIds.map(studentId => 
          getDoc(doc(db, "users", studentId))
            .then(snap => {
              if (snap.exists()) {
                const data = snap.data();
                return {
                  email: data.email as string || "",
                  name: (data.displayName || "Estudante") as string
                };
              }
              return null;
            })
            .catch(err => {
              console.error("Erro ao carregar perfil de aluno para email:", studentId, err);
              return null;
            })
        )
      ).then(async (results) => {
        const validRecipients = results.filter((r): r is { email: string; name: string } => !!(r && r.email));
        if (validRecipients.length > 0) {
          const joinedEmails = validRecipients.map(r => r.email).join(",");
          const recipientName = validRecipients.length === 1 ? validRecipients[0].name : "Estudantes da Turma";

          await sendClassMeetingNotificationEmail(
            joinedEmails,
            recipientName,
            classTitle,
            scheduledAt,
            callUrl,
            instructorName,
            primaryColor.value
          );
        }
      });
    }

    if (!isDemoUser.value) {
      try {
        const classRef = doc(db, "classes", updatedClass.id);
        await setDoc(classRef, updatedClass, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `classes/${updatedClass.id}`);
      }
    } else {
      classes.value = classes.value.map(c => c.id === updatedClass.id ? updatedClass : c);
    }
  };

  const handleMarkPresence = async (classId: string) => {
    const uid = currentUser.value?.uid || "demo-student-uid";
    if (!isDemoUser.value) {
      try {
        const classRef = doc(db, "classes", classId);
        await updateDoc(classRef, {
          presentStudentIds: arrayUnion(uid)
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `classes/${classId}`);
      }
    } else {
      classes.value = classes.value.map(c => {
        if (c.id === classId) {
          const arr = c.presentStudentIds || [];
          if (!arr.includes(uid)) {
            return { ...c, presentStudentIds: [...arr, uid] };
          }
        }
        return c;
      });
    }
  };

  const handleStartChatRoom = async (courseId: string, topic: string) => {
    const uid = currentUser.value?.uid || "demo-student-uid";
    const roomId = `chat-${Math.random().toString(36).substring(2, 9)}`;
    const chosenCourse = courses.value.find(c => c.id === courseId);

    const newRoom: ChatRoom = {
      id: roomId,
      studentId: uid,
      studentName: userProfile.value?.displayName || currentUser.value?.displayName || "Estudante",
      courseId,
      courseTitle: chosenCourse?.title || "Dúvida Geral",
      topic,
      status: "open",
      instructorId: chosenCourse?.creatorId || "demo-instructor-uid",
      createdAt: new Date().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }),
      updatedAt: new Date().toISOString(),
      totalMessages: 0
    };

    if (!isDemoUser.value) {
      try {
        await setDoc(doc(db, "chats", roomId), newRoom);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `chats/${roomId}`);
      }
    } else {
      if (!demoChatRooms.value.some(r => r.id === roomId)) {
        demoChatRooms.value = [newRoom, ...demoChatRooms.value];
      }
      demoChatMessages.value[roomId] = [];
      chatRooms.value = [...demoChatRooms.value];
    }
    selectedRoomId.value = roomId;
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedRoomId.value) return;
    const uid = currentUser.value?.uid || "demo-student-uid";
    const msgId = `msg-${Math.random().toString(36).substring(2, 10)}`;

    const newMsg: ChatMessage = {
      id: msgId,
      senderId: uid,
      senderName: userProfile.value?.displayName || currentUser.value?.displayName || "Membro",
      text,
      createdAt: new Date().toISOString()
    };

    if (!isDemoUser.value) {
      try {
        const msgRef = doc(db, "chats", selectedRoomId.value, "messages", msgId);
        await setDoc(msgRef, newMsg);

        // Atualizar o canal de chat principal com informações de última atividade para atualizar o badge de forma reativa e instantânea
        const roomRef = doc(db, "chats", selectedRoomId.value);
        await updateDoc(roomRef, {
          updatedAt: newMsg.createdAt,
          lastMessageText: text,
          lastSenderId: uid,
          totalMessages: increment(1)
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `chats/${selectedRoomId.value}/messages/${msgId}`);
      }
    } else {
      const rid = selectedRoomId.value;
      if (!demoChatMessages.value[rid]) {
        demoChatMessages.value[rid] = [];
      }
      if (!demoChatMessages.value[rid].some(m => m.id === msgId)) {
        demoChatMessages.value[rid] = [...demoChatMessages.value[rid], newMsg];
      }
      activeMessages.value = [...demoChatMessages.value[rid]];

      // Atualizar o canal de chat principal fictício para recalcular os badges
      const rIdx = chatRooms.value.findIndex(r => r.id === rid);
      if (rIdx !== -1) {
        const prevTotal = chatRooms.value[rIdx].totalMessages || 0;
        chatRooms.value[rIdx] = {
          ...chatRooms.value[rIdx],
          updatedAt: newMsg.createdAt,
          lastMessageText: text,
          lastSenderId: uid,
          totalMessages: prevTotal + 1
        } as any;
      }

      const isStudentMessage = uid === "demo-student-uid" || uid.includes("student");
      if (isStudentMessage) {
        setTimeout(() => {
          if (selectedRoomId.value !== rid) return;

          const activeRm = chatRooms.value.find(r => r.id === rid);
          let teacherName = "Teacher Voluntário";
          let teacherId = "demo-instructor-uid";

          const studentName = newMsg.senderName || "Estudante";
          const firstName = studentName.split(" ")[0];

          let replyText = "";
          const lowerText = text.toLowerCase();
          if (lowerText.includes("in") || lowerText.includes("on") || lowerText.includes("at") || lowerText.includes("preposição") || lowerText.includes("preposi") || lowerText.includes("tempo")) {
            replyText = `Ótima pergunta sobre preposições de tempo, ${firstName}! Lembre-se desta regra prática:\n\n• 📍 **at**: Horas específicas (at 8:30 PM, at midnight).\n• 📅 **on**: Dias da semana e datas (on Monday, on October 5th).\n• 🗓️ **in**: Meses, estações, anos e períodos longos (in July, in winter, in 2026).\n\nQuer tentar criar um exemplo para eu corrigir?`;
          } else if (lowerText.includes("ajuda") || lowerText.includes("dúvida") || lowerText.includes("como") || lowerText.includes("queria") || lowerText.includes("significa") || lowerText.includes("traduz")) {
            replyText = `Olá, ${firstName}! Estou aqui para ajudar. O tema deste canal é excelente para alavancar seu progresso no inglês. Praticar diariamente é o segredo! O que você acha de tentarmos exercitar juntos escrevendo uma frase simples aqui no chat? Go ahead! 🚀`;
          } else if (lowerText.includes("obrigado") || lowerText.includes("obrigada") || lowerText.includes("thanks") || lowerText.includes("thank you")) {
            replyText = `You're very welcome, ${firstName}! É uma honra ver sua dedicação aqui no English Volunteer. Não hesite em perguntar se surgir qualquer dúvida de inglês. Se cuida! 🙌`;
          } else if (lowerText.includes("olá") || lowerText.includes("oi") || lowerText.includes("hello") || lowerText.includes("hi")) {
            replyText = `Hello, ${firstName}! How's it going? Como vão seus estudos? Estou muito feliz em te receber neste canal de suporte pedagógico. Qual a sua principal dúvida hoje?`;
          } else {
            replyText = `Excelente colocação, ${firstName}!\n\nSeu ponto é muito importante para a fluência do inglês do dia a dia. Vou separar alguns exercícios extras desse assunto para conversarmos melhor em nossa próxima aula ao vivo! Caso precise de mais exemplos rápidos, me mande aqui! 🇬🇧🌟`;
          }

          const teacherMsgId = `msg-reply-${Math.random().toString(36).substring(2, 10)}`;
          const teacherMsg: ChatMessage = {
            id: teacherMsgId,
            senderId: teacherId,
            senderName: teacherName,
            text: replyText,
            createdAt: new Date().toISOString()
          };

          if (demoChatMessages.value[rid]) {
            if (!demoChatMessages.value[rid].some(m => m.id === teacherMsgId)) {
              demoChatMessages.value[rid] = [...demoChatMessages.value[rid], teacherMsg];
            }
            if (selectedRoomId.value === rid) {
              activeMessages.value = [...demoChatMessages.value[rid]];
            }

            // Atualizar o canal de chat fictício com a resposta do professor
            const rIdxReplies = chatRooms.value.findIndex(r => r.id === rid);
            if (rIdxReplies !== -1) {
              const prevTotal = chatRooms.value[rIdxReplies].totalMessages || 0;
              chatRooms.value[rIdxReplies] = {
                ...chatRooms.value[rIdxReplies],
                updatedAt: teacherMsg.createdAt,
                lastMessageText: replyText,
                lastSenderId: teacherId,
                totalMessages: prevTotal + 1
              } as any;
            }
          }
        }, 1500);
      }
    }
  };

  const handleResolveRoom = async (roomId: string) => {
    if (!isDemoUser.value) {
      try {
        const roomRef = doc(db, "chats", roomId);
        await updateDoc(roomRef, {
          status: "resolved"
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `chats/${roomId}`);
      }
    } else {
      demoChatRooms.value = demoChatRooms.value.map(r => r.id === roomId ? { ...r, status: "resolved" } : r);
      chatRooms.value = [...demoChatRooms.value];
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!isDemoUser.value) {
      try {
        await deleteDoc(doc(db, "courses", courseId));
        const associatedLessons = lessons.value.filter(l => l.courseId === courseId);
        for (const les of associatedLessons) {
          await deleteDoc(doc(db, "lessons", les.id));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `courses/${courseId}`);
      }
    } else {
      courses.value = courses.value.filter(c => c.id !== courseId);
      lessons.value = lessons.value.filter(l => l.courseId !== courseId);
    }
  };

  const handleUpdateCourseConfig = async (courseId: string, updates: Partial<Course>) => {
    if (!isDemoUser.value) {
      try {
        await setDoc(doc(db, "courses", courseId), updates, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `courses/${courseId}`);
      }
    } else {
      courses.value = courses.value.map(c => {
        if (c.id === courseId) {
          return { ...c, ...updates };
        }
        return c;
      });
    }
  };

  const handleUpdateUserRole = async (targetUid: string, isInstructor: boolean) => {
    const updatedUser = {
      uid: targetUid,
      displayName: allUsers.value.find(u => u.uid === targetUid)?.displayName || "Voluntário Novo",
      isInstructor,
      level: allUsers.value.find(u => u.uid === targetUid)?.level || "Intermediate",
      bio: allUsers.value.find(u => u.uid === targetUid)?.bio || ""
    };
    if (!isDemoUser.value) {
      try {
        await setDoc(doc(db, "users", targetUid), updatedUser, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
      }
    } else {
      allUsers.value = allUsers.value.map(u => u.uid === targetUid ? { ...u, isInstructor } : u);
    }
  };

  const handleDeleteUserPhoto = async (targetUid: string) => {
    if (!isDemoUser.value) {
      try {
        await setDoc(doc(db, "users", targetUid), {
          photoURL: ""
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
        return;
      }
    }
    allUsers.value = allUsers.value.map(u => u.uid === targetUid ? { ...u, photoURL: "" } : u);
  };

  const handleSelectRoomAndTab = (roomId: string) => {
    selectedRoomId.value = roomId;
    activeTab.value = "chats";
  };

  const handleAddCourseReview = async (courseId: string, rating: number, comment: string) => {
    const uid = currentUser.value?.uid || "demo-student-uid";
    const name = userProfile.value?.displayName || currentUser.value?.displayName || "Estudante";
    const photo = userProfile.value?.photoURL || currentUser.value?.photoURL || "";
    const reviewId = `review_${uid}_${courseId}`;

    const newReview: CourseReview = {
      id: reviewId,
      courseId,
      userId: uid,
      userName: name,
      userPhoto: photo,
      rating,
      comment,
      createdAt: new Date().toLocaleDateString("pt-BR")
    };

    const reviewCopy = [...reviews.value.filter(r => r.id !== reviewId), newReview];
    reviews.value = reviewCopy;
    localStorage.setItem("all_reviews_cache", JSON.stringify(reviewCopy));

    if (isOnline.value && !isDemoUser.value) {
      try {
        await setDoc(doc(db, "reviews", reviewId), newReview);
        showToast("Avaliação enviada com sucesso!", "success");
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `reviews/${reviewId}`);
      }
    } else {
      showToast("Avaliação salva localmente (offline)!", "success");
    }
  };

  return {
    currentUser,
    userProfile,
    isOnboarding,
    isDemoUser,
    currentEnvMode,
    primaryColor,
    secondaryColor,
    bgColor,
    isDarkMode,
    autoBg,
    isMasterEnabled,
    onboardName,
    onboardRole,
    onboardLevel,
    onboardCode,
    isAdminLoginForm,
    adminEmail,
    adminPassword,
    adminError,
    adminLoading,
    activeTab,
    courses,
    lessons,
    classes,
    progressList,
    reviews,
    chatRooms,
    unreadChatsCount,
    allUsers,
    demoChatRooms,
    demoChatMessages,
    activeCourseId,
    selectedRoomId,
    chatMessagesLimit,
    activeMessages,
    showCertificateData,
    isDbLoading,
    isUsingFallback,
    isOnline,
    deferredPrompt,
    showInstallBanner,
    completedCountGlobal,
    completedCoursesWithCertificates,
    getProgressForCourse,
    handleSaveProgress,
    handleSaveProfile,
    handleUploadCourse,
    handleJoinClass,
    handleLeaveClass,
    handleCreateClass,
    handleDeleteClass,
    handleUpdateClass,
    handleMarkPresence,
    handleStartChatRoom,
    handleSendMessage,
    handleResolveRoom,
    handleDeleteCourse,
    handleUpdateCourseConfig,
    handleUpdateUserRole,
    handleDeleteUserPhoto,
    handleSelectRoomAndTab,
    handleAddCourseReview,
    syncOfflineProgress,
    syncOfflineClassActions,
    appNotifications,
    showToast,
    dismissToast,
    lastSeenTimestamps,
    lastSeenMessageCounts,
    getRoomLastSeen,
    setRoomLastSeen,
    getRoomLastSeenCount,
    setRoomLastSeenCount,
    parseToTimestamp
  };
}
