<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { 
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  CheckCircle
} from 'lucide-vue-next';
import { Course, UserProfile } from '../../types';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { showToast } from '../../composables/useAppState';

const props = defineProps<{
  courses: Course[];
  users: UserProfile[];
  primaryColor?: string;
}>();

const emit = defineEmits<{
  (e: 'reassign-course-owner', payload: { courseId: string; instructorId: string; instructorName: string }): void;
}>();

// Course ownership succession (LGPD) computed properties and reassign functions
const potentialOwners = computed(() => {
  return props.users.filter(u => {
    if (!u) return false;
    const isInst = u.isInstructor === true || String(u.isInstructor) === 'true';
    const isAdm = u.isAdmin === true || String(u.isAdmin) === 'true';
    const isMasterEmail = !!(u.email && (
      u.email === "kibedasppk@gmail.com" || 
      u.email === "admin@englishvolunteer.org" || 
      u.email === "janyel.lima2809@outlook.com"
    ));
    return isInst || isAdm || isMasterEmail;
  });
});

const detailedCourses = computed(() => {
  return props.courses.map(course => {
    const activeOwner = props.users.find(u => {
      if (!u) return false;
      const isInst = u.isInstructor === true || String(u.isInstructor) === 'true';
      const isAdm = u.isAdmin === true || String(u.isAdmin) === 'true';
      const isMasterEmail = !!(u.email && (
        u.email === "kibedasppk@gmail.com" || 
        u.email === "admin@englishvolunteer.org" || 
        u.email === "janyel.lima2809@outlook.com"
      ));
      return u.uid === course.creatorId && (isInst || isAdm || isMasterEmail);
    });
    const isOrphaned = course.creatorId === "system-volunteer" || !activeOwner;
    return {
      ...course,
      isOrphaned,
      ownerName: activeOwner 
        ? (activeOwner.displayName || activeOwner.email || "Usuário Sem Nome") 
        : (course.creatorId === "system-volunteer" 
            ? "Administração" 
            : `Ex-Instrutor (${course.creatorName || "Sem Nome"})`)
    };
  });
});

const courseSearchQuery = ref('');
const coursesPage = ref(1);
const coursesPerPage = ref(5);

watch([courseSearchQuery], () => {
  coursesPage.value = 1;
});

const filteredDetailedCourses = computed(() => {
  return detailedCourses.value.filter(course => {
    if (!courseSearchQuery.value) return true;
    const query = courseSearchQuery.value.toLowerCase().trim();
    const matchTitle = course.title.toLowerCase().includes(query);
    const matchLevel = course.level.toLowerCase().includes(query);
    const matchOwner = course.ownerName.toLowerCase().includes(query);
    const matchId = course.id.toLowerCase().includes(query);
    return matchTitle || matchLevel || matchOwner || matchId;
  });
});

const totalCoursesPages = computed(() => {
  return Math.ceil(filteredDetailedCourses.value.length / coursesPerPage.value) || 1;
});

const paginatedDetailedCourses = computed(() => {
  const start = (coursesPage.value - 1) * coursesPerPage.value;
  const end = start + coursesPerPage.value;
  return filteredDetailedCourses.value.slice(start, end);
});

// Reassign confirm modal
const showReassignDialog = ref(false);
const reassignPayload = ref<{
  courseId: string;
  courseTitle: string;
  targetInstructorId: string;
  instructorName: string;
  oldCreatorId: string;
  eventTarget: HTMLSelectElement | null;
} | null>(null);

const handleReassignCourseOwner = (event: Event, courseId: string, targetInstructorId: string) => {
  if (!targetInstructorId) return;
  const courseObj = props.courses.find(c => c.id === courseId);
  const oldCreatorId = courseObj ? courseObj.creatorId : "";

  const chosenInstr = props.users.find(u => u.uid === targetInstructorId);
  const instructorName = chosenInstr ? chosenInstr.displayName : "Administrador";

  reassignPayload.value = {
    courseId,
    courseTitle: courseObj?.title || 'este curso',
    targetInstructorId,
    instructorName,
    oldCreatorId,
    eventTarget: event.target as HTMLSelectElement || null
  };
  showReassignDialog.value = true;
};

const confirmReassignment = async () => {
  if (!reassignPayload.value) return;
  const { courseId, targetInstructorId, instructorName, oldCreatorId, eventTarget } = reassignPayload.value;
  
  try {
    if (db) {
      await updateDoc(doc(db, "courses", courseId), {
        creatorId: targetInstructorId,
        creatorName: instructorName
      });
    }
    
    emit('reassign-course-owner', {
      courseId,
      instructorId: targetInstructorId,
      instructorName
    });

    showToast(`Sucesso! Propriedade do curso em questão reatribuída para: ${instructorName}`, "success");
  } catch (err: any) {
    console.error("Erro ao reatribuir curso:", err);
    showToast("Falha de rede ou segurança ao atualizar curso no Firestore.", "error");
    if (eventTarget) {
      eventTarget.value = oldCreatorId;
    }
  } finally {
    showReassignDialog.value = false;
    reassignPayload.value = null;
  }
};

const cancelReassignment = () => {
  if (reassignPayload.value && reassignPayload.value.eventTarget) {
    reassignPayload.value.eventTarget.value = reassignPayload.value.oldCreatorId;
  }
  showReassignDialog.value = false;
  reassignPayload.value = null;
};
</script>

<template>
  <div>
    <!-- Gestão de Direitos Autorais e Cursos Transferidos (LGPD) -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-xs text-left space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
        <div>
          <h3 class="text-sm font-bold text-gray-950 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
            <Shield class="w-4.5 h-4.5" :style="{ color: props.primaryColor || '#4f46e5' }" />
            Sucessão de Propriedade de Curso (LGPD)
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Transfira direitos autorais e atribua tutores válidos para cursos de professores desligados da plataforma (solicitação de eliminação de dados pessoais / esquecimento).
          </p>
        </div>
        <div 
          :style="{ 
            color: props.primaryColor || '#4f46e5',
            borderColor: (props.primaryColor || '#4f46e5') + '40',
            backgroundColor: (props.primaryColor || '#4f46e5') + '15'
          }"
          class="px-3 py-1.5 rounded-xl border text-[10px] font-extrabold flex items-center gap-1.5 uppercase select-none whitespace-nowrap"
        >
          🛡️ Salvaguarda de Continuidade Didática
        </div>
      </div>

       <div 
        :style="{ 
          borderColor: (props.primaryColor || '#4f46e5') + '25',
          backgroundColor: (props.primaryColor || '#4f46e5') + '08'
        }"
        class="border rounded-2xl p-4 text-xs text-slate-650 dark:text-slate-350 leading-relaxed w-full"
      >
        De acordo com as regras de continuidade e termos descritos de acordo com a <strong>Lei Geral de Proteção de Dados (LGPD)</strong>, quando um instrutor decide excluir permanentemente seu cadastro e e-mail no English Volunteer, os materiais e minicursos autorais fornecidos continuam sob propriedade da administração do ecossistema. Isso previne o rompimento do progresso pedagógico de centenas de alunos matriculados e em processo de certificação.
      </div>

      <!-- Search inside course succession -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 select-none">
        <p class="text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider">Histórico de Obras Catalogadas</p>
        <div class="relative w-full sm:max-w-xs">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search class="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Pesquisar por curso, nível ou proprietário..."
            v-model="courseSearchQuery"
            class="w-full text-xs pl-9 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-xl p-2.5 focus:outline-hidden text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div class="overflow-x-auto rounded-xl border border-gray-200/50 dark:border-slate-850 bg-white dark:bg-slate-900">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-950 border-b border-gray-100 dark:border-slate-850 text-slate-450 font-extrabold uppercase tracking-wider text-[10px]">
              <th class="p-4">Curso / Minicurso</th>
              <th class="p-4">Nível de Foco</th>
              <th class="p-4">Proprietário / Mentor</th>
              <th class="p-4">Status de Atribuição</th>
              <th class="p-4 text-right">Transferir Sucessão</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200/50 dark:divide-slate-850">
            <tr 
              v-for="course in paginatedDetailedCourses" 
              :key="course.id" 
              class="hover:bg-slate-50/50 dark:hover:bg-slate-950/25 transition-colors"
            >
              <td class="p-4 font-bold text-gray-900 dark:text-white">
                {{ course.title }}
                <span class="block text-[10px] font-medium text-slate-450 dark:text-gray-500 mt-0.5">ID: {{ course.id }}</span>
              </td>
              <td class="p-4">
                <span class="px-2 py-0.5 rounded bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold uppercase text-[9px] tracking-wider font-sans">
                  {{ course.level }}
                </span>
              </td>
              <td class="p-4 font-mono text-gray-550 dark:text-gray-300">
                {{ course.ownerName }}
              </td>
              <td class="p-4">
                <span 
                  v-if="course.isOrphaned" 
                  class="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-slate-800/80 px-2 py-1 rounded-md border border-amber-100 dark:border-slate-850 animate-pulse font-sans"
                >
                  ⚠️ Sem Dono Ativo / Órfão
                </span>
                <span 
                  v-else 
                  class="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-slate-800/80 px-2 py-1 rounded-md border border-emerald-100 dark:border-slate-850 font-sans"
                >
                  ✓ Tutor Vinculado
                </span>
              </td>
              <td class="p-4 text-right">
                <select
                  :value="course.creatorId"
                  @change="(e) => handleReassignCourseOwner(e, course.id, (e.target as HTMLSelectElement).value)"
                  class="text-xs font-bold bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-850 dark:text-white border border-gray-200 dark:border-slate-800 rounded-lg p-1.5 focus:outline-hidden cursor-pointer"
                >
                  <option value="" disabled>Selecione um tutor sucessor...</option>
                  <option value="system-volunteer">Administração (Padrão)</option>
                  <option 
                    v-for="inst in potentialOwners" 
                    :key="inst.uid" 
                    :value="inst.uid"
                  >
                    {{ inst.displayName || inst.email || "Usuário Sem Nome" }} ({{ inst.isInstructor ? 'Prof' : 'Admin' }})
                  </option>
                </select>
              </td>
            </tr>
            <tr v-if="filteredDetailedCourses.length === 0">
              <td colspan="5" class="p-8 text-center text-slate-450 dark:text-slate-400 italic">
                Nenhum curso correspondente aos termos de busca.
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination Controls for Course Succession (LGPD) -->
        <div v-if="filteredDetailedCourses.length > 0" class="p-4 border-t border-gray-100 dark:border-slate-850 flex items-center justify-between gap-4 flex-wrap text-xs font-semibold select-none text-slate-450 dark:text-slate-400">
          <span>
            Mostrando <strong class="text-slate-900 dark:text-slate-200">{{ Math.min(filteredDetailedCourses.length, (coursesPage - 1) * coursesPerPage + 1) }}</strong> a 
            <strong class="text-slate-900 dark:text-slate-200">{{ Math.min(filteredDetailedCourses.length, coursesPage * coursesPerPage) }}</strong> de 
            <strong class="text-slate-900 dark:text-slate-200">{{ filteredDetailedCourses.length }}</strong> obras catalogadas
          </span>

          <div class="flex items-center gap-1.5">
            <button
              type="button"
              :disabled="coursesPage === 1"
              @click="coursesPage--"
              class="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 disabled:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 dark:disabled:bg-slate-950 border border-gray-102 dark:border-slate-850 rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 transition duration-150 inline-flex items-center gap-1 text-[11px]"
            >
              <ChevronLeft class="w-3.5 h-3.5" /> Anterior
            </button>
            
            <span class="px-2 text-[11px]">Página {{ coursesPage }} de {{ totalCoursesPages }}</span>
            
            <button
              type="button"
              :disabled="coursesPage === totalCoursesPages"
              @click="coursesPage++"
              class="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 disabled:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 dark:disabled:bg-slate-950 border border-gray-102 dark:border-slate-850 rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 transition duration-150 inline-flex items-center gap-1 text-[11px]"
            >
              Próxima <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Succession Confirmation Dialog Modal for Reassignments (avoiding native iframe blocks) -->
    <div 
      v-if="showReassignDialog && reassignPayload" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    >
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 text-left animate-scaleIn">
        <div class="flex items-center gap-3 border-b border-amber-100 dark:border-slate-800 pb-3">
          <div class="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900/30 text-amber-600">
            <ShieldAlert class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Sucessão de Propriedade</h3>
            <span class="text-[9px] bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/30 text-amber-750 dark:text-amber-300 font-extrabold px-1.5 py-0.5 rounded uppercase">LGPD / Sucessão</span>
          </div>
        </div>

        <p class="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
          Deseja realmente transferir de forma permanente todos os direitos autorais, de propriedade intelectual e de administração deste curso?
        </p>

        <div class="p-3 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
          <div class="text-[9px] font-black uppercase text-slate-400">Curso</div>
          <div class="text-xs font-black text-slate-850 dark:text-slate-200">{{ reassignPayload.courseTitle }}</div>
          
          <div class="pt-2 text-[9px] font-black uppercase text-slate-400">Novo Tutor / Sucessor</div>
          <div class="text-xs font-black text-emerald-600 dark:text-emerald-450 flex items-center gap-1">
            <CheckCircle class="w-3.5 h-3.5" />
            {{ reassignPayload.instructorName }}
          </div>
        </div>

        <p class="text-[9.5px] text-slate-450 dark:text-slate-400 leading-normal font-medium">
          Isso definirá o novo orientador do curso e atualizará os painéis pedagógicos imediatamente. Esta ação é considerada um direito de sucessão definitivo.
        </p>

        <div class="flex gap-2.5 pt-1.5">
          <button
            type="button"
            @click="cancelReassignment"
            class="w-1/2 py-2.5 bg-slate-105 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl transition cursor-pointer text-center active:scale-95"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="confirmReassignment"
            class="w-1/2 py-2.5 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer text-center hover:brightness-110 active:scale-95"
            :style="{ backgroundColor: props.primaryColor || '#4f46e5' }"
          >
            Confirmar Sucessão
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
