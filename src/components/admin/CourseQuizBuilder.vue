<template>
  <div class="space-y-6">
    <div class="bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
      <p class="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-left">
        Adicionar Questão de Múltipla Escolha
      </p>
      
      <div class="space-y-3 text-left">
        <div>
          <label class="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Enunciado da Pergunta *</label>
          <input
            type="text"
            v-model="newQuestionText"
            placeholder="Ex: Qual a tradução mais aceitável de 'How are you doing?' no cotidiano?"
            class="w-full text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-hidden text-slate-900 dark:text-slate-100 transition-all"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Alternativa A (Opção 1) *</label>
            <input
              type="text"
              v-model="newOption1"
              placeholder="Ex: Como vai você?"
              class="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-hidden text-slate-900 dark:text-slate-100 transition-all"
            />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Alternativa B (Opção 2) *</label>
            <input
              type="text"
              v-model="newOption2"
              placeholder="Ex: O que você faz diariamente?"
              class="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-hidden text-slate-900 dark:text-slate-100 transition-all"
            />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Alternativa C (Opção 3)</label>
            <input
              type="text"
              v-model="newOption3"
              placeholder="Ex: O que você está vestindo?"
              class="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-hidden text-slate-900 dark:text-slate-100 transition-all"
            />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Alternativa D (Opção 4)</label>
            <input
              type="text"
              v-model="newOption4"
              placeholder="Ex: Onde fica seu trabalho?"
              class="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-hidden text-slate-900 dark:text-slate-100 transition-all"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div class="sm:col-span-1">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Qual a opção correta? *</label>
            <select
              v-model="newCorrectIndex"
              class="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-hidden cursor-pointer font-bold text-slate-800 dark:text-slate-200 transition-all"
            >
              <option :value="0">Alternativa A (Opção 1)</option>
              <option :value="1">Alternativa B (Opção 2)</option>
              <option :value="2">Alternativa C (Opção 3)</option>
              <option :value="3">Alternativa D (Opção 4)</option>
            </select>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Explicação Curta (Feedback Didático)</label>
            <input
              type="text"
              v-model="newExplanation"
              placeholder="Ex: A expressão 'How are you doing?' é equivalente a 'como vai você?'..."
              class="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-hidden text-slate-900 dark:text-slate-100 transition-all"
            />
          </div>
        </div>

        <div class="flex justify-end pt-1">
          <button
            type="button"
            @click="handleAdd"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle class="w-4 h-4" /> Registrar Questão no Rascunho
          </button>
        </div>
      </div>
    </div>

    <!-- List of configured quiz questions for the active lesson draft -->
    <div class="space-y-4 text-left">
      <p class="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
        Questões registradas no rascunho
      </p>
      <div v-if="!quizQuestions || quizQuestions.length === 0" class="py-4 text-center text-xs text-slate-400 dark:text-slate-500 italic">
        Nenhuma questão registrada para esta aula. Adicione pelo menos uma para o progresso do estudante.
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="(q, qIdx) in quizQuestions"
          :key="qIdx"
          class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 relative"
        >
          <button
            type="button"
            @click="emit('remove-question', qIdx)"
            class="absolute top-3 right-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded transition-all cursor-pointer"
            title="Apagar Pergunta"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>

          <p class="font-extrabold text-xs text-slate-800 dark:text-slate-200 pr-8">
            Q{{ qIdx + 1 }}: {{ q.question }}
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div
              v-for="(opt, optIdx) in q.options"
              :key="optIdx"
              :class="[
                'p-2 rounded text-[11px] font-medium text-left',
                q.correctAnswer === optIdx 
                  ? 'bg-emerald-50 dark:bg-emerald-950/35 text-emerald-800 dark:text-emerald-400 font-bold border border-emerald-100 dark:border-emerald-900/50' 
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-300'
              ]"
            >
              {{ String.fromCharCode(65 + optIdx) }}) {{ opt }}
              <span v-if="q.correctAnswer === optIdx" class="ml-1 text-[9px] uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 px-1.5 py-0.5 rounded-sm font-bold border border-emerald-200 dark:border-emerald-900/40">Correta</span>
            </div>
          </div>

          <p v-if="q.explanation" class="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1">
            <strong>Feedback técnico:</strong> {{ q.explanation }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PlusCircle, Trash2 } from 'lucide-vue-next';
import { QuizQuestion } from '../../types';

const props = defineProps<{
  quizQuestions: QuizQuestion[];
}>();

const emit = defineEmits<{
  (e: 'add-question', question: QuizQuestion): void;
  (e: 'remove-question', index: number): void;
  (e: 'toast', msg: string, type: string): void;
}>();

const newQuestionText = ref('');
const newOption1 = ref('');
const newOption2 = ref('');
const newOption3 = ref('');
const newOption4 = ref('');
const newCorrectIndex = ref(0);
const newExplanation = ref('');

const handleAdd = () => {
  if (!newQuestionText.value.trim() || !newOption1.value.trim() || !newOption2.value.trim()) {
    emit('toast', 'Preencha ao menos o enunciado e as alternativas A e B.', 'warning');
    return;
  }

  const options = [newOption1.value.trim(), newOption2.value.trim()];
  if (newOption3.value.trim()) options.push(newOption3.value.trim());
  if (newOption4.value.trim()) options.push(newOption4.value.trim());

  if (newCorrectIndex.value >= options.length) {
    emit('toast', 'A alternativa correta selecionada não está preenchida.', 'warning');
    return;
  }

  const questionObj: QuizQuestion = {
    question: newQuestionText.value.trim(),
    options,
    correctAnswer: newCorrectIndex.value,
    explanation: newExplanation.value.trim() || undefined
  };

  emit('add-question', questionObj);

  // Clear fields
  newQuestionText.value = '';
  newOption1.value = '';
  newOption2.value = '';
  newOption3.value = '';
  newOption4.value = '';
  newCorrectIndex.value = 0;
  newExplanation.value = '';

  emit('toast', 'Questão registrada no rascunho com sucesso!', 'success');
};
</script>
