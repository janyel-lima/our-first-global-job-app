<template>
  <div id="coordination-announcements-widget" class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
    <!-- Component Header -->
    <div class="flex items-center justify-between gap-3 mb-3">
      <div class="flex items-center gap-2.5">
        <div class="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
          <Megaphone class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2">
            <span>{{ t('announcements.title') }}</span>
            <span v-if="pinnedAnnouncements.length > 0" class="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
              📌 {{ pinnedAnnouncements.length }} {{ t('announcements.pinned') }}
            </span>
          </h2>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">
            {{ t('announcements.subtitle') }}
          </p>
        </div>
      </div>

      <!-- Add Announcement Button for Admins -->
      <button
        v-if="canManage"
        type="button"
        @click="openModal()"
        class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
      >
        <Plus class="w-4 h-4" />
        <span class="hidden sm:inline">{{ t('announcements.newButton') }}</span>
      </button>
    </div>

    <!-- Category Filter Pills (sem caixa de pesquisa) -->
    <div v-if="announcements.length > 0" class="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 custom-scrollbar">
      <button
        type="button"
        @click="setCategoryFilter('ALL')"
        :class="[
          'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0',
          selectedCategoryFilter === 'ALL'
            ? 'bg-indigo-600 text-white shadow-2xs'
            : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
        ]"
      >
        📢 {{ t('common.all') }}
      </button>

      <button
        type="button"
        @click="setCategoryFilter('Aviso Importante')"
        :class="[
          'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0',
          selectedCategoryFilter === 'Aviso Importante'
            ? 'bg-rose-600 text-white shadow-2xs'
            : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
        ]"
      >
        🚨 {{ t('announcements.tagImportant') }}
      </button>

      <button
        type="button"
        @click="setCategoryFilter('Nova Turma')"
        :class="[
          'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0',
          selectedCategoryFilter === 'Nova Turma'
            ? 'bg-blue-600 text-white shadow-2xs'
            : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
        ]"
      >
        🎓 {{ t('announcements.tagNewClass') }}
      </button>

      <button
        type="button"
        @click="setCategoryFilter('Evento')"
        :class="[
          'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0',
          selectedCategoryFilter === 'Evento'
            ? 'bg-purple-600 text-white shadow-2xs'
            : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
        ]"
      >
        📅 {{ t('announcements.tagEvent') }}
      </button>

      <button
        type="button"
        @click="setCategoryFilter('Dica Semanal')"
        :class="[
          'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0',
          selectedCategoryFilter === 'Dica Semanal'
            ? 'bg-emerald-600 text-white shadow-2xs'
            : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
        ]"
      >
        💡 {{ t('announcements.tagTip') }}
      </button>

      <button
        v-if="pinnedAnnouncements.length > 0"
        type="button"
        @click="setCategoryFilter('PINNED')"
        :class="[
          'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0',
          selectedCategoryFilter === 'PINNED'
            ? 'bg-amber-600 text-white shadow-2xs'
            : 'bg-amber-100/70 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900'
        ]"
      >
        📌 {{ t('announcements.pinned') }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="filteredAnnouncements.length === 0" class="text-center py-6 px-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
      <BellOff class="w-7 h-7 mx-auto text-slate-400 mb-1" />
      <p class="text-xs font-bold text-slate-700 dark:text-slate-300">{{ t('announcements.emptyTitle') }}</p>
      <p class="text-[11px] text-slate-500 dark:text-slate-400">{{ t('announcements.emptySub') }}</p>
    </div>

    <!-- Announcements Cards List -->
    <div v-else class="space-y-3">
      <div
        v-for="item in paginatedAnnouncements"
        :key="item.id"
        :class="[
          'p-4 sm:p-5 rounded-2xl transition-all relative space-y-2.5',
          getCardContainerClass(item.tag, item.isPinned)
        ]"
      >
        <!-- Card Top Bar: Meta & Admin Actions -->
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
          <div class="flex items-center gap-1.5 flex-wrap">
            <!-- Pin Badge -->
            <span v-if="item.isPinned" class="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500 text-white border border-amber-600 shadow-2xs">
              📌 {{ t('announcements.pinnedLabel') }}
            </span>

            <!-- Tag Badge -->
            <span :class="['inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border', getTagBadgeClass(item.tag)]">
              {{ getTagIcon(item.tag) }} {{ item.tag || 'Geral' }}
            </span>
          </div>

          <!-- Date & Author -->
          <div class="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-bold">
            <span>👤 {{ item.authorName }}</span>
            <span>•</span>
            <span>📅 {{ formatDisplayDate(item.createdAt) }}</span>

            <!-- Admin Actions -->
            <div v-if="canManage" class="flex items-center gap-1 ml-2">
              <button
                type="button"
                @click="openModal(item)"
                class="p-1 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                :title="t('common.edit')"
              >
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="deleteAnnouncement(item.id)"
                class="p-1 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                :title="t('common.delete')"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Highlighted Title Block (The typed title) -->
        <div :class="['p-3 rounded-xl border flex items-start gap-2.5 shadow-2xs my-1', getTitleHeaderClass(item.tag)]">
          <span class="text-base sm:text-lg shrink-0 mt-0.5">{{ getTagIcon(item.tag) }}</span>
          <h3 class="text-sm sm:text-base font-black leading-snug tracking-tight">
            {{ item.title }}
          </h3>
        </div>

        <!-- Markdown Body Content -->
        <div class="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed space-y-1">
          <MarkdownRenderer
            :content="expandedIds[item.id] || item.content.length <= 180 ? item.content : item.content.slice(0, 180) + '...'"
          />
          <div v-if="item.content.length > 180" class="pt-1 flex items-center justify-start">
            <button
              type="button"
              @click="toggleExpand(item.id)"
              class="inline-flex items-center gap-1.5 text-[11px] font-black text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 hover:underline cursor-pointer transition-all shadow-2xs"
            >
              <span v-if="!expandedIds[item.id]" class="flex items-center gap-1">
                <span>Ver mais</span>
                <ChevronDown class="w-3.5 h-3.5" />
              </span>
              <span v-else class="flex items-center gap-1">
                <span>Ver menos</span>
                <ChevronUp class="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination Footer Controls -->
    <div v-if="filteredAnnouncements.length > pageSize" class="flex items-center justify-between pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
      <button
        type="button"
        @click="currentPage--"
        :disabled="currentPage <= 1"
        class="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
      >
        <ChevronLeft class="w-4 h-4" />
        <span>{{ t('common.previous') }}</span>
      </button>

      <div class="flex items-center gap-1 text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
        <span>{{ t('common.page', { current: currentPage, total: totalPages }) }}</span>
      </div>

      <button
        type="button"
        @click="currentPage++"
        :disabled="currentPage >= totalPages"
        class="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
      >
        <span>{{ t('common.next') }}</span>
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>

    <!-- Modal Form for Creating/Editing Announcement -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl relative space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 class="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{{ editingId ? t('announcements.editTitle') : t('announcements.createTitle') }}</span>
          </h3>
          <button type="button" @click="closeModal" class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveAnnouncement" class="space-y-3">
          <div>
            <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              {{ t('announcements.titleField') }} *
            </label>
            <input
              type="text"
              v-model="formTitle"
              required
              :placeholder="t('announcements.titlePlaceholder')"
              class="w-full text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-hidden"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                {{ t('announcements.tagField') }}
              </label>
              <select
                v-model="formTag"
                class="w-full text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white cursor-pointer focus:outline-hidden"
              >
                <option value="Aviso Importante">🚨 {{ t('announcements.tagImportant') }}</option>
                <option value="Nova Turma">🎓 {{ t('announcements.tagNewClass') }}</option>
                <option value="Evento">📅 {{ t('announcements.tagEvent') }}</option>
                <option value="Dica Semanal">💡 {{ t('announcements.tagTip') }}</option>
                <option value="Geral">📢 {{ t('announcements.tagGeneral') }}</option>
              </select>
            </div>

            <div class="flex items-end pb-2">
              <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                <input type="checkbox" v-model="formIsPinned" class="w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600" />
                <span>📌 {{ t('announcements.pinCheck') }}</span>
              </label>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {{ t('announcements.contentField') }} *
              </label>
              <!-- Tab Mode: Write vs Preview -->
              <div class="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
                <button
                  type="button"
                  @click="editorTab = 'write'"
                  :class="[
                    'px-2 py-0.5 rounded-md transition-all cursor-pointer',
                    editorTab === 'write' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  ]"
                >
                  ✍️ Editor
                </button>
                <button
                  type="button"
                  @click="editorTab = 'preview'"
                  :class="[
                    'px-2 py-0.5 rounded-md transition-all cursor-pointer',
                    editorTab === 'preview' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  ]"
                >
                  👁️ Pré-visualização
                </button>
              </div>
            </div>

            <div v-if="editorTab === 'write'" class="space-y-1.5">
              <!-- Advanced Formatting Toolbar -->
              <div class="flex items-center flex-wrap gap-1 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  @click="insertFormat('**', '**')"
                  class="p-1 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
                  title="Negrito"
                >
                  <Bold class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  @click="insertFormat('*', '*')"
                  class="p-1 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 italic font-bold rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
                  title="Itálico"
                >
                  <Italic class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  @click="insertFormat('\n### ')"
                  class="px-1.5 py-0.5 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs text-[10px]"
                  title="Título H3"
                >
                  H3
                </button>
                <button
                  type="button"
                  @click="insertFormat('\n- ')"
                  class="p-1 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
                  title="Lista com Marcadores"
                >
                  <List class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  @click="insertFormat('\n> 🚨 **Aviso:** ')"
                  class="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 font-bold rounded-lg border border-rose-200 dark:border-rose-800 cursor-pointer shadow-2xs text-[10px]"
                  title="Bloco de Alerta"
                >
                  🚨 Alerta
                </button>
                <button
                  type="button"
                  @click="insertFormat('\n> 💡 **Dica:** ')"
                  class="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 cursor-pointer shadow-2xs text-[10px]"
                  title="Bloco de Dica"
                >
                  💡 Dica
                </button>

                <div class="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5 shrink-0"></div>

                <!-- Quick Emojis Bar -->
                <div class="flex items-center gap-0.5 overflow-x-auto custom-scrollbar">
                  <button
                    v-for="emoji in ['🚀', '🚨', '🎓', '📅', '💡', '✨', '📢', '💬', '📌', '✅']"
                    :key="emoji"
                    type="button"
                    @click="insertFormat(emoji + ' ')"
                    class="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md cursor-pointer text-xs shrink-0"
                  >
                    {{ emoji }}
                  </button>
                </div>
              </div>

              <textarea
                ref="contentTextareaRef"
                v-model="formContent"
                required
                rows="6"
                :placeholder="t('announcements.contentPlaceholder')"
                class="w-full text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden leading-relaxed"
              ></textarea>
            </div>

            <!-- Live Preview -->
            <div
              v-else
              :class="['p-3.5 min-h-[160px] max-h-60 overflow-y-auto rounded-xl text-xs text-slate-900 dark:text-slate-100 leading-relaxed space-y-2', getCardContainerClass(formTag, formIsPinned)]"
            >
              <div v-if="formTitle.trim()" :class="['p-2.5 rounded-lg border flex items-start gap-2 shadow-2xs', getTitleHeaderClass(formTag)]">
                <span class="text-base shrink-0">{{ getTagIcon(formTag) }}</span>
                <h4 class="text-xs sm:text-sm font-black leading-snug tracking-tight">
                  {{ formTitle }}
                </h4>
              </div>
              <p v-if="!formContent.trim()" class="text-slate-500 dark:text-slate-400 italic text-[11px]">
                Nenhum texto informado para pré-visualização.
              </p>
              <MarkdownRenderer v-else :content="formContent" />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              @click="closeModal"
              class="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {{ isSubmitting ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Megaphone, Plus, BellOff, Pencil, Trash2, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Bold, Italic, List } from 'lucide-vue-next';
import { Announcement } from '../../types';
import { useI18n } from '../../composables/useI18n';
import { formatDisplayDate } from '../../utils/helpers';
import MarkdownRenderer from './MarkdownRenderer.vue';

const props = defineProps<{
  canManage: boolean;
  currentUser: any;
  userProfile: any;
}>();

const { t } = useI18n();

const announcements = ref<Announcement[]>([]);
const isModalOpen = ref(false);
const editingId = ref<string | null>(null);
const isSubmitting = ref(false);

// Advanced Editor & View States
const expandedIds = ref<Record<string, boolean>>({});
const editorTab = ref<'write' | 'preview'>('write');
const contentTextareaRef = ref<HTMLTextAreaElement | null>(null);

const toggleExpand = (id: string) => {
  expandedIds.value[id] = !expandedIds.value[id];
};

const insertFormat = (prefix: string, suffix = '') => {
  if (!contentTextareaRef.value) {
    formContent.value += `${prefix}${suffix}`;
    return;
  }
  const el = contentTextareaRef.value;
  const start = el.selectionStart || 0;
  const end = el.selectionEnd || 0;
  const selected = formContent.value.substring(start, end);
  const replacement = `${prefix}${selected}${suffix}`;
  formContent.value = formContent.value.substring(0, start) + replacement + formContent.value.substring(end);

  setTimeout(() => {
    el.focus();
    el.setSelectionRange(start + prefix.length, end + prefix.length);
  }, 50);
};

const formTitle = ref('');
const formContent = ref('');
const formTag = ref<Announcement['tag']>('Aviso Importante');
const formIsPinned = ref(false);

// Filter & Pagination states
const selectedCategoryFilter = ref<string>('ALL');
const currentPage = ref(1);
const pageSize = 3;

const setCategoryFilter = (category: string) => {
  selectedCategoryFilter.value = category;
  currentPage.value = 1;
};

const pinnedAnnouncements = computed(() => announcements.value.filter(a => a.isPinned));

const filteredAnnouncements = computed(() => {
  if (selectedCategoryFilter.value === 'ALL') {
    return announcements.value;
  }
  if (selectedCategoryFilter.value === 'PINNED') {
    return announcements.value.filter(a => a.isPinned);
  }
  return announcements.value.filter(a => a.tag === selectedCategoryFilter.value);
});

const totalPages = computed(() => {
  return Math.ceil(filteredAnnouncements.value.length / pageSize) || 1;
});

const paginatedAnnouncements = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredAnnouncements.value.slice(start, start + pageSize);
});

const getCardContainerClass = (tag: string, isPinned?: boolean) => {
  if (isPinned) {
    return 'bg-amber-50/90 dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-500/90 shadow-2xs';
  }
  switch (tag) {
    case 'Aviso Importante':
      return 'bg-rose-50/90 dark:bg-slate-900 border-2 border-rose-300 dark:border-rose-800/90 shadow-2xs';
    case 'Nova Turma':
      return 'bg-blue-50/90 dark:bg-slate-900 border-2 border-blue-300 dark:border-blue-800/90 shadow-2xs';
    case 'Evento':
      return 'bg-purple-50/90 dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-800/90 shadow-2xs';
    case 'Dica Semanal':
      return 'bg-emerald-50/90 dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-800/90 shadow-2xs';
    default:
      return 'bg-indigo-50/90 dark:bg-slate-900 border-2 border-indigo-300 dark:border-indigo-800/90 shadow-2xs';
  }
};

const getTitleHeaderClass = (tag: string) => {
  switch (tag) {
    case 'Aviso Importante':
      return 'bg-rose-100/90 dark:bg-rose-950/80 border-rose-200/90 dark:border-rose-800/90 text-rose-950 dark:text-rose-100';
    case 'Nova Turma':
      return 'bg-blue-100/90 dark:bg-blue-950/80 border-blue-200/90 dark:border-blue-800/90 text-blue-950 dark:text-blue-100';
    case 'Evento':
      return 'bg-purple-100/90 dark:bg-purple-950/80 border-purple-200/90 dark:border-purple-800/90 text-purple-950 dark:text-purple-100';
    case 'Dica Semanal':
      return 'bg-emerald-100/90 dark:bg-emerald-950/80 border-emerald-200/90 dark:border-emerald-800/90 text-emerald-950 dark:text-emerald-100';
    default:
      return 'bg-indigo-100/90 dark:bg-indigo-950/80 border-indigo-200/90 dark:border-indigo-800/90 text-indigo-950 dark:text-indigo-100';
  }
};

const getTagBadgeClass = (tag: string) => {
  switch (tag) {
    case 'Aviso Importante':
      return 'bg-rose-600 text-white border-rose-700 shadow-2xs font-extrabold';
    case 'Nova Turma':
      return 'bg-blue-600 text-white border-blue-700 shadow-2xs font-extrabold';
    case 'Evento':
      return 'bg-purple-600 text-white border-purple-700 shadow-2xs font-extrabold';
    case 'Dica Semanal':
      return 'bg-emerald-600 text-white border-emerald-700 shadow-2xs font-extrabold';
    default:
      return 'bg-indigo-600 text-white border-indigo-700 shadow-2xs font-extrabold';
  }
};

const getTagIcon = (tag: string) => {
  switch (tag) {
    case 'Aviso Importante':
      return '🚨';
    case 'Nova Turma':
      return '🎓';
    case 'Evento':
      return '📅';
    case 'Dica Semanal':
      return '💡';
    default:
      return '📢';
  }
};

const getTagClass = (tag: string) => {
  switch (tag) {
    case 'Aviso Importante':
      return 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800';
    case 'Nova Turma':
      return 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-800';
    case 'Evento':
      return 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800';
    case 'Dica Semanal':
      return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800';
    default:
      return 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';
  }
};

const openModal = (item?: Announcement) => {
  editorTab.value = 'write';
  if (item) {
    editingId.value = item.id;
    formTitle.value = item.title;
    formContent.value = item.content;
    formTag.value = item.tag;
    formIsPinned.value = !!item.isPinned;
  } else {
    editingId.value = null;
    formTitle.value = '';
    formContent.value = '';
    formTag.value = 'Aviso Importante';
    formIsPinned.value = false;
  }
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingId.value = null;
};

const saveAnnouncement = async () => {
  if (!formTitle.value.trim() || !formContent.value.trim()) return;
  isSubmitting.value = true;

  try {
    const id = editingId.value || `announcement_${Date.now()}`;
    const authorName = props.userProfile?.displayName || props.currentUser?.displayName || 'Coordenação';
    const authorId = props.currentUser?.uid || 'system';

    const item: Announcement = {
      id,
      title: formTitle.value.trim(),
      content: formContent.value.trim(),
      tag: formTag.value,
      isPinned: formIsPinned.value,
      authorName,
      authorId,
      createdAt: new Date().toISOString().split('T')[0]
    };

    await setDoc(doc(db, 'announcements', id), item, { merge: true });
    closeModal();
  } catch (err) {
    console.warn('[Announcements] Save failed:', err);
  } finally {
    isSubmitting.value = false;
  }
};

const deleteAnnouncement = async (id: string) => {
  if (!confirm(t('announcements.deleteConfirm'))) return;
  try {
    await deleteDoc(doc(db, 'announcements', id));
  } catch (err) {
    console.warn('[Announcements] Delete failed:', err);
  }
};

let unsub: any = null;

onMounted(() => {
  unsub = onSnapshot(collection(db, 'announcements'), (snap) => {
    const list: Announcement[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Announcement);
    });
    // Sort pinned first, then by date desc
    list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    announcements.value = list;
  }, (err) => {
    console.warn('[Announcements] Snapshot error:', err);
  });
});

onUnmounted(() => {
  if (unsub) unsub();
});
</script>
