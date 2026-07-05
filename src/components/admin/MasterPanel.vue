<script setup lang="ts">
import { computed } from 'vue';
import { 
  Users, 
  BookOpen, 
  Calendar,
  Award,
  TrendingUp,
  Target,
  AlertTriangle,
  LineChart,
  CheckCircle2,
  Zap,
  Activity,
  Lightbulb
} from 'lucide-vue-next';
import { UserProfile, Course, ClassTurma, Progress } from '../../types';
import MasterUserList from './MasterUserList.vue';
import MasterCourseSuccession from './MasterCourseSuccession.vue';
import { useI18n } from '../../composables/useI18n';

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
  const isPt = locale.value === 'pt';
  
  const beg = levelDistribution.value.Beginner;
  const inter = levelDistribution.value.Intermediate;
  const adv = levelDistribution.value.Advanced;
  
  // Rule A: Low practice session density in high demand levels
  if (beg.students > 0 && beg.classes === 0) {
    list.push({
      id: recId++,
      title: isPt ? 'Déficit de Aulas de Prática: Beginner' : 'Practice Class Deficit: Beginner',
      type: 'warning',
      text: isPt 
        ? `Há ${beg.students} alunos ativos no nível Iniciante, mas nenhuma turma de prática ao vivo agendada. Aulas síncronas evitam a evasão precoce!`
        : `There are ${beg.students} active students at the Beginner level, but no live practice classes scheduled. Synchronous classes prevent early dropout!`
    });
  } else if (beg.classes > 0 && beg.students > (beg.classes * 4)) {
    list.push({
      id: recId++,
      title: isPt ? 'Alta densidade de alunos no nível Iniciante' : 'High student density at Beginner level',
      type: 'info',
      text: isPt 
        ? `Cada turma de nível Beginner possui em média ${Math.round(beg.students / beg.classes)} alunos. Considere instruir tutores a abrir novos horários para turmas menores e mais interativas.`
        : `Each Beginner class has an average of ${Math.round(beg.students / beg.classes)} students. Consider advising tutors to open new slots for smaller, more interactive classes.`
    });
  }
  
  if (inter.students > 0 && inter.classes === 0) {
    list.push({
      id: recId++,
      title: isPt ? 'Déficit de Aulas de Prática: Intermediate' : 'Practice Class Deficit: Intermediate',
      type: 'warning',
      text: isPt 
        ? `Existem ${inter.students} estudantes no nível Intermediário sem turmas ativas de conversação prática. Recomendado abrir encontros semanais.`
        : `There are ${inter.students} students at the Intermediate level with no active conversation practice classes. Recommended to host weekly meetings.`
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
          title: isPt ? `Gargalo pedagógico detectado: ${c.title}` : `Pedagogical bottleneck detected: ${c.title}`,
          type: 'warning',
          text: isPt 
            ? `Apenas ${Math.round(rate)}% dos alunos que iniciaram este curso concluíram o certificado. Sugere-se que o tutor revise se a dificuldade do questionário está muito alta ou se faltam recursos de apoio.`
            : `Only ${Math.round(rate)}% of students who started this course completed the certificate. It is suggested that the tutor review if the quiz difficulty is too high or if support materials are missing.`
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
      title: isPt ? 'Sobrecarga Operacional de Mentores' : 'Operational Overload of Mentors',
      type: 'warning',
      text: isPt 
        ? `A proporção de suporte é de ${instructorStudentRatio.value} alunos ativos por tutor voluntário. Recomendamos realizar nova campanha de atração de tutores parceiros para reequilibrar o sistema.`
        : `The support ratio is ${instructorStudentRatio.value} active students per volunteer tutor. We recommend launching a new volunteer tutor recruitment campaign to rebalance the system.`
    });
  }

  // Rule D: Success highlight
  if (globalCertificationRate.value >= 40) {
    list.push({
      id: recId++,
      title: isPt ? 'Eficiência de Conclusão Saudável' : 'Healthy Completion Efficiency',
      type: 'success',
      text: isPt 
        ? `${globalCertificationRate.value}% dos estudantes ativos completaram integralmente seus roteiros pedagógicos de autoestudo. Desempenho comunitário excelente!`
        : `${globalCertificationRate.value}% of active students fully completed their self-study courses. Excellent community performance!`
    });
  }

  if (list.length === 0) {
    list.push({
      id: recId++,
      title: isPt ? 'Estabilidade do Ecossistema' : 'Ecosystem Stability',
      type: 'info',
      text: isPt 
        ? 'Todos os indicadores de fluxo de alunos, turmas de prática e desempenho nos questionários operam dentro do patamar de conformidade esperado.'
        : 'All indicators of student flow, practice classes, and quiz performance are operating within the expected compliance thresholds.'
    });
  }

  return list;
});
</script>

<template>
  <div class="space-y-8 animate-fadeIn text-left">
    
    <!-- Banner / Overview -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
      <div>
        <h2 class="text-xl font-black text-gray-900 flex items-center gap-2">
          <span class="p-1 px-2 border border-amber-300 bg-amber-50 text-amber-700 rounded text-[10px] sm:text-xs select-none font-bold">👑 {{ locale === 'pt' ? 'ADMIN MASTER' : 'MASTER ADMIN' }}</span>
          {{ locale === 'pt' ? 'Gerenciamento Geral English Volunteer' : 'English Volunteer General Management' }}
        </h2>
        <p class="text-xs text-gray-500 mt-1">
          {{ locale === 'pt' 
            ? 'Supervisão de alunos e mentores, alteração de perfis pedagógicos, liberação de acesso e disparador de resets de senha.' 
            : 'Supervision of students and mentors, management of pedagogical profiles, access authorization, and password reset trigger.' 
          }}
        </p>
      </div>
    </div>

    <!-- Grid Quick Dashboard Metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
        <div class="flex justify-between items-start">
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {{ locale === 'pt' ? 'Contas Cadastradas' : 'Registered Accounts' }}
          </p>
          <span class="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Users class="w-5 h-5" />
          </span>
        </div>
        <h4 class="text-2xl font-black text-gray-900 mt-2">{{ users.length }}</h4>
        <p class="text-[10px] text-emerald-600 font-bold mt-1">
          {{ locale === 'pt' ? '● Alunos, Professores e Admins' : '● Students, Teachers & Admins' }}
        </p>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
        <div class="flex justify-between items-start">
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {{ locale === 'pt' ? 'Catálogo de Cursos' : 'Course Catalog' }}
          </p>
          <span class="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <BookOpen class="w-5 h-5" />
          </span>
        </div>
        <h4 class="text-2xl font-black text-gray-900 mt-2">{{ courses.length }}</h4>
        <p class="text-[10px] text-gray-450 mt-1">
          {{ locale === 'pt' ? 'Grade didática ativa' : 'Active courses schedule' }}
        </p>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
        <div class="flex justify-between items-start">
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {{ locale === 'pt' ? 'Turmas de Prática Ativas' : 'Active Practice Classes' }}
          </p>
          <span class="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <Calendar class="w-5 h-5" />
          </span>
        </div>
        <h4 class="text-2xl font-black text-gray-900 mt-2">{{ totalClassesCount }}</h4>
        <p class="text-[10px] text-amber-600 font-bold mt-1">
          {{ locale === 'pt' ? 'Encontros marcados' : 'Scheduled meetings' }}
        </p>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
        <div class="flex justify-between items-start">
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {{ locale === 'pt' ? 'Certificados Válidos' : 'Valid Certificates' }}
          </p>
          <span class="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Award class="w-5 h-5" />
          </span>
        </div>
        <h4 class="text-2xl font-black text-gray-900 mt-2">
          {{ totalCertified }}
        </h4>
        <p class="text-[10px] text-indigo-600 font-bold mt-1">
          {{ locale === 'pt' ? 'Conclusões com aprovação' : 'Approved completions' }}
        </p>
      </div>
    </div>

    <!-- ADVANCED CONTINUOUS IMPROVEMENT ANALYTICS GRID -->
    <div class="bg-white rounded-3xl border border-gray-100 p-6 space-y-6 shadow-xs select-none">
      <div class="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider block">
            {{ locale === 'pt' ? 'Painel de Impacto e Melhoria Contínua de Processos' : 'Impact & Continuous Process Improvement Dashboard' }}
          </h3>
          <p class="text-xs text-slate-400 font-bold block">
            {{ locale === 'pt' ? 'Visão executiva baseada em métricas para otimização do ecossistema educacional de voluntariado.' : 'Executive metrics-based overview for optimization of the volunteer educational ecosystem.' }}
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
              {{ locale === 'pt' ? 'Eficiência de Conclusão' : 'Completion Efficiency' }}
            </span>
            <Target class="w-4 h-4 text-emerald-600" />
          </div>
          <h5 class="text-2xl font-black text-slate-900">{{ globalCertificationRate }}%</h5>
          <p class="text-[10.5px] text-slate-400 font-bold">
            {{ locale === 'pt' ? 'Taxa de alunos ativos que conquistaram o certificado.' : 'Rate of active students who earned the certificate.' }}
          </p>
        </div>

        <!-- KPI 2 -->
        <div class="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100/50">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {{ locale === 'pt' ? 'Retenção de Conhecimento' : 'Knowledge Retention' }}
            </span>
            <TrendingUp class="w-4 h-4 text-indigo-600" />
          </div>
          <h5 class="text-2xl font-black text-slate-900">{{ globalQuizAverage }}%</h5>
          <p class="text-[10.5px] text-slate-400 font-bold">
            {{ locale === 'pt' ? 'Média de aproveitamento nos quizzes auto-corrigidos.' : 'Average performance on self-corrected quizzes.' }}
          </p>
        </div>

        <!-- KPI 3 -->
        <div class="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100/50">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {{ locale === 'pt' ? 'Relação Aluno/Mentor' : 'Student/Mentor Ratio' }}
            </span>
            <Users class="w-4 h-4 text-blue-600" />
          </div>
          <h5 class="text-2xl font-black text-slate-900">1 : {{ instructorStudentRatio }}</h5>
          <p class="text-[10.5px] text-slate-400 font-bold">
            {{ locale === 'pt' ? 'Alunos em processo ativo gerenciados por mentor voluntário.' : 'Active students managed per volunteer mentor.' }}
          </p>
        </div>
      </div>

      <!-- Charts & Diagnosis Row -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Demand per Level Visual Bar Chart (8 columns) -->
        <div class="lg:col-span-7 bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
          <div>
            <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider">
              {{ locale === 'pt' ? 'Distribuição e Demanda por Nível Pedagógico' : 'Distribution & Demand by Pedagogical Level' }}
            </h4>
            <p class="text-[11px] text-slate-400 font-bold">
              {{ locale === 'pt' ? 'Direciona recursos voluntários de acordo com o público real ativo.' : 'Guides volunteer resources based on the active audience.' }}
            </p>
          </div>

          <div class="space-y-4 pt-1">
            <!-- Beginner -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded bg-blue-500 block"></span>
                  {{ locale === 'pt' ? 'Iniciante (Beginner)' : 'Beginner (Iniciante)' }}
                </span>
                <span class="text-slate-450 text-[10px]">
                  {{ levelDistribution.Beginner.students }} {{ locale === 'pt' ? 'alunos' : 'students' }} · {{ levelDistribution.Beginner.certificates }} certs · {{ levelDistribution.Beginner.classes }} {{ locale === 'pt' ? 'turmas' : 'classes' }}
                </span>
              </div>
              <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div class="bg-blue-500 h-full rounded-full transition-all duration-500" :style="{ width: `${progressReports.length > 0 ? (levelDistribution.Beginner.students / progressReports.length) * 100 : 0}%` }"></div>
              </div>
            </div>

            <!-- Intermediate -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded bg-amber-500 block"></span>
                  {{ locale === 'pt' ? 'Intermediário (Intermediate)' : 'Intermediate (Intermediário)' }}
                </span>
                <span class="text-slate-450 text-[10px]">
                  {{ levelDistribution.Intermediate.students }} {{ locale === 'pt' ? 'alunos' : 'students' }} · {{ levelDistribution.Intermediate.certificates }} certs · {{ levelDistribution.Intermediate.classes }} {{ locale === 'pt' ? 'turmas' : 'classes' }}
                </span>
              </div>
              <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div class="bg-amber-500 h-full rounded-full transition-all duration-500" :style="{ width: `${progressReports.length > 0 ? (levelDistribution.Intermediate.students / progressReports.length) * 100 : 0}%` }"></div>
              </div>
            </div>

            <!-- Advanced -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded bg-indigo-500 block"></span>
                  {{ locale === 'pt' ? 'Avançado (Advanced)' : 'Advanced (Avançado)' }}
                </span>
                <span class="text-slate-450 text-[10px]">
                  {{ levelDistribution.Advanced.students }} {{ locale === 'pt' ? 'alunos' : 'students' }} · {{ levelDistribution.Advanced.certificates }} certs · {{ levelDistribution.Advanced.classes }} {{ locale === 'pt' ? 'turmas' : 'classes' }}
                </span>
              </div>
              <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div class="bg-indigo-500 h-full rounded-full transition-all duration-500" :style="{ width: `${progressReports.length > 0 ? (levelDistribution.Advanced.students / progressReports.length) * 100 : 0}%` }"></div>
              </div>
            </div>
          </div>
          
          <div class="text-[9.5px] text-slate-400 font-bold leading-normal border-t border-slate-200/50 pt-2 flex items-center gap-1.5">
            <span class="text-indigo-600">💡 {{ locale === 'pt' ? 'Dica de Planejamento:' : 'Planning Tip:' }}</span> 
            {{ locale === 'pt' ? 'Alinhar a abertura de novas turmas de Prática ao vivo com os níveis de maior representatividade de alunos.' : 'Align the creation of new live Practice classes with the levels of highest student representation.' }}
          </div>
        </div>

        <!-- Continuous Improvement System Recommendations Dashboard (5 columns) -->
        <div class="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
          <div>
            <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb class="w-4 h-4 text-amber-500" />
              {{ locale === 'pt' ? 'Recomendações de Melhoria' : 'Improvement Recommendations' }}
            </h4>
            <p class="text-[11px] text-slate-400 font-bold">
              {{ locale === 'pt' ? 'Auditor inteligente baseado em conformidade e gargalos ativos.' : 'Intelligent auditor based on compliance and active bottlenecks.' }}
            </p>
          </div>

          <div class="space-y-3 max-h-[175px] overflow-y-auto pr-1">
            <div 
              v-for="rec in systemRecommendations" 
              :key="rec.id" 
              class="p-3 rounded-xl border flex gap-2 text-left leading-snug"
              :class="[
                rec.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                rec.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                'bg-blue-50 border-blue-200 text-blue-900'
              ]"
            >
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
    <MasterUserList
      :users="users"
      :currentUserId="currentUserId"
      :isDemoUser="isDemoUser"
      :primaryColor="primaryColor"
      @update-user-role="(uid, isInst) => emit('update-user-role', uid, isInst)"
      @delete-user-completely="(uid) => emit('delete-user-completely', uid)"
    />

    <!-- Master Course Succession Section -->
    <MasterCourseSuccession
      :courses="courses"
      :users="users"
      :primaryColor="primaryColor"
      @reassign-course-owner="(payload) => emit('reassign-course-owner', payload)"
    />

  </div>
</template>
