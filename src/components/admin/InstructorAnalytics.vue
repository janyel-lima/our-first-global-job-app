<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import AnalyticsStudentTable from './analytics/AnalyticsStudentTable.vue';
import { 
  FileText, 
  UploadCloud, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  Search,
  Trash2, 
  Check, 
  Users, 
  ExternalLink,
  BookOpen,
  Award,
  Info,
  Trash
} from 'lucide-vue-next';
import * as XLSX from 'xlsx';
import { Course, Lesson, Progress, ClassTurma, UserProfile } from '../../types';
import { showToast, useAppState } from '../../composables/useAppState';
import CertificateViewer from '../courses/CertificateViewer.vue';
import { useI18n } from '../../composables/useI18n';

const props = defineProps<{
  courses: Course[];
  progressReports: Progress[];
  classes: ClassTurma[];
  lessons: Lesson[];
  users?: UserProfile[];
  deleteCourseFn?: (courseId: string) => Promise<void>;
  instructorId?: string;
}>();

const { currentUser, userProfile, reviews } = useAppState();
const { t, locale } = useI18n();

const getCourseReviews = (courseId: string) => {
  return (reviews.value || []).filter(r => r.courseId === courseId);
};

const getCourseAverageRating = (courseId: string) => {
  const courseReviews = getCourseReviews(courseId);
  if (courseReviews.length === 0) return 0;
  const sum = courseReviews.reduce((acc, r) => acc + r.rating, 0);
  return (sum / courseReviews.length).toFixed(1);
};

const getCourseReactionDistribution = (courseId: string) => {
  const courseReviews = getCourseReviews(courseId);
  const total = courseReviews.length;
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  courseReviews.forEach(r => {
    const star = Math.round(r.rating) as 1|2|3|4|5;
    if (counts[star] !== undefined) {
      counts[star]++;
    }
  });
  return {
    total,
    5: total > 0 ? Math.round((counts[5] / total) * 100) : 0,
    4: total > 0 ? Math.round((counts[4] / total) * 100) : 0,
    3: total > 0 ? Math.round((counts[3] / total) * 100) : 0,
    2: total > 0 ? Math.round((counts[2] / total) * 100) : 0,
    1: total > 0 ? Math.round((counts[1] / total) * 100) : 0,
  };
};

const instructorId = computed(() => props.instructorId || '');

const courses = computed(() => {
  if (!instructorId.value) return props.courses;
  return props.courses.filter(c => c.creatorId === instructorId.value);
});

const courseIds = computed(() => courses.value.map(c => c.id));

const progressReports = computed(() => {
  if (!instructorId.value) return props.progressReports;
  return props.progressReports.filter(p => courseIds.value.includes(p.courseId));
});

const classes = computed(() => {
  if (!instructorId.value) return props.classes;
  return props.classes.filter(cl => courseIds.value.includes(cl.courseId));
});

const lessons = computed(() => {
  if (!instructorId.value) return props.lessons;
  return props.lessons.filter(l => courseIds.value.includes(l.courseId));
});

const emit = defineEmits<{
  (e: 'delete-course', courseId: string): void;
  (e: 'update-course-config', courseId: string, updates: Partial<Course>): void;
}>();

const analyticsTab = ref<'students' | 'courses'>('students');
const expandedCourseId = ref<string | null>(null);

const isJanyelAdmin = computed(() => {
  const email = userProfile.value?.email || currentUser.value?.email || "";
  const isEmailAdmin = email === "janyel.lima2809@outlook.com" || email === "kibedasppk@gmail.com" || email === "admin@englishvolunteer.org";
  return isEmailAdmin || !!userProfile.value?.isAdmin;
});

// Certificate customizer states
const editingCertCourseId = ref<string | null>(null);
const certColorInput = ref('#1e3a8a');
const certIconUrlInput = ref('');
const certBgStyleInput = ref<'vintage-parchment' | 'dark-velvet' | 'clean-light'>('clean-light');
const certFrameStyleInput = ref<'medieval-gothic' | 'classic-imperial' | 'modern-border'>('modern-border');
const certDetailColorInput = ref<'gold' | 'silver' | 'bronze' | 'ruby' | 'emerald' | 'theme'>('theme');

// Preview certificate states
const showPreviewCertData = ref<{
  studentName: string;
  courseTitle: string;
  primaryColor: string;
  iconUrl: string;
  bgStyle: any;
  frameStyle: any;
  detailColor: any;
  creatorId: string;
  isTransferred?: boolean;
} | null>(null);

const startEditCert = (course: Course) => {
  editingCertCourseId.value = course.id;
  certColorInput.value = course.certificateConfig?.primaryColor || '#1e3a8a';
  certIconUrlInput.value = course.certificateConfig?.iconUrl || '';
  certBgStyleInput.value = course.certificateConfig?.bgStyle || 'clean-light';
  certFrameStyleInput.value = course.certificateConfig?.frameStyle || 'modern-border';
  certDetailColorInput.value = course.certificateConfig?.detailColor || 'theme';
};

const cancelEditCert = () => {
  editingCertCourseId.value = null;
  showPreviewCertData.value = null;
};

const saveCertConfig = () => {
  if (!editingCertCourseId.value) return;
  emit('update-course-config', editingCertCourseId.value, {
    certificateConfig: {
      primaryColor: certColorInput.value,
      iconUrl: certIconUrlInput.value,
      bgStyle: isJanyelAdmin.value ? certBgStyleInput.value : 'clean-light',
      frameStyle: isJanyelAdmin.value ? certFrameStyleInput.value : 'modern-border',
      detailColor: isJanyelAdmin.value ? certDetailColorInput.value : 'theme'
    }
  });
  editingCertCourseId.value = null;
  showPreviewCertData.value = null;
};

// Open live preview with simulated logged-in tutor/admin details
const openPreviewCert = (course: Course) => {
  const tutorName = userProfile.value?.displayName || "Tutor Voluntário";
  showPreviewCertData.value = {
    studentName: tutorName,
    courseTitle: course.title,
    primaryColor: certColorInput.value,
    iconUrl: certIconUrlInput.value,
    bgStyle: isJanyelAdmin.value ? certBgStyleInput.value : 'clean-light',
    frameStyle: isJanyelAdmin.value ? certFrameStyleInput.value : 'modern-border',
    detailColor: isJanyelAdmin.value ? certDetailColorInput.value : 'theme',
    creatorId: course.creatorId,
    isTransferred: course.isTransferred
  };
};

// Update live preview values in real-time as the fields are modified
watch(() => [certColorInput.value, certIconUrlInput.value, certBgStyleInput.value, certFrameStyleInput.value, certDetailColorInput.value], () => {
  if (showPreviewCertData.value) {
    showPreviewCertData.value.primaryColor = certColorInput.value;
    showPreviewCertData.value.iconUrl = certIconUrlInput.value;
    showPreviewCertData.value.bgStyle = isJanyelAdmin.value ? certBgStyleInput.value : 'clean-light';
    showPreviewCertData.value.frameStyle = isJanyelAdmin.value ? certFrameStyleInput.value : 'modern-border';
    showPreviewCertData.value.detailColor = isJanyelAdmin.value ? certDetailColorInput.value : 'theme';
  }
});

// Analytics calculations
const activeStudentsCount = computed(() => {
  return Array.from(new Set(progressReports.value.map(p => p.userId))).length;
});

const averageQuizPercentage = computed(() => {
  if (progressReports.value.length === 0) return 0;
  const list = progressReports.value.map(current => {
    const scores = Object.values(current.quizScores);
    return scores.length > 0 ? (scores.reduce((acc, score) => acc + score, 0) / scores.length) : 0;
  });
  const sum = list.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / list.length);
});

const courseCompletionData = computed(() => {
  return courses.value.map(course => {
    const courseLessons = lessons.value.filter(l => l.courseId === course.id);
    const totalLessons = courseLessons.length;
    
    const associatedProgress = progressReports.value.filter(p => p.courseId === course.id);
    const avgCompleted = associatedProgress.length > 0
      ? (associatedProgress.reduce((sum, p) => sum + p.completedLessons.length, 0) / associatedProgress.length)
      : 0;

    return {
      id: course.id,
      title: course.title,
      totalLessons,
      avgCompleted: Math.round(avgCompleted * 10) / 10,
      studentCount: associatedProgress.length
    };
  });
});

const gradeDistributionData = computed(() => {
  let excellent = 0; // >= 80%
  let average = 0;   // >= 50% && < 80%
  let review = 0;    // < 50% or no quizzes completed
  
  progressReports.value.forEach(progress => {
    const scores = Object.values(progress.quizScores);
    if (scores.length > 0) {
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avg >= 80) excellent++;
      else if (avg >= 50) average++;
      else review++;
    } else {
      review++;
    }
  });
  
  const total = excellent + average + review;
  return {
    excellentPct: total > 0 ? Math.round((excellent / total) * 100) : 0,
    goodPct: total > 0 ? Math.round((average / total) * 100) : 0,
    reviewPct: total > 0 ? Math.round((review / total) * 100) : 0,
    total
  };
});

const activityEngagementScores = computed(() => {
  let totalReadings = 0;
  let totalVideos = 0;
  let totalQuizzes = 0;
  
  progressReports.value.forEach(progress => {
    totalReadings += progress.completedLessons.length;
    totalQuizzes += Object.keys(progress.quizScores).length;
    // Assume 60% of students with progress watched at least one video in ESL context
    totalVideos += progress.completedLessons.length > 0 ? 1 : 0;
  });
  
  const grandTotal = totalReadings + totalVideos + totalQuizzes;
  return {
    readings: totalReadings,
    videos: totalVideos,
    quizzes: totalQuizzes,
    readingsPct: grandTotal > 0 ? Math.round((totalReadings / grandTotal) * 100) : 0,
    videosPct: grandTotal > 0 ? Math.round((totalVideos / grandTotal) * 100) : 0,
    quizzesPct: grandTotal > 0 ? Math.round((totalQuizzes / grandTotal) * 100) : 0
  };
});

const pedCourseEfficiency = computed(() => {
  return courses.value.map(course => {
    const courseProgress = progressReports.value.filter(p => p.courseId === course.id);
    const totalStudents = courseProgress.length;
    const certified = courseProgress.filter(p => p.certified).length;
    const rate = totalStudents > 0 ? Math.round((certified / totalStudents) * 100) : 0;

    return {
      id: course.id,
      title: course.title,
      totalStudents,
      certified,
      rate
    };
  });
});

const pedagogicalRecommendations = computed(() => {
  const list: Array<{ id: number; title: string; text: string }> = [];
  let recId = 1;
  const isPt = locale.value === 'pt';

  if (averageQuizPercentage.value < 70) {
    list.push({
      id: recId++,
      title: isPt ? "Revisão de Dificuldade Pedagógica" : "Pedagogical Difficulty Review",
      text: isPt 
        ? `A média acadêmica geral está em ${averageQuizPercentage.value}%. Seus alunos estão enfrentando barreiras nos questionários avaliativos. Recomendamos revisar os textos de explicação de erros nas lições ou facilitar as perguntas de múltipla escolha.`
        : `The general academic average is at ${averageQuizPercentage.value}%. Your students are facing barriers in the evaluative quizzes. We recommend reviewing error explanation texts in the lessons or easing multiple-choice questions.`
    });
  } else if (averageQuizPercentage.value > 92) {
    list.push({
      id: recId++,
      title: isPt ? "Incentivo a Desafios Maiores" : "Encouraging Greater Challenges",
      text: isPt 
        ? `Excelente! A média dos questionários é muito alta (${averageQuizPercentage.value}%). Para incentivar a melhoria contínua de vocabulário avançado, adicione diálogos complexos opcionais ou perguntas abertas nos roteiros.`
        : `Excellent! The average quiz score is very high (${averageQuizPercentage.value}%). To encourage continuous improvement of advanced vocabulary, add optional complex dialogues or open-ended questions to the pathways.`
    });
  }

  pedCourseEfficiency.value.forEach(item => {
    if (item.totalStudents >= 2 && item.rate < 30) {
      list.push({
        id: recId++,
        title: isPt ? `Reduzir evasão: ${item.title}` : `Reduce dropout rate: ${item.title}`,
        text: isPt 
          ? `O curso apresenta baixa conversão de certificados (${item.rate}%). Alunos iniciam mas não terminam. Considere fragmentar as lições mais longas ou realizar um plantão síncrono de tirar dúvidas.`
          : `The course has a low certificate conversion rate (${item.rate}%). Students start but do not finish. Consider breaking down longer lessons or hosting a synchronous Q&A session.`
      });
    }
  });

  const classesForInstructor = classes.value.length;
  const activeStudentsCountInReports = Array.from(new Set(progressReports.value.map(p => p.userId))).length;
  if (activeStudentsCountInReports > 5 && classesForInstructor === 0) {
    list.push({
      id: recId++,
      title: isPt ? "Ausência de Prática Ativa ao Vivo" : "Lack of Active Live Practice",
      text: isPt 
        ? "Seus alunos estão estudando o conteúdo estático, mas não há turmas de Prática Conversacional agendadas. Encontros online síncronos aumentam a fixação de pronúncia em mais de 65%!"
        : "Your students are studying static content, but there are no scheduled Conversational Practice classes. Synchronous online meetings increase pronunciation retention by more than 65%!"
    });
  }

  if (list.length === 0) {
    list.push({
      id: recId++,
      title: isPt ? "Desempenho Pedagógico Saudável" : "Healthy Pedagogical Performance",
      text: isPt 
        ? "Todos os cursos operam com ótima taxa de avanço e retenção de conteúdo. Continue monitorando os cliques de engajamento para manter a constância."
        : "All courses operate with an excellent progress and content retention rate. Continue monitoring engagement clicks to maintain consistency."
    });
  }

  return list;
});

const getStudentName = (uid: string) => {
  const found = props.users?.find(u => u.uid === uid);
  const isPt = locale.value === 'pt';
  return found 
    ? (found.displayName || found.email || (isPt ? "Estudante Sem Nome" : "Unnamed Student")) 
    : (isPt ? "Estudante Independente" : "Independent Student");
};

const isMobile = ref(false);
const updateMobileStatus = () => {
  isMobile.value = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
};

// Tables, Search, Pagination
const studentQuery = ref('');
const studentPage = ref(1);
const studentsPerPage = computed(() => isMobile.value ? 3 : 5);

const filteredStudentReports = computed(() => {
  return progressReports.value.filter(report => {
    const sName = getStudentName(report.userId).toLowerCase();
    const courseTitle = (courses.value.find(c => c.id === report.courseId)?.title || "").toLowerCase();
    const query = studentQuery.value.trim().toLowerCase();
    return sName.includes(query) || report.userId.includes(query) || courseTitle.includes(query);
  });
});

const totalStudentPages = computed(() => {
  return Math.ceil(filteredStudentReports.value.length / studentsPerPage.value);
});

const paginatedStudentReports = computed(() => {
  const start = (studentPage.value - 1) * studentsPerPage.value;
  const end = start + studentsPerPage.value;
  return filteredStudentReports.value.slice(start, end);
});

const coursesQuery = ref('');
const coursesLevelFilter = ref('all');
const coursesPage = ref(1);
const coursesPerPage = computed(() => isMobile.value ? 2 : 4);

watch([coursesQuery, coursesLevelFilter], () => {
  coursesPage.value = 1;
});

const filteredCourses = computed(() => {
  return courses.value.filter(course => {
    const query = coursesQuery.value.trim().toLowerCase();
    const matchesQuery = !query || 
      course.title.toLowerCase().includes(query) || 
      (course.creatorName && course.creatorName.toLowerCase().includes(query)) ||
      course.level.toLowerCase().includes(query);
    const matchesLevel = coursesLevelFilter.value === 'all' || 
      course.level.toLowerCase() === coursesLevelFilter.value.toLowerCase();
    return matchesQuery && matchesLevel;
  });
});

const totalCoursesPages = computed(() => {
  return Math.ceil(filteredCourses.value.length / coursesPerPage.value);
});

const paginatedCoursesList = computed(() => {
  const start = (coursesPage.value - 1) * coursesPerPage.value;
  const end = start + coursesPerPage.value;
  return filteredCourses.value.slice(start, end);
});

const courseToDelete = ref<Course | null>(null);

const deleteConfirm = (course: Course) => {
  courseToDelete.value = course;
};

const confirmDeleteCourse = () => {
  if (courseToDelete.value) {
    emit('delete-course', courseToDelete.value.id);
    const isPt = locale.value === 'pt';
    showToast(
      isPt 
        ? `Curso "${courseToDelete.value.title}" removido da base com sucesso!` 
        : `Course "${courseToDelete.value.title}" successfully removed from database!`, 
      "success"
    );
    courseToDelete.value = null;
  }
};

const exportCourseToJson = (course: Course) => {
  const courseLessons = lessons.value.filter(l => l.courseId === course.id);
  const data = {
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      category: course.category,
      certificateConfig: course.certificateConfig,
      progressConfig: course.progressConfig
    },
    lessons: courseLessons.map(l => ({
      id: l.id,
      title: l.title,
      order: l.order,
      content: l.content,
      videoUrl: l.videoUrl,
      quiz: l.quiz
    }))
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${course.title.toLowerCase().replace(/\s+/g, '-')}-course.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const handleExportXLSX = () => {
  const isPt = locale.value === 'pt';
  if (progressReports.value.length === 0) {
    showToast(isPt ? "Sem dados de estudantes para exportar." : "No student data to export.", "warning");
    return;
  }

  const dataToExport = progressReports.value.map(report => {
    const associatedCourse = courses.value.find(c => c.id === report.courseId);
    const scores = Object.values(report.quizScores);
    const average = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    if (isPt) {
      return {
        "ID do Estudante": report.userId,
        "Nome do Aluno": getStudentName(report.userId),
        "Curso Matriculado": associatedCourse ? associatedCourse.title : "N/A",
        "Lições Completadas": report.completedLessons.length,
        "Média nos Quizzes (%)": scores.length > 0 ? `${average}%` : "Nenhum respondido",
        "Certificado Emitido": report.certified ? "Sim (Aprovado)" : "Não (Em andamento)",
        "Código do Certificado": report.certificateId || "N/A"
      };
    } else {
      return {
        "Student ID": report.userId,
        "Student Name": getStudentName(report.userId),
        "Enrolled Course": associatedCourse ? associatedCourse.title : "N/A",
        "Completed Lessons": report.completedLessons.length,
        "Quiz Average (%)": scores.length > 0 ? `${average}%` : "None answered",
        "Issued Certificate": report.certified ? "Yes (Approved)" : "No (In progress)",
        "Certificate Code": report.certificateId || "N/A"
      };
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, isPt ? "Progresso Alunos" : "Student Progress");

  // Ajustar largura de colunas automaticamente
  const headers = Object.keys(dataToExport[0]);
  const maxColWidths = headers.map(header => {
    let maxLen = header.length;
    dataToExport.forEach(item => {
      const val = item[header as keyof typeof item];
      const len = val ? String(val).length : 0;
      if (len > maxLen) maxLen = len;
    });
    return { wch: maxLen + 3 };
  });
  worksheet['!cols'] = maxColWidths;

  // Gerar buffer e download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  const rawDateStr = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
  link.download = isPt 
    ? `Relatorio_Estudantes_Excel_${rawDateStr}.xlsx`
    : `Student_Report_Excel_${rawDateStr}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(isPt ? "Planilha de estudantes exportada com sucesso!" : "Student spreadsheet successfully exported!", "success");
};

onMounted(() => {
  updateMobileStatus();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateMobileStatus);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateMobileStatus);
  }
});

const handleExportJSON = () => {
  const isPt = locale.value === 'pt';
  if (progressReports.value.length === 0) {
    showToast(isPt ? "Sem dados de estudantes para exportar." : "No student data to export.", "warning");
    return;
  }

  const data = progressReports.value.map(report => {
    const associatedCourse = courses.value.find(c => c.id === report.courseId);
    return {
      userId: report.userId,
      studentName: getStudentName(report.userId),
      courseId: report.courseId,
      courseTitle: associatedCourse ? associatedCourse.title : "N/A",
      completedLessons: report.completedLessons,
      quizScores: report.quizScores,
      certified: report.certified,
      certifiedAt: report.certifiedAt,
      certificateId: report.certificateId
    };
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const rawDateStr = new Date().toLocaleDateString("pt-BR");
  link.download = isPt 
    ? `Relatorio_Estudantes_Raw_${rawDateStr}.json`
    : `Student_Report_Raw_${rawDateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(isPt ? "Relatório JSON exportado com sucesso!" : "JSON report successfully exported!", "success");
};
</script>

<template>
  <div class="space-y-8">
    <!-- Key cards metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
      <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 flex items-center gap-4 shadow-2xs">
        <span class="p-3 bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-300 rounded-2xl border border-emerald-300 dark:border-emerald-400/60 shadow-xs">
          <FileText class="w-6 h-6 stroke-[2.5] text-emerald-600 dark:text-emerald-300" />
        </span>
        <div>
          <p class="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {{ t('tutor.onlineCourses') }}
          </p>
          <h4 class="text-xl font-black text-gray-900 dark:text-white mt-0.5">{{ courses.length }}</h4>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 flex items-center gap-4 shadow-2xs">
        <span class="p-3 bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-300 rounded-2xl border border-emerald-300 dark:border-emerald-400/60 shadow-xs">
          <Users class="w-6 h-6 stroke-[2.5] text-emerald-600 dark:text-emerald-300" />
        </span>
        <div>
          <p class="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {{ t('tutor.activeStudents') }}
          </p>
          <h4 class="text-xl font-black text-gray-900 dark:text-white mt-0.5">{{ activeStudentsCount }}</h4>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 flex items-center gap-4 shadow-2xs">
        <span class="p-3 bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-300 rounded-2xl border border-emerald-300 dark:border-emerald-400/60 shadow-xs">
          <Check class="w-6 h-6 stroke-[2.5] text-emerald-600 dark:text-emerald-300" />
        </span>
        <div>
          <p class="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {{ t('tutor.averageScore') }}
          </p>
          <h4 class="text-xl font-black text-gray-900 dark:text-white mt-0.5">
            {{ t('tutor.averageQuizzes', { pct: averageQuizPercentage }) }}
          </h4>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 flex items-center gap-4 shadow-2xs">
        <span class="p-3 bg-amber-500/20 dark:bg-amber-500/30 text-amber-600 dark:text-amber-300 rounded-2xl border border-amber-300 dark:border-amber-400/60 shadow-xs">
          <BookOpen class="w-6 h-6 stroke-[2.5] text-amber-600 dark:text-amber-300" />
        </span>
        <div>
          <p class="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {{ t('tutor.scheduledClasses') }}
          </p>
          <h4 class="text-xl font-black text-gray-900 dark:text-white mt-0.5">
            {{ t('tutor.scheduledClassesCount', { count: classes.length }) }}
          </h4>
        </div>
      </div>
    </div>

    <!-- Indicator charts dashboard -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
      <!-- Chart 1: Progress comparison -->
      <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xs space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-gray-950 dark:text-white tracking-tight flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-600 block"></span>
            {{ t('tutor.progressByCourse') }}
          </h3>
          <span class="text-[9px] bg-blue-50 dark:bg-blue-950/45 text-blue-600 dark:text-blue-300 border border-transparent dark:border-blue-900/30 px-2.5 py-0.5 font-bold rounded-full">
            {{ t('tutor.lessonsCompleted') }}
          </span>
        </div>
        <div class="space-y-4 pt-1.5 overflow-hidden">
          <div v-for="c in courseCompletionData" :key="c.id" class="space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-slate-300">
              <span class="truncate pr-2" :title="c.title">{{ c.title }}</span>
              <span class="shrink-0 text-slate-500 dark:text-slate-400">{{ c.avgCompleted }} / {{ c.totalLessons }}</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
              <div 
                class="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out"
                :style="{ width: c.totalLessons > 0 ? `${Math.min((c.avgCompleted / c.totalLessons) * 100, 100)}%` : '0%' }"
              ></div>
            </div>
            <div class="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
              <span>{{ t('tutor.enrolledStudents') }}</span>
              <span class="text-slate-600 dark:text-slate-305 font-bold">{{ c.studentCount }}</span>
            </div>
          </div>
          <div v-if="courseCompletionData.length === 0" class="text-xs text-center text-gray-400 dark:text-gray-500 py-6">
            {{ t('tutor.noCoursesRegisteredYet') }}
          </div>
        </div>
      </div>

      <!-- Chart 2: Distribuicao de notas -->
      <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-gray-950 dark:text-white tracking-tight flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
              {{ t('tutor.quizPerformance') }}
            </h3>
            <span class="text-[9px] bg-emerald-50 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-300 border border-transparent dark:border-emerald-900/30 px-2.5 py-0.5 font-bold rounded-full">
              {{ t('tutor.proportions') }}
            </span>
          </div>
          
          <div class="flex items-center justify-center py-6">
            <!-- Radial Donut SVG -->
            <div class="relative w-32 h-32">
              <svg class="w-full h-full transform -rotate-90 animate-fade-in" viewBox="0 0 36 36">
                <!-- Grey track -->
                <circle cx="18" cy="18" r="15.915" fill="none" class="stroke-slate-100 dark:stroke-slate-800" stroke-width="3.5"/>
                
                <!-- Excellent Segment -->
                <circle 
                  cx="18" cy="18" r="15.915" fill="none" 
                  stroke="#10b981" stroke-width="3.5" 
                  :stroke-dasharray="`${gradeDistributionData.excellentPct} ${100 - gradeDistributionData.excellentPct}`"
                  stroke-dashoffset="0"
                />
                
                <!-- Good Segment -->
                <circle 
                  cx="18" cy="18" r="15.915" fill="none" 
                  stroke="#3b82f6" stroke-width="3.5" 
                  :stroke-dasharray="`${gradeDistributionData.goodPct} ${100 - gradeDistributionData.goodPct}`"
                  :stroke-dashoffset="`-${gradeDistributionData.excellentPct}`"
                />
                
                <!-- Needs Review Segment -->
                <circle 
                  cx="18" cy="18" r="15.915" fill="none" 
                  stroke="#f59e0b" stroke-width="3.5" 
                  :stroke-dasharray="`${gradeDistributionData.reviewPct} ${100 - gradeDistributionData.reviewPct}`"
                  :stroke-dashoffset="`-${gradeDistributionData.excellentPct + gradeDistributionData.goodPct}`"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span class="text-2xl font-black text-gray-900 dark:text-white leading-none">{{ gradeDistributionData.total }}</span>
                <span class="text-[8.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                  {{ t('tutor.evaluated') }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-slate-800 pt-3 text-center">
          <div>
            <div class="flex items-center justify-center gap-1">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span class="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">
                {{ t('tutor.gradeA') }}
              </span>
            </div>
            <h5 class="text-xs font-black text-gray-800 dark:text-gray-200 mt-0.5">{{ gradeDistributionData.excellentPct }}%</h5>
          </div>
          <div>
            <div class="flex items-center justify-center gap-1">
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              <span class="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">
                {{ t('tutor.gradeB') }}
              </span>
            </div>
            <h5 class="text-xs font-black text-gray-800 dark:text-gray-200 mt-0.5">{{ gradeDistributionData.goodPct }}%</h5>
          </div>
          <div>
            <div class="flex items-center justify-center gap-1">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              <span class="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">
                {{ t('tutor.difficultyReview') }}
              </span>
            </div>
            <h5 class="text-xs font-black text-gray-800 dark:text-gray-200 mt-0.5">{{ gradeDistributionData.reviewPct }}%</h5>
          </div>
        </div>
      </div>

      <!-- Chart 3: Engajamento de Atendimento -->
      <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xs space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-indigo-500 block"></span>
            {{ t('tutor.studentParticipation') }}
          </h3>
          <span class="text-[9px] bg-indigo-100/90 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700/60 px-2.5 py-0.5 font-bold rounded-full">
            {{ t('tutor.engagement') }}
          </span>
        </div>

        <div class="space-y-4 pt-1">
          <!-- Readings -->
          <div class="space-y-1.5 text-left">
            <div class="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-slate-300">
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                {{ t('tutor.dialogueReadings') }}
              </span>
              <span class="text-slate-500 dark:text-slate-400">{{ activityEngagementScores.readings }} clicks</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="bg-indigo-600 h-full rounded-full transition-all duration-500" :style="{ width: `${activityEngagementScores.readingsPct}%` }"></div>
            </div>
          </div>

          <!-- Videos -->
          <div class="space-y-1.5 text-left">
            <div class="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-slate-300">
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-violet-500"></span>
                {{ t('tutor.videoLessonsWatched') }}
              </span>
              <span class="text-slate-500 dark:text-slate-400">{{ activityEngagementScores.videos }} clicks</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="bg-violet-600 h-full rounded-full transition-all duration-500" :style="{ width: `${activityEngagementScores.videosPct}%` }"></div>
            </div>
          </div>

          <!-- Quizzes -->
          <div class="space-y-1.5 text-left">
            <div class="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-slate-300">
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-fuchsia-500"></span>
                {{ t('tutor.quizzesSubmitted') }}
              </span>
              <span class="text-slate-500 dark:text-slate-400">{{ activityEngagementScores.quizzes }} clicks</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="bg-fuchsia-600 h-full rounded-full transition-all duration-500" :style="{ width: `${activityEngagementScores.quizzesPct}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section: Melhoria Contínua e Eficiência Pedagógica -->
    <div class="bg-slate-50 dark:bg-slate-900/45 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 space-y-6 text-left select-none">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
        <div>
          <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider block">
            {{ t('tutor.retentionTitle') }}
          </h3>
          <p class="text-xs text-slate-400 dark:text-slate-500 font-bold block">
            {{ t('tutor.retentionSub') }}
          </p>
        </div>
        <span class="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 rounded-xl text-xs font-black shrink-0 border border-emerald-300 dark:border-emerald-600/70 shadow-2xs">
          🔍 {{ t('tutor.didacticAuditor') }}
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Part A: Analise de Eficiência por Curso -->
        <div class="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <h4 class="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {{ t('tutor.certConversionRate') }}
            </h4>
            <p class="text-[10.5px] text-slate-400 dark:text-slate-500 font-bold">
              {{ t('tutor.certConversionSub') }}
            </p>
          </div>

          <div class="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            <div 
              v-for="c in pedCourseEfficiency" 
              :key="c.id" 
              class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2"
            >
              <div class="flex items-center justify-between text-xs font-extrabold">
                <span class="text-slate-800 dark:text-slate-200 truncate max-w-[180px]" :title="c.title">{{ c.title }}</span>
                <span :class="[
                  'text-[10px] font-black uppercase px-2 py-0.5 rounded-full',
                  c.rate >= 60 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' :
                  c.rate >= 30 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' :
                  'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                ]">
                  {{ t('tutor.efficiencyText', { rate: c.rate }) }}
                </span>
              </div>
              <!-- Mini progress bar -->
              <div class="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-500"
                  :class="[
                    c.rate >= 60 ? 'bg-emerald-500' :
                    c.rate >= 30 ? 'bg-amber-500' :
                    'bg-rose-500'
                  ]"
                  :style="{ width: `${c.rate}%` }"
                ></div>
              </div>
              <div class="flex justify-between text-[10px] text-slate-450 dark:text-slate-500 font-bold leading-none">
                <span>{{ t('tutor.certificatesCount') }} {{ c.certified }} / {{ c.totalStudents }}</span>
                <span v-if="c.rate < 30" class="text-rose-500 dark:text-rose-400">⚠️ {{ t('tutor.dropoutWarning') }}</span>
                <span v-else-if="c.rate >= 60" class="text-emerald-600 dark:text-emerald-400">✓ {{ t('tutor.healthyFlow') }}</span>
                <span v-else class="text-amber-600 dark:text-amber-400">✎ {{ t('tutor.adjustmentsAdvised') }}</span>
              </div>
            </div>
            <div v-if="pedCourseEfficiency.length === 0" class="text-xs text-slate-400 dark:text-slate-500 italic py-4 text-center">
              {{ t('tutor.noHistoricalData') }}
            </div>
          </div>
        </div>

        <!-- Part B: Recomendações de Aprimoramento Didático -->
        <div class="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <h4 class="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {{ t('tutor.strategicActions') }}
            </h4>
            <p class="text-[10.5px] text-slate-400 dark:text-slate-500 font-bold">
              {{ t('tutor.strategicActionsSub') }}
            </p>
          </div>

          <div class="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            <div 
              v-for="rec in pedagogicalRecommendations" 
              :key="rec.id" 
              class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex gap-2.5 text-[11px] leading-relaxed"
            >
              <span class="text-indigo-500 dark:text-indigo-400 shrink-0 font-extrabold text-xs">💡</span>
              <div class="space-y-0.5 text-left">
                <p class="font-extrabold text-slate-800 dark:text-slate-200 leading-tight">{{ rec.title }}</p>
                <p class="text-slate-500 dark:text-slate-400 font-medium leading-normal">{{ rec.text }}</p>
              </div>
            </div>
            <div v-if="pedagogicalRecommendations.length === 0" class="text-xs text-slate-400 dark:text-slate-500 italic py-4 text-center">
              {{ t('tutor.everythingUnderControl') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sub Navigation Tabs for Analytics Section -->
    <div class="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-xl w-full max-w-sm sm:max-w-md select-none border border-transparent dark:border-slate-800">
      <button
        type="button"
        @click="analyticsTab = 'students'"
        :class="[
          'flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center',
          analyticsTab === 'students' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-gray-500 dark:text-gray-455 hover:text-gray-900 dark:hover:text-white'
        ]"
      >
        👥 {{ t('tutor.studentsCountTab', { count: progressReports.length }) }}
      </button>
      <button
        type="button"
        @click="analyticsTab = 'courses'"
        :class="[
          'flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center',
          analyticsTab === 'courses' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-gray-500 dark:text-gray-455 hover:text-gray-900 dark:hover:text-white'
        ]"
      >
        📚 {{ t('tutor.courseHistoryTab', { count: courses.length }) }}
      </button>
    </div>

    <!-- Tab 1: Students performance list with Excel and JSON export features -->
    <div v-if="analyticsTab === 'students'">
      <AnalyticsStudentTable
        :reports="progressReports"
        :courses="courses"
        :users="users || []"
        @export-xlsx="handleExportXLSX"
        @export-json="handleExportJSON"
      />
    </div>

    <!-- Tab 2: Course History List & Expandable Lessons Grid -->
    <div v-if="analyticsTab === 'courses'" class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 space-y-5 shadow-2xs text-left animate-fadeIn">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100/60 dark:border-slate-800/80 pb-4">
        <div>
          <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider block">
            {{ t('tutor.courseHistoryTitle') }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
            {{ t('tutor.courseHistorySub') }}
          </p>
        </div>

        <!-- Search & Filter Controls -->
        <div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <!-- Level Filter Dropdown -->
          <select
            v-model="coursesLevelFilter"
            class="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-extrabold p-2.5 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-2xs"
          >
            <option value="all">Todos os Níveis</option>
            <option value="Beginner">Nível Iniciante</option>
            <option value="Intermediate">Nível Intermediário</option>
            <option value="Advanced">Nível Avançado</option>
          </select>

          <!-- Search box -->
          <div class="relative min-w-[200px] flex-1 md:flex-none">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Search class="w-4 h-4" />
            </span>
            <input
              type="text"
              :placeholder="t('tutor.searchCoursePlaceholder')"
              v-model="coursesQuery"
              class="w-full text-xs pl-9 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:outline-hidden text-slate-900 dark:text-white shadow-2xs font-semibold"
            />
          </div>
        </div>
      </div>

      <p v-if="filteredCourses.length === 0" class="text-xs text-slate-450 dark:text-slate-500 italic py-6 text-center">
        {{ t('tutor.noMatchingCourse') }}
      </p>
      <div v-else class="space-y-4">
        <div v-for="course in paginatedCoursesList" :key="course.id" class="p-5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3.5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="space-y-1.5 text-left">
              <div class="flex items-center gap-2.5 flex-wrap">
                <span class="font-black text-base text-slate-900 dark:text-white leading-tight">{{ course.title }}</span>
                <span class="px-2.5 py-0.5 bg-cyan-100 dark:bg-cyan-950/90 text-cyan-900 dark:text-cyan-200 text-[10px] font-black border border-cyan-300 dark:border-cyan-500/70 rounded-lg uppercase tracking-wider shadow-2xs">
                  {{ t('tutor.levelText', { level: course.level }) }}
                </span>
              </div>
              <p class="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-none" v-html="t('tutor.courseCreatedBy', {
                author: course.creatorName || t('tutor.volunteerFallback'),
                count: lessons.filter(l => l.courseId === course.id).length
              })">
              </p>
              <!-- Course progress criteria tag summary -->
              <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                <span class="text-[9.5px] px-2 py-0.5 rounded-md bg-slate-200/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase tracking-wider">
                  {{ t('tutor.metricsLabel') }}
                </span>
                <span :class="['text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase border shadow-2xs', (!course.progressConfig || course.progressConfig.requireReading) ? 'bg-emerald-100 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-500/70 text-emerald-900 dark:text-emerald-200' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 line-through']">
                  {{ t('tutor.reading') }}
                </span>
                <span :class="['text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase border shadow-2xs', (course.progressConfig && course.progressConfig.requireVideo) ? 'bg-emerald-100 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-500/70 text-emerald-900 dark:text-emerald-200' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 line-through']">
                  {{ t('tutor.video') }}
                </span>
                <span :class="['text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase border shadow-2xs', (course.progressConfig && course.progressConfig.requireQuiz) ? 'bg-emerald-100 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-500/70 text-emerald-900 dark:text-emerald-200' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 line-through']">Quiz {{ course.progressConfig?.minQuizScore ? `(>= ${course.progressConfig.minQuizScore}%)` : '' }}</span>
              </div>
            </div>

            <!-- Action buttons without Delete -->
            <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end shrink-0">
              <button
                type="button"
                @click="exportCourseToJson(course)"
                class="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-500/70 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                :title="t('tutor.exportCourseJsonTitle')"
              >
                <UploadCloud class="w-3.5 h-3.5 rotate-180 text-emerald-600 dark:text-emerald-300" />
                {{ t('tutor.exportJsonLabel') }}
              </button>

              <button
                type="button"
                @click="startEditCert(course)"
                class="px-3 py-1.5 bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-500/70 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                :title="t('tutor.customizeCertTitle')"
              >
                <Award class="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
                {{ t('tutor.customizeCertLabel') }}
              </button>

              <button
                type="button"
                @click="expandedCourseId = expandedCourseId === course.id ? null : course.id"
                class="px-3.5 py-1.5 bg-indigo-100 dark:bg-indigo-950/80 hover:bg-indigo-200 dark:hover:bg-indigo-900 text-indigo-900 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-500/70 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              >
                <span>{{ t('tutor.lessonsGridLabel') }}</span>
                <ChevronUp v-if="expandedCourseId === course.id" class="w-3.5 h-3.5" />
                <ChevronDown v-else class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Certificate editor inline card -->
          <div v-if="editingCertCourseId === course.id" class="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5 animate-fadeIn text-left text-slate-800 dark:text-slate-100 shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Award class="w-4 h-4 text-amber-500 shrink-0" />
                {{ t('tutor.certEditorTitle') }}
              </h4>
              <button @click="cancelEditCert" class="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer">
                {{ t('tutor.close') }}
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- Color Config -->
              <div class="space-y-2">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {{ t('tutor.certThemeColor') }}
                </label>
                <p class="text-[10.5px] text-slate-400 dark:text-slate-500 leading-tight">
                  {{ t('tutor.certThemeColorSub') }}
                </p>
                
                <!-- Preset Swatches -->
                <div class="flex flex-wrap gap-1.5 py-1">
                  <button v-for="color in ['#1e3a8a', '#065f46', '#1c1917', '#881337', '#7c2d12', '#4c1d95']" 
                    :key="color" 
                    type="button" 
                    @click="certColorInput = color"
                    class="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 transition-transform active:scale-90 relative cursor-pointer shadow-xs"
                    :style="{ backgroundColor: color }"
                    :title="t('tutor.clickToSelect')"
                  >
                    <span v-if="certColorInput === color" class="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold">✓</span>
                  </button>
                </div>

                <div class="flex items-center gap-2">
                  <input type="color" v-model="certColorInput" class="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 cursor-pointer p-0 bg-transparent" />
                  <input type="text" v-model="certColorInput" placeholder="#1e3a8a" class="w-28 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20" />
                </div>
              </div>

              <!-- Icon seal Config -->
              <div class="space-y-2">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {{ t('tutor.certSealIcon') }}
                </label>
                <p class="text-[10.5px] text-slate-400 dark:text-slate-500 leading-tight">
                  {{ t('tutor.certSealIconSub') }}
                </p>
                
                <input type="url" v-model="certIconUrlInput" placeholder="Ex: https://img.icons8.com/color/96/quality-badge.png" class="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20" />
                
                <!-- Suggestions quick copy -->
                <div class="space-y-1.5 pt-1">
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <p class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {{ t('tutor.recommendedModels') }}
                    </p>
                    <a 
                      href="https://icons8.com.br/icons" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      class="text-[9px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold cursor-pointer shrink-0"
                    >
                      <ExternalLink class="w-3 h-3" />
                      {{ t('tutor.moreOptionsIcons8') }}
                    </a>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button type="button" @click="certIconUrlInput = 'https://img.icons8.com/color/96/gold-medal.png'" class="text-[9.5px] bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900/60 dark:border-amber-800/80 font-semibold px-2 py-1 rounded-lg border border-amber-200 transition-colors cursor-pointer">🏅 {{ t('tutor.goldMedal') }}</button>
                    <button type="button" @click="certIconUrlInput = 'https://img.icons8.com/color/96/quality-badge.png'" class="text-[9.5px] bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 dark:border-blue-800/80 font-semibold px-2 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer">⭐ {{ t('tutor.royalStar') }}</button>
                    <button type="button" @click="certIconUrlInput = 'https://img.icons8.com/?size=100&id=lsZBoVE2zMo3&format=png&color=000000'" class="text-[9.5px] bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 dark:border-emerald-800/80 font-semibold px-2 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer">🛡️ {{ t('tutor.trustSeal') }}</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Premium Administration Customizer Section (janyel.lima2809 exclusive) -->
            <div v-if="isJanyelAdmin" class="pt-4 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Fundo (Background) Selection -->
              <div class="space-y-1.5 text-left">
                <label class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  {{ t('tutor.certBackground') }}
                </label>
                <select 
                  v-model="certBgStyleInput"
                  class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl text-xs p-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="vintage-parchment">📜 {{ t('tutor.vintageParchment') }}</option>
                  <option value="dark-velvet">🌌 {{ t('tutor.darkVelvet') }}</option>
                  <option value="clean-light">⬜ {{ t('tutor.cleanLight') }}</option>
                </select>
              </div>

              <!-- Moldura (Frame) Selection -->
              <div class="space-y-1.5 text-left">
                <label class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  {{ t('tutor.certFrameStyle') }}
                </label>
                <select 
                  v-model="certFrameStyleInput"
                  class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl text-xs p-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="medieval-gothic">🏰 {{ t('tutor.medievalGothic') }}</option>
                  <option value="classic-imperial">🏛️ {{ t('tutor.classicImperial') }}</option>
                  <option value="modern-border">📱 {{ t('tutor.modernBorder') }}</option>
                </select>
              </div>

              <!-- Accent Color Selection -->
              <div class="space-y-1.5 text-left">
                <label class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  {{ t('tutor.certDetailsColor') }}
                </label>
                <select 
                  v-model="certDetailColorInput"
                  class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl text-xs p-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="gold">⚜️ {{ t('tutor.goldGradient') }}</option>
                  <option value="silver">🛡️ {{ t('tutor.silverGradient') }}</option>
                  <option value="bronze">⚔️ {{ t('tutor.bronzeGradient') }}</option>
                  <option value="ruby">💎 {{ t('tutor.rubyGradient') }}</option>
                  <option value="emerald">🌲 {{ t('tutor.emeraldGradient') }}</option>
                  <option value="theme">🎨 {{ t('tutor.defaultCourseColor') }}</option>
                </select>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 dark:border-slate-800 pt-3.5">
              <button 
                type="button" 
                @click="openPreviewCert(course)" 
                class="w-full sm:w-auto px-4 py-2 text-xs bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white rounded-xl font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 mr-auto"
              >
                <span>👁️ {{ t('tutor.viewCertPreview') }}</span>
              </button>
              <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button type="button" @click="cancelEditCert" class="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
                  {{ t('tutor.cancel') }}
                </button>
                <button type="button" @click="saveCertConfig" class="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl font-bold transition-all cursor-pointer shadow-xs">
                  {{ t('tutor.saveConfiguration') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Expanded Course Details: Modern, Adaptive Light/Dark High-Contrast Panel -->
          <div v-if="expandedCourseId === course.id" class="bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 animate-fadeIn space-y-5 text-left shadow-lg mt-4">
            <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              <!-- Left Column: Lessons Grid (xl:col-span-7) -->
              <div class="xl:col-span-7 space-y-3.5">
                <p class="text-[11px] text-emerald-700 dark:text-emerald-400 uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2.5 flex items-center gap-2">
                  📚 {{ t('tutor.curriculumGridTitle') }}
                </p>
                
                <p v-if="lessons.filter(l => l.courseId === course.id).length === 0" class="text-xs text-slate-500 dark:text-slate-400 italic pl-1">
                  {{ t('tutor.noLessonsRegistered') }}
                </p>
                <div v-else class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                  <table class="w-full text-left text-[11.5px] font-medium text-slate-800 dark:text-slate-200 min-w-[500px]">
                    <thead>
                      <tr class="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-[10px] tracking-wider">
                        <th class="p-3.5 text-center w-14">{{ t('tutor.thOrder') }}</th>
                        <th class="p-3.5 pl-2">{{ t('tutor.thLessonTitle') }}</th>
                        <th class="p-3.5 text-center">{{ t('tutor.thVideo') }}</th>
                        <th class="p-3.5 text-center">{{ t('tutor.thTextLength') }}</th>
                        <th class="p-3.5 text-right pr-4">{{ t('tutor.thQuizQs') }}</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">
                      <tr v-for="l in lessons.filter(l => l.courseId === course.id)" :key="l.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <td class="p-3.5 text-center">
                          <span class="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg font-mono text-xs font-black bg-sky-100 text-sky-900 border border-sky-300 dark:bg-sky-950/80 dark:text-sky-200 dark:border-sky-500/70 shadow-2xs">
                            #{{ l.order }}
                          </span>
                        </td>
                        <td class="p-3.5 pl-2 font-black text-slate-900 dark:text-white text-xs leading-snug">{{ l.title }}</td>
                        <td class="p-3.5 text-center">
                          <span v-if="l.videoUrl" class="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-500/70 px-2.5 py-0.5 rounded-lg shadow-2xs">
                            {{ t('tutor.yes') }}
                          </span>
                          <span v-else class="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-300 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700 px-2.5 py-0.5 rounded-lg">
                            {{ t('tutor.no') }}
                          </span>
                        </td>
                        <td class="p-3.5 text-center font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {{ t('tutor.charsCount', { count: l.content.length }) }}
                        </td>
                        <td class="p-3.5 text-right pr-4">
                          <span class="inline-flex items-center gap-1 text-xs font-black bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-200 dark:border-indigo-500/70 px-2.5 py-0.5 rounded-lg font-mono shadow-2xs">
                            {{ t('tutor.questionsCount', { count: (l.quiz || []).length }) }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Right Column: Course Reviews & Reaction Metrics (xl:col-span-5) -->
              <div class="xl:col-span-5 space-y-4 border-t xl:border-t-0 xl:border-l border-slate-200 dark:border-slate-800 pt-5 xl:pt-0 xl:pl-6 text-left">
                <p class="text-[11px] text-amber-700 dark:text-amber-400 uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2.5 flex items-center gap-2">
                  ⭐ {{ t('tutor.reviewsTitle') }}
                </p>

                <!-- Average Score & Overall Reaction indicators -->
                <div class="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
                  <div class="text-left">
                    <p class="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
                      {{ t('tutor.averageRating') }}
                    </p>
                    <div class="flex items-baseline gap-1 mt-1">
                      <span class="text-3xl font-black text-slate-900 dark:text-white">
                        {{ getCourseAverageRating(course.id) }}
                      </span>
                      <span class="text-xs font-bold text-slate-500 dark:text-slate-400">/ 5.0</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
                      {{ t('tutor.totalReviews') }}
                    </p>
                    <p class="text-sm font-black text-slate-800 dark:text-slate-200 mt-1">
                      {{ t('tutor.reviewsCount', { count: getCourseReviews(course.id).length }) }}
                    </p>
                  </div>
                </div>

                <!-- Star breakdown progress bars (Indicators) -->
                <div class="space-y-1.5 text-xs text-left">
                  <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="flex items-center gap-2.5">
                    <span class="w-8 text-right font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-end gap-1 select-none">
                      {{ star }}<span class="text-amber-500 dark:text-amber-400">★</span>
                    </span>
                    <div class="flex-1 bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        class="bg-amber-500 dark:bg-amber-400 h-full rounded-full transition-all duration-500" 
                        :style="{ width: `${getCourseReactionDistribution(course.id)[star]}%` }"
                      ></div>
                    </div>
                    <span class="w-9 text-slate-600 dark:text-slate-400 font-bold text-right font-mono text-[11px]">
                      {{ getCourseReactionDistribution(course.id)[star] }}%
                    </span>
                  </div>
                </div>

                <!-- Feedbacks and Comments -->
                <div class="space-y-2 pt-1">
                  <p class="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    {{ t('tutor.commentsFeedbacks') }}
                  </p>
                  
                  <div v-if="getCourseReviews(course.id).length === 0" class="text-xs text-slate-500 dark:text-slate-400 italic py-4">
                    {{ t('tutor.noFeedbackYet') }}
                  </div>
                  <div v-else class="space-y-2.5 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                    <div v-for="rev in getCourseReviews(course.id)" :key="rev.id" class="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-left shadow-2xs">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <img v-if="rev.userPhoto" :src="rev.userPhoto" class="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                          <div v-else class="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-700 dark:text-slate-200">
                            {{ rev.userName.charAt(0) }}
                          </div>
                          <span class="font-extrabold text-xs text-slate-900 dark:text-slate-200 truncate max-w-[130px]">{{ rev.userName }}</span>
                        </div>
                        
                        <div class="flex text-amber-500 dark:text-amber-400 text-[10px] tracking-tighter shrink-0 select-none">
                          <span v-for="i in 5" :key="i">
                            {{ i <= rev.rating ? '★' : '☆' }}
                          </span>
                        </div>
                      </div>
                      
                      <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-0.5 break-words font-medium">
                        {{ rev.comment }}
                      </p>
                      
                      <p class="text-[9.5px] text-slate-400 dark:text-slate-500 text-right pr-0.5 font-mono select-none">
                        {{ rev.createdAt }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Course Catalog Pagination -->
        <div v-if="filteredCourses.length > 0" class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-slate-200/80 dark:border-slate-800/80 mt-2">
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Exibindo {{ Math.min(filteredCourses.length, (coursesPage - 1) * coursesPerPage + 1) }} - {{ Math.min(filteredCourses.length, coursesPage * coursesPerPage) }} de {{ filteredCourses.length }} cursos
          </p>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="coursesPage = Math.max(1, coursesPage - 1)"
              :disabled="coursesPage === 1"
              class="px-3.5 py-1.5 text-xs font-black rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
            >
              Anterior
            </button>
            <span class="text-xs font-extrabold px-2 text-slate-700 dark:text-slate-300">
              Página {{ coursesPage }} de {{ totalCoursesPages || 1 }}
            </span>
            <button
              type="button"
              @click="coursesPage = Math.min(totalCoursesPages, coursesPage + 1)"
              :disabled="coursesPage === totalCoursesPages || totalCoursesPages <= 1"
              class="px-3.5 py-1.5 text-xs font-black rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Course Delete Confirmation Modal -->
    <Teleport to="body">
      <div 
        v-if="courseToDelete" 
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left animate-fadeIn"
      >
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl animate-scaleUp text-slate-900 dark:text-white">
          <div class="flex items-start gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div class="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-900/30 text-rose-600">
              <Trash2 class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white uppercase tracking-wider leading-none">
                {{ t('tutor.deleteCourseModalTitle') }}
              </h3>
              <p class="text-[10px] text-rose-500 font-bold uppercase mt-1">
                {{ t('tutor.irreversibleAction') }}
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-xs sm:text-sm text-slate-700 dark:text-slate-350 leading-relaxed font-semibold" v-html="t('tutor.deleteCourseConfirmText', { title: courseToDelete.title })">
            </p>
            <p class="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
              {{ t('tutor.deleteCourseConfirmSub') }}
            </p>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="courseToDelete = null"
              class="w-1/2 py-3 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-xl transition duration-150 cursor-pointer shadow-2xs"
            >
              {{ t('tutor.cancel') }}
            </button>
            <button
              type="button"
              @click="confirmDeleteCourse"
              class="w-1/2 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl transition duration-155 cursor-pointer shadow-md"
            >
              {{ t('tutor.deleteCourseConfirmButton') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Live Preview Certificate Modal Dialog -->
    <CertificateViewer
      v-if="showPreviewCertData"
      :studentName="showPreviewCertData.studentName"
      :courseTitle="showPreviewCertData.courseTitle"
      :primaryColor="showPreviewCertData.primaryColor"
      :iconUrl="showPreviewCertData.iconUrl"
      :bgStyle="showPreviewCertData.bgStyle"
      :frameStyle="showPreviewCertData.frameStyle"
      :detailColor="showPreviewCertData.detailColor"
      :creatorId="showPreviewCertData.creatorId"
      :isTransferred="showPreviewCertData.isTransferred"
      :isMaster="isJanyelAdmin"
      @close="showPreviewCertData = null"
    />
  </div>
</template>
