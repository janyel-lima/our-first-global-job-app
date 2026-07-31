<template>
  <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 space-y-4 shadow-2xs text-left animate-fadeIn">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
          {{ t('tutor.studentsUnderCoordination') }}
        </h3>
        <p class="text-xs text-gray-400 dark:text-gray-500 leading-tight block">
          {{ t('tutor.studentsUnderCoordinationSub') }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          @click="emit('export-xlsx')"
          class="p-1 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/45 dark:border-emerald-900/40 dark:text-emerald-300 rounded-lg text-[10.5px] font-bold cursor-pointer transition-all flex items-center gap-1"
        >
          📥 {{ t('tutor.exportExcel') }}
        </button>

        <button
          type="button"
          @click="emit('export-json')"
          class="p-1 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 dark:bg-blue-950/45 dark:border-blue-900/40 dark:text-blue-300 rounded-lg text-[10.5px] font-bold cursor-pointer transition-all flex items-center gap-1"
        >
          📥 {{ t('tutor.exportJson') }}
        </button>
      </div>
    </div>

    <!-- Search Box -->
    <div class="flex items-center justify-start select-none">
      <div class="relative w-full sm:max-w-xs">
        <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
          <Search class="w-4 h-4" />
        </span>
        <input
          type="text"
          :placeholder="t('tutor.searchStudentPlaceholder')"
          v-model="searchQuery"
          class="w-full text-xs pl-9 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl p-2.5 focus:outline-hidden text-gray-900 dark:text-white"
        />
      </div>
    </div>

    <p v-if="filteredReports.length === 0" class="text-xs text-slate-400 dark:text-slate-500 italic py-4">
      {{ t('tutor.noMatchingStudent') }}
    </p>
    <div v-else class="rounded-2xl border border-gray-200/60 dark:border-slate-850 bg-white dark:bg-slate-900 overflow-hidden">
      <!-- Mobile Vertical Responsiveness View (Stacked Cards) -->
      <div class="sm:hidden divide-y divide-gray-100 dark:divide-slate-800">
        <div 
          v-for="report in paginatedReports" 
          :key="'mob-' + report.id" 
          class="p-4 space-y-3 bg-white dark:bg-slate-900"
        >
          <!-- Student Header -->
          <div class="flex items-start justify-between gap-2">
            <div>
              <h4 class="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                {{ getStudentName(report.userId) }}
              </h4>
              <p class="text-[9.5px] font-mono text-gray-400 dark:text-slate-500 leading-none mt-1">
                ID: {{ (report.userId || '').substring(0, 12) }}...
              </p>
            </div>
            <span v-if="report.certified" class="inline-flex items-center gap-1 text-[9.5px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full shrink-0 select-none">
              <Check class="w-2.5 h-2.5" /> {{ t('tutor.released') }}
            </span>
            <span v-else class="text-[9.5px] text-gray-400 dark:text-slate-500 italic font-medium shrink-0">
              {{ t('tutor.inProgress') }}
            </span>
          </div>

          <!-- Assigned Course -->
          <div class="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-1">
            <span class="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block leading-none">
              {{ t('tutor.thAssignedCourse') }}
            </span>
            <p class="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
              {{ getCourseTitle(report.courseId) }}
            </p>
          </div>

          <!-- Metrics Row (Lessons & Grade) -->
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="p-2 bg-slate-50/80 dark:bg-slate-950/40 rounded-lg border border-slate-100 dark:border-slate-800/50">
              <span class="text-[8.5px] font-bold uppercase text-slate-400 dark:text-slate-500 block">
                {{ t('tutor.thLessonsCompleted') }}
              </span>
              <span class="font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 block">
                {{ (report.completedLessons || []).length }} check(s)
              </span>
            </div>
            <div class="p-2 bg-slate-50/80 dark:bg-slate-950/40 rounded-lg border border-slate-100 dark:border-slate-800/50">
              <span class="text-[8.5px] font-bold uppercase text-slate-400 dark:text-slate-500 block">
                {{ t('tutor.thAcademicAverage') }}
              </span>
              <template v-if="getAverageGrade(report) !== null">
                <span :class="[
                  'font-black text-xs inline-block mt-0.5',
                  (getAverageGrade(report) || 0) >= 70
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                ]">
                  {{ getAverageGrade(report) }}%
                </span>
              </template>
              <span v-else class="text-gray-400 dark:text-slate-500 italic text-[10px] mt-0.5 block">
                {{ t('tutor.noGrades') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Horizontal Table View -->
      <div class="hidden sm:block overflow-x-auto">
        <table id="instructor-analytics-table" class="w-full text-left border-collapse text-xs min-w-[700px]">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-950 border-b border-gray-100 dark:border-slate-850 text-slate-450 font-extrabold uppercase tracking-wider text-[10px]">
              <th class="p-4 font-extrabold">{{ t('tutor.thStudent') }}</th>
              <th class="p-4 font-extrabold">{{ t('tutor.thAssignedCourse') }}</th>
              <th class="p-4 font-extrabold text-center">{{ t('tutor.thLessonsCompleted') }}</th>
              <th class="p-4 font-extrabold">{{ t('tutor.thAcademicAverage') }}</th>
              <th class="p-4 font-extrabold">{{ t('tutor.thCertificateStatus') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in paginatedReports" :key="report.id" class="border-b border-gray-250/30 dark:border-slate-800/65 text-gray-600 dark:text-slate-350 hover:bg-gray-50/50 dark:hover:bg-slate-850/30 transition-colors duration-155">
              <td class="p-4">
                <div class="font-bold text-slate-900 dark:text-white">{{ getStudentName(report.userId) }}</div>
                <div class="text-[9.5px] font-mono text-gray-400 dark:text-slate-500 leading-none mt-0.5">ID: {{ (report.userId || '').substring(0, 10) }}...</div>
              </td>
              <td class="p-4 font-medium text-gray-800 dark:text-slate-200">
                {{ getCourseTitle(report.courseId) }}
              </td>
              <td class="p-4 text-center font-bold text-blue-600 dark:text-blue-400">{{ (report.completedLessons || []).length }} check(s)</td>
              <td class="p-4">
                <template v-if="getAverageGrade(report) !== null">
                  <span :class="[
                    'font-bold px-2 py-0.5 rounded-sm',
                    (getAverageGrade(report) || 0) >= 70
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                  ]">
                    {{ getAverageGrade(report) }}%
                  </span>
                </template>
                <span v-else class="text-gray-400 dark:text-slate-500 italic">
                  {{ t('tutor.noGrades') }}
                </span>
              </td>
              <td class="p-4">
                <span v-if="report.certified" class="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full select-none">
                  <Check class="w-2.5 h-2.5" /> {{ t('tutor.released') }}
                </span>
                <span v-else class="text-gray-400 dark:text-slate-500 italic font-medium">
                  {{ t('tutor.inProgress') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginator Footer for Students list -->
      <div v-if="filteredReports.length > 0" class="p-4 border-t border-gray-100 dark:border-slate-850 flex items-center justify-between gap-4 text-xs font-semibold select-none text-slate-450 dark:text-slate-400 flex-wrap">
        <span v-html="t('tutor.showingStudents', {
          from: `<strong>${Math.min(filteredReports.length, (currentPage - 1) * itemsPerPage + 1)}</strong>`,
          to: `<strong>${Math.min(filteredReports.length, currentPage * itemsPerPage)}</strong>`,
          total: `<strong>${filteredReports.length}</strong>`
        })"></span>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            :disabled="currentPage === 1"
            @click="currentPage--"
            class="p-1 px-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-gray-200 dark:border-slate-850 rounded-lg cursor-pointer disabled:opacity-40 transition disabled:cursor-not-allowed inline-flex items-center gap-1 text-[11px]"
          >
            <ChevronLeft class="w-3.5 h-3.5" /> {{ t('tutor.prev') }}
          </button>
          <span class="px-2 text-[11px]">
            {{ t('tutor.pageOf', { current: currentPage, total: totalPages || 1 }) }}
          </span>
          <button
            type="button"
            :disabled="currentPage === totalPages || totalPages <= 1"
            @click="currentPage++"
            class="p-1 px-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-gray-200 dark:border-slate-850 rounded-lg cursor-pointer disabled:opacity-40 transition disabled:cursor-not-allowed inline-flex items-center gap-1 text-[11px]"
          >
            {{ t('tutor.next') }} <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Search, Check, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { useI18n } from '../../../composables/useI18n';
import { Course, Progress, UserProfile } from '../../../types';

const { t } = useI18n();

const props = withDefaults(defineProps<{
  reports?: Progress[];
  courses?: Course[];
  users?: UserProfile[];
}>(), {
  reports: () => [],
  courses: () => [],
  users: () => []
});

const emit = defineEmits<{
  (e: 'export-xlsx'): void;
  (e: 'export-json'): void;
}>();

const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 8;

const getStudentName = (userId: string) => {
  if (!userId) return 'Estudante';
  const u = (props.users || []).find(x => x.uid === userId);
  return u ? u.displayName : `Estudante (${userId.substring(0, 6)})`;
};

const getCourseTitle = (courseId: string) => {
  return (props.courses || []).find(c => c.id === courseId)?.title || 'Manual Course';
};

const getAverageGrade = (report: Progress): number | null => {
  const scores = Object.values(report.quizScores || {});
  if (scores.length === 0) return null;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round(sum / scores.length);
};

const filteredReports = computed(() => {
  const list = props.reports || [];
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return list;
  return list.filter(r => {
    const sName = getStudentName(r.userId || '').toLowerCase();
    const cTitle = getCourseTitle(r.courseId || '').toLowerCase();
    return sName.includes(q) || cTitle.includes(q) || (r.userId || '').toLowerCase().includes(q);
  });
});

const totalPages = computed(() => {
  return Math.ceil(filteredReports.value.length / itemsPerPage);
});

const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredReports.value.slice(start, start + itemsPerPage);
});
</script>
