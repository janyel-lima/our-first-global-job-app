<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Search, Filter, Award, ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon } from 'lucide-vue-next';
import { Course, Lesson, Progress, UserProfile } from '../../types';
import { useI18n } from '../../composables/useI18n';

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
  const userLevel = props.userProfile?.level || "Beginner";
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
    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-950/90 dark:to-blue-900/40 rounded-3xl p-6 sm:p-10 border border-blue-500/20 dark:border-blue-500/15 absolute-decor text-white relative overflow-hidden shadow-lg animate-fadeIn text-left">
      <div class="space-y-4 max-w-xl z-10 relative">
        <span class="inline-block py-1 px-3 bg-white/20 dark:bg-white/10 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-wider">
          🚀 {{ t('hero.badge') }}
        </span>
        <h2 class="text-xl sm:text-3xl font-black tracking-tight leading-none text-white">
          {{ t('hero.title') }}
        </h2>
        <p class="text-sm text-blue-50/90 dark:text-blue-100/80 font-medium leading-relaxed font-semibold">
          {{ t('hero.subtitle') }}
        </p>

        <div class="flex flex-wrap items-center gap-3 pt-2">
          <div class="bg-white/10 dark:bg-white/5 backdrop-blur-xs px-4 py-2 rounded-2xl border border-white/10 dark:border-white/5 shadow-xs">
            <p class="text-xs text-blue-100 dark:text-blue-200 uppercase tracking-wide font-black">{{ t('hero.certBadge') }}</p>
            <p class="text-base font-black text-white">{{ completedCountGlobal }} {{ t('hero.certBadgeSub') }}</p>
          </div>
          <div class="bg-white/10 dark:bg-white/5 backdrop-blur-xs px-4 py-2 rounded-2xl border border-white/10 dark:border-white/5 shadow-xs">
            <p class="text-xs text-blue-100 dark:text-blue-200 uppercase tracking-wide font-black">
              {{ locale === 'pt' ? 'Metodologia' : 'Methodology' }}
            </p>
            <p class="text-base font-black text-white">Bilingual / Bilingue</p>
          </div>
        </div>
      </div>

      <!-- Abstract decor background circles -->
      <span class="absolute right-[-40px] bottom-[-40px] w-56 h-56 bg-white/5 rounded-full select-none" />
      <span class="absolute top-[20px] right-[20px] w-24 h-24 bg-white/5 rounded-full select-none" />
    </div>

    <!-- Search & Filter Controls -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-gray-150 dark:border-slate-700/80">
      <!-- Search query input -->
      <div class="relative flex-1">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          id="input-course-search"
          v-model="courseSearchQuery"
          type="text"
          :placeholder="t('courses.searchPlaceholder')"
          class="w-full text-xs sm:text-sm bg-white dark:bg-slate-900 dark:text-white border border-gray-250 dark:border-slate-700 pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold"
        />
      </div>

      <!-- Filter level select -->
      <div class="flex items-center gap-3 shrink-0">
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
          <Filter class="w-3.5 h-3.5 text-gray-400" />
          {{ t('header.englishLevel') }}:
        </span>
        <select
          id="select-course-level-filter"
          v-model="courseLevelFilter"
          class="text-xs sm:text-sm bg-white dark:bg-slate-900 dark:text-white border border-gray-250 dark:border-slate-700 rounded-xl px-3 py-2.5 font-bold cursor-pointer focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">{{ t('onboarding.all') }}</option>
          <option value="Beginner">{{ t('onboarding.beginner') }}</option>
          <option value="Intermediate">{{ t('onboarding.intermediate') }}</option>
          <option value="Advanced">{{ t('onboarding.advanced') }}</option>
        </select>
      </div>
    </div>

    <!-- Listed Cursos Grid catalog -->
    <div class="space-y-4">
      <div class="flex items-center justify-between pl-1">
        <p class="text-xs font-black text-gray-500 uppercase tracking-widest block text-left">{{ t('courses.activeCourses') }}</p>
        <p class="text-[11px] font-bold text-gray-400" v-if="filteredCourses.length > 0">
          {{ locale === 'pt' ? `Página ${courseCurrentPage} de ${totalCoursePages}` : `Page ${courseCurrentPage} of ${totalCoursePages}` }}
        </p>
      </div>
      
      <!-- Empty state when searching/filtering yields zero results -->
      <div v-if="filteredCourses.length === 0" class="p-12 text-center bg-gray-50 dark:bg-slate-850 rounded-3xl border border-gray-200/60 dark:border-slate-700 text-gray-500 max-w-sm mx-auto">
        <Search class="w-8 h-8 mx-auto mb-2 text-gray-400 animate-pulse" />
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {{ locale === 'pt' ? 'Nenhum mini-curso encontrado' : 'No courses found' }}
        </p>
        <p class="text-xs text-gray-400 mt-1">
          {{ locale === 'pt' ? 'Tente ajustar seus termos de pesquisa ou o filtro de nível.' : 'Try adjusting your search terms or level filter.' }}
        </p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        <div 
          v-for="course in paginatedCourses" 
          :key="course.id"
          id="course-card"
          class="bg-white dark:bg-slate-850 p-5 sm:p-6 rounded-3xl border border-gray-150 dark:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between space-y-4 shadow-2xs relative"
        >
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
              <span v-if="getProgressForCourse(course.id)?.certified" class="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                <Award class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {{ locale === 'pt' ? 'Concluído' : 'Completed' }}
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
              Tutor: <strong class="text-gray-700 dark:text-gray-300">{{ course.creatorName || t('courses.comunitario') }}</strong>
            </p>

            <button
              id="btn-access-course"
              @click="$emit('select-course', course.id)"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
              :style="{ backgroundColor: primaryColor }"
            >
              {{ locale === 'pt' ? 'Acessar Curso' : 'Access Course' }} <ChevronRightIcon class="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <!-- Paginator for Courses -->
      <div v-if="totalCoursePages > 1" class="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-slate-755">
        <p class="text-xs font-bold text-gray-500 dark:text-gray-400">
          <template v-if="locale === 'pt'">
            Mostrando <span class="text-gray-900 dark:text-white">{{ (courseCurrentPage - 1) * courseItemsPerPage + 1 }}</span> a 
            <span class="text-gray-900 dark:text-white">{{ Math.min(courseCurrentPage * courseItemsPerPage, filteredCourses.length) }}</span> de 
            <span class="text-gray-900 dark:text-white font-extrabold">{{ filteredCourses.length }}</span> mini-cursos
          </template>
          <template v-else>
            Showing <span class="text-gray-900 dark:text-white">{{ (courseCurrentPage - 1) * courseItemsPerPage + 1 }}</span> to 
            <span class="text-gray-900 dark:text-white">{{ Math.min(courseCurrentPage * courseItemsPerPage, filteredCourses.length) }}</span> of 
            <span class="text-gray-900 dark:text-white font-extrabold">{{ filteredCourses.length }}</span> courses
          </template>
        </p>
        
        <div class="flex items-center gap-1.5">
          <button
            id="btn-course-prev-page"
            :disabled="courseCurrentPage === 1"
            @click="courseCurrentPage--"
            class="p-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            :title="locale === 'pt' ? 'Página Anterior' : 'Previous Page'"
          >
            <ChevronLeft class="w-4 h-4 text-gray-700 dark:text-gray-200" />
          </button>

          <div class="flex items-center gap-1">
            <button
              v-for="page in totalCoursePages"
              :key="page"
              @click="courseCurrentPage = page"
              :class="[
                'w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer',
                courseCurrentPage === page 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              ]"
              :style="courseCurrentPage === page ? { backgroundColor: primaryColor } : {}"
            >
              {{ page }}
            </button>
          </div>

          <button
            id="btn-course-next-page"
            :disabled="courseCurrentPage === totalCoursePages"
            @click="courseCurrentPage++"
            class="p-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            :title="locale === 'pt' ? 'Próxima Página' : 'Next Page'"
          >
            <ChevronRight class="w-4 h-4 text-gray-700 dark:text-gray-200" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
