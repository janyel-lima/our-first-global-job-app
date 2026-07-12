<script setup lang="ts">
import { Award, ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon, Filter, Search } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useI18n } from '../../composables/useI18n';
import { Course, Lesson, Progress, UserProfile } from '../../types';

const { t, locale } = useI18n();


const props = defineProps<{
  courses: Course[];
  lessons: Lesson[];
  progressList: Progress[];
  completedCountGlobal: number;
  currentUser: any;
  userProfile: UserProfile | null;
  primaryColor: string;
}>();

const emit = defineEmits<{
  (e: 'select-course', courseId: string): void;
}>();

const courseSearchQuery = ref("");
const courseLevelFilter = ref("All");
const courseCurrentPage = ref(1);
const courseItemsPerPage = 4;

watch([courseSearchQuery, courseLevelFilter], () => {
  courseCurrentPage.value = 1;
});

const getProgressForCourse = (courseId: string) => {
  const uid = props.currentUser?.uid || "demo-student-uid";
  return props.progressList.find(p => p.courseId === courseId && p.userId === uid) || null;
};

// Filter courses based on search query, level constraints, and accessible levels
const filteredCourses = computed(() => {
  const queryText = courseSearchQuery.value.trim().toLowerCase();

  // Custom rank mappings to permit dynamic unlocking!
  const levelRank: Record<string, number> = { Beginner: 1, Intermediate: 2, Advanced: 3, All: 4 };
  const isAdmin = props.userProfile?.isAdmin === true || String(props.userProfile?.isAdmin) === 'true';
  const userLevel = isAdmin ? "All" : (props.userProfile?.level || "Beginner");
  const userPower = levelRank[userLevel] || 1;

  return props.courses.filter((course) => {
    // 1. Level access control check: Hide courses requiring a level above the student's current profile level
    const coursePower = levelRank[course.level] || 1;
    if (coursePower > userPower) {
      return false;
    }

    // 2. Filter level query selection
    if (courseLevelFilter.value !== "All" && course.level !== courseLevelFilter.value) {
      return false;
    }

    // 3. Search query check
    if (queryText) {
      const matchTitle = (course.title || "").toLowerCase().includes(queryText);
      const matchDesc = (course.description || "").toLowerCase().includes(queryText);
      const matchCreator = (course.creatorName || "").toLowerCase().includes(queryText);
      return matchTitle || matchDesc || matchCreator;
    }

    return true;
  });
});

const filterOptions = computed(() => {
  const options = [{ value: "All", label: t('courses.filterAll') }];

  options.push({
    value: "Beginner",
    label: t('courses.filterBeginner')
  });

  const levelRank: Record<string, number> = { Beginner: 1, Intermediate: 2, Advanced: 3, All: 4 };
  const isAdmin = props.userProfile?.isAdmin === true || String(props.userProfile?.isAdmin) === 'true';
  const userLevel = isAdmin ? "All" : (props.userProfile?.level || "Beginner");
  const userPower = levelRank[userLevel] || 1;

  if (userPower >= 2) {
    options.push({
      value: "Intermediate",
      label: t('courses.filterIntermediate')
    });
  }
  if (userPower >= 3) {
    options.push({
      value: "Advanced",
      label: t('courses.filterAdvanced')
    });
  }
  return options;
});

watch(filterOptions, (newOptions) => {
  const exists = newOptions.some(opt => opt.value === courseLevelFilter.value);
  if (!exists) {
    courseLevelFilter.value = "All";
  }
});

const totalCoursePages = computed(() => {
  return Math.max(1, Math.ceil(filteredCourses.value.length / courseItemsPerPage));
});

const paginatedCourses = computed(() => {
  const start = (courseCurrentPage.value - 1) * courseItemsPerPage;
  const end = start + courseItemsPerPage;
  return filteredCourses.value.slice(start, end);
});
</script>

<template>
  <div id="student-courses-panel" class="space-y-6">
    <!-- Hero banner welcoming students -->
    <div
      class="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-950/90 dark:to-blue-900/40 rounded-3xl p-6 sm:p-10 border border-blue-500/20 dark:border-blue-500/15 absolute-decor text-white relative overflow-hidden shadow-lg animate-fadeIn text-left">
      <div class="space-y-4 max-w-xl z-10 relative">
        <span
          class="inline-block py-1 px-3 bg-white/20 dark:bg-white/10 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-wider">
          🚀 {{ t('hero.badge') }}
        </span>
        <h2 class="text-xl sm:text-3xl font-black tracking-tight leading-none text-white">
          {{ t('hero.title') }}
        </h2>
        <p class="text-sm text-blue-50/90 dark:text-blue-100/80 font-medium leading-relaxed font-semibold">
          {{ t('hero.subtitle') }}
        </p>

        <div class="flex flex-wrap items-center gap-3 pt-2">
          <div
            class="bg-white/10 dark:bg-white/5 backdrop-blur-xs px-4 py-2 rounded-2xl border border-white/10 dark:border-white/5 shadow-xs">
            <p class="text-xs text-blue-100 dark:text-blue-200 uppercase tracking-wide font-black">{{
              t('hero.certBadge') }}</p>
            <p class="text-base font-black text-white">{{ completedCountGlobal }} {{ t('hero.certBadgeSub') }}</p>
          </div>
          <div
            class="bg-white/10 dark:bg-white/5 backdrop-blur-xs px-4 py-2 rounded-2xl border border-white/10 dark:border-white/5 shadow-xs">
            <p class="text-xs text-blue-100 dark:text-blue-200 uppercase tracking-wide font-black">
              {{ t('courses.methodology') }}
            </p>
            <p class="text-base font-black text-white">{{ t('courses.methodologyValue') }}</p>
          </div>
        </div>
      </div>

      <!-- Abstract decor background circles -->
      <span class="absolute right-[-40px] bottom-[-40px] w-56 h-56 bg-white/5 rounded-full select-none" />
      <span class="absolute top-[20px] right-[20px] w-24 h-24 bg-white/5 rounded-full select-none" />
    </div>

    <!-- Search & Filter Controls -->
    <div
      class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-3xl border border-gray-150 dark:border-slate-700/80">
      <!-- Search query input -->
      <div class="relative flex-1 w-full">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input id="input-course-search" v-model="courseSearchQuery" type="text"
          :placeholder="t('courses.searchPlaceholder')"
          class="w-full text-xs sm:text-sm bg-white dark:bg-slate-900 dark:text-white border border-gray-250 dark:border-slate-700 pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold" />
      </div>

      <!-- Filter level select -->
      <div class="flex flex-row items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
        <span
          class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
          <Filter class="w-3.5 h-3.5 text-gray-400" />
          {{ t('header.englishLevel') }}:
        </span>
        <select id="select-course-level-filter" v-model="courseLevelFilter"
          class="flex-1 sm:flex-initial text-xs sm:text-sm bg-white dark:bg-slate-900 dark:text-white border border-gray-250 dark:border-slate-700 rounded-xl px-3 py-2.5 font-bold cursor-pointer focus:ring-2 focus:ring-blue-500 min-w-[100px] max-w-[200px] sm:max-w-none">
          <option v-for="opt in filterOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Canais Oficiais de Comunicação -->
    <div id="community-channels-widget"
      class="bg-white dark:bg-slate-850 p-5 sm:p-6 rounded-3xl border border-gray-150 dark:border-slate-700/80 shadow-2xs space-y-4 text-left">
      <div>
        <h3
          class="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
          📢 {{ t('community.title') }}
        </h3>
        <p class="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-0.5">
          {{ t('community.subtitle') }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- WhatsApp -->
        <a href="https://chat.whatsapp.com/LiZZEd9O4ko7hYQhXIQq44" target="_blank" rel="noopener noreferrer"
          class="flex items-center gap-4 p-4 bg-emerald-50/40 hover:bg-emerald-50/80 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl transition-all hover:scale-[1.01]">
          <div class="p-2.5 bg-emerald-500 rounded-xl text-white shadow-md shadow-emerald-500/20 shrink-0">
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path
                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-extrabold text-xs text-emerald-950 dark:text-emerald-400 truncate">
              {{ t('community.whatsappTitle') }}
            </h4>
            <p
              class="text-[10px] text-emerald-700/80 dark:text-emerald-500 font-semibold mt-0.5 leading-tight line-clamp-2">
              {{ t('community.whatsappDesc') }}
            </p>
          </div>
          <span
            class="text-emerald-600 dark:text-emerald-400 font-black text-[9px] uppercase tracking-wider shrink-0 bg-emerald-100 dark:bg-emerald-950/85 px-2 py-1 rounded-lg">
            {{ t('community.accessLabel') }}
          </span>
        </a>

        <!-- Telegram -->
        <a href="https://t.me/+mwC7pnv770A4MDQx" target="_blank" rel="noopener noreferrer"
          class="flex items-center gap-4 p-4 bg-sky-50/40 hover:bg-sky-50/80 dark:bg-sky-950/10 dark:hover:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/40 rounded-2xl transition-all hover:scale-[1.01]">
          <div class="p-2.5 bg-sky-500 rounded-xl text-white shadow-md shadow-sky-500/20 shrink-0">
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path
                d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.18l-1.91 9c-.14.65-.53.81-1.08.5l-2.91-2.15-1.4 1.35c-.15.15-.28.27-.58.27l.21-2.97 5.41-4.89c.23-.21-.05-.33-.36-.12L10 13.01l-2.88-.9c-.63-.2-1.25-.33-.63-.57l11.23-4.33c.52-.19.98.12.84.97z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-extrabold text-xs text-sky-950 dark:text-sky-400 truncate">
              {{ t('community.telegramTitle') }}
            </h4>
            <p class="text-[10px] text-sky-700/80 dark:text-sky-500 font-semibold mt-0.5 leading-tight line-clamp-2">
              {{ t('community.telegramDesc') }}
            </p>
          </div>
          <span
            class="text-sky-600 dark:text-sky-400 font-black text-[9px] uppercase tracking-wider shrink-0 bg-sky-100 dark:bg-sky-950/85 px-2 py-1 rounded-lg">
            {{ t('community.accessLabel') }}
          </span>
        </a>
      </div>
    </div>

    <!-- Listed Cursos Grid catalog -->
    <div class="space-y-4">
      <div class="flex items-center justify-between pl-1">
        <p class="text-xs font-black text-gray-500 uppercase tracking-widest block text-left">{{
          t('courses.activeCourses') }}</p>
        <p class="text-[11px] font-bold text-gray-400" v-if="filteredCourses.length > 0">
          {{ t('courses.pageIndicator', { current: courseCurrentPage, total: totalCoursePages }) }}
        </p>
      </div>

      <!-- Empty state when searching/filtering yields zero results -->
      <div v-if="filteredCourses.length === 0"
        class="p-12 text-center bg-gray-50 dark:bg-slate-850 rounded-3xl border border-gray-200/60 dark:border-slate-700 text-gray-500 max-w-sm mx-auto">
        <Search class="w-8 h-8 mx-auto mb-2 text-gray-400 animate-pulse" />
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {{ t('courses.noCoursesTitle') }}
        </p>
        <p class="text-xs text-gray-400 mt-1">
          {{ t('courses.noCoursesSubtitle') }}
        </p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        <div v-for="course in paginatedCourses" :key="course.id" id="course-card"
          class="bg-white dark:bg-slate-850 p-5 sm:p-6 rounded-3xl border border-gray-150 dark:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between space-y-4 shadow-2xs relative">
          <div class="space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <span :class="[
                'px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider',
                course.level === 'Beginner' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                  : (course.level === 'Intermediate' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-indigo-100 text-indigo-850 dark:bg-indigo-950/40 dark:text-indigo-300')
              ]">
                {{ t('courses.level', { level: course.level }) }}
              </span>

              <!-- Completion badge -->
              <span v-if="getProgressForCourse(course.id)?.certified"
                class="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                <Award class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {{ t('courses.completed') }}
              </span>
            </div>

            <h3 class="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white leading-tight">
              {{ course.title }}
            </h3>

            <p class="text-xs text-gray-500 dark:text-gray-400 font-semibold line-clamp-3 leading-relaxed">
              {{ course.description }}
            </p>
          </div>

          <div class="pt-4 border-t border-gray-150 dark:border-slate-700/80 flex items-center justify-between gap-4">
            <p class="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
              {{ t('courses.tutorLabel') }} <strong class="text-gray-700 dark:text-gray-300">{{ course.creatorName ||
                t('courses.comunitario')
                }}</strong>
            </p>

            <button id="btn-access-course" @click="$emit('select-course', course.id)"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
              :style="{ backgroundColor: primaryColor }">
              {{ t('courses.accessBtn') }}
              <ChevronRightIcon class="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <!-- Paginator for Courses -->
      <div v-if="totalCoursePages > 1"
        class="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-slate-755">
        <p class="text-xs font-bold text-gray-500 dark:text-gray-400">
          {{ t('courses.showingPageOf', {
            start: (courseCurrentPage - 1) * courseItemsPerPage + 1,
            end: Math.min(courseCurrentPage * courseItemsPerPage, filteredCourses.length),
            total: filteredCourses.length
          }) }}
        </p>

        <div class="flex items-center gap-1.5">
          <button id="btn-course-prev-page" :disabled="courseCurrentPage === 1" @click="courseCurrentPage--"
            class="p-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            :title="t('courses.prevPage')">
            <ChevronLeft class="w-4 h-4 text-gray-700 dark:text-gray-200" />
          </button>

          <div class="flex items-center gap-1">
            <button v-for="page in totalCoursePages" :key="page" @click="courseCurrentPage = page" :class="[
              'w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer',
              courseCurrentPage === page
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
            ]" :style="courseCurrentPage === page ? { backgroundColor: primaryColor } : {}">
              {{ page }}
            </button>
          </div>

          <button id="btn-course-next-page" :disabled="courseCurrentPage === totalCoursePages"
            @click="courseCurrentPage++"
            class="p-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            :title="t('courses.nextPage')">
            <ChevronRight class="w-4 h-4 text-gray-700 dark:text-gray-200" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
