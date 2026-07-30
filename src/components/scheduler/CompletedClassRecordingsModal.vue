<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl relative space-y-4">
      <!-- Modal Title -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Video class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-black text-slate-900 dark:text-white leading-tight">
              {{ t('recordings.modalTitle') }}
            </h3>
            <p class="text-[10px] text-slate-500 dark:text-slate-400">
              {{ classItem.courseTitle }} • {{ formatDisplayDate(classItem.scheduledAt) }}
            </p>
          </div>
        </div>

        <button type="button" @click="$emit('close')" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- VIEW MODE (for students & general users) -->
      <div v-if="!isEditing" class="space-y-3">
        <!-- Recording Link -->
        <div class="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
          <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <Video class="w-3.5 h-3.5 text-purple-500" />
            <span>{{ t('recordings.videoLinkTitle') }}</span>
          </span>

          <div v-if="classItem.recordingUrl" class="pt-1">
            <a
              :href="classItem.recordingUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <PlayCircle class="w-4 h-4" />
              <span>{{ t('recordings.watchRecording') }}</span>
              <ExternalLink class="w-3 h-3 ml-1 opacity-70" />
            </a>
          </div>

          <p v-else class="text-xs text-slate-400 italic">
            {{ t('recordings.noRecordingYet') }}
          </p>
        </div>

        <!-- Class Materials Link -->
        <div class="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
          <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <FileText class="w-3.5 h-3.5 text-blue-500" />
            <span>{{ t('recordings.materialsTitle') }}</span>
          </span>

          <div v-if="classItem.materialsUrl" class="pt-1">
            <a
              :href="classItem.materialsUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Download class="w-4 h-4" />
              <span>{{ t('recordings.accessMaterials') }}</span>
              <ExternalLink class="w-3 h-3 ml-1 opacity-70" />
            </a>
          </div>

          <p v-else class="text-xs text-slate-400 italic">
            {{ t('recordings.noMaterialsYet') }}
          </p>
        </div>

        <!-- Class Notes / Summary -->
        <div v-if="classItem.notes" class="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
          <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
            <FileCode class="w-3.5 h-3.5 text-amber-500" />
            <span>{{ t('recordings.notesTitle') }}</span>
          </span>
          <p class="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-medium">
            {{ classItem.notes }}
          </p>
        </div>

        <!-- Edit Button for Instructors / Admins -->
        <div v-if="canManage" class="pt-2 flex justify-end">
          <button
            type="button"
            @click="isEditing = true"
            class="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Pencil class="w-3.5 h-3.5" />
            <span>{{ t('recordings.editLinks') }}</span>
          </button>
        </div>
      </div>

      <!-- EDIT FORM MODE (for instructors & admins) -->
      <form v-else @submit.prevent="handleSave" class="space-y-3">
        <div>
          <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            📹 {{ t('recordings.recordingUrlLabel') }}
          </label>
          <input
            type="url"
            v-model="formRecordingUrl"
            placeholder="https://drive.google.com/... ou https://youtube.com/..."
            class="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-hidden"
          />
        </div>

        <div>
          <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            📁 {{ t('recordings.materialsUrlLabel') }}
          </label>
          <input
            type="url"
            v-model="formMaterialsUrl"
            placeholder="https://drive.google.com/folder/... ou https://canva.com/..."
            class="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-hidden"
          />
        </div>

        <div>
          <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            📝 {{ t('recordings.notesLabel') }}
          </label>
          <textarea
            v-model="formNotes"
            rows="3"
            placeholder="Principais vocabulários ensinados, tópicos e recomendações de estudo..."
            class="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-hidden"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            @click="isEditing = false"
            class="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            <Check class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Salvando...' : t('common.save') }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Video, X, PlayCircle, ExternalLink, Download, FileText, FileCode, Pencil, Check } from 'lucide-vue-next';
import { ClassTurma } from '../../types';
import { useI18n } from '../../composables/useI18n';
import { formatDisplayDate } from '../../utils/helpers';

const props = defineProps<{
  classItem: ClassTurma;
  canManage: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save-recordings', data: { recordingUrl?: string; materialsUrl?: string; notes?: string }): void;
}>();

const { t } = useI18n();

const isEditing = ref(!props.classItem.recordingUrl && !props.classItem.materialsUrl && props.canManage);
const isSubmitting = ref(false);

const formRecordingUrl = ref(props.classItem.recordingUrl || '');
const formMaterialsUrl = ref(props.classItem.materialsUrl || '');
const formNotes = ref(props.classItem.notes || '');

const handleSave = async () => {
  isSubmitting.value = true;
  try {
    emit('save-recordings', {
      recordingUrl: formRecordingUrl.value.trim() || undefined,
      materialsUrl: formMaterialsUrl.value.trim() || undefined,
      notes: formNotes.value.trim() || undefined
    });
    isEditing.value = false;
  } catch (err) {
    console.warn('[RecordingsModal] Save error:', err);
  } finally {
    isSubmitting.value = false;
  }
};
</script>
