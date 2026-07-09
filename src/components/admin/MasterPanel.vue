<script setup lang="ts">
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  Activity,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Mail,
  Target,
  TrendingUp,
  Users,
  Zap
} from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { showToast } from '../../composables/useAppState';
import { useI18n } from '../../composables/useI18n';
import { db } from '../../firebase';
import { ClassTurma, Course, Progress, UserProfile } from '../../types';
import MasterCourseSuccession from './MasterCourseSuccession.vue';
import MasterUserList from './MasterUserList.vue';

const props = defineProps<{
  users: UserProfile[];
  courses: Course[];
  classes: ClassTurma[];
  progressReports: Progress[];
  currentUserId: string;
  isDemoUser?: boolean;
  primaryColor?: string;
}>();

const emit = defineEmits<{
  (e: 'update-user-role', uid: string, isInstructor: boolean): void;
  (e: 'delete-user-completely', uid: string): void;
  (e: 'reassign-course-owner', payload: { courseId: string; instructorId: string; instructorName: string }): void;
}>();

const { t, locale } = useI18n();

const totalClassesCount = computed(() => props.classes.length);

// 1. Core Continuous Improvement Metrics & Calculations
const totalCertified = computed(() => props.progressReports.filter(p => p.certified).length);

const globalCertificationRate = computed(() => {
  const total = props.progressReports.length;
  if (total === 0) return 0;
  return Math.round((props.progressReports.filter(p => p.certified).length / total) * 100);
});

const globalQuizAverage = computed(() => {
  let totalScoresSum = 0;
  let scoresCount = 0;
  props.progressReports.forEach(p => {
    const scores = Object.values(p.quizScores);
    if (scores.length > 0) {
      totalScoresSum += scores.reduce((sum, s) => sum + s, 0);
      scoresCount += scores.length;
    }
  });
  return scoresCount > 0 ? Math.round(totalScoresSum / scoresCount) : 0;
});

const instructorStudentRatio = computed(() => {
  const instructorsCount = props.users.filter(u => u.isInstructor).length;
  const activeStudentsCount = Array.from(new Set(props.progressReports.map(p => p.userId))).length;
  if (activeStudentsCount === 0) return 0;
  return Math.round((activeStudentsCount / (instructorsCount || 1)) * 10) / 10;
});

// 2. Data Distribution by English Level for targeted resource allocation
const levelDistribution = computed(() => {
  const levels = {
    Beginner: { students: 0, courses: 0, certificates: 0, classes: 0 },
    Intermediate: { students: 0, courses: 0, certificates: 0, classes: 0 },
    Advanced: { students: 0, courses: 0, certificates: 0, classes: 0 }
  };

  props.courses.forEach(c => {
    if (levels[c.level]) {
      levels[c.level].courses++;
    }
  });

  props.progressReports.forEach(p => {
    const c = props.courses.find(course => course.id === p.courseId);
    if (c && levels[c.level]) {
      levels[c.level].students++;
      if (p.certified) {
        levels[c.level].certificates++;
      }
    }
  });

  props.classes.forEach(cl => {
    const c = props.courses.find(course => course.id === cl.courseId);
    if (c && levels[c.level]) {
      levels[c.level].classes++;
    }
  });

  return levels;
});

// 3. Automated Continuous System Improvement Suggestions Engine
const systemRecommendations = computed(() => {
  const list: Array<{ id: number; title: string; type: 'warning' | 'info' | 'success'; text: string }> = [];
  let recId = 1;

  const beg = levelDistribution.value.Beginner;
  const inter = levelDistribution.value.Intermediate;
  const adv = levelDistribution.value.Advanced;

  // Rule A: Low practice session density in high demand levels
  if (beg.students > 0 && beg.classes === 0) {
    list.push({
      id: recId++,
      title: t('master.panel.recBeginnerDeficitTitle'),
      type: 'warning',
      text: t('master.panel.recBeginnerDeficitText', { count: beg.students })
    });
  } else if (beg.classes > 0 && beg.students > (beg.classes * 4)) {
    list.push({
      id: recId++,
      title: t('master.panel.recBeginnerDensityTitle'),
      type: 'info',
      text: t('master.panel.recBeginnerDensityText', { avg: Math.round(beg.students / beg.classes) })
    });
  }

  if (inter.students > 0 && inter.classes === 0) {
    list.push({
      id: recId++,
      title: t('master.panel.recIntermediateDeficitTitle'),
      type: 'warning',
      text: t('master.panel.recIntermediateDeficitText', { count: inter.students })
    });
  }

  // Rule B: Identify courses with low completion rates (Bottlenecks)
  props.courses.forEach(c => {
    const courseReports = props.progressReports.filter(p => p.courseId === c.id);
    if (courseReports.length >= 3) {
      const certifiedNum = courseReports.filter(p => p.certified).length;
      const rate = (certifiedNum / courseReports.length) * 100;
      if (rate < 30) {
        list.push({
          id: recId++,
          title: t('master.panel.recPedagogicalBottleneckTitle', { title: c.title }),
          type: 'warning',
          text: t('master.panel.recPedagogicalBottleneckText', { rate: Math.round(rate) })
        });
      }
    }
  });

  // Rule C: Overload of Volunteer Mentors
  const tutorsCount = props.users.filter(u => u.isInstructor).length;
  const activeStudentsCount = Array.from(new Set(props.progressReports.map(p => p.userId))).length;
  if (tutorsCount > 0 && (activeStudentsCount / tutorsCount) > 12) {
    list.push({
      id: recId++,
      title: t('master.panel.recTutorOverloadTitle'),
      type: 'warning',
      text: t('master.panel.recTutorOverloadText', { ratio: instructorStudentRatio.value })
    });
  }

  // Rule D: Success highlight
  if (globalCertificationRate.value >= 40) {
    list.push({
      id: recId++,
      title: t('master.panel.recHealthyCompletionTitle'),
      type: 'success',
      text: t('master.panel.recHealthyCompletionText', { rate: globalCertificationRate.value })
    });
  }

  if (list.length === 0) {
    list.push({
      id: recId++,
      title: t('master.panel.recEcosystemStabilityTitle'),
      type: 'info',
      text: t('master.panel.recEcosystemStabilityText')
    });
  }

  return list;
});

// EmailJS configurations state & persistence
const showEmailJsModal = ref(false);
const isLoadingConfig = ref(false);
const isSavingConfig = ref(false);

const emailJsConfig = ref({
  serviceId: '',
  templateCommId: '',
  templateSysId: '',
  publicKey: ''
});

const fetchCurrentConfig = async () => {
  isLoadingConfig.value = true;
  try {
    const docRef = doc(db, 'settings', 'emailjs');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      emailJsConfig.value = {
        serviceId: data.serviceId || '',
        templateCommId: data.templateCommId || '',
        templateSysId: data.templateSysId || '',
        publicKey: data.publicKey || ''
      };
    }
  } catch (error) {
    console.error('Error fetching EmailJS config:', error);
    showToast(t('master.panel.toastLoadError'), 'error');
  } finally {
    isLoadingConfig.value = false;
  }
};

const saveConfig = async () => {
  if (!emailJsConfig.value.serviceId || !emailJsConfig.value.templateCommId || !emailJsConfig.value.templateSysId || !emailJsConfig.value.publicKey) {
    showToast(t('master.panel.toastRequiredFields'), 'warning');
    return;
  }
  isSavingConfig.value = true;
  try {
    const docRef = doc(db, 'settings', 'emailjs');
    await setDoc(docRef, {
      serviceId: emailJsConfig.value.serviceId.trim(),
      templateCommId: emailJsConfig.value.templateCommId.trim(),
      templateSysId: emailJsConfig.value.templateSysId.trim(),
      publicKey: emailJsConfig.value.publicKey.trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: props.currentUserId
    });
    showToast(t('master.panel.toastSaveSuccess'), 'success');
    showEmailJsModal.value = false;
  } catch (error) {
    console.error('Error saving EmailJS config:', error);
    showToast(t('master.panel.toastSaveError'), 'error');
  } finally {
    isSavingConfig.value = false;
  }
};

onMounted(() => {
  fetchCurrentConfig();
});
</script>

<template>
  <div class="space-y-8 animate-fadeIn text-left">

    <!-- Banner / Overview -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
      <div>
        <h2 class="text-xl font-black text-gray-900 flex items-center gap-2">
          <span
            class="p-1 px-2 border border-amber-300 bg-amber-50 text-amber-700 rounded text-[10px] sm:text-xs select-none font-bold">👑
            {{ t('master.panel.badge') }}</span>
          {{ t('master.panel.generalManagement') }}
        </h2>
        <p class="text-xs text-gray-500 mt-1">
          {{ t('master.panel.generalManagementSub') }}
        </p>
      </div>
      <div class="shrink-0 flex items-center gap-3">
        <button type="button" @click="showEmailJsModal = true"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5">
          <Mail class="w-4 h-4" />
          {{ t('master.panel.configureEmailJs') }}
        </button>
      </div>
    </div>

    <!-- Grid Quick Dashboard Metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
        <div class="flex justify-between items-start">
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {{ t('master.panel.registeredAccounts') }}
          </p>
          <span class="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Users class="w-5 h-5" />
          </span>
        </div>
        <h4 class="text-2xl font-black text-gray-900 mt-2">{{ users.length }}</h4>
        <p class="text-[10px] text-emerald-600 font-bold mt-1">
          {{ t('master.panel.registeredAccountsSub') }}
        </p>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
        <div class="flex justify-between items-start">
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {{ t('master.panel.courseCatalog') }}
          </p>
          <span class="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <BookOpen class="w-5 h-5" />
          </span>
        </div>
        <h4 class="text-2xl font-black text-gray-900 mt-2">{{ courses.length }}</h4>
        <p class="text-[10px] text-gray-450 mt-1">
          {{ t('master.panel.courseCatalogSub') }}
        </p>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
        <div class="flex justify-between items-start">
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {{ t('master.panel.activePracticeClasses') }}
          </p>
          <span class="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <Calendar class="w-5 h-5" />
          </span>
        </div>
        <h4 class="text-2xl font-black text-gray-900 mt-2">{{ totalClassesCount }}</h4>
        <p class="text-[10px] text-amber-600 font-bold mt-1">
          {{ t('master.panel.activePracticeClassesSub') }}
        </p>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
        <div class="flex justify-between items-start">
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {{ t('master.panel.validCertificates') }}
          </p>
          <span class="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Award class="w-5 h-5" />
          </span>
        </div>
        <h4 class="text-2xl font-black text-gray-900 mt-2">
          {{ totalCertified }}
        </h4>
        <p class="text-[10px] text-indigo-600 font-bold mt-1">
          {{ t('master.panel.validCertificatesSub') }}
        </p>
      </div>
    </div>

    <!-- ADVANCED CONTINUOUS IMPROVEMENT ANALYTICS GRID -->
    <div class="bg-white rounded-3xl border border-gray-100 p-6 space-y-6 shadow-xs select-none">
      <div class="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider block">
            {{ t('master.panel.impactDashboardTitle') }}
          </h3>
          <p class="text-xs text-slate-400 font-bold block">
            {{ t('master.panel.impactDashboardSub') }}
          </p>
        </div>
        <Activity class="w-5 h-5 text-indigo-600" />
      </div>

      <!-- Core KPIs Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- KPI 1 -->
        <div class="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100/50">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {{ t('master.panel.completionEfficiency') }}
            </span>
            <Target class="w-4 h-4 text-emerald-600" />
          </div>
          <h5 class="text-2xl font-black text-slate-900">{{ globalCertificationRate }}%</h5>
          <p class="text-[10.5px] text-slate-400 font-bold">
            {{ t('master.panel.completionEfficiencySub') }}
          </p>
        </div>

        <!-- KPI 2 -->
        <div class="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100/50">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {{ t('master.panel.knowledgeRetention') }}
            </span>
            <TrendingUp class="w-4 h-4 text-indigo-600" />
          </div>
          <h5 class="text-2xl font-black text-slate-900">{{ globalQuizAverage }}%</h5>
          <p class="text-[10.5px] text-slate-400 font-bold">
            {{ t('master.panel.knowledgeRetentionSub') }}
          </p>
        </div>

        <!-- KPI 3 -->
        <div class="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100/50">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {{ t('master.panel.studentMentorRatio') }}
            </span>
            <Users class="w-4 h-4 text-blue-600" />
          </div>
          <h5 class="text-2xl font-black text-slate-900">1 : {{ instructorStudentRatio }}</h5>
          <p class="text-[10.5px] text-slate-400 font-bold">
            {{ t('master.panel.studentMentorRatioSub') }}
          </p>
        </div>
      </div>

      <!-- Charts & Diagnosis Row -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Demand per Level Visual Bar Chart (8 columns) -->
        <div class="lg:col-span-7 bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
          <div>
            <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider">
              {{ t('master.panel.demandTitle') }}
            </h4>
            <p class="text-[11px] text-slate-400 font-bold">
              {{ t('master.panel.demandSub') }}
            </p>
          </div>

          <div class="space-y-4 pt-1">
            <!-- Beginner -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded bg-blue-500 block"></span>
                  {{ t('master.panel.beginnerLabel') }}
                </span>
                <span class="text-slate-450 text-[10px]">
                  {{ t('master.panel.studentsCountText', { count: levelDistribution.Beginner.students }) }} · {{
                    t('master.panel.certsCountText', { count: levelDistribution.Beginner.certificates }) }} · {{
                    t('master.panel.classesCountText', { count: levelDistribution.Beginner.classes }) }}
                </span>
              </div>
              <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div class="bg-blue-500 h-full rounded-full transition-all duration-500"
                  :style="{ width: `${progressReports.length > 0 ? (levelDistribution.Beginner.students / progressReports.length) * 100 : 0}%` }">
                </div>
              </div>
            </div>

            <!-- Intermediate -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded bg-amber-500 block"></span>
                  {{ t('master.panel.intermediateLabel') }}
                </span>
                <span class="text-slate-450 text-[10px]">
                  {{ t('master.panel.studentsCountText', { count: levelDistribution.Intermediate.students }) }} · {{
                    t('master.panel.certsCountText', { count: levelDistribution.Intermediate.certificates }) }} · {{
                    t('master.panel.classesCountText', { count: levelDistribution.Intermediate.classes }) }}
                </span>
              </div>
              <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div class="bg-amber-500 h-full rounded-full transition-all duration-500"
                  :style="{ width: `${progressReports.length > 0 ? (levelDistribution.Intermediate.students / progressReports.length) * 100 : 0}%` }">
                </div>
              </div>
            </div>

            <!-- Advanced -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded bg-indigo-500 block"></span>
                  {{ t('master.panel.advancedLabel') }}
                </span>
                <span class="text-slate-450 text-[10px]">
                  {{ t('master.panel.studentsCountText', { count: levelDistribution.Advanced.students }) }} · {{
                    t('master.panel.certsCountText', { count: levelDistribution.Advanced.certificates }) }} · {{
                    t('master.panel.classesCountText', { count: levelDistribution.Advanced.classes }) }}
                </span>
              </div>
              <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div class="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  :style="{ width: `${progressReports.length > 0 ? (levelDistribution.Advanced.students / progressReports.length) * 100 : 0}%` }">
                </div>
              </div>
            </div>
          </div>

          <div
            class="text-[9.5px] text-slate-400 font-bold leading-normal border-t border-slate-200/50 pt-2 flex items-center gap-1.5">
            <span class="text-indigo-600">💡 {{ t('master.panel.planningTipTitle') }}</span>
            {{ t('master.panel.planningTipText') }}
          </div>
        </div>

        <!-- Continuous Improvement System Recommendations Dashboard (5 columns) -->
        <div class="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
          <div>
            <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb class="w-4 h-4 text-amber-500" />
              {{ t('master.panel.recommendationsTitle') }}
            </h4>
            <p class="text-[11px] text-slate-400 font-bold">
              {{ t('master.panel.recommendationsSub') }}
            </p>
          </div>

          <div class="space-y-3 max-h-[175px] overflow-y-auto pr-1">
            <div v-for="rec in systemRecommendations" :key="rec.id"
              class="p-3 rounded-xl border flex gap-2 text-left leading-snug" :class="[
                rec.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                  rec.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                    'bg-blue-50 border-blue-200 text-blue-900'
              ]">
              <span class="shrink-0 mt-0.5">
                <AlertTriangle v-if="rec.type === 'warning'" class="w-3.5 h-3.5 text-amber-600" />
                <CheckCircle2 v-else-if="rec.type === 'success'" class="w-3.5 h-3.5 text-emerald-600" />
                <Zap v-else class="w-3.5 h-3.5 text-blue-600" />
              </span>
              <div class="space-y-0.5">
                <p class="text-[11.5px] font-extrabold leading-tight">{{ rec.title }}</p>
                <p class="text-[10px] opacity-90 font-semibold leading-relaxed">{{ rec.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Master User List Section -->
    <MasterUserList :users="users" :currentUserId="currentUserId" :isDemoUser="isDemoUser" :primaryColor="primaryColor"
      @update-user-role="(uid, isInst) => emit('update-user-role', uid, isInst)"
      @delete-user-completely="(uid) => emit('delete-user-completely', uid)" />

    <!-- Master Course Succession Section -->
    <MasterCourseSuccession :courses="courses" :users="users" :primaryColor="primaryColor"
      @reassign-course-owner="(payload) => emit('reassign-course-owner', payload)" />

    <!-- EMAILJS CONFIGURATION MODAL -->
    <div v-if="showEmailJsModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div
        class="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp overflow-y-auto max-h-[90vh] space-y-5">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div class="flex items-center gap-2 text-indigo-650 dark:text-indigo-400">
            <Mail class="w-5 h-5" />
            <h3 class="text-base font-black uppercase tracking-wider">
              {{ t('master.panel.emailjsModalTitle') }}
            </h3>
          </div>
          <button type="button" @click="showEmailJsModal = false"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg cursor-pointer">
            ✕
          </button>
        </div>

        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {{ t('master.panel.emailjsModalDesc') }}
        </p>

        <!-- Loading Configuration State -->
        <div v-if="isLoadingConfig" class="flex flex-col items-center justify-center py-8 space-y-2">
          <Loader2 class="w-8 h-8 text-indigo-600 animate-spin" />
          <p class="text-xs text-slate-400 font-bold">
            {{ t('master.panel.queryingDatabase') }}
          </p>
        </div>

        <!-- Form fields -->
        <form v-else @submit.prevent="saveConfig" class="space-y-4">
          <!-- Service ID -->
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {{ t('master.panel.serviceIdLabel') }}
            </label>
            <input v-model="emailJsConfig.serviceId" type="text" placeholder="e.g. service_abcdef" required
              class="w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white focus:outline-hidden focus:border-indigo-500" />
          </div>

          <!-- Template ID - Comunicação -->
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {{ t('master.panel.templateCommIdLabel') }}
            </label>
            <input v-model="emailJsConfig.templateCommId" type="text" placeholder="e.g. template_comm123" required
              class="w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white focus:outline-hidden focus:border-indigo-500" />
          </div>

          <!-- Template ID - Sistema -->
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {{ t('master.panel.templateSysIdLabel') }}
            </label>
            <input v-model="emailJsConfig.templateSysId" type="text" placeholder="e.g. template_sys456" required
              class="w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white focus:outline-hidden focus:border-indigo-500" />
          </div>

          <!-- Public Key -->
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {{ t('master.panel.publicKeyLabel') }}
            </label>
            <input v-model="emailJsConfig.publicKey" type="text" placeholder="e.g. user_A1B2C3d4e5f6g7h8i" required
              class="w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white focus:outline-hidden focus:border-indigo-500" />
          </div>

          <!-- Information Notice -->
          <div
            class="p-3 bg-amber-50 dark:bg-amber-950/25 rounded-2xl border border-amber-100/40 dark:border-amber-900/40 flex items-start gap-2 select-none">
            <AlertTriangle class="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p class="text-[10px] text-amber-800 dark:text-amber-300 font-bold leading-relaxed">
              {{ t('master.panel.securityNote') }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button type="button" @click="showEmailJsModal = false"
              class="px-4 py-2 text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer">
              {{ t('master.panel.cancel') }}
            </button>
            <button type="submit" :disabled="isSavingConfig"
              class="px-5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 text-center flex items-center gap-1.5">
              <Loader2 v-if="isSavingConfig" class="w-3.5 h-3.5 animate-spin" />
              {{ t('master.panel.saveConfiguration') }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
