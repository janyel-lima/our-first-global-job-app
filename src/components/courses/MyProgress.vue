<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Award, BookOpen, User, Check, Search, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-vue-next';
import { Course, Progress, UserProfile } from '../../types';
import { formatCertifiedDate } from '../../utils/helpers';
import { useI18n } from '../../composables/useI18n';

const { locale } = useI18n();

const props = defineProps<{
  completedCoursesWithCertificates: Array<{ progress: Progress; course: Course }>;
  progressList: Progress[];
  courses: Course[];
  currentUser: any;
  userProfile: UserProfile | null;
  primaryColor: string;
}>();

const emit = defineEmits<{
  (e: 'open-profile'): void;
  (e: 'show-certificate', certificate: any): void;
  (e: 'navigate-courses'): void;
}>();

const searchQuery = ref('');
const selectedLevel = ref('All');
const currentPage = ref(1);
const itemsPerPage = ref(4);

// Filtragem de certificados
const filteredCertificates = computed(() => {
  return props.completedCoursesWithCertificates.filter(item => {
    // Busca por texto no título do curso ou na descrição
    const titleMatch = item.course.title.toLowerCase().includes(searchQuery.value.toLowerCase());
    const descMatch = item.course.description?.toLowerCase().includes(searchQuery.value.toLowerCase()) || false;
    const matchesSearch = titleMatch || descMatch;
    
    // Busca por nível do curso
    const matchesLevel = selectedLevel.value === 'All' || item.course.level === selectedLevel.value;
    
    return matchesSearch && matchesLevel;
  });
});

// Total de páginas de acordo com os filtros aplicados
const totalPages = computed(() => {
  return Math.ceil(filteredCertificates.value.length / itemsPerPage.value) || 1;
});

// Certificados paginados da página atual
const paginatedCertificates = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value;
  const endIndex = startIndex + itemsPerPage.value;
  return filteredCertificates.value.slice(startIndex, endIndex);
});

// Se os filtros mudarem, resetamos para a primeira página
watch([searchQuery, selectedLevel], () => {
  currentPage.value = 1;
});

// Funções de paginação
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const setPage = (page: number) => {
  currentPage.value = page;
};
</script>

<template>
  <div id="progress-tracking-panel" class="space-y-6 text-left animate-fadeIn">
    <div class="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 sm:p-8 rounded-3xl text-white shadow-lg relative overflow-hidden select-none">
      <div class="absolute right-0 bottom-0 opacity-15 transform translate-y-1/4 translate-x-1/6 pointer-events-none">
        <Award id="decor-award" class="w-64 h-64 text-white" />
      </div>
      <div class="relative z-10 max-w-2xl space-y-2">
        <span class="bg-indigo-600/60 border border-indigo-400/30 text-indigo-100 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full w-max block">
          {{ locale === 'pt' ? 'Histórico Acadêmico' : 'Academic History' }}
        </span>
        <h2 class="text-xl sm:text-3xl font-black tracking-tight leading-tight">
          {{ locale === 'pt' ? 'Meu Progresso de Conquistas' : 'My Progress & Achievements' }}
        </h2>
        <p class="text-xs sm:text-sm text-indigo-100 leading-relaxed font-semibold">
          {{ locale === 'pt' 
            ? 'Monitore todos os mini-cursos voluntários de inglês que você já concluiu com sucesso na plataforma, emita seus certificados comunitários e acompanhe sua evolução de fluência.' 
            : 'Track all volunteer English courses you have successfully completed, issue community certificates, and monitor your fluency development.' 
          }}
        </p>
      </div>
    </div>

    <!-- Statistics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-slate-900 border border-slate-200/75 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-2xs">
        <div class="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/25 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
          <Award class="w-6 h-6" />
        </div>
        <div>
          <span class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block leading-none mb-1">
            {{ locale === 'pt' ? 'Cursos Concluídos' : 'Completed Courses' }}
          </span>
          <p class="text-2xl font-black text-slate-800 dark:text-white leading-none">
            {{ completedCoursesWithCertificates.length }}
          </p>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 border border-slate-200/75 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-2xs">
        <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/25 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <BookOpen class="w-6 h-6" />
        </div>
        <div>
          <span class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block leading-none mb-1">
            {{ locale === 'pt' ? 'Lições Completadas' : 'Completed Lessons' }}
          </span>
          <p class="text-2xl font-black text-slate-800 dark:text-white leading-none">
            {{ progressList.filter(p => p.userId === (currentUser?.uid || 'demo-student-uid') && courses.some(c => c.id === p.courseId)).reduce((sum, current) => sum + (current.completedLessons?.length || 0), 0) }}
          </p>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 border border-slate-200/75 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-2xs">
        <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <User class="w-6 h-6" />
        </div>
        <div class="flex-1">
          <span class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block leading-none mb-1">
            {{ locale === 'pt' ? 'Fluência Auto-Avaliada' : 'Self-Assessed Fluency' }}
          </span>
          <div class="flex items-center justify-between">
            <p class="text-base font-black text-slate-800 dark:text-white leading-none">
              {{ locale === 'pt' ? 'Nível' : 'Level' }} {{ userProfile?.level || "Beginner" }}
            </p>
            <button 
              @click="$emit('open-profile')" 
              class="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-100/70 dark:bg-blue-950/30 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              {{ locale === 'pt' ? 'Ajustar' : 'Adjust' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Certificates Section -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-3xl p-6 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4 select-none">
        <div>
          <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider block">
            {{ locale === 'pt' ? 'Lista Global de Certificados Ganhos' : 'Global List of Earned Certificates' }}
          </h3>
          <p class="text-xs text-slate-400 dark:text-slate-350 font-bold block">
            {{ locale === 'pt' 
              ? 'Todos os cursos finalizados aparecem listados abaixo independente do seu nível de inglês configurado.' 
              : 'All finished courses appear listed below, regardless of your configured English level.' 
            }}
          </p>
        </div>
      </div>

      <!-- Search & Filters Bar -->
      <div v-if="completedCoursesWithCertificates.length > 0" class="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-2 select-none">
        <!-- Search Field -->
        <div class="sm:col-span-7 relative">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
            <Search class="w-4 h-4" />
          </span>
          <input
            id="certificate-search"
            v-model="searchQuery"
            type="text"
            :placeholder="locale === 'pt' ? 'Pesquisar certificado por título ou descrição...' : 'Search certificate by title or description...'"
            class="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-900/60 dark:focus:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-white text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 transition-all"
          />
        </div>

        <!-- Level Selector Dropdown -->
        <div class="sm:col-span-5 relative">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
            <SlidersHorizontal class="w-4 h-4" />
          </span>
          <select
            id="certificate-level-filter"
            v-model="selectedLevel"
            class="w-full pl-10 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100/70 dark:bg-slate-950 dark:hover:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-white text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 transition-all appearance-none cursor-pointer"
          >
            <option value="All">{{ locale === 'pt' ? 'Todos os Níveis' : 'All Levels' }}</option>
            <option value="Beginner">{{ locale === 'pt' ? 'Nível Beginner (Iniciante)' : 'Beginner Level' }}</option>
            <option value="Intermediate">{{ locale === 'pt' ? 'Nível Intermediate (Intermediário)' : 'Intermediate Level' }}</option>
            <option value="Advanced">{{ locale === 'pt' ? 'Nível Advanced (Avançado)' : 'Advanced Level' }}</option>
          </select>
          <span class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path>
            </svg>
          </span>
        </div>
      </div>

      <!-- No Certificates at all -->
      <div v-if="completedCoursesWithCertificates.length === 0" class="p-12 text-center bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md mx-auto space-y-3">
        <div class="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
          <Award class="w-6 h-6" />
        </div>
        <p class="text-xs font-bold text-slate-600 dark:text-slate-350 leading-normal block">
          {{ locale === 'pt' 
            ? 'Você ainda não obteve nenhuma certificação. Complete todos os requisitos (leituras, vídeos ou questionários) de qualquer mini-curso voluntário para gerar seu diploma oficial!' 
            : 'You have not obtained any certifications yet. Complete all requirements (readings, videos, or quizzes) of any course to generate your official diploma!' 
          }}
        </p>
        <button 
          @click="$emit('navigate-courses')" 
          class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
          :style="{ backgroundColor: primaryColor }"
        >
          {{ locale === 'pt' ? 'Explorar Cursos' : 'Explore Courses' }}
        </button>
      </div>

      <!-- No Certificates matching the filter terms -->
      <div v-else-if="filteredCertificates.length === 0" class="p-12 text-center bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md mx-auto space-y-3 select-none">
        <div class="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
          <Search class="w-6 h-6" />
        </div>
        <p class="text-xs font-bold text-slate-600 dark:text-slate-350 leading-normal block">
          {{ locale === 'pt' ? 'Nenhum certificado corresponde aos termos pesquisados ou filtros selecionados. Tente alterar sua busca!' : 'No certificates match the searched terms or selected filters. Try changing your search!' }}
        </p>
        <button 
          @click="searchQuery = ''; selectedLevel = 'All';" 
          class="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-755 transition-colors cursor-pointer"
        >
          {{ locale === 'pt' ? 'Limpar Filtros' : 'Clear Filters' }}
        </button>
      </div>

      <!-- Paginated grid of matching certificates -->
      <div v-else class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            v-for="item in paginatedCertificates" 
            :key="item.progress.id" 
            class="border border-slate-200/70 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-all flex flex-col justify-between gap-4"
          >
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <span 
                  class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
                  :class="[
                    item.course.level === 'Beginner' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/45 dark:text-blue-300' :
                    item.course.level === 'Intermediate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/45 dark:text-amber-300' :
                    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/45 dark:text-indigo-300'
                  ]"
                >
                  {{ locale === 'pt' ? 'Nível' : 'Level' }} {{ item.course.level }}
                </span>
                <span class="text-[9px] text-emerald-600 font-black flex items-center gap-0.5">
                  <Check class="w-3 h-3 text-emerald-600" /> {{ locale === 'pt' ? 'Aprovado' : 'Approved' }}
                </span>
              </div>
              <h4 class="text-xs sm:text-sm font-black text-slate-800 dark:text-white leading-snug">{{ item.course.title }}</h4>
              <p class="text-[11px] text-slate-500 dark:text-slate-350 font-semibold line-clamp-2 leading-tight">
                {{ item.course.description }}
              </p>
            </div>

            <div class="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800/60 pt-3">
              <div class="text-[9px] text-slate-400 dark:text-slate-500 font-bold leading-tight">
                <span>{{ locale === 'pt' ? 'Finalizado em:' : 'Completed on:' }}</span>
                <p class="text-slate-600 dark:text-slate-350 font-extrabold">
                  {{ formatCertifiedDate(item.progress.certifiedAt) }}
                </p>
              </div>
              <button
                type="button"
                @click="$emit('show-certificate', { 
                  studentName: userProfile?.displayName || 'Estudante', 
                  courseTitle: item.course.title, 
                  id: item.progress.certificateId || item.progress.id, 
                  primaryColor: item.course.certificateConfig?.primaryColor, 
                  iconUrl: item.course.certificateConfig?.iconUrl,
                  bgStyle: item.course.certificateConfig?.bgStyle,
                  frameStyle: item.course.certificateConfig?.frameStyle,
                  detailColor: item.course.certificateConfig?.detailColor,
                  creatorId: item.course.creatorId
                })"
                :style="{ backgroundColor: primaryColor }"
                class="px-3.5 py-1.5 text-white hover:brightness-110 font-black text-[10.5px] rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer hover:shadow"
              >
                <Award class="w-3.5 h-3.5 text-white" />
                {{ locale === 'pt' ? 'Ver Certificado' : 'View Certificate' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Paginator Controls -->
        <div v-if="totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 select-none">
          <span class="text-xs text-slate-400 dark:text-slate-500 font-bold">
            <template v-if="locale === 'pt'">
              Mostrando página {{ currentPage }} de {{ totalPages }} ({{ filteredCertificates.length }} certificados)
            </template>
            <template v-else>
              Showing page {{ currentPage }} of {{ totalPages }} ({{ filteredCertificates.length }} certificates)
            </template>
          </span>
          <div class="flex items-center gap-1.5">
            <button
              id="cert-pagination-prev"
              @click="prevPage"
              :disabled="currentPage === 1"
              class="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:hover:bg-slate-50 dark:disabled:hover:bg-slate-950 text-slate-600 dark:text-slate-300 rounded-xl transition cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            
            <button
              v-for="p in totalPages"
              :key="p"
              id="cert-pagination-page"
              @click="setPage(p)"
              :class="[
                p === currentPage 
                  ? 'bg-blue-600 dark:bg-blue-600 text-white border-blue-600 dark:border-blue-600 font-extrabold shadow-sm' 
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 font-bold'
              ]"
              :style="p === currentPage ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}"
              class="w-8 h-8 flex items-center justify-center border text-xs rounded-xl transition cursor-pointer"
            >
              {{ p }}
            </button>

            <button
              id="cert-pagination-next"
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:hover:bg-slate-50 dark:disabled:hover:bg-slate-950 text-slate-600 dark:text-slate-300 rounded-xl transition cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
