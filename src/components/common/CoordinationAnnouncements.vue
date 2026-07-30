<template>
  <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
    <!-- Component Header -->
    <div class="flex items-center justify-between gap-3 mb-4">
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

    <!-- Empty State -->
    <div v-if="announcements.length === 0" class="text-center py-6 px-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
      <BellOff class="w-7 h-7 mx-auto text-slate-400 mb-1" />
      <p class="text-xs font-bold text-slate-700 dark:text-slate-300">{{ t('announcements.emptyTitle') }}</p>
      <p class="text-[11px] text-slate-500 dark:text-slate-400">{{ t('announcements.emptySub') }}</p>
    </div>

    <!-- Announcements Cards List -->
    <div v-else class="space-y-3">
      <div
        v-for="item in announcements"
        :key="item.id"
        :class="[
          'p-4 rounded-xl border transition-all relative',
          item.isPinned 
            ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80 shadow-2xs' 
            : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80'
        ]"
      >
        <!-- Card Top Bar -->
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div class="flex items-center gap-1.5 flex-wrap">
            <!-- Pin Badge -->
            <span v-if="item.isPinned" class="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700 shadow-2xs">
              📌 {{ t('announcements.pinnedLabel') }}
            </span>

            <!-- Tag Badge -->
            <span :class="['inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-md border shadow-2xs', getTagClass(item.tag)]">
              {{ item.tag || 'Geral' }}
            </span>
          </div>

          <!-- Date & Author -->
          <div class="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            <span>👤 {{ item.authorName }}</span>
            <span>•</span>
            <span>📅 {{ formatDisplayDate(item.createdAt) }}</span>

            <!-- Admin Actions -->
            <div v-if="canManage" class="flex items-center gap-1 ml-2">
              <button
                type="button"
                @click="openModal(item)"
                class="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                :title="t('common.edit')"
              >
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="deleteAnnouncement(item.id)"
                class="p-1 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                :title="t('common.delete')"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Title & Content -->
        <h3 class="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-snug mb-1">
          {{ item.title }}
        </h3>
        <p class="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
          {{ item.content }}
        </p>
      </div>
    </div>

    <!-- Modal Form for Creating/Editing Announcement -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl relative space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 class="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{{ editingId ? t('announcements.editTitle') : t('announcements.createTitle') }}</span>
          </h3>
          <button type="button" @click="closeModal" class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
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
            <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              {{ t('announcements.contentField') }} *
            </label>
            <textarea
              v-model="formContent"
              required
              rows="4"
              :placeholder="t('announcements.contentPlaceholder')"
              class="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-hidden"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              @click="closeModal"
              class="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {{ isSubmitting ? 'Salvando...' : t('common.save') }}
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
import { Megaphone, Plus, BellOff, Pencil, Trash2, X } from 'lucide-vue-next';
import { Announcement } from '../../types';
import { useI18n } from '../../composables/useI18n';
import { formatDisplayDate } from '../../utils/helpers';

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

const formTitle = ref('');
const formContent = ref('');
const formTag = ref<Announcement['tag']>('Aviso Importante');
const formIsPinned = ref(false);

const pinnedAnnouncements = computed(() => announcements.value.filter(a => a.isPinned));

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
