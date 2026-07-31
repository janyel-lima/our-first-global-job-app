<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn"
      >
        <!-- Header -->
        <div class="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div class="text-left">
            <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Award class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {{ locale === 'pt' ? 'Prova da Lição:' : 'Lesson Quiz:' }} {{ lessonTitle }}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
              {{ locale === 'pt' ? 'Aproveitamento mínimo requerido de' : 'Minimum score required:' }} {{ quizPassScore }}%
            </p>
          </div>
          
          <!-- Close (X) button is strictly shown only after submission to ensure focus -->
          <button 
            v-if="isSubmitted"
            @click="emit('close')"
            :title="locale === 'pt' ? 'Fechar e Retornar' : 'Close and Return'"
            class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-all border border-transparent dark:border-slate-800 bg-transparent cursor-pointer flex items-center justify-center"
          >
            <X class="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <!-- Quiz Questions content area (Scrollable) -->
        <div class="p-6 sm:p-8 overflow-y-auto space-y-6 text-left flex-1">
          <!-- Inline Guidance Banner -->
          <div v-if="!isSubmitted" class="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex items-start gap-3">
            <AlertCircle class="w-5 h-5 text-amber-600 dark:text-amber-450 shrink-0 mt-0.5 animate-pulse" />
            <div class="space-y-0.5">
              <p class="text-xs font-black text-amber-900 dark:text-amber-300">
                {{ locale === 'pt' ? 'Prova Ativa em Andamento' : 'Active Quiz in Progress' }}
              </p>
              <p class="text-[11px] text-amber-800 dark:text-amber-400 font-semibold leading-relaxed">
                {{ locale === 'pt' 
                  ? 'Para garantir sua trilha pedagógica, esta janela de prova é selada. Responda tudo com atenção e clique em Enviar Respostas no rodapé quando concluir.' 
                  : 'To guarantee your educational path, this quiz window is locked. Answer all questions carefully and click Submit Answers at the footer when finished.' 
                }}
              </p>
            </div>
          </div>

          <div class="space-y-6">
            <div v-for="(q, qIdx) in quizQuestions" :key="qIdx" class="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p class="font-bold text-slate-900 dark:text-white text-sm mb-3">
                {{ qIdx + 1 }}. {{ q.question }}
              </p>
              
              <div class="space-y-2.5">
                <button
                  v-for="(opt, oIdx) in q.options"
                  :key="oIdx"
                  :id="`quiz-modal-${qIdx}-option-${oIdx}`"
                  :disabled="isSubmitted"
                  @click="emit('select-answer', qIdx, oIdx)"
                  :class="[
                    'w-full text-left p-3.5 text-xs sm:text-sm rounded-xl border font-semibold transition-all flex items-center justify-between cursor-pointer',
                    Number(selectedAnswers[qIdx]) === Number(oIdx) 
                      ? (isSubmitted 
                          ? (Number(q.correctAnswer) === Number(oIdx) ? 'bg-emerald-50 dark:bg-emerald-950/45 border-emerald-500 dark:border-emerald-700 text-emerald-900 dark:!text-emerald-300 font-extrabold' : 'bg-rose-50 dark:bg-rose-950/45 border-rose-300 dark:border-rose-900 text-rose-900 dark:!text-rose-300 font-extrabold') 
                          : 'font-extrabold ring-2')
                      : (isSubmitted 
                          ? (Number(q.correctAnswer) === Number(oIdx) ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-800 text-emerald-950 dark:!text-emerald-300 font-extrabold' : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-450 dark:!text-slate-500 opacity-60') 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:!text-slate-200')
                  ]"
                  :style="[
                    Number(selectedAnswers[qIdx]) === Number(oIdx) && !isSubmitted 
                      ? { borderColor: themeColor, color: themeColor, backgroundColor: themeColor + '12', '--tw-ring-color': themeColor + '40' } 
                      : {}
                  ]"
                >
                  <span class="pr-2">{{ opt }}</span>
                  
                  <span v-if="isSubmitted && Number(q.correctAnswer) === Number(oIdx)" class="text-[10px] text-emerald-600 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 py-0.5 px-2.5 rounded-full uppercase shrink-0 font-black">
                    {{ locale === 'pt' ? 'Correto' : 'Correct' }}
                  </span>
                  <span v-if="isSubmitted && Number(selectedAnswers[qIdx]) === Number(oIdx) && Number(q.correctAnswer) !== Number(oIdx)" class="text-[10px] text-rose-600 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/50 py-0.5 px-2.5 rounded-full uppercase shrink-0 font-black">
                    {{ locale === 'pt' ? 'Incorreto' : 'Incorrect' }}
                  </span>
                </button>
              </div>

              <div v-if="isSubmitted" :style="{ backgroundColor: themeColor + '10' }" class="mt-4 p-4 border border-slate-100 dark:border-slate-800 rounded-xl text-xs leading-relaxed text-slate-700 dark:!text-slate-200 shadow-2xs">
                <strong class="font-extrabold" :style="{ color: themeColor }">
                  {{ locale === 'pt' ? 'Dica Pedagógica:' : 'Pedagogical Tip:' }}
                </strong>
                <span class="text-slate-600 dark:!text-slate-300 font-semibold ml-1">{{ q.explanation }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky footer of the modal -->
        <div class="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div class="text-left w-full sm:w-auto">
            <div v-if="isSubmitted && score !== null" class="text-xs sm:text-sm">
              <span class="font-bold text-slate-700 dark:text-slate-300">
                {{ locale === 'pt' ? 'Seu Desempenho:' : 'Your Score:' }}
              </span>
              <span :class="['font-black text-sm sm:text-base block sm:inline', score >= quizPassScore ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400']">
                {{ score }}% ({{ score >= quizPassScore 
                  ? (locale === 'pt' ? "✓ Aprovado para Conclusão" : "✓ Passed for Completion") 
                  : (locale === 'pt' ? "Abaixo da Média Necessária (Requer >= " + quizPassScore + "%)" : "Below Required Passing Score (Requires >= " + quizPassScore + "%)") 
                }})
              </span>
            </div>
            <div v-else class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {{ locale === 'pt' 
                ? `Respostas: ${Object.keys(selectedAnswers).length} de ${quizQuestions.length} preenchidas` 
                : `Answers: ${Object.keys(selectedAnswers).length} of ${quizQuestions.length} completed` 
              }}
            </div>
          </div>

          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              v-if="!isSubmitted"
              id="btn-submit-quick-quiz"
              :disabled="isSubmitting"
              @click="emit('submit')"
              :style="{ backgroundColor: themeColor }"
              class="w-full sm:w-auto px-6 py-3 hover:opacity-90 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {{ isSubmitting 
                ? (locale === 'pt' ? "Enviando Prova..." : "Submitting Quiz...") 
                : (locale === 'pt' ? "Enviar e Entregar Prova" : "Submit Quiz") 
              }}
              <ArrowRight class="w-4 h-4" />
            </button>
            
            <div v-else class="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <button
                v-if="score !== null && score < quizPassScore"
                id="btn-retry-quiz"
                @click="emit('retry')"
                class="w-full sm:w-auto px-5 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                {{ locale === 'pt' ? 'Tentar Novamente' : 'Try Again' }}
              </button>
              
              <button
                @click="emit('close')"
                :style="{ backgroundColor: themeColor }"
                class="w-full sm:w-auto px-6 py-3 hover:opacity-90 text-white text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                {{ locale === 'pt' ? 'Concluir e Fechar' : 'Complete and Close' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Award, AlertCircle, ArrowRight, X } from 'lucide-vue-next';
import { useI18n } from '../../composables/useI18n';
import { QuizQuestion } from '../../types';

const { locale } = useI18n();

defineProps<{
  isOpen: boolean;
  lessonTitle: string;
  quizQuestions: QuizQuestion[];
  selectedAnswers: Record<number, number>;
  isSubmitted: boolean;
  isSubmitting: boolean;
  score: number | null;
  quizPassScore: number;
  themeColor: string;
}>();

const emit = defineEmits<{
  (e: 'select-answer', questionIndex: number, optionIndex: number): void;
  (e: 'submit'): void;
  (e: 'retry'): void;
  (e: 'close'): void;
}>();
</script>
