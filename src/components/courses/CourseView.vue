<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { BookOpen, CheckCircle, Video, ArrowRight, Award, ChevronLeft, AlertCircle, ShieldCheck, Download, X } from 'lucide-vue-next';
import MarkdownRenderer from '../common/MarkdownRenderer.vue';
import { Course, Lesson, Progress } from '../../types';
import { showToast } from '../../composables/useAppState';
import { generateInteractiveHTML } from '../../utils/interactiveHtmlExporter';
import { useI18n } from '../../composables/useI18n';

const { locale } = useI18n();

const props = defineProps<{
  course: Course;
  lessons: Lesson[];
  progressReport: Progress | null;
  currentUserId: string;
  studentName: string;
  primaryColor?: string;
}>();

const emit = defineEmits<{
  (e: 'save-progress', completedLessonId: string, score: number, activityType?: 'reading' | 'video' | 'quiz'): void;
  (e: 'back'): void;
  (e: 'show-certificate', certificate: any): void;
}>();

const activeLessonIndex = ref(0);
const selectedAnswers = ref<Record<number, number>>({});
const isQuizSubmitted = ref(false);
const quizScore = ref<number | null>(null);
const isSubmitting = ref(false);
const showQuizModal = ref(false);

const currentLesson = computed(() => props.lessons[activeLessonIndex.value]);

const courseThemeColor = computed(() => props.course.certificateConfig?.primaryColor || props.primaryColor || "#2563EB");

const quizButtonText = computed(() => {
  if (!currentLesson.value) return locale.value === 'pt' ? "Realizar Prova da Lição" : "Take Lesson Quiz";
  return (isQuizCompleted(currentLesson.value.id) || isQuizSubmitted.value)
    ? (locale.value === 'pt' ? "Revisar / Refazer Prova" : "Review / Retake Quiz")
    : (locale.value === 'pt' ? "Realizar Prova da Lição" : "Take Lesson Quiz");
});

// Dynamic progress config per course
const lessonProgressConfig = computed(() => props.course.progressConfig || {
  requireReading: true,
  requireQuiz: false,
  minQuizScore: 70,
  requireVideo: false
});

// Strictly >= 80% passing as requested for quizzes if required, otherwise fallback
const quizPassScore = computed(() => {
  return lessonProgressConfig.value.requireQuiz ? 80 : (lessonProgressConfig.value.minQuizScore || 70);
});

// Interactive state tracking for reading and video
const hasReadToBottom = ref(false);
const isYTCompleted = ref(false);
const isOnline = ref(typeof window !== "undefined" ? window.navigator.onLine : true);

const updateOnlineStatus = () => {
  isOnline.value = typeof window !== "undefined" ? window.navigator.onLine : true;
};

const isReadingCompleted = (lessonId: string) => {
  return props.progressReport?.completedReadings?.includes(lessonId) || false;
};

const isVideoWatched = (lessonId: string) => {
  return props.progressReport?.completedVideos?.includes(lessonId) || false;
};

const isQuizCompleted = (lessonId: string) => {
  return props.progressReport?.completedQuizzes?.includes(lessonId) || false;
};

const getQuizScore = (lessonId: string) => {
  return props.progressReport?.quizScores?.[lessonId] ?? null;
};

const isLessonCompletedFn = (lessonId: string) => {
  if (props.progressReport?.completedLessons?.includes(lessonId)) return true;
  
  const lesson = props.lessons.find(l => l.id === lessonId);
  if (!lesson) return false;
  
  const config = lessonProgressConfig.value;
  const score = props.progressReport?.quizScores?.[lessonId] ?? 0;
  const isQuizPassed = isQuizCompleted(lessonId) && Number(score) >= Number(quizPassScore.value);

  // COOPERATIVE PROGRESS FALLBACK: If there's a quiz and the student passes the quiz, they have fully mastered the lesson content!
  if (lesson.quiz && lesson.quiz.length > 0 && isQuizPassed) {
    return true;
  }

  // Completed read
  let readingOk = !config.requireReading || isReadingCompleted(lessonId);
  // Bypassed automatically when offline to protect student session progression!
  let videoOk = !config.requireVideo || !lesson.videoUrl || !isOnline.value || isVideoWatched(lessonId);
  // Must respect quiz pass score if required!
  let quizOk = !config.requireQuiz || !lesson.quiz || lesson.quiz.length === 0 || isQuizPassed;
  
  return readingOk && videoOk && quizOk;
};

const isLessonCompleted = computed(() => {
  if (!currentLesson.value) return false;
  return isLessonCompletedFn(currentLesson.value.id);
});

// Reset states on lesson change
watch(activeLessonIndex, () => {
  selectedAnswers.value = {};
  isQuizSubmitted.value = false;
  quizScore.value = null;
  hasReadToBottom.value = false;
  isYTCompleted.value = false;
  showQuizModal.value = false;
});

const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
  if (isQuizSubmitted.value) return;
  selectedAnswers.value[questionIndex] = optionIndex;
};

const handleSubmitQuiz = async () => {
  if (!currentLesson.value?.quiz || currentLesson.value.quiz.length === 0) return;
  
  // Check if answered all
  const answeredCount = Object.keys(selectedAnswers.value).length;
  const totalQuestions = currentLesson.value.quiz.length;
  if (answeredCount < totalQuestions) {
    showToast(locale.value === 'pt' ? "Por favor, responda todas as perguntas do quiz antes de enviar!" : "Please answer all questions before submitting!", "warning");
    return;
  }

  isSubmitting.value = true;
  try {
    let correctCount = 0;
    currentLesson.value.quiz.forEach((q, idx) => {
      if (Number(selectedAnswers.value[idx]) === Number(q.correctAnswer)) {
        correctCount++;
      }
    });

    const percentageScore = Math.round((correctCount / totalQuestions) * 100);
    quizScore.value = percentageScore;
    isQuizSubmitted.value = true;

    // Save quiz specific progress to the server using the extended handler
    emit('save-progress', currentLesson.value.id, percentageScore, 'quiz');
  } catch (error) {
    console.error("Erro salvando progresso:", error);
  } finally {
    isSubmitting.value = false;
  }
};

// Safe YouTube embedding ID parser
const getEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return match[2]; // Return only ID for the API Player instantiation
  }
  return null;
};

const videoEmbedId = computed(() => {
  return currentLesson.value ? getEmbedUrl(currentLesson.value.videoUrl || "") : null;
});

const handleClaimCertificate = () => {
  if (isCourseFullyCompleted.value) {
    emit('show-certificate', {
      studentName: props.studentName || (locale.value === 'pt' ? 'Estudante Voluntário' : 'Volunteer Student'),
      courseTitle: props.course.title,
      id: props.progressReport?.certificateId || `CERT-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      primaryColor: props.course.certificateConfig?.primaryColor,
      iconUrl: props.course.certificateConfig?.iconUrl,
      bgStyle: props.course.certificateConfig?.bgStyle,
      frameStyle: props.course.certificateConfig?.frameStyle,
      detailColor: props.course.certificateConfig?.detailColor,
      creatorId: props.course.creatorId
    });
  }
};

// Calculate overall course completed ratio
const completedCount = computed(() => {
  return props.lessons.filter(l => isLessonCompletedFn(l.id)).length;
});

const isCourseFullyCompleted = computed(() => {
  return completedCount.value >= props.lessons.length && props.lessons.length > 0;
});

// Dynamic reading observer bottom detector
let readingObserver: IntersectionObserver | null = null;
const bottomSentinel = ref<HTMLElement | null>(null);

const setupReadingObserver = () => {
  if (readingObserver) {
    readingObserver.disconnect();
  }
  nextTick(() => {
    if (!bottomSentinel.value) return;
    readingObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          hasReadToBottom.value = true;
        }
      });
    }, {
      root: null,
      threshold: 0.1
    });
    readingObserver.observe(bottomSentinel.value);
  });
};

// Dynamic YouTube player tracker
let ytPlayer: any = null;
let ytPollInterval: any = null;

const setupYouTubeTracking = () => {
  if (ytPlayer) {
    try {
      ytPlayer.destroy();
    } catch (e) {}
    ytPlayer = null;
  }
  if (ytPollInterval) {
    clearInterval(ytPollInterval);
    ytPollInterval = null;
  }
  
  if (typeof window !== 'undefined' && videoEmbedId.value && isOnline.value) {
    const isYTRuntimeReady = () => {
      const win = window as any;
      return win.YT && win.YT.Player && typeof win.YT.Player === 'function';
    };

    if (!isYTRuntimeReady()) {
      // If script is not loaded, inject it
      const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
      
      const win = window as any;
      const originalCallback = win.onYouTubeIframeAPIReady;
      win.onYouTubeIframeAPIReady = () => {
        if (originalCallback) {
          try {
            originalCallback();
          } catch (e) {}
        }
        initializePlayer();
      };

      // Set a fallback polling interval in case onYouTubeIframeAPIReady has already fired or is bypassed
      let polls = 0;
      ytPollInterval = setInterval(() => {
        if (isYTRuntimeReady()) {
          clearInterval(ytPollInterval);
          ytPollInterval = null;
          initializePlayer();
        } else {
          polls++;
          if (polls > 100) { // Keep trying for 10 seconds maximum
            clearInterval(ytPollInterval);
            ytPollInterval = null;
          }
        }
      }, 100);
    } else {
      initializePlayer();
    }
  }
};

const initializePlayer = () => {
  if (typeof window === 'undefined' || !videoEmbedId.value) return;
  const win = window as any;
  if (!win.YT || !win.YT.Player || typeof win.YT.Player !== 'function') return;
  
  nextTick(() => {
    const el = document.getElementById('lesson-youtube-player-element');
    if (!el) {
      // Try again in next tick / brief timeout if element isn't in DOM yet
      setTimeout(() => {
        initializePlayer();
      }, 80);
      return;
    }

    // Double check that we don't duplicate existing player
    if (ytPlayer) {
      return;
    }

    try {
      ytPlayer = new win.YT.Player('lesson-youtube-player-element', {
        height: '100%',
        width: '100%',
        videoId: videoEmbedId.value,
        events: {
          'onStateChange': (event: any) => {
            // YT.PlayerState.ENDED is 0
            if (event.data === 0) {
              isYTCompleted.value = true;
              emit('save-progress', currentLesson.value.id, 100, 'video');
            }
          }
        }
      });
    } catch (e) {
      console.error(`[YOUTUBE PLAYER ERRO] Falha crítica de instanciamento do YouTube Player para a lição ${currentLesson.value?.id || 'unknown'} com o vídeo ${videoEmbedId.value || 'none'}:`, e);
    }
  });
};

watch([currentLesson, isOnline], () => {
  setupReadingObserver();
  setupYouTubeTracking();
}, { immediate: true });

// Offline caching support states and functions
const isOfflineAvailable = ref(false);
const isDownloadingOffline = ref(false);

const checkOfflineStatus = () => {
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(`course_offline_${props.course.id}`);
    isOfflineAvailable.value = cached ? true : false;
  }
};

const makeCourseAvailableOffline = () => {
  isDownloadingOffline.value = true;
  
  // Package course and lessons to save locally
  setTimeout(() => {
    try {
      localStorage.setItem(`course_offline_${props.course.id}`, JSON.stringify({
        course: props.course,
        lessons: props.lessons,
        savedAt: new Date().toISOString()
      }));
      
      // Save to list of downloaded courses
      const savedList = JSON.parse(localStorage.getItem('offline_downloaded_course_ids') || '[]');
      if (!savedList.includes(props.course.id)) {
        savedList.push(props.course.id);
        localStorage.setItem('offline_downloaded_course_ids', JSON.stringify(savedList));
      }
      
      isOfflineAvailable.value = true;
    } catch (e) {
      console.error(e);
      showToast(locale.value === 'pt' ? "Erro ao salvar curso offline. Verifique o espaço do navegador." : "Error saving course offline. Check browser space.", "error");
    } finally {
      isDownloadingOffline.value = false;
    }
  }, 1000);
};

const downloadInteractiveHTML = async () => {
  isDownloadingOffline.value = true;
  try {
    await generateInteractiveHTML(props.course, props.lessons);
  } catch (err) {
    console.error("Erro ao gerar arquivo HTML:", err);
    showToast(locale.value === 'pt' ? "Erro ao exportar material offline." : "Error exporting material offline.", "error");
  } finally {
    isDownloadingOffline.value = false;
  }
};

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  checkOfflineStatus();
});

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
  if (readingObserver) {
    readingObserver.disconnect();
  }
  if (ytPlayer) {
    try {
      ytPlayer.destroy();
    } catch (e) {}
  }
});
</script>

<template>
  <div v-if="!currentLesson" class="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800">
    <AlertCircle id="no-lesson-icon" class="w-12 h-12 text-amber-500 mb-4" />
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
      {{ locale === 'pt' ? 'Currículo em Construção' : 'Curriculum under Construction' }}
    </h3>
    <p class="text-gray-500 dark:text-slate-400 max-w-sm">
      {{ locale === 'pt' ? 'Este mini-curso não possui lições cadastradas no momento. Volte em breve!' : 'This mini-course does not have any registered lessons at the moment. Come back soon!' }}
    </p>
    <button 
      id="back-empty-lessons"
      @click="emit('back')"
      class="mt-6 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg transition-all cursor-pointer border border-gray-200 dark:border-slate-700"
    >
      {{ locale === 'pt' ? 'Voltar aos Cursos' : 'Back to Courses' }}
    </button>
  </div>

  <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
    
    <!-- Sidebar: Lesson outline -->
    <div class="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xs border border-gray-100/80 dark:border-slate-800 text-left">
      <button
        id="btn-back-to-catalog"
        @click="emit('back')"
        class="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-6 cursor-pointer"
      >
        <ChevronLeft class="w-4 h-4 mr-1" />
        {{ locale === 'pt' ? 'Voltar ao Catálogo' : 'Back to Catalog' }}
      </button>

      <div class="mb-6">
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-slate-700">
          {{ locale === 'pt' ? 'Nível' : 'Level' }} {{ course.level }}
        </span>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mt-2 leading-tight">{{ course.title }}</h2>
        <p class="text-xs text-gray-500 dark:text-slate-450 mt-1">
          {{ locale === 'pt' ? 'Por' : 'By' }} {{ course.creatorName }}
        </p>
      </div>

      <!-- OFFLINE PWA CACHE MODULE -->
      <div class="mb-6 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-blue-100/50 dark:border-blue-900/30 space-y-2.5 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-extrabold uppercase tracking-widest text-blue-800 dark:text-blue-450 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {{ locale === 'pt' ? 'Acesso Offline' : 'Offline Access' }}
          </span>
          <span 
            class="text-[9.5px] font-black px-2 py-0.5 rounded-full"
            :class="isOfflineAvailable ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'"
          >
            {{ isOfflineAvailable 
              ? (locale === 'pt' ? 'Concluído' : 'Completed') 
              : (locale === 'pt' ? 'Apenas Online' : 'Online Only') 
            }}
          </span>
        </div>
        
        <button
          v-if="!isOfflineAvailable"
          type="button"
          @click="makeCourseAvailableOffline"
          :disabled="isDownloadingOffline"
          class="w-full text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-white bg-blue-600 hover:bg-blue-700 transition"
        >
          <span v-if="isDownloadingOffline" class="flex gap-1 items-center">
            <svg class="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ locale === 'pt' ? 'Salvando...' : 'Saving...' }}
          </span>
          <span v-else>{{ locale === 'pt' ? 'Disponibilizar Offline' : 'Make Available Offline' }}</span>
        </button>

        <div v-else class="text-xs text-emerald-700 dark:text-emerald-450 font-medium flex items-center justify-center gap-1 fill-emerald-600 py-1.5 border border-dashed border-emerald-200 dark:border-emerald-900/40 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20">
          {{ locale === 'pt' ? '✓ Conteúdo salvo offline!' : '✓ Content saved offline!' }}
        </div>
      </div>

      <!-- EXPORTER BLOCK (KEEP THE KNOWLEDGE) -->
      <div 
        id="exporter-html-card" 
        class="mb-6 p-4 rounded-xl border space-y-2.5 shadow-2xs text-left transition-all duration-300"
        :style="{
          backgroundColor: 'color-mix(in srgb, ' + courseThemeColor + ' 8%, var(--bg-color, rgba(255, 255, 255, 0.4)))',
          borderColor: 'color-mix(in srgb, ' + courseThemeColor + ' 20%, rgba(226, 232, 240, 0.5))'
        }"
      >
        <span 
          class="text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5"
          :style="{ color: 'color-mix(in srgb, ' + courseThemeColor + ' 90%, #000000)' }"
        >
          <Download class="w-3.5 h-3.5" :style="{ color: 'color-mix(in srgb, ' + courseThemeColor + ' 90%, #000000)' }" />
          {{ locale === 'pt' ? 'Guardar Conhecimento' : 'Keep Knowledge' }}
        </span>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal animate-fadeIn">
          {{ locale === 'pt' 
            ? '"Fique com o conhecimento e o material, ele é gratuito e seu para sempre!" Baixe o mini-curso como um arquivo HTML offline interativo completo.' 
            : '"Keep the knowledge and material, it is free and yours forever!" Download the mini-course as a complete interactive offline HTML file.' 
          }}
        </p>
        <button
          id="btn-download-interactive-html"
          type="button"
          @click="downloadInteractiveHTML"
          class="w-full text-xs font-black uppercase tracking-wide py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-white transition-all shadow-2xs hover:shadow-xs hover:brightness-110 active:scale-95"
          :style="{ backgroundColor: courseThemeColor }"
        >
          <Download class="w-4 h-4 shrink-0" />
          {{ locale === 'pt' ? 'Baixar Curso (.html)' : 'Download Course (.html)' }}
        </button>
      </div>

      <!-- Progress Tracker Widget -->
      <div class="mb-6 pb-6 border-b border-gray-100 dark:border-slate-800">
        <div class="flex justify-between text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">
          <span>{{ locale === 'pt' ? 'Seu Progresso' : 'Your Progress' }}</span>
          <span>{{ completedCount }} {{ locale === 'pt' ? 'de' : 'of' }} {{ lessons.length }} {{ locale === 'pt' ? 'lições' : 'lessons' }}</span>
        </div>
        <div class="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            class="bg-blue-600 h-2 rounded-full transition-all duration-500" 
            :style="{ width: `${lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0}%` }"
          />
        </div>

        <div v-if="isCourseFullyCompleted" class="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Award class="w-5 h-5 text-emerald-600 dark:text-emerald-450" />
            <span class="text-xs font-semibold text-emerald-800 dark:text-emerald-300">{{ locale === 'pt' ? 'Curso Concluído!' : 'Course Completed!' }}</span>
          </div>
          <button
            id="btn-get-certificate-side"
            @click="handleClaimCertificate"
            class="text-xs bg-emerald-600 hover:bg-emerald-775 text-white font-medium py-1.5 px-3 rounded-lg transition-colors cursor-pointer animate-pulse"
          >
            {{ locale === 'pt' ? 'Gerar Certificado' : 'Generate Certificate' }}
          </button>
        </div>
      </div>

      <!-- Curriculum list -->
      <div class="space-y-2">
        <p class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 mb-3 block">
          {{ locale === 'pt' ? 'Conteúdo Programático' : 'Syllabus' }}
        </p>
        <button
          v-for="(lesson, idx) in lessons"
          :key="lesson.id"
          :id="`lesson-tab-${lesson.id}`"
          @click="activeLessonIndex = idx"
          :class="[
            'w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between border cursor-pointer min-w-0',
            idx === activeLessonIndex 
              ? 'bg-blue-50/40 dark:bg-blue-950/50 border-blue-200 dark:border-blue-700 text-blue-900 dark:!text-white font-bold shadow-2xs' 
              : 'bg-white dark:bg-slate-900 border-transparent dark:border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-750 dark:text-slate-300'
          ]"
        >
          <div class="flex items-center gap-3 w-full min-w-0">
            <span :class="[
               'w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0',
              idx === activeLessonIndex ? 'bg-blue-600 text-white font-bold' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'
            ]">
              {{ lesson.order }}
            </span>
            <div class="truncate min-w-0 w-full text-left">
              <p :class="['text-sm truncate block w-full', idx === activeLessonIndex ? 'font-semibold text-blue-950 dark:!text-white' : 'text-gray-700 dark:text-slate-300']">{{ lesson.title }}</p>
              <p v-if="lesson.quiz && lesson.quiz.length > 0" :class="['text-[10px] font-medium', idx === activeLessonIndex ? 'text-blue-600 dark:!text-blue-300' : 'text-gray-400 dark:text-slate-500']">
                {{ lesson.quiz.length }} {{ locale === 'pt' ? 'questões de fixação' : 'practice questions' }}
              </p>
            </div>
          </div>
          <CheckCircle v-if="isLessonCompletedFn(lesson.id)" class="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
        </button>
      </div>
    </div>

    <!-- Main Study Area -->
    <div class="lg:col-span-8 space-y-6">
      
      <!-- Lesson Material -->
      <div class="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 text-left">
        <div class="flex items-center gap-3 text-xs font-medium text-gray-400 dark:text-slate-400 mb-3">
          <BookOpen class="w-4 h-4" />
          <span>{{ locale === 'pt' ? 'LIÇÃO' : 'LESSON' }} {{ currentLesson.order }} {{ locale === 'pt' ? 'de' : 'of' }} {{ lessons.length }}</span>
          <span v-if="isLessonCompleted" class="flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-semibold">
            <CheckCircle class="w-3 h-3" /> {{ locale === 'pt' ? 'Concluída' : 'Completed' }}
          </span>
        </div>
        
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-4 mb-3">
          {{ currentLesson.title }}
        </h1>

        <!-- Progress requirement checklist widget for student -->
        <div class="mb-6 p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80 rounded-xl space-y-2 text-left shadow-2xs">
          <div class="flex items-center justify-between">
            <p class="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck class="w-4 h-4 text-emerald-600 dark:text-emerald-450" />
              {{ locale === 'pt' ? 'Critérios de Conclusão desta Lição' : 'Completion Criteria for this Lesson' }}
            </p>
            <span class="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse" :class="isLessonCompleted ? 'bg-emerald-100 dark:bg-emerald-900/35 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/35 text-amber-800 dark:text-amber-300'">
              {{ isLessonCompleted 
                ? (locale === 'pt' ? '✓ Concluiu Tudo' : '✓ Completed All') 
                : (locale === 'pt' ? 'Atividades Pendentes' : 'Pending Activities') 
              }}
            </span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <!-- 1. Reading Requirement -->
            <div class="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200 block">1. {{ locale === 'pt' ? 'Estudo Teórico' : 'Theoretical Study' }}</span>
                <span class="text-[9.5px] text-slate-500 dark:text-slate-400 block font-semibold leading-tight">
                  {{ lessonProgressConfig.requireReading 
                    ? (locale === 'pt' ? 'Role até o final do texto' : 'Scroll to the end') 
                    : (locale === 'pt' ? 'Leitura recomendada' : 'Recommended reading') 
                  }}
                </span>
               </div>
               <button
                 type="button"
                 @click="emit('save-progress', currentLesson.id, 100, 'reading')"
                 :disabled="isReadingCompleted(currentLesson.id) || (lessonProgressConfig.requireReading && !hasReadToBottom)"
                 :class="[
                   'w-full py-1 mt-2.5 text-[10px] font-extrabold rounded-md border transition-all cursor-pointer text-center uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed',
                   isReadingCompleted(currentLesson.id)
                     ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100/50 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-extrabold'
                     : (lessonProgressConfig.requireReading && !hasReadToBottom
                         ? 'bg-amber-100 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-300 font-bold'
                         : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent')
                 ]"
               >
                 <span v-if="isReadingCompleted(currentLesson.id)">✓ {{ locale === 'pt' ? 'Texto Lido' : 'Text Read' }}</span>
                 <span v-else-if="lessonProgressConfig.requireReading && !hasReadToBottom">{{ locale === 'pt' ? 'Role até o fim ▲' : 'Scroll to the end ▲' }}</span>
                 <span v-else>{{ locale === 'pt' ? 'Marcar Lido' : 'Mark as Read' }}</span>
               </button>
            </div>

            <!-- 2. Video Requirement -->
            <div class="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200 block">2. {{ locale === 'pt' ? 'Vídeo de Apoio' : 'Supporting Video' }}</span>
                <span class="text-[9.5px] text-slate-500 dark:text-slate-400 block font-semibold leading-tight">
                  {{ lessonProgressConfig.requireVideo 
                    ? (isOnline ? (locale === 'pt' ? 'Assista até o fim' : 'Watch till the end') : (locale === 'pt' ? 'Pular Vídeo (Offline)' : 'Skip Video (Offline)')) 
                    : (locale === 'pt' ? 'Opcional / Auxiliar' : 'Optional / Auxiliary') 
                  }}
                </span>
              </div>
              <button
                type="button"
                @click="emit('save-progress', currentLesson.id, 100, 'video')"
                :disabled="isVideoWatched(currentLesson.id) || !currentLesson.videoUrl || (isOnline && lessonProgressConfig.requireVideo && !isYTCompleted)"
                :class="[
                  'w-full py-1 mt-2.5 text-[10px] font-extrabold rounded-md border transition-all cursor-pointer text-center uppercase tracking-wide disabled:opacity-55 disabled:cursor-not-allowed',
                  isVideoWatched(currentLesson.id)
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100/50 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-extrabold'

                    : (!currentLesson.videoUrl 
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-semibold' 
                        : (isOnline && lessonProgressConfig.requireVideo && !isYTCompleted
                            ? 'bg-amber-100 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-300 font-bold'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent'))
                ]"
              >
                <span v-if="!currentLesson.videoUrl">{{ locale === 'pt' ? 'Sem Vídeo' : 'No Video' }}</span>
                <span v-else-if="isVideoWatched(currentLesson.id)">✓ {{ locale === 'pt' ? 'Assistido' : 'Watched' }}</span>
                <span v-else-if="isOnline && lessonProgressConfig.requireVideo && !isYTCompleted">{{ locale === 'pt' ? 'Assista até o fim ▲' : 'Watch till the end ▲' }}</span>
                <span v-else-if="!isOnline">{{ locale === 'pt' ? 'Pular Vídeo (Offline)' : 'Skip Video (Offline)' }}</span>
                <span v-else>{{ locale === 'pt' ? 'Marcar Assistido' : 'Mark as Watched' }}</span>
              </button>
            </div>

            <!-- 3. Quiz Requirement -->
            <div class="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200 block">3. {{ locale === 'pt' ? 'Quiz Avaliativo' : 'Evaluation Quiz' }}</span>
                <span class="text-[9.5px] text-slate-500 dark:text-slate-400 block font-semibold leading-tight mb-2">
                  {{ lessonProgressConfig.requireQuiz 
                    ? (locale === 'pt' ? `Requer acerto >= ${quizPassScore}%` : `Requires score >= ${quizPassScore}%`) 
                    : (locale === 'pt' ? 'Opcional para treino' : 'Optional practice') 
                  }}
                </span>
              </div>
              
              <div
                :class="[
                  'w-full py-1 text-[10px] font-extrabold rounded-md border text-center uppercase tracking-wide transition-all',
                  isQuizCompleted(currentLesson.id) && ((getQuizScore(currentLesson.id) || 0) >= quizPassScore)
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100/50 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-extrabold'
                    : (currentLesson.quiz?.length 
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-550 dark:text-slate-400 font-semibold' 
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850 text-slate-400 dark:text-slate-500')
                ]"
              >
                <span v-if="!currentLesson.quiz?.length">{{ locale === 'pt' ? 'Sem Quiz' : 'No Quiz' }}</span>
                <span v-else-if="isQuizCompleted(currentLesson.id) && ((getQuizScore(currentLesson.id) || 0) >= quizPassScore)">✓ {{ locale === 'pt' ? 'Resolvido' : 'Solved' }} ({{ getQuizScore(currentLesson.id) }}%)</span>
                <span v-else>{{ locale === 'pt' ? 'Resolver Abaixo' : 'Solve Below' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Embedded Video Player -->
        <div v-if="videoEmbedId" class="mb-8">
          <div class="rounded-xl overflow-hidden aspect-video shadow-xs border border-gray-100 dark:border-slate-800 bg-slate-900 relative">
            <div v-if="!isOnline" class="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 bg-slate-950 text-center">
              <Video class="w-12 h-12 text-slate-600 mb-2" />
              <p class="text-sm font-bold text-slate-300">{{ locale === 'pt' ? 'Player de Vídeo Indisponível (Modo Offline)' : 'Video Player Unavailable (Offline Mode)' }}</p>
              <p class="text-xs text-slate-500 mt-1 max-w-sm">{{ locale === 'pt' ? 'Você está sem internet. O critério de visualizar ao vídeo foi flexibilizado para que você continue estudando na lição sem travar.' : 'You are offline. The requirement to watch the video has been bypassed so you can continue learning without interruptions.' }}</p>
            </div>
            <div v-else id="lesson-youtube-player-element" class="w-full h-full"></div>
          </div>
          <div v-if="isOnline" class="mt-3 p-3.5 rounded-xl text-left flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20">
            <span class="text-sm select-none">💡</span>
            <div class="text-xs text-amber-900 dark:text-amber-300 leading-normal font-semibold">
              {{ locale === 'pt' ? 'Problemas com o vídeo ou erro de reprodução? Você também pode' : 'Problems with the video or playback error? You can also' }} <a :href="`https://www.youtube.com/watch?v=${videoEmbedId}`" target="_blank" class="font-extrabold underline hover:opacity-80 inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">{{ locale === 'pt' ? 'assistir diretamente no YouTube ↗' : 'watch directly on YouTube ↗' }}</a>.
            </div>
          </div>
        </div>

        <!-- Interactive Lesson Text -->
        <div class="max-w-none text-gray-700 leading-relaxed relative">
          <MarkdownRenderer :content="currentLesson.content" />
          
          <!-- Sentinel to monitor reading reached bottom -->
          <div ref="bottomSentinel" id="reading-bottom-sentinel" class="w-full h-4 absolute bottom-0 select-none pointer-events-none opacity-0"></div>
        </div>
      </div>

      <!-- Quiz trigger action block to save space & prevent scroll fatigue -->
      <div v-if="currentLesson.quiz && currentLesson.quiz.length > 0" class="bg-slate-50 dark:bg-slate-950/40 p-6 sm:p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-2xs mt-6">
        <div class="space-y-1">
          <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle class="w-5 h-5 shrink-0" :style="{ color: courseThemeColor }" />
            {{ locale === 'pt' ? 'Prova de Fixação da Lição' : 'Lesson Practice Quiz' }}
          </h3>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed font-semibold">
            {{ locale === 'pt' 
              ? `Esta lição possui um questionário integrado de ` 
              : `This lesson features an integrated quiz of `
            }}<strong>{{ currentLesson.quiz.length }} {{ locale === 'pt' ? 'perguntas' : 'questions' }}</strong>{{ locale === 'pt'
              ? ` para testar seu aprendizado técnico.`
              : ` to test your learning.`
            }}
          </p>
          <div v-if="isQuizCompleted(currentLesson.id) || isQuizSubmitted" class="pt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:!text-emerald-400 font-bold">
            <ShieldCheck class="w-4 h-4 animate-bounce" />
            {{ locale === 'pt' 
              ? `Aprovado com ${getQuizScore(currentLesson.id) || quizScore || 100}% de desempenho!` 
              : `Passed with ${getQuizScore(currentLesson.id) || quizScore || 100}% score!`
            }}
          </div>
        </div>
        
        <button
          @click="showQuizModal = true"
          :style="{ backgroundColor: courseThemeColor }"
          class="px-5 py-3 hover:opacity-90 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs shrink-0 flex items-center justify-center gap-2 cursor-pointer hover:scale-102 active:scale-98"
        >
          <Award class="w-4 h-4" />
          {{ quizButtonText }}
        </button>
      </div>

      <!-- Lesson has no quiz, allow immediate completion marking for support flexibility -->
      <div v-else class="bg-slate-50 dark:bg-slate-950/40 p-6 sm:p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-left mt-6 shadow-2xs">
        <div>
          <h4 class="font-bold text-gray-900 dark:text-white text-sm">{{ locale === 'pt' ? 'Leitura Finalizada?' : 'Finished Reading?' }}</h4>
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-semibold">{{ locale === 'pt' ? 'Marque como concluído para atualizar seu gráfico de estudos.' : 'Mark as completed to update your studies graph.' }}</p>
        </div>
        
        <button
          id="btn-confirm-read"
          @click="emit('save-progress', currentLesson.id, 100, 'reading')"
          :disabled="isLessonCompleted"
          :class="[
            'px-5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer',
            isLessonCompleted 
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-transparent' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          ]"
        >
          {{ isLessonCompleted 
            ? (locale === 'pt' ? "✓ Concluído" : "✓ Completed") 
            : (locale === 'pt' ? "Marcar Concluído" : "Mark as Completed") 
          }}
        </button>
      </div>

      <!-- Floating Quiz Modal Overlay (Only closable after answering & submitting) -->
      <Teleport to="body">
        <div v-if="showQuizModal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div 
            class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn"
          >
            <!-- Header -->
            <div class="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
              <div class="text-left">
                <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Award class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  {{ locale === 'pt' ? 'Prova da Lição:' : 'Lesson Quiz:' }} {{ currentLesson.title }}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                  {{ locale === 'pt' ? 'Aproveitamento mínimo requerido de' : 'Minimum score required:' }} {{ quizPassScore }}%
                </p>
              </div>
              
              <!-- Close (X) button is strictly shown only after submission to ensure focus -->
              <button 
                v-if="isQuizSubmitted"
                @click="showQuizModal = false"
                :title="locale === 'pt' ? 'Fechar e Retornar' : 'Close and Return'"
                class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-all border border-transparent dark:border-slate-800 bg-transparent cursor-pointer flex items-center justify-center"
              >
                <X class="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <!-- Quiz Questions content area (Scrollable) -->
            <div class="p-6 sm:p-8 overflow-y-auto space-y-6 text-left flex-1">
              <!-- Inline Guidance Banner -->
              <div v-if="!isQuizSubmitted" class="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex items-start gap-3">
                <AlertCircle class="w-5 h-5 text-amber-600 dark:text-amber-450 shrink-0 mt-0.5 animate-pulse" />
                <div class="space-y-0.5">
                  <p class="text-xs font-black text-amber-900 dark:text-amber-300">
                    {{ locale === 'pt' ? 'Prova Ativa em Andamento' : 'Active Quiz in Progress' }}
                  </p>
                  <p class="text-[11px] text-amber-800 dark:text-amber-400 font-semibold leading-relaxed">
                    {{ locale === 'pt' 
                      ? 'Para garantir sua trilha pedagógica, esta janela de prova é selada. Responda tudo com atenção e clique em Enviar Respostas no rodapé quando concluir.' 
                      : 'To guarantee your educational path, this quiz window is locked. Answer all questions carefully and click Submit Answers at the footer when finished.' 
                    }}
                  </p>
                </div>
              </div>

              <div class="space-y-6">
                <div v-for="(q, qIdx) in currentLesson.quiz" :key="qIdx" class="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p class="font-bold text-slate-900 dark:text-white text-sm mb-3">
                    {{ qIdx + 1 }}. {{ q.question }}
                  </p>
                  
                  <div class="space-y-2.5">
                    <button
                      v-for="(opt, oIdx) in q.options"
                      :key="oIdx"
                      :id="`quiz-modal-${qIdx}-option-${oIdx}`"
                      :disabled="isQuizSubmitted"
                      @click="handleSelectAnswer(qIdx, oIdx)"
                      :class="[
                        'w-full text-left p-3.5 text-xs sm:text-sm rounded-xl border font-semibold transition-all flex items-center justify-between cursor-pointer',
                        Number(selectedAnswers[qIdx]) === Number(oIdx) 
                          ? (isQuizSubmitted 
                              ? (Number(q.correctAnswer) === Number(oIdx) ? 'bg-emerald-50 dark:bg-emerald-950/45 border-emerald-500 dark:border-emerald-700 text-emerald-900 dark:!text-emerald-300 font-extrabold' : 'bg-rose-50 dark:bg-rose-950/45 border-rose-300 dark:border-rose-900 text-rose-900 dark:!text-rose-300 font-extrabold') 
                              : 'font-extrabold ring-2')
                          : (isQuizSubmitted 
                              ? (Number(q.correctAnswer) === Number(oIdx) ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-800 text-emerald-950 dark:!text-emerald-300 font-extrabold' : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-450 dark:!text-slate-500 opacity-60') 
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:!text-slate-200')
                      ]"
                      :style="[
                        Number(selectedAnswers[qIdx]) === Number(oIdx) && !isQuizSubmitted 
                          ? { borderColor: courseThemeColor, color: courseThemeColor, backgroundColor: courseThemeColor + '12', '--tw-ring-color': courseThemeColor + '40' } 
                          : {}
                      ]"
                    >
                      <span class="pr-2">{{ opt }}</span>
                      
                      <span v-if="isQuizSubmitted && Number(q.correctAnswer) === Number(oIdx)" class="text-[10px] text-emerald-600 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 py-0.5 px-2.5 rounded-full uppercase shrink-0 font-black">
                        {{ locale === 'pt' ? 'Correto' : 'Correct' }}
                      </span>
                      <span v-if="isQuizSubmitted && Number(selectedAnswers[qIdx]) === Number(oIdx) && Number(q.correctAnswer) !== Number(oIdx)" class="text-[10px] text-rose-600 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/50 py-0.5 px-2.5 rounded-full uppercase shrink-0 font-black">
                        {{ locale === 'pt' ? 'Incorreto' : 'Incorrect' }}
                      </span>
                    </button>
                  </div>

                  <div v-if="isQuizSubmitted" :style="{ backgroundColor: courseThemeColor + '10' }" class="mt-4 p-4 border border-slate-100 dark:border-slate-800 rounded-xl text-xs leading-relaxed text-slate-705 dark:!text-slate-200 shadow-2xs">
                    <strong class="font-extrabold" :style="{ color: courseThemeColor }">
                      {{ locale === 'pt' ? 'Dica Pedagógica:' : 'Pedagogical Tip:' }}
                    </strong>
                    <span class="text-slate-650 dark:!text-slate-800 font-semibold ml-1">{{ q.explanation }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sticky footer of the modal -->
            <div class="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div class="text-left w-full sm:w-auto">
                <div v-if="isQuizSubmitted && quizScore !== null" class="text-xs sm:text-sm">
                  <span class="font-bold text-slate-700 dark:text-slate-300">
                    {{ locale === 'pt' ? 'Seu Desempenho:' : 'Your Score:' }}
                  </span>
                  <span :class="['font-black text-sm sm:text-base block sm:inline', quizScore >= quizPassScore ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400']">
                    {{ quizScore }}% ({{ quizScore >= quizPassScore 
                      ? (locale === 'pt' ? "✓ Aprovado para Conclusão" : "✓ Passed for Completion") 
                      : (locale === 'pt' ? "Abaixo da Média Necessária (Requer >= " + quizPassScore + "%)" : "Below Required Passing Score (Requires >= " + quizPassScore + "%)") 
                    }})
                  </span>
                </div>
                <div v-else class="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                  {{ locale === 'pt' 
                    ? `Respostas: ${Object.keys(selectedAnswers).length} de ${currentLesson.quiz.length} preenchidas` 
                    : `Answers: ${Object.keys(selectedAnswers).length} of ${currentLesson.quiz.length} completed` 
                  }}
                </div>
              </div>

              <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  v-if="!isQuizSubmitted"
                  id="btn-submit-quick-quiz"
                  :disabled="isSubmitting"
                  @click="handleSubmitQuiz"
                  :style="{ backgroundColor: courseThemeColor }"
                  class="w-full sm:w-auto px-6 py-3 hover:opacity-90 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {{ isSubmitting 
                    ? (locale === 'pt' ? "Enviando Prova..." : "Submitting Quiz...") 
                    : (locale === 'pt' ? "Enviar e Entregar Prova" : "Submit Quiz") 
                  }}
                  <ArrowRight class="w-4 h-4" />
                </button>
                
                <div v-else class="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <button
                    v-if="quizScore !== null && quizScore < quizPassScore"
                    id="btn-retry-quiz"
                    @click="selectedAnswers = {}; isQuizSubmitted = false; quizScore = null;"
                    class="w-full sm:w-auto px-5 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-755 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {{ locale === 'pt' ? 'Tentar Novamente' : 'Try Again' }}
                  </button>
                  
                  <button
                    @click="showQuizModal = false"
                    :style="{ backgroundColor: courseThemeColor }"
                    class="w-full sm:w-auto px-6 py-3 hover:opacity-90 text-white text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    {{ locale === 'pt' ? 'Concluir e Fechar' : 'Complete and Close' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>
