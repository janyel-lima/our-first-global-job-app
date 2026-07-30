<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-5 shadow-2xl relative space-y-4 max-h-[90vh] flex flex-col">
      <!-- Modal Title -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
            <FolderOpen class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-black text-slate-900 dark:text-white leading-tight">
              {{ locale === 'pt' ? 'Materiais & Links da Aula' : 'Class Materials & Links' }}
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
      <div v-if="!isEditing" class="space-y-3 overflow-y-auto pr-1 flex-1">
        <!-- List of Attached Materials -->
        <div v-if="allDisplayMaterials.length > 0" class="space-y-2">
          <div
            v-for="item in allDisplayMaterials"
            :key="item.id"
            class="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="p-2 rounded-lg shrink-0"
                :class="getTypeBadgeStyle(item.type)"
              >
                <component :is="getTypeIcon(item.type)" class="w-4 h-4" />
              </div>

              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {{ item.title }}
                  </span>
                  <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0" :class="getTypeBadgeStyle(item.type)">
                    {{ getTypeLabel(item.type) }}
                  </span>
                </div>
                <p class="text-[10px] text-slate-400 dark:text-slate-500 truncate font-mono mt-0.5">
                  {{ item.url }}
                </p>
              </div>
            </div>

            <a
              :href="item.url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              <span>{{ locale === 'pt' ? 'Acessar' : 'Open' }}</span>
              <ExternalLink class="w-3 h-3 opacity-80" />
            </a>
          </div>
        </div>

        <!-- No materials fallback -->
        <div v-else class="p-5 bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-1">
          <FolderOpen class="w-8 h-8 text-slate-400 mx-auto opacity-50" />
          <p class="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {{ locale === 'pt' ? 'Nenhum material ou gravação anexado para esta aula.' : 'No materials or recordings attached yet for this class.' }}
          </p>
          <p v-if="canManage" class="text-[10px] text-slate-400">
            {{ locale === 'pt' ? 'Clique abaixo para adicionar slides, PDFs ou gravações.' : 'Click below to add slides, PDFs or video recordings.' }}
          </p>
        </div>

        <!-- Class Notes / Summary -->
        <div v-if="classItem.notes" class="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
          <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
            <FileCode class="w-3.5 h-3.5 text-amber-500" />
            <span>{{ locale === 'pt' ? 'Resumo Pedagógico da Aula' : 'Pedagogical Class Summary' }}</span>
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
            class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Pencil class="w-3.5 h-3.5" />
            <span>{{ locale === 'pt' ? 'Editar Links & Materiais' : 'Edit Links & Materials' }}</span>
          </button>
        </div>
      </div>

      <!-- EDIT FORM MODE (dynamic links list for instructors & admins) -->
      <form v-else @submit.prevent="handleSave" class="space-y-4 overflow-y-auto pr-1 flex-1">
        <!-- Dynamic Links Header & Add Button -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <LinkIcon class="w-4 h-4 text-indigo-500" />
              <span>{{ locale === 'pt' ? 'Links & Arquivos Anexados' : 'Attached Links & Files' }}</span>
            </label>
            <button
              type="button"
              @click="addMaterialItem"
              class="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>{{ locale === 'pt' ? 'Adicionar Link / Material' : 'Add Link / Material' }}</span>
            </button>
          </div>

          <!-- List of editable items -->
          <div v-if="editableMaterials.length > 0" class="space-y-2.5">
            <div
              v-for="(item, index) in editableMaterials"
              :key="item.id"
              class="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 relative"
            >
              <div class="flex items-center justify-between gap-2">
                <!-- Type Selection -->
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  <select
                    v-model="item.type"
                    class="text-xs font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                  >
                    <option value="recording">📹 {{ locale === 'pt' ? 'Gravação da Aula' : 'Video Recording' }}</option>
                    <option value="slides">📊 {{ locale === 'pt' ? 'Slides / Apresentação' : 'Slides / Presentation' }}</option>
                    <option value="pdf">📄 {{ locale === 'pt' ? 'PDF / Apostila' : 'PDF / Document' }}</option>
                    <option value="exercise">📝 {{ locale === 'pt' ? 'Exercício / Atividade' : 'Exercise / Quiz' }}</option>
                    <option value="link">🔗 {{ locale === 'pt' ? 'Link Externo' : 'External Link' }}</option>
                  </select>
                </div>

                <button
                  type="button"
                  @click="removeMaterialItem(index)"
                  class="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                  :title="locale === 'pt' ? 'Remover Item' : 'Remove Item'"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <!-- Title input -->
                <input
                  type="text"
                  v-model="item.title"
                  :placeholder="locale === 'pt' ? 'Título do material (ex: Slides da Aula)' : 'Material title (e.g. Class Slides)'"
                  class="w-full text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-hidden"
                />

                <!-- URL input -->
                <input
                  type="url"
                  v-model="item.url"
                  placeholder="https://..."
                  class="w-full text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div v-else class="p-3 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
            <p class="text-xs text-slate-400">
              {{ locale === 'pt' ? 'Nenhum link adicionado. Clique no botão acima para adicionar.' : 'No links added. Click above to add.' }}
            </p>
          </div>
        </div>

        <!-- Class Notes / Summary -->
        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1">
            📝 {{ locale === 'pt' ? 'Resumo Pedagógico da Aula' : 'Pedagogical Class Summary' }}
          </label>
          <textarea
            v-model="formNotes"
            rows="3"
            :placeholder="locale === 'pt' ? 'Principais vocabulários ensinados, tópicos e recomendações de estudo...' : 'Key vocabulary taught, topics and study recommendations...'"
            class="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-hidden font-medium"
          ></textarea>
        </div>

        <!-- Modal Footer Actions -->
        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            @click="isEditing = false"
            class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {{ locale === 'pt' ? 'Cancelar' : 'Cancel' }}
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            <Check class="w-4 h-4" />
            <span>{{ isSubmitting ? (locale === 'pt' ? 'Salvando...' : 'Saving...') : (locale === 'pt' ? 'Salvar Materiais' : 'Save Materials') }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  FolderOpen,
  X,
  ExternalLink,
  FileText,
  FileCode,
  Pencil,
  Check,
  Video,
  Presentation,
  CheckSquare,
  Link as LinkIcon,
  Plus,
  Trash2
} from 'lucide-vue-next';
import { ClassTurma, ClassMaterialItem } from '../../types';
import { useI18n } from '../../composables/useI18n';
import { formatDisplayDate } from '../../utils/helpers';

const props = defineProps<{
  classItem: ClassTurma;
  canManage: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save-recordings', data: { recordingUrl?: string; materialsUrl?: string; materialsList?: ClassMaterialItem[]; notes?: string }): void;
}>();

const { locale } = useI18n();

// Initialize materials list from props.classItem
const initialMaterials: ClassMaterialItem[] = [];
if (props.classItem.materialsList && props.classItem.materialsList.length > 0) {
  initialMaterials.push(...props.classItem.materialsList);
} else {
  if (props.classItem.recordingUrl) {
    initialMaterials.push({
      id: 'rec-' + Date.now(),
      title: locale.value === 'pt' ? 'Gravação da Aula' : 'Class Recording',
      url: props.classItem.recordingUrl,
      type: 'recording'
    });
  }
  if (props.classItem.materialsUrl) {
    initialMaterials.push({
      id: 'mat-' + Date.now(),
      title: locale.value === 'pt' ? 'Materiais Didáticos / Slides' : 'Class Materials / Slides',
      url: props.classItem.materialsUrl,
      type: 'slides'
    });
  }
}

const editableMaterials = ref<ClassMaterialItem[]>(JSON.parse(JSON.stringify(initialMaterials)));
const formNotes = ref(props.classItem.notes || '');

const hasNoContent = initialMaterials.length === 0 && !props.classItem.notes;
const isEditing = ref(hasNoContent && props.canManage);
const isSubmitting = ref(false);

const allDisplayMaterials = computed(() => {
  if (props.classItem.materialsList && props.classItem.materialsList.length > 0) {
    return props.classItem.materialsList;
  }
  const list: ClassMaterialItem[] = [];
  if (props.classItem.recordingUrl) {
    list.push({
      id: 'rec-view',
      title: locale.value === 'pt' ? 'Gravação da Videochamada' : 'Video Recording',
      url: props.classItem.recordingUrl,
      type: 'recording'
    });
  }
  if (props.classItem.materialsUrl) {
    list.push({
      id: 'mat-view',
      title: locale.value === 'pt' ? 'Materiais & Slides da Aula' : 'Class Materials & Slides',
      url: props.classItem.materialsUrl,
      type: 'slides'
    });
  }
  return list;
});

const addMaterialItem = () => {
  editableMaterials.value.push({
    id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    title: '',
    url: '',
    type: 'slides'
  });
};

const removeMaterialItem = (index: number) => {
  editableMaterials.value.splice(index, 1);
};

const getTypeIcon = (type: ClassMaterialItem['type']) => {
  switch (type) {
    case 'recording': return Video;
    case 'slides': return Presentation;
    case 'pdf': return FileText;
    case 'exercise': return CheckSquare;
    case 'link': return LinkIcon;
    default: return LinkIcon;
  }
};

const getTypeLabel = (type: ClassMaterialItem['type']) => {
  switch (type) {
    case 'recording': return locale.value === 'pt' ? 'Gravação' : 'Recording';
    case 'slides': return locale.value === 'pt' ? 'Slides' : 'Slides';
    case 'pdf': return 'PDF';
    case 'exercise': return locale.value === 'pt' ? 'Exercício' : 'Exercise';
    case 'link': return 'Link';
    default: return 'Link';
  }
};

const getTypeBadgeStyle = (type: ClassMaterialItem['type']) => {
  switch (type) {
    case 'recording':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
    case 'slides':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
    case 'pdf':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
    case 'exercise':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
    case 'link':
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
  }
};

const handleSave = async () => {
  isSubmitting.value = true;
  try {
    const validMaterials = editableMaterials.value
      .filter(item => item.url.trim().length > 0)
      .map(item => ({
        ...item,
        title: item.title.trim() || (item.type === 'recording' ? (locale.value === 'pt' ? 'Gravação da Aula' : 'Recording') : (locale.value === 'pt' ? 'Material da Aula' : 'Material')),
        url: item.url.trim()
      }));

    // Find legacy fallback URLs
    const recItem = validMaterials.find(m => m.type === 'recording');
    const matItem = validMaterials.find(m => m.type !== 'recording');

    emit('save-recordings', {
      recordingUrl: recItem ? recItem.url : undefined,
      materialsUrl: matItem ? matItem.url : undefined,
      materialsList: validMaterials,
      notes: formNotes.value.trim() || undefined
    });
    isEditing.value = false;
  } catch (err) {
    console.warn('[CompletedClassRecordingsModal] Save error:', err);
  } finally {
    isSubmitting.value = false;
  }
};
</script>
