<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl p-5 sm:p-7 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
            <Award class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
              {{ t('volunteer.modalTitle') }}
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ t('volunteer.modalSubtitle') }}
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="$emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Overview Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
        <div class="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-950/40 dark:to-amber-900/10 border border-amber-500/20">
          <p class="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">
            {{ t('volunteer.totalHours') }}
          </p>
          <p class="text-2xl font-black text-amber-900 dark:text-amber-100 mt-1">
            {{ totalHours }} <span class="text-xs font-bold">{{ t('volunteer.hoursSuffix') }}</span>
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-950/40 dark:to-blue-900/10 border border-blue-500/20">
          <p class="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400 tracking-wider">
            {{ t('volunteer.completedSessions') }}
          </p>
          <p class="text-2xl font-black text-blue-900 dark:text-blue-100 mt-1">
            {{ completedClasses.length }} <span class="text-xs font-bold">{{ t('volunteer.sessionsSuffix') }}</span>
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-950/40 dark:to-emerald-900/10 border border-emerald-500/20">
          <p class="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
            {{ t('volunteer.impactedStudents') }}
          </p>
          <p class="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
            {{ totalImpactedStudents }} <span class="text-xs font-bold">{{ t('volunteer.studentsSuffix') }}</span>
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-between gap-3 print:hidden pt-2">
        <div class="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
          <CheckCircle class="w-4 h-4 text-emerald-500" />
          <span>{{ t('volunteer.officialVerification') }}</span>
        </div>

        <button
          type="button"
          @click="printCertificate"
          class="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
        >
          <Printer class="w-4 h-4" />
          <span>{{ t('volunteer.printCertificate') }}</span>
        </button>
      </div>

      <!-- CERTIFICATE PRINT / VIEW CANVAS -->
      <div
        id="volunteer-certificate-canvas"
        class="border-8 border-double border-amber-600/30 dark:border-amber-500/30 p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-amber-50/80 via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-center relative space-y-6 shadow-xl"
      >
        <!-- Background Seal Watermark -->
        <div class="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <Award class="w-80 h-80 text-amber-600" />
        </div>

        <!-- Header -->
        <div class="space-y-1 relative">
          <div class="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-xs uppercase tracking-widest px-3 py-1 bg-amber-100/80 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 rounded-full mb-2">
            <Globe class="w-3.5 h-3.5" /> English Volunteer Org
          </div>
          <h1 class="text-2xl sm:text-3xl font-black font-serif text-slate-900 dark:text-white uppercase tracking-wider">
            {{ t('volunteer.certHeader') }}
          </h1>
          <p class="text-xs text-amber-800 dark:text-amber-300 font-bold uppercase tracking-widest">
            {{ t('volunteer.certSub') }}
          </p>
        </div>

        <!-- Main Body Text -->
        <div class="max-w-2xl mx-auto space-y-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium relative">
          <p>
            {{ t('volunteer.certBody1') }} <strong class="text-base font-black text-slate-900 dark:text-white underline decoration-amber-500 decoration-2">{{ tutorName }}</strong> {{ t('volunteer.certRole') }} {{ t('volunteer.certBody2') }} <em>English Volunteer Platform</em>.
          </p>

          <p>
            {{ t('volunteer.certBody3') }} <strong class="font-extrabold text-amber-800 dark:text-amber-300">{{ completedClasses.length }} {{ t('volunteer.sessionsLabel') }}</strong>, {{ t('volunteer.certBody4') }}
          </p>

          <div class="py-3 px-6 bg-amber-100/60 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-2xl inline-block">
            <span class="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-200">
              {{ totalHours }} {{ t('volunteer.complementaryHours') }}
            </span>
          </div>

          <p class="text-xs text-slate-600 dark:text-slate-400">
            {{ t('volunteer.certBody5') }} <strong class="text-slate-900 dark:text-slate-200">{{ totalImpactedStudents }} {{ t('volunteer.studentsEnrolled') }}</strong> {{ t('volunteer.certBody6') }}
          </p>
        </div>

        <!-- Completed Classes Log Summary -->
        <div class="text-left bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 relative text-xs">
          <h4 class="font-black text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
            <span>{{ t('volunteer.summaryTitle') }}</span>
          </h4>

          <div class="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            <div
              v-for="cl in completedClasses"
              :key="cl.id"
              class="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[11px]"
            >
              <div class="min-w-0 pr-2">
                <span class="font-bold text-slate-900 dark:text-white truncate block">
                  {{ cl.courseTitle }}
                </span>
                <span class="text-[10px] text-slate-500">
                  {{ cl.eventType === 'encontro' ? '1-on-1' : cl.eventType === 'conversacao' ? 'Conversação' : 'Aula' }} • {{ cl.studentIds?.length || 0 }} alunos
                </span>
              </div>
              <span class="font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
                📅 {{ formatDisplayDate(cl.scheduledAt) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Footer Signatures & Validation Code -->
        <div class="pt-6 border-t border-slate-300 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs relative">
          <div class="text-left space-y-1">
            <p class="text-[10px] font-black uppercase text-slate-400">{{ t('volunteer.authCode') }}</p>
            <p class="font-mono text-[11px] font-bold text-amber-700 dark:text-amber-400 break-all">
              {{ verificationHash }}
            </p>
            <p class="text-[10px] text-slate-500">{{ t('volunteer.issuedAt') }}: {{ issueDate }}</p>
          </div>

          <div class="text-right space-y-1">
            <div class="border-b border-slate-400 dark:border-slate-600 w-48 ml-auto mb-1"></div>
            <p class="font-extrabold text-slate-900 dark:text-white">{{ t('volunteer.pedagogicalCoordination') }}</p>
            <p class="text-[10px] text-slate-500">English Volunteer Organization</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Award, X, Printer, CheckCircle, Globe, CheckCircle2 } from 'lucide-vue-next';
import { ClassTurma } from '../../types';
import { useI18n } from '../../composables/useI18n';
import { formatDisplayDate } from '../../utils/helpers';

const props = defineProps<{
  tutorName: string;
  tutorUid: string;
  classes: ClassTurma[];
}>();

defineEmits(['close']);

const { t } = useI18n();

// Filter completed classes taught by tutor
const completedClasses = computed(() => {
  return (props.classes || []).filter(cl => {
    if (cl.status !== 'completed') return false;
    return cl.instructorId === props.tutorUid || cl.instructorName === props.tutorName;
  });
});

// Calculate total hours (1 hour per session)
const totalHours = computed(() => completedClasses.value.length);

// Calculate total students impacted
const totalImpactedStudents = computed(() => {
  return completedClasses.value.reduce((acc, curr) => acc + (curr.studentIds?.length || 0), 0);
});

const issueDate = new Date().toLocaleDateString('pt-BR');

const verificationHash = computed(() => {
  const shortUid = (props.tutorUid || 'USER').slice(0, 8).toUpperCase();
  return `EV-TUTOR-${shortUid}-${completedClasses.value.length}H-${Date.now().toString(36).toUpperCase()}`;
});

const printCertificate = () => {
  window.print();
};
</script>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  #volunteer-certificate-canvas, #volunteer-certificate-canvas * {
    visibility: visible;
  }
  #volunteer-certificate-canvas {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border-width: 4px !important;
  }
}
</style>
