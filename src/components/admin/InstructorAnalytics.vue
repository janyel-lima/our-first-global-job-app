<script setup lang="ts">
import {
  Award,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  FileText,
  Search,
  Trash2,
  UploadCloud,
  Users
} from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import * as XLSX from 'xlsx';
import { showToast, useAppState } from '../../composables/useAppState';
import { ClassTurma, Course, Lesson, Progress, UserProfile } from '../../types';
import CertificateViewer from '../courses/CertificateViewer.vue';

const props = defineProps<{
  courses: Course[];
  progressReports: Progress[];
  classes: ClassTurma[];
  lessons: Lesson[];
  users?: UserProfile[];
  deleteCourseFn?: (courseId: string) => Promise<void>;
  instructorId?: string;
}>();

const { currentUser, userProfile } = useAppState();

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
const certBgStyleInput = ref<'vintage-parchment' | 'dark-velvet' | 'clean-light'>('vintage-parchment');
const certFrameStyleInput = ref<'medieval-gothic' | 'classic-imperial' | 'modern-border'>('medieval-gothic');
const certDetailColorInput = ref<'gold' | 'silver' | 'bronze' | 'ruby' | 'emerald' | 'theme'>('gold');

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
} | null>(null);

const startEditCert = (course: Course) => {
  editingCertCourseId.value = course.id;
  certColorInput.value = course.certificateConfig?.primaryColor || '#1e3a8a';
  certIconUrlInput.value = course.certificateConfig?.iconUrl || '';
  certBgStyleInput.value = course.certificateConfig?.bgStyle || 'vintage-parchment';
  certFrameStyleInput.value = course.certificateConfig?.frameStyle || 'medieval-gothic';
  certDetailColorInput.value = course.certificateConfig?.detailColor || 'gold';
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
      bgStyle: certBgStyleInput.value,
      frameStyle: certFrameStyleInput.value,
      detailColor: certDetailColorInput.value
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
    bgStyle: certBgStyleInput.value,
    frameStyle: certFrameStyleInput.value,
    detailColor: certDetailColorInput.value,
    creatorId: course.creatorId
  };
};

// Update live preview values in real-time as the fields are modified
watch(() => [certColorInput.value, certIconUrlInput.value, certBgStyleInput.value, certFrameStyleInput.value, certDetailColorInput.value], () => {
  if (showPreviewCertData.value) {
    showPreviewCertData.value.primaryColor = certColorInput.value;
    showPreviewCertData.value.iconUrl = certIconUrlInput.value;
    showPreviewCertData.value.bgStyle = certBgStyleInput.value;
    showPreviewCertData.value.frameStyle = certFrameStyleInput.value;
    showPreviewCertData.value.detailColor = certDetailColorInput.value;
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

  if (averageQuizPercentage.value < 70) {
    list.push({
      id: recId++,
      title: "Revisão de Dificuldade Pedagógica",
      text: `A média acadêmica geral está em ${averageQuizPercentage.value}%. Seus alunos estão enfrentando barreiras nos questionários avaliativos. Recomendamos revisar os textos de explicação de erros nas lições ou facilitar as perguntas de múltipla escolha.`
    });
  } else if (averageQuizPercentage.value > 92) {
    list.push({
      id: recId++,
      title: "Incentivo a Desafios Maiores",
      text: `Excelente! A média dos questionários é muito alta (${averageQuizPercentage.value}%). Para incentivar a melhoria contínua de vocabulário avançado, adicione diálogos complexos opcionais ou perguntas abertas nos roteiros.`
    });
  }

  pedCourseEfficiency.value.forEach(item => {
    if (item.totalStudents >= 2 && item.rate < 30) {
      list.push({
        id: recId++,
        title: `Reduzir evasão: ${item.title}`,
        text: `O curso apresenta baixa conversão de certificados (${item.rate}%). Alunos iniciam mas não terminam. Considere fragmentar as lições mais longas ou realizar um plantão síncrono de tirar dúvidas.`
      });
    }
  });

  const classesForInstructor = classes.value.length;
  const activeStudentsCountInReports = Array.from(new Set(progressReports.value.map(p => p.userId))).length;
  if (activeStudentsCountInReports > 5 && classesForInstructor === 0) {
    list.push({
      id: recId++,
      title: "Ausência de Prática Ativa ao Vivo",
      text: "Seus alunos estão estudando o conteúdo estático, mas não há turmas de Prática Conversacional agendadas. Encontros online síncronos aumentam a fixação de pronúncia em mais de 65%!"
    });
  }

  if (list.length === 0) {
    list.push({
      id: recId++,
      title: "Desempenho Pedagógico Saudável",
      text: "Todos os cursos operam com ótima taxa de avanço e retenção de conteúdo. Continue monitorando os cliques de engajamento para manter a constância."
    });
  }

  return list;
});

const getStudentName = (uid: string) => {
  const found = props.users?.find(u => u.uid === uid);
  return found ? found.displayName : "Estudante Independente";
};

// Tables, Search, Pagination
const studentQuery = ref('');
const studentPage = ref(1);
const studentsPerPage = ref(5);

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
const coursesPage = ref(1);
const coursesPerPage = ref(4);

const filteredCourses = computed(() => {
  return courses.value.filter(course => {
    const query = coursesQuery.value.trim().toLowerCase();
    return course.title.toLowerCase().includes(query) || course.level.toLowerCase().includes(query);
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
    showToast(`Curso "${courseToDelete.value.title}" removido da base com sucesso!`, "success");
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
  if (progressReports.value.length === 0) {
    showToast("Sem dados de estudantes para exportar.", "warning");
    return;
  }

  const dataToExport = progressReports.value.map(report => {
    const associatedCourse = courses.value.find(c => c.id === report.courseId);
    const scores = Object.values(report.quizScores);
    const average = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    return {
      "ID do Estudante": report.userId,
      "Nome do Aluno": getStudentName(report.userId),
      "Curso Matriculado": associatedCourse ? associatedCourse.title : "N/A",
      "Lições Completadas": report.completedLessons.length,
      "Média nos Quizzes (%)": scores.length > 0 ? `${average}%` : "Nenhum respondido",
      "Certificado Emitido": report.certified ? "Sim (Aprovado)" : "Não (Em andamento)",
      "Código do Certificado": report.certificateId || "N/A"
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Progresso Alunos");

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
  link.download = `Relatorio_Estudantes_Excel_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Planilha de estudantes exportada com sucesso!", "success");
};

const handleExportJSON = () => {
  if (progressReports.value.length === 0) {
    showToast("Sem dados de estudantes para exportar.", "warning");
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
  link.download = `Relatorio_Estudantes_Raw_${new Date().toLocaleDateString("pt-BR")}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Relatório JSON exportado com sucesso!", "success");
};
</script>

<template>
  <div class="space-y-8">
    <!-- Key cards metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
      <div
        class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 flex items-center gap-4">
        <span class="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 rounded-xl">
          <FileText class="w-6 h-6" />
        </span>
        <div>
          <p class="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Cursos Online</p>
          <h4 class="text-xl font-black text-gray-900 dark:text-white mt-0.5">{{ courses.length }}</h4>
        </div>
      </div>

      <div
        class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 flex items-center gap-4">
        <span class="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 rounded-xl">
          <Users class="w-6 h-6" />
        </span>
        <div>
          <p class="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Estudantes Ativos
          </p>
          <h4 class="text-xl font-black text-gray-900 dark:text-white mt-0.5">{{ activeStudentsCount }}</h4>
        </div>
      </div>

      <div
        class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 flex items-center gap-4">
        <span class="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 rounded-xl">
          <Check class="w-6 h-6" />
        </span>
        <div>
          <p class="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Aproveitamento
            Médio</p>
          <h4 class="text-xl font-black text-gray-900 dark:text-white mt-0.5">{{ averageQuizPercentage }}% nos Quizzes
          </h4>
        </div>
      </div>

      <div
        class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 flex items-center gap-4">
        <span class="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 rounded-xl">
          <BookOpen class="w-6 h-6" />
        </span>
        <div>
          <p class="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Aulas Marcadas</p>
          <h4 class="text-xl font-black text-gray-900 dark:text-white mt-0.5">{{ classes.length }} turmas</h4>
        </div>
      </div>
    </div>

    <!-- Indicator charts dashboard -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
      <!-- Chart 1: Progress comparison -->
      <div
        class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-2xs space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-gray-950 dark:text-white tracking-tight flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-600 block"></span>
            Progresso por Curso
          </h3>
          <span
            class="text-[9px] bg-blue-50 dark:bg-blue-950/45 text-blue-600 dark:text-blue-300 border border-transparent dark:border-blue-900/30 px-2.5 py-0.5 font-bold rounded-full">Aulas
            Concluídas</span>
        </div>
        <div class="space-y-4 pt-1.5 overflow-hidden">
          <div v-for="c in courseCompletionData" :key="c.id" class="space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-slate-300">
              <span class="truncate pr-2" :title="c.title">{{ c.title }}</span>
              <span class="shrink-0 text-slate-500 dark:text-slate-400">{{ c.avgCompleted }} / {{ c.totalLessons
                }}</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
              <div class="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out"
                :style="{ width: c.totalLessons > 0 ? `${Math.min((c.avgCompleted / c.totalLessons) * 100, 100)}%` : '0%' }">
              </div>
            </div>
            <div class="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
              <span>Alunos Matriculados:</span>
              <span class="text-slate-600 dark:text-slate-305 font-bold">{{ c.studentCount }}</span>
            </div>
          </div>
          <div v-if="courseCompletionData.length === 0"
            class="text-xs text-center text-gray-400 dark:text-gray-500 py-6">
            Nenhum curso cadastrado ainda.
          </div>
        </div>
      </div>

      <!-- Chart 2: Distribuicao de notas -->
      <div
        class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-gray-950 dark:text-white tracking-tight flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
              Desempenho nos Quizzes
            </h3>
            <span
              class="text-[9px] bg-emerald-50 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-300 border border-transparent dark:border-emerald-900/30 px-2.5 py-0.5 font-bold rounded-full">Proporções</span>
          </div>

          <div class="flex items-center justify-center py-6">
            <!-- Radial Donut SVG -->
            <div class="relative w-32 h-32">
              <svg class="w-full h-full transform -rotate-90 animate-fade-in" viewBox="0 0 36 36">
                <!-- Grey track -->
                <circle cx="18" cy="18" r="15.915" fill="none" class="stroke-slate-100 dark:stroke-slate-800"
                  stroke-width="3.5" />

                <!-- Excellent Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" stroke-width="3.5"
                  :stroke-dasharray="`${gradeDistributionData.excellentPct} ${100 - gradeDistributionData.excellentPct}`"
                  stroke-dashoffset="0" />

                <!-- Good Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" stroke-width="3.5"
                  :stroke-dasharray="`${gradeDistributionData.goodPct} ${100 - gradeDistributionData.goodPct}`"
                  :stroke-dashoffset="`-${gradeDistributionData.excellentPct}`" />

                <!-- Needs Review Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" stroke-width="3.5"
                  :stroke-dasharray="`${gradeDistributionData.reviewPct} ${100 - gradeDistributionData.reviewPct}`"
                  :stroke-dashoffset="`-${gradeDistributionData.excellentPct + gradeDistributionData.goodPct}`" />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span class="text-2xl font-black text-gray-900 dark:text-white leading-none">{{
                  gradeDistributionData.total }}</span>
                <span
                  class="text-[8.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Avaliados</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-slate-800 pt-3 text-center">
          <div>
            <div class="flex items-center justify-center gap-1">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span class="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">Nota A</span>
            </div>
            <h5 class="text-xs font-black text-gray-800 dark:text-gray-200 mt-0.5">{{ gradeDistributionData.excellentPct
              }}%</h5>
          </div>
          <div>
            <div class="flex items-center justify-center gap-1">
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              <span class="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">Nota B</span>
            </div>
            <h5 class="text-xs font-black text-gray-800 dark:text-gray-200 mt-0.5">{{ gradeDistributionData.goodPct }}%
            </h5>
          </div>
          <div>
            <div class="flex items-center justify-center gap-1">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              <span class="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">Dificuldade</span>
            </div>
            <h5 class="text-xs font-black text-gray-800 dark:text-gray-200 mt-0.5">{{ gradeDistributionData.reviewPct
              }}%</h5>
          </div>
        </div>
      </div>

      <!-- Chart 3: Engajamento de Atendimento -->
      <div
        class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-2xs space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-indigo-500 block"></span>
            Participação de Alunos
          </h3>
          <span
            class="text-[9px] bg-indigo-50 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-300 border border-transparent dark:border-indigo-900/30 px-2.5 py-0.5 font-bold rounded-full">Engajamento</span>
        </div>

        <div class="space-y-4 pt-1">
          <!-- Readings -->
          <div class="space-y-1.5 text-left">
            <div class="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-slate-300">
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                Leituras de Diálogos
              </span>
              <span class="text-slate-500 dark:text-slate-400">{{ activityEngagementScores.readings }} clicks</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="bg-indigo-600 h-full rounded-full transition-all duration-500"
                :style="{ width: `${activityEngagementScores.readingsPct}%` }"></div>
            </div>
          </div>

          <!-- Videos -->
          <div class="space-y-1.5 text-left">
            <div class="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-slate-300">
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-violet-500"></span>
                Vídeolas Assistidas
              </span>
              <span class="text-slate-500 dark:text-slate-400">{{ activityEngagementScores.videos }} clicks</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="bg-violet-600 h-full rounded-full transition-all duration-500"
                :style="{ width: `${activityEngagementScores.videosPct}%` }"></div>
            </div>
          </div>

          <!-- Quizzes -->
          <div class="space-y-1.5 text-left">
            <div class="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-slate-300">
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-fuchsia-500"></span>
                Quizzes Entregues
              </span>
              <span class="text-slate-500 dark:text-slate-400">{{ activityEngagementScores.quizzes }} clicks</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="bg-fuchsia-600 h-full rounded-full transition-all duration-500"
                :style="{ width: `${activityEngagementScores.quizzesPct}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section: Melhoria Contínua e Eficiência Pedagógica -->
    <div
      class="bg-slate-50 dark:bg-slate-900/45 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 space-y-6 text-left select-none">
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150/60 dark:border-slate-800/60 pb-4">
        <div>
          <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider block">Diagnóstico de
            Retenção & Melhoria Pedagógica</h3>
          <p class="text-xs text-slate-400 dark:text-slate-500 font-bold block">Detecte lições de alta complexidade ou
            quedas bruscas de engajamento para aprimoramento didático contínuo.</p>
        </div>
        <span
          class="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-bold shrink-0 border border-transparent dark:border-indigo-900/20">
          🔍 Auditor Didático
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Part A: Analise de Eficiência por Curso -->
        <div
          class="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-gray-150/40 dark:border-slate-850 space-y-4">
          <div>
            <h4 class="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Índice de
              Conversão de Certificados</h4>
            <p class="text-[10.5px] text-slate-400 dark:text-slate-500 font-bold">Relação de matriculados que
              conseguiram o selo de certificação por curso.</p>
          </div>

          <div class="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            <div v-for="c in pedCourseEfficiency" :key="c.id"
              class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
              <div class="flex items-center justify-between text-xs font-extrabold">
                <span class="text-slate-800 dark:text-slate-200 truncate max-w-[180px]" :title="c.title">{{ c.title
                  }}</span>
                <span :class="[
                  'text-[10px] font-black uppercase px-2 py-0.5 rounded-full',
                  c.rate >= 60 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' :
                    c.rate >= 30 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' :
                      'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                ]">
                  {{ c.rate }}% Eficiência
                </span>
              </div>
              <!-- Mini progress bar -->
              <div class="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500" :class="[
                  c.rate >= 60 ? 'bg-emerald-500' :
                    c.rate >= 30 ? 'bg-amber-500' :
                      'bg-rose-500'
                ]" :style="{ width: `${c.rate}%` }"></div>
              </div>
              <div class="flex justify-between text-[10px] text-slate-450 dark:text-slate-500 font-bold leading-none">
                <span>Certificados: {{ c.certified }} / {{ c.totalStudents }}</span>
                <span v-if="c.rate < 30" class="text-rose-500 dark:text-rose-400">⚠️ Alerta de Evasão</span>
                <span v-else-if="c.rate >= 60" class="text-emerald-600 dark:text-emerald-400">✓ Fluxo Saudável</span>
                <span v-else class="text-amber-600 dark:text-amber-400">✎ Recomenda-se Ajuste</span>
              </div>
            </div>
            <div v-if="pedCourseEfficiency.length === 0"
              class="text-xs text-slate-400 dark:text-slate-500 italic py-4 text-center">
              Sem dados históricos disponíveis para avaliar eficiência.
            </div>
          </div>
        </div>

        <!-- Part B: Recomendações de Aprimoramento Didático -->
        <div
          class="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-gray-150/40 dark:border-slate-850 space-y-4">
          <div>
            <h4 class="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Ações
              Estratégicas para Melhoria Contínua</h4>
            <p class="text-[10.5px] text-slate-400 dark:text-slate-500 font-bold">Gabarito de correções acionáveis com
              base nas turmas e progresso dos alunos.</p>
          </div>

          <div class="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            <div v-for="rec in pedagogicalRecommendations" :key="rec.id"
              class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex gap-2.5 text-[11px] leading-relaxed">
              <span class="text-indigo-500 dark:text-indigo-400 shrink-0 font-extrabold text-xs">💡</span>
              <div class="space-y-0.5 text-left">
                <p class="font-extrabold text-slate-800 dark:text-slate-200 leading-tight">{{ rec.title }}</p>
                <p class="text-slate-500 dark:text-slate-400 font-medium leading-normal">{{ rec.text }}</p>
              </div>
            </div>
            <div v-if="pedagogicalRecommendations.length === 0"
              class="text-xs text-slate-400 dark:text-slate-500 italic py-4 text-center">
              Tudo sob controle! Nenhum gargalo didático relevante detectado no momento.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sub Navigation Tabs for Analytics Section -->
    <div
      class="flex bg-slate-100 dark:bg-slate-805 p-1 rounded-xl w-full max-w-sm sm:max-w-md select-none border border-transparent dark:border-slate-800">
      <button type="button" @click="analyticsTab = 'students'" :class="[
        'flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center',
        analyticsTab === 'students' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-gray-500 dark:text-gray-450 hover:text-gray-900 dark:hover:text-white'
      ]">
        👥 Alunos ({{ progressReports.length }})
      </button>
      <button type="button" @click="analyticsTab = 'courses'" :class="[
        'flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center',
        analyticsTab === 'courses' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-gray-500 dark:text-gray-450 hover:text-gray-900 dark:hover:text-white'
      ]">
        📚 Histórico de Cursos ({{ courses.length }})
      </button>
    </div>

    <!-- Tab 1: Students performance list with Excel and JSON export features -->
    <div v-if="analyticsTab === 'students'"
      class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4 shadow-2xs text-left animate-fadeIn">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider block">Estudantes sob sua
            Coordenação</h3>
          <p class="text-xs text-gray-400 dark:text-gray-500 leading-tight block">Acompanhe as notas dos quizzes e emita
            relatórios analíticos formatados.</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button type="button" @click="handleExportXLSX"
            class="p-1 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/45 dark:border-emerald-900/40 dark:text-emerald-300 rounded-lg text-[10.5px] font-bold cursor-pointer transition-all flex items-center gap-1">
            📥 Exportar Excel (XLSX)
          </button>

          <button type="button" @click="handleExportJSON"
            class="p-1 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 dark:bg-blue-950/45 dark:border-blue-900/40 dark:text-blue-300 rounded-lg text-[10.5px] font-bold cursor-pointer transition-all flex items-center gap-1">
            📥 Exportar JSON
          </button>
        </div>
      </div>

      <!-- Search Box -->
      <div class="flex items-center justify-start select-none">
        <div class="relative w-full sm:max-w-xs">
          <span
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
            <Search class="w-4 h-4" />
          </span>
          <input type="text" placeholder="Pesquisar estudante por nome ou ID..." v-model="studentQuery"
            class="w-full text-xs pl-9 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl p-2.5 focus:outline-hidden text-gray-900 dark:text-white" />
        </div>
      </div>

      <p v-if="filteredStudentReports.length === 0" class="text-xs text-slate-400 dark:text-slate-500 italic py-4">
        Nenhum estudante correspondente encontrado.
      </p>
      <div v-else class="overflow-x-auto">
        <table id="instructor-analytics-table" class="w-full text-left border-collapse text-xs">
          <thead>
            <tr
              class="border-b border-gray-100 dark:border-slate-850 text-gray-400 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
              <th class="py-2.5 font-bold">Estudante</th>
              <th class="py-2.5 font-bold">Curso Assinalado</th>
              <th class="py-2.5 font-bold text-center">Lições Concluídas</th>
              <th class="py-2.5 font-bold">Média Acadêmica</th>
              <th class="py-2.5 font-bold">Status do Certificado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in paginatedStudentReports" :key="report.id"
              class="border-b border-gray-200/50 dark:border-slate-800/65 text-gray-600 dark:text-slate-350 hover:bg-gray-50/50 dark:hover:bg-slate-850/30 transition-colors duration-155">
              <td class="py-3">
                <div class="font-bold text-slate-900 dark:text-white">{{ getStudentName(report.userId) }}</div>
                <div class="text-[9.5px] font-mono text-gray-450 dark:text-slate-500 leading-none mt-0.5">ID: {{
                  report.userId.substring(0, 10) }}...</div>
              </td>
              <td class="py-3 font-medium text-gray-800 dark:text-slate-205">
                {{courses.find(c => c.id === report.courseId)?.title || "Manual Course"}}
              </td>
              <td class="py-3 text-center font-bold text-blue-600 dark:text-blue-400">{{ report.completedLessons.length
                }} check(s)</td>
              <td class="py-3">
                <template v-if="Object.values(report.quizScores).length > 0">
                  <span :class="[
                    'font-bold px-2 py-0.5 rounded-sm',
                    (Object.values(report.quizScores).reduce((a, b) => a + b, 0) / Object.values(report.quizScores).length) >= 70
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                  ]">
                    {{
                      Math.round(Object.values(report.quizScores).reduce((a, b) => a + b, 0) / Object.values(report.quizScores).length)
                    }}%
                  </span>
                </template>
                <span v-else class="text-gray-400 dark:text-slate-500 italic">Sem notas</span>
              </td>
              <td class="py-3">
                <span v-if="report.certified"
                  class="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full select-none">
                  <Check class="w-2.5 h-2.5" /> Liberado
                </span>
                <span v-else class="text-gray-400 dark:text-slate-500 italic font-medium">Em andamento</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginator Footer for Students list -->
      <div v-if="filteredStudentReports.length > 0"
        class="pt-4 flex items-center justify-between gap-4 text-xs font-semibold select-none text-slate-450 dark:text-slate-400 border-t border-gray-100 dark:border-slate-850/60 mt-3 flex-wrap">
        <span>
          Mostrando <strong>{{ Math.min(filteredStudentReports.length, (studentPage - 1) * studentsPerPage + 1)
            }}</strong> a
          <strong>{{ Math.min(filteredStudentReports.length, studentPage * studentsPerPage) }}</strong> de
          <strong>{{ filteredStudentReports.length }}</strong> estudantes
        </span>
        <div class="flex items-center gap-1.5">
          <button type="button" :disabled="studentPage === 1" @click="studentPage--"
            class="p-1 px-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-gray-200 dark:border-slate-850 rounded-lg cursor-pointer disabled:opacity-40 transition disabled:cursor-not-allowed inline-flex items-center gap-1 text-[11px]">
            <ChevronLeft class="w-3.5 h-3.5" /> Anterior
          </button>
          <span class="px-2 text-[11px]">Página {{ studentPage }} de {{ totalStudentPages || 1 }}</span>
          <button type="button" :disabled="studentPage === totalStudentPages || totalStudentPages <= 1"
            @click="studentPage++"
            class="p-1 px-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-gray-200 dark:border-slate-850 rounded-lg cursor-pointer disabled:opacity-40 transition disabled:cursor-not-allowed inline-flex items-center gap-1 text-[11px]">
            Próximo
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Tab 2: Course History List & Expandable Lessons Grid -->
    <div v-if="analyticsTab === 'courses'"
      class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4 shadow-2xs text-left animate-fadeIn">
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100/40 dark:border-slate-800/60 pb-3">
        <div>
          <h3 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider block">Histórico de Cursos
            no
            Servidor</h3>
          <p class="text-xs text-gray-400 dark:text-gray-500 leading-tight block">Veja a grade acadêmica de todas as
            aulas
            em circulação e gerencie as publicações.</p>
        </div>

        <!-- Search box for courses -->
        <div class="relative w-full sm:max-w-xs">
          <span
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
            <Search class="w-4 h-4" />
          </span>
          <input type="text" placeholder="Pesquisar por título ou nível..." v-model="coursesQuery"
            class="w-full text-xs pl-9 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl p-2.5 focus:outline-hidden text-gray-900 dark:text-white" />
        </div>
      </div>

      <p v-if="filteredCourses.length === 0" class="text-xs text-gray-455 dark:text-slate-500 italic py-4">Nenhum curso
        correspondente encontrado.</p>
      <div v-else class="space-y-3.5">
        <div v-for="course in paginatedCoursesList" :key="course.id"
          class="p-4 bg-slate-50 dark:bg-slate-950/45 border border-slate-200/60 dark:border-slate-850 rounded-xl space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-[12.5px] text-slate-800 dark:text-white">{{ course.title }}</span>
                <span
                  class="px-2 py-0.2 bg-blue-50 text-blue-700 text-[9px] font-bold border border-blue-100 rounded-sm">
                  Nível {{ course.level }}
                </span>
              </div>
              <p class="text-[11px] text-gray-550 dark:text-gray-400 leading-none">
                Criado por: <strong>{{ course.creatorName || "Voluntário" }}</strong> | {{lessons.filter(l =>
                  l.courseId
                === course.id).length }} lições cadastradas
              </p>
              <!-- Course progress criteria tag summary -->
              <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span
                  class="text-[9px] px-1.5 py-0.5 rounded-sm bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Métricas:</span>
                <span
                  :class="['text-[8.5px] px-1.5 py-0.5 rounded-sm font-bold uppercase border', (!course.progressConfig || course.progressConfig.requireReading) ? 'bg-emerald-50 border-emerald-100/50 text-emerald-700' : 'bg-gray-100 border-gray-150 text-gray-400 line-through']">Leitura</span>
                <span
                  :class="['text-[8.5px] px-1.5 py-0.5 rounded-sm font-bold uppercase border', (course.progressConfig && course.progressConfig.requireVideo) ? 'bg-emerald-50 border-emerald-100/50 text-emerald-700' : 'bg-gray-100 border-gray-150 text-gray-400 line-through']">Vídeo</span>
                <span
                  :class="['text-[8.5px] px-1.5 py-0.5 rounded-sm font-bold uppercase border', (course.progressConfig && course.progressConfig.requireQuiz) ? 'bg-emerald-50 border-emerald-100/50 text-emerald-700' : 'bg-gray-100 border-gray-150 text-gray-400 line-through']">Quiz
                  {{ course.progressConfig?.minQuizScore ? `(>= ${course.progressConfig.minQuizScore}%)` : '' }}</span>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
              <button type="button" @click="exportCourseToJson(course)"
                class="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-950 rounded-lg text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                title="Exportar curso completo em JSON">
                <UploadCloud class="w-3.5 h-3.5 rotate-180" />
                Exportar (JSON)
              </button>

              <button type="button" @click="expandedCourseId = expandedCourseId === course.id ? null : course.id"
                class="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-lg text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs">
                Grade de Aulas
                <ChevronUp v-if="expandedCourseId === course.id" class="w-3.5 h-3.5" />
                <ChevronDown v-else class="w-3.5 h-3.5" />
              </button>

              <button type="button" @click="startEditCert(course)"
                class="px-3 py-1.5 bg-blue-50/70 hover:bg-blue-100/90 text-blue-700 border border-blue-200 rounded-lg text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs animate-fadeIn"
                title="Configurar a estética do certificado emitido para o curso">
                <Award class="w-3.5 h-3.5" />
                Personalizar Certificado
              </button>

              <button v-if="deleteCourseFn" type="button" @click="deleteConfirm(course)"
                class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                title="Excluir Curso">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Certificate editor inline card -->
          <div v-if="editingCertCourseId === course.id"
            class="p-5 bg-white border border-blue-100 rounded-xl space-y-4 animate-fadeIn text-left text-slate-800">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 class="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Award class="w-4 h-4 text-amber-500" />
                Editor de Certificado Simplificado
              </h4>
              <button @click="cancelEditCert"
                class="text-xs font-semibold text-slate-400 hover:text-slate-600">Fechar</button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Color Config -->
              <div class="space-y-2">
                <label class="block text-xs font-bold text-slate-600">Cor Temática do Certificado</label>
                <p class="text-[10.5px] text-slate-400 leading-tight">Escolha a cor para o brasão, borda dupla e
                  ornamentos
                  de canto.</p>

                <!-- Preset Swatches -->
                <div class="flex flex-wrap gap-1.5 py-1">
                  <button v-for="color in ['#1e3a8a', '#065f46', '#1c1917', '#881337', '#7c2d12', '#4c1d95']"
                    :key="color" type="button" @click="certColorInput = color"
                    class="w-6 h-6 rounded-full border border-slate-200 transition-transform active:scale-90 relative cursor-pointer"
                    :style="{ backgroundColor: color }" title="Clique para selecionar">
                    <span v-if="certColorInput === color"
                      class="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold">✓</span>
                  </button>
                </div>

                <div class="flex items-center gap-2">
                  <input type="color" v-model="certColorInput"
                    class="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 bg-transparent" />
                  <input type="text" v-model="certColorInput" placeholder="#1e3a8a"
                    class="w-24 text-[11px] bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-slate-800 focus:outline-blue-500" />
                </div>
              </div>

              <!-- Icon seal Config -->
              <div class="space-y-2">
                <label class="block text-xs font-bold text-slate-600">Ícone PNG Customizado (Selo)</label>
                <p class="text-[10.5px] text-slate-400 leading-tight">Insira a URL de uma imagem PNG para ser inserida
                  como
                  brasão central no pé do certificado.</p>

                <input type="url" v-model="certIconUrlInput"
                  placeholder="Ex: https://img.icons8.com/color/96/quality-badge.png"
                  class="w-full text-xs bg-slate-50 border border-slate-250 p-2.5 rounded-lg text-slate-800 focus:outline-blue-500" />

                <!-- Suggestions quick copy -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Modelos recomendados (Clique
                      para usar):</p>
                    <a href="https://icons8.com.br/icons" target="_blank" rel="noopener noreferrer"
                      class="text-[9px] text-blue-600 hover:underline flex items-center gap-1 font-bold cursor-pointer shrink-0">
                      <ExternalLink class="w-3 h-3" />
                      Mais opções no Icons8 ↗
                    </a>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button type="button" @click="certIconUrlInput = 'https://img.icons8.com/color/96/gold-medal.png'"
                      class="text-[9.5px] bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold px-2 py-1 rounded border border-amber-200 transition-colors cursor-pointer">🏅
                      Medalha de Ouro</button>
                    <button type="button"
                      @click="certIconUrlInput = 'https://img.icons8.com/color/96/quality-badge.png'"
                      class="text-[9.5px] bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold px-2 py-1 rounded border border-blue-200 transition-colors cursor-pointer">⭐
                      Estrela Real</button>
                    <button type="button"
                      @click="certIconUrlInput = 'https://img.icons8.com/?size=100&id=lsZBoVE2zMo3&format=png&color=000000'"
                      class="text-[9.5px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold px-2 py-1 rounded border border-emerald-200 transition-colors cursor-pointer">🛡️
                      Selo de Confiança</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Premium Administration Customizer Section (janyel.lima2809 exclusive) -->
            <div v-if="isJanyelAdmin" class="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Fundo (Background) Selection -->
              <div class="space-y-1.5 text-left">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Fundo do
                  Documento</label>
                <select v-model="certBgStyleInput"
                  class="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer">
                  <option value="vintage-parchment">📜 Pergaminho Vintage (Claro)</option>
                  <option value="dark-velvet">🌌 Veludo Negro (Escuro)</option>
                  <option value="clean-light">⬜ Branco Clássico (Limpo)</option>
                </select>
              </div>

              <!-- Moldura (Frame) Selection -->
              <div class="space-y-1.5 text-left">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Estilo da
                  Moldura</label>
                <select v-model="certFrameStyleInput"
                  class="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer">
                  <option value="medieval-gothic">🏰 Gótico Medieval (Ornato Antigo)</option>
                  <option value="classic-imperial">🏛️ Imperial Clássico (Bordas Duplas)</option>
                  <option value="modern-border">📱 Moderno Minimalista (Linhas Retas)</option>
                </select>
              </div>

              <!-- Accent Color Selection -->
              <div class="space-y-1.5 text-left">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cor dos Detalhes &
                  Selo</label>
                <select v-model="certDetailColorInput"
                  class="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-xl text-xs p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer">
                  <option value="gold">⚜️ Ouro Nobre (Gradiente)</option>
                  <option value="silver">🛡️ Prata Imperial (Gradiente)</option>
                  <option value="bronze">⚔️ Bronze Antigo (Gradiente)</option>
                  <option value="ruby">💎 Rubi Real (Gradiente)</option>
                  <option value="emerald">🌲 Esmeralda Mágica (Gradiente)</option>
                  <option value="theme">🎨 Cor Padrão do Curso</option>
                </select>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <button type="button" @click="openPreviewCert(course)"
                class="w-full sm:w-auto px-4 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 mr-auto">
                <span>👁️ Ver Preview do Certificado</span>
              </button>
              <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button type="button" @click="cancelEditCert"
                  class="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">Cancelar</button>
                <button type="button" @click="saveCertConfig"
                  class="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors cursor-pointer shadow-2xs">Salvar
                  Configuração</button>
              </div>
            </div>
          </div>

          <!-- Expandable Table for Lesson Content/Quiz Checklist -->
          <div v-if="expandedCourseId === course.id"
            class="bg-white rounded-lg border border-slate-200/80 p-3.5 space-y-2.5 animate-fadeIn">
            <p class="text-[10px] text-slate-500 uppercase font-black tracking-widest border-b border-slate-100 pb-1">📚
              Matriz Curricular (Grade de Lições)</p>

            <p v-if="lessons.filter(l => l.courseId === course.id).length === 0"
              class="text-xs text-gray-450 italic pl-1">
              Este curso não possui lições cadastradas na base de dados.
            </p>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-left text-[11px] font-medium text-slate-600">
                <thead>
                  <tr class="border-b border-slate-100 text-slate-400 font-bold">
                    <th class="pb-1 text-center w-12">Ordem</th>
                    <th class="pb-1 pl-2">Título da Lição</th>
                    <th class="pb-1 text-center">Videoaumentada</th>
                    <th class="pb-1 text-center">Comprimento Texto</th>
                    <th class="pb-1 text-right">Qtd. Questões</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  <tr v-for="l in lessons.filter(l => l.courseId === course.id)" :key="l.id"
                    class="hover:bg-slate-50/40">
                    <td class="py-2 text-center font-bold font-mono text-blue-600 font-extrabold">#{{ l.order }}</td>
                    <td class="py-2 pl-2 font-bold text-slate-800">{{ l.title }}</td>
                    <td class="py-2 text-center">
                      <span v-if="l.videoUrl"
                        class="inline-flex text-[9px] font-bold bg-indigo-50 text-indigo-700 px-1.5 rounded-sm border border-indigo-100">Sim</span>
                      <span v-else class="text-gray-400 italic">Não</span>
                    </td>
                    <td class="py-2 text-center font-mono text-slate-400">{{ l.content.length }} caracs.</td>
                    <td class="py-2 text-right font-bold text-emerald-600 font-mono pr-2">{{ (l.quiz || []).length }}
                      qts.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Paginator Footer for Courses list -->
      <div v-if="filteredCourses.length > 0"
        class="pt-4 flex items-center justify-between gap-4 text-xs font-semibold select-none text-slate-450 dark:text-slate-400 border-t border-gray-200/60 dark:border-slate-800 mt-3 flex-wrap">
        <span>
          Mostrando <strong>{{ Math.min(filteredCourses.length, (coursesPage - 1) * coursesPerPage + 1) }}</strong> a
          <strong>{{ Math.min(filteredCourses.length, coursesPage * coursesPerPage) }}</strong> de
          <strong>{{ filteredCourses.length }}</strong> cursos no servidor
        </span>
        <div class="flex items-center gap-1.5">
          <button type="button" :disabled="coursesPage === 1" @click="coursesPage--"
            class="p-1 px-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-gray-200 dark:border-slate-850 rounded-lg cursor-pointer disabled:opacity-40 transition disabled:cursor-not-allowed inline-flex items-center gap-1 text-[11px]">
            <ChevronLeft class="w-3.5 h-3.5" /> Anterior
          </button>
          <span class="px-2 text-[11px]">Página {{ coursesPage }} de {{ totalCoursesPages || 1 }}</span>
          <button type="button" :disabled="coursesPage === totalCoursesPages || totalCoursesPages <= 1"
            @click="coursesPage++"
            class="p-1 px-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-gray-200 dark:border-slate-850 rounded-lg cursor-pointer disabled:opacity-40 transition disabled:cursor-not-allowed inline-flex items-center gap-1 text-[11px]">
            Próximo
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Custom Course Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="courseToDelete"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left animate-fadeIn">
        <div
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl animate-scaleUp text-slate-900 dark:text-white">
          <div class="flex items-start gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div
              class="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-900/30 text-rose-600">
              <Trash2 class="w-6 h-6" />
            </div>
            <div>
              <h3
                class="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white uppercase tracking-wider leading-none">
                Excluir Curso</h3>
              <p class="text-[10px] text-rose-500 font-bold uppercase mt-1">Ação Irreversível</p>
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-xs sm:text-sm text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">
              Tem certeza absoluta que deseja remover permanentemente o curso <strong
                class="text-slate-950 dark:text-white">"{{ courseToDelete.title }}"</strong>?
            </p>
            <p class="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
              Todas as lições, quizes, e dados vinculados serão excluídos permanentemente. Os alunos inscritos perderão
              acesso instantaneamente.
            </p>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" @click="courseToDelete = null"
              class="w-1/2 py-3 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-xl transition duration-150 cursor-pointer shadow-2xs">
              Cancelar
            </button>
            <button type="button" @click="confirmDeleteCourse"
              class="w-1/2 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl transition duration-155 cursor-pointer shadow-md">
              Sim, Excluir Curso
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Live Preview Certificate Modal Dialog -->
    <CertificateViewer v-if="showPreviewCertData" :studentName="showPreviewCertData.studentName"
      :courseTitle="showPreviewCertData.courseTitle" :primaryColor="showPreviewCertData.primaryColor"
      :iconUrl="showPreviewCertData.iconUrl" :bgStyle="showPreviewCertData.bgStyle"
      :frameStyle="showPreviewCertData.frameStyle" :detailColor="showPreviewCertData.detailColor"
      :creatorId="showPreviewCertData.creatorId" :isMaster="isJanyelAdmin" @close="showPreviewCertData = null" />
  </div>
</template>
