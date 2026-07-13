<script setup lang="ts">
import { CheckCircle2, ChevronLeft, ChevronRight, History, MessageSquare, Search, Send, Smile, User } from 'lucide-vue-next';
import { computed, nextTick, ref, watch } from 'vue';
import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';
import { useAppState } from '../../composables/useAppState';
import { useI18n } from '../../composables/useI18n';
import { ChatMessage, ChatRoom, Course } from '../../types';

const { t, locale } = useI18n();

const props = defineProps<{
  chatRooms: ChatRoom[];
  activeMessages: ChatMessage[];
  courses: Course[];
  currentUserId: string;
  userDisplayName: string;
  isInstructor: boolean;
  isAdmin?: boolean;
  selectedRoomId: string | null;
  messagesLimit: number;
  isDarkMode?: boolean;
}>();

const { getRoomLastSeen, getRoomLastSeenCount, parseToTimestamp } = useAppState();

const emit = defineEmits<{
  (e: 'select-room', roomId: string | null): void;
  (e: 'start-room', courseId: string, topic: string): void;
  (e: 'send-message', text: string): void;
  (e: 'resolve-room', roomId: string): void;
  (e: 'load-more-messages'): void;
}>();

const newTopic = ref('');
const selectedCourseId = ref('');
const messageInput = ref('');
const isSubmitting = ref(false);

// Advanced Filter states
const searchQuery = ref('');
const statusFilter = ref<'all' | 'open' | 'resolved'>('all');
const courseFilter = ref('');

// Emoji Picker states
const showEmojiPicker = ref(false);

const ptLocale = {
  search: "Pesquisar emoji...",
  groups: {
    smileys_people: "Carinhas e Pessoas",
    animals_nature: "Animais e Natureza",
    food_drink: "Comida e Bebida",
    travel_places: "Viagens e Lugares",
    activities: "Atividades",
    objects: "Objetos",
    symbols: "Símbolos",
    flags: "Bandeiras",
    recently_used: "Usados Recentemente",
  }
};

const enLocale = {
  search: "Search emoji...",
  groups: {
    smileys_people: "Smileys & People",
    animals_nature: "Animals & Nature",
    food_drink: "Food & Drink",
    travel_places: "Travel & Places",
    activities: "Activities",
    objects: "Objects",
    symbols: "Symbols",
    flags: "Flags",
    recently_used: "Recently Used",
  }
};

const onSelectEmoji = (emojiObj: any) => {
  const char = typeof emojiObj === 'string'
    ? emojiObj
    : (emojiObj.i || emojiObj.emoji || emojiObj.char || '');
  if (char) {
    messageInput.value = (messageInput.value || '') + char;
  }
  showEmojiPicker.value = false;
  const inputEl = document.getElementById('input-chat-message-text');
  if (inputEl) {
    (inputEl as HTMLInputElement).focus();
  }
};

const activeRoom = computed(() => {
  return props.chatRooms.find(r => r.id === props.selectedRoomId);
});

const getProfessorNameForRoom = (room: ChatRoom) => {
  const course = props.courses.find(c => c.id === room.courseId);
  return course ? course.creatorName : t('chat.defaultProfessor');
};

// Computed list applying search and dropdown filters
const filteredChatRooms = computed(() => {
  return props.chatRooms.filter(room => {
    // Replicate database secure visibility scopes client-side for absolute consistency in mock environments
    const matchesRoleScope = props.isInstructor
      ? (props.isAdmin || props.currentUserId === 'demo-admin-uid' || room.instructorId === props.currentUserId || !room.instructorId)
      : (room.studentId === props.currentUserId);

    if (!matchesRoleScope) return false;

    const term = searchQuery.value.trim().toLowerCase();
    const matchesSearch = term === '' ||
      room.topic.toLowerCase().includes(term) ||
      room.studentName.toLowerCase().includes(term) ||
      room.courseTitle.toLowerCase().includes(term);

    const matchesStatus = statusFilter.value === 'all' || room.status === statusFilter.value;
    const matchesCourse = courseFilter.value === '' || room.courseId === courseFilter.value;

    return matchesSearch && matchesStatus && matchesCourse;
  });
});

// Pagination States for Chat Rooms List
const chatCurrentPage = ref(1);
const chatItemsPerPage = ref(4);

const paginatedChatRooms = computed(() => {
  const start = (chatCurrentPage.value - 1) * chatItemsPerPage.value;
  const end = start + chatItemsPerPage.value;
  return filteredChatRooms.value.slice(start, end);
});

const totalChatPages = computed(() => {
  return Math.ceil(filteredChatRooms.value.length / chatItemsPerPage.value) || 1;
});

// Reset page when search or dropdown filters change
watch([searchQuery, statusFilter, courseFilter], () => {
  chatCurrentPage.value = 1;
});

const handleStartChat = async () => {
  if (!selectedCourseId.value || !newTopic.value) return;

  isSubmitting.value = true;
  try {
    emit('start-room', selectedCourseId.value, newTopic.value);
    newTopic.value = '';
    selectedCourseId.value = '';
  } catch (error) {
    console.error("Erro iniciando chat:", error);
  } finally {
    isSubmitting.value = false;
  }
};

const handleSend = async () => {
  if (!messageInput.value.trim()) return;

  try {
    emit('send-message', messageInput.value.trim());
    messageInput.value = '';
    showEmojiPicker.value = false;
  } catch (error) {
    console.error("Erro enviando mensagem:", error);
  }
};

// Scroll handling for messages
const messagesContainerRef = ref<HTMLDivElement | null>(null);

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainerRef.value) {
      messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight;
    }
  });
};

watch(() => props.activeMessages, (newMsgs, oldMsgs) => {
  if (!oldMsgs || newMsgs.length > oldMsgs.length) {
    const isNewMsgAdded = oldMsgs && (newMsgs.length - oldMsgs.length === 1);
    const wasEmpty = !oldMsgs || oldMsgs.length === 0;

    if (isNewMsgAdded || wasEmpty) {
      scrollToBottom();
    }
  }
}, { deep: true });

watch(() => props.selectedRoomId, () => {
  scrollToBottom();
});

// Elegant message time display
const formatMessageTime = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr; // fallback for legacy values e.g. "12:35"
    return d.toLocaleString("pt-BR", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  } catch (e) {
    return dateStr;
  }
};

const getRoomUnreadCount = (room: ChatRoom): number => {
  if (room.status !== 'open') return 0;
  if (room.id === props.selectedRoomId) return 0;

  const lastSenderId = (room as any).lastSenderId;
  if (lastSenderId === props.currentUserId) return 0;

  // Se é um canal recém-criado em que não há mensagens ainda, o próprio autor (estudante) não deve ver badge unread
  if (!lastSenderId && room.studentId === props.currentUserId) return 0;

  const lastSeen = getRoomLastSeen(room.id);
  const updatedAtTime = parseToTimestamp(room.updatedAt) || parseToTimestamp(room.createdAt);

  if (updatedAtTime <= lastSeen) return 0;

  if (room.totalMessages !== undefined) {
    const lastSeenCount = getRoomLastSeenCount(room.id);
    const diff = room.totalMessages - lastSeenCount;
    return diff > 0 ? diff : 1;
  }

  return 1;
};

const isRoomUnread = (room: ChatRoom) => {
  return getRoomUnreadCount(room) > 0;
};
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch h-[calc(100vh-220px)] min-h-[550px] relative">

    <!-- Left Column: Chat room list with Advanced Filters -->
    <div :class="[
      'bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col justify-between text-left h-full transition-all',
      selectedRoomId ? 'hidden md:flex md:col-span-5' : 'flex md:col-span-5'
    ]">
      <div class="space-y-4 flex flex-col flex-grow overflow-hidden">
        <div class="shrink-0">
          <h3 class="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare class="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
            {{ t('chat.channels') }}
          </h3>
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-medium">
            {{ t('chat.channelsDesc') }}
          </p>
        </div>

        <!-- Advanced Filters Box -->
        <div
          class="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2 shrink-0">
          <div class="relative">
            <input id="input-chat-room-search" type="text" :placeholder="t('chat.searchPlaceholder')"
              v-model="searchQuery"
              class="w-full text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-705 rounded-lg py-1.5 pl-8 pr-3 focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-gray-800 dark:text-slate-100 dark:placeholder-slate-500" />
            <Search class="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 absolute left-2.5 top-2" />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <select id="select-chat-filter-status" v-model="statusFilter"
                class="w-full text-[10px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-705 rounded-lg p-1.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-gray-700 dark:text-slate-300 cursor-pointer">
                <option value="all">{{ t('chat.allStatus') }}</option>
                <option value="open">{{ t('chat.open') }}</option>
                <option value="resolved">{{ t('chat.resolved') }}</option>
              </select>
            </div>
            <div>
              <select id="select-chat-filter-course" v-model="courseFilter"
                class="w-full text-[10px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-705 rounded-lg p-1.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-gray-700 dark:text-slate-300 cursor-pointer truncate">
                <option value="">{{ t('chat.allCourses') }}</option>
                <option v-for="c in courses" :key="c.id" :value="c.id">
                  {{ c.title }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- List existing channels -->
        <div class="flex-grow overflow-y-auto pr-1 space-y-2">
          <p v-if="filteredChatRooms.length === 0"
            class="text-xs text-gray-400 dark:text-slate-500 italic py-8 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-gray-100 dark:border-slate-800">
            {{ t('chat.noChannels') }}
          </p>
          <button v-else v-for="room in paginatedChatRooms" :key="room.id" :id="`chat-room-${room.id}`"
            @click="emit('select-room', room.id)" :class="[
              'w-full text-left p-3.5 rounded-xl transition-all border flex flex-col justify-between cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-200/55',
              room.id === selectedRoomId
                ? 'bg-blue-50/70 border-blue-300 dark:bg-blue-950/40 dark:border-blue-600/50 text-blue-950 dark:!text-gray-950 shadow-3xs dark:shadow-sm'
                : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 text-gray-700 dark:text-slate-300 hover:shadow-4xs'
            ]">
            <div class="flex justify-between items-start gap-2 w-full">
              <div class="flex items-center gap-1.5">
                <span :class="[
                  'text-[8px] font-black font-mono px-2 py-0.5 rounded-full uppercase shrink-0',
                  room.status === 'open'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/40'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/40'
                ]">
                  {{ room.status === 'open' ? t('chat.open') : t('chat.resolved') }}
                </span>
                <span v-if="isRoomUnread(room)"
                  class="animate-pulse bg-red-500 text-white text-[9px] font-extrabold leading-none px-1.5 py-0.5 rounded-full shrink-0 min-w-[16px] h-4 flex items-center justify-center font-mono">
                  {{ getRoomUnreadCount(room) }}
                </span>
              </div>
              <span :class="[
                'text-[9px] font-bold tracking-tight px-2 py-0.5 rounded truncate max-w-[150px]',
                room.id === selectedRoomId
                  ? 'text-blue-600 dark:!text-gray-800 bg-blue-100/60 dark:bg-blue-900/40'
                  : 'text-gray-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
              ]" :title="room.courseTitle">
                {{ room.courseTitle }}
              </span>
            </div>

            <h4 :class="[
              'font-extrabold text-xs mt-2 line-clamp-2 w-full',
              room.id === selectedRoomId
                ? 'text-blue-950 dark:!text-gray-950'
                : 'text-gray-950 dark:text-slate-200'
            ]">{{ room.topic }}</h4>

            <div :class="[
              'flex justify-between items-center w-full mt-2.5 text-[9px] font-medium border-t pt-1.5',
              room.id === selectedRoomId
                ? 'text-blue-600/85 dark:!text-gray-600 border-blue-100/50 dark:border-blue-900/30'
                : 'text-gray-400 dark:text-slate-400 border-slate-50 dark:border-slate-800/40'
            ]">
              <span>{{ t('chat.by') }}{{ room.studentName }}</span>
              <span>{{ t('chat.active') }}</span>
            </div>
          </button>
        </div>

        <!-- Paginator for Chat Tickets -->
        <div v-if="filteredChatRooms.length > 0"
          class="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <p class="text-[10px] font-bold text-gray-400 dark:text-slate-500">
            {{ t('chat.showingTicketPage', {
              current: chatCurrentPage, total: totalChatPages, filterCount:
                filteredChatRooms.length }) }}
          </p>
          <div class="flex items-center gap-1.5">
            <button id="btn-chat-prev-page" type="button" :disabled="chatCurrentPage === 1" @click="chatCurrentPage--"
              class="p-1 px-1.5 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer text-[10px] font-bold text-gray-600 dark:text-slate-300 flex items-center justify-center gap-0.5"
              :title="t('chat.prevPage')">
              <ChevronLeft class="w-3 h-3 text-gray-700 dark:text-slate-300" />
              <span>{{ t('chat.prev') }}</span>
            </button>
            <button id="btn-chat-next-page" type="button" :disabled="chatCurrentPage === totalChatPages"
              @click="chatCurrentPage++"
              class="p-1 px-1.5 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer text-[10px] font-bold text-gray-600 dark:text-slate-300 flex items-center justify-center gap-0.5"
              :title="t('chat.nextPage')">
              <span>{{ t('chat.next') }}</span>
              <ChevronRight class="w-3 h-3 text-gray-700 dark:text-slate-300" />
            </button>
          </div>
        </div>
      </div>

      <!-- Start New Ticket panel (Only for students) -->
      <form v-if="!isInstructor" id="form-add-chat" @submit.prevent="handleStartChat"
        class="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 space-y-3 shrink-0">
        <p class="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider">
          {{ t('chat.newQuestion') }}
        </p>
        <div class="grid grid-cols-1 gap-2">
          <select id="select-chat-course" required v-model="selectedCourseId"
            class="w-full text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-705 rounded-xl p-2.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer text-gray-800 dark:text-slate-200">
            <option value="">{{ t('chat.selectCourse') }}</option>
            <option v-for="c in courses" :key="c.id" :value="c.id">
              {{ c.title }}
            </option>
          </select>

          <input id="input-chat-topic" type="text" :placeholder="t('chat.questionPlaceholder')" required
            v-model="newTopic"
            class="w-full text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-705 rounded-xl p-2.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-gray-800 dark:text-slate-200 dark:placeholder-slate-500 font-medium" />
        </div>
        <button id="btn-confirm-start-chat" type="submit" :disabled="isSubmitting"
          class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-98">
          <Send class="w-3.5 h-3.5 animate-pulse" />
          {{ isSubmitting ? t('chat.sending') : t('chat.openChannel') }}
        </button>
      </form>
    </div>

    <!-- Right Column: Chat dialog dashboard -->
    <div :class="[
      'bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col justify-between text-left h-full overflow-hidden transition-all',
      selectedRoomId ? 'flex md:col-span-7' : 'hidden md:flex md:col-span-7'
    ]">
      <template v-if="selectedRoomId && activeRoom">
        <!-- Active chat header -->
        <div class="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <button id="btn-chat-mobile-back" type="button" @click="emit('select-room', null)"
              class="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 shrink-0 cursor-pointer">
              <ChevronLeft class="w-4 h-4" />
              <span class="text-xs font-bold">{{ t('chat.back') }}</span>
            </button>
            <div>
              <span
                class="text-[9px] text-blue-600 dark:text-blue-300 font-extrabold uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">{{
                  activeRoom.courseTitle }}</span>
              <h4 class="font-black text-sm text-gray-950 dark:text-white mt-1.5">{{ activeRoom.topic }}</h4>
              <div class="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-400 font-medium mt-0.5">
                <User class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span v-if="!isInstructor">{{ t('chat.professorLabel') }}{{ getProfessorNameForRoom(activeRoom)
                  }}</span>
                <span v-else>{{ t('chat.studentLabel') }}{{ activeRoom.studentName }}</span>
              </div>
            </div>
          </div>

          <button v-if="activeRoom.status === 'open' && (isInstructor || activeRoom.studentId === currentUserId)"
            id="btn-resolve-chat" @click="emit('resolve-room', activeRoom.id)"
            class="flex items-center gap-1 px-3 py-2 border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-[10px] font-black uppercase tracking-wider rounded-xl transition shadow-3xs cursor-pointer select-none">
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {{ t('chat.resolveBtn') }}
          </button>
        </div>

        <!-- Simulated Chat Bridge Info Banner -->
        <div v-if="currentUserId === 'demo-student-uid'"
          class="bg-blue-50/75 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl p-2.5 mt-2 text-[11px] text-blue-800 dark:text-blue-300 font-semibold flex items-start gap-1.5 shrink-0">
          <Smile class="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
          <span>
            <strong>{{ t('chat.connectionAlert') }}</strong>
            {{ t('chat.connectionAlertDesc') }}
          </span>
        </div>

        <!-- Dynamic Message History with Lazy Load Trigger -->
        <div ref="messagesContainerRef" class="flex-grow overflow-y-auto py-4 space-y-4 px-1 relative">

          <!-- History / Lazy loading action trigger indicator -->
          <div v-if="activeMessages.length >= messagesLimit"
            class="flex justify-center pb-2 border-b border-dashed border-slate-100 dark:border-slate-800 mb-2">
            <button type="button" @click="emit('load-more-messages')"
              class="text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40 dark:hover:bg-blue-900/30 border border-blue-200/40 py-1.5 px-3 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-4xs select-none">
              <History class="w-3.5 h-3.5" />
              {{ t('chat.loadPrevious') }}
            </button>
          </div>

          <div v-if="activeMessages.length === 0"
            class="text-center py-16 text-gray-400 dark:text-slate-500 text-xs italic font-medium">
            {{ t('chat.emptyChannel') }}
          </div>

          <div v-else v-for="msg in activeMessages" :key="msg.id"
            :class="['flex flex-col', msg.senderId === currentUserId ? 'items-end' : 'items-start']">
            <div :class="[
              'max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-4xs',
              msg.senderId === currentUserId
                ? 'bg-blue-600 border border-blue-500 text-white rounded-tr-none'
                : 'bg-slate-100 border border-slate-200/55 text-slate-800 dark:bg-slate-800 dark:border-slate-705 dark:text-slate-100 rounded-bl-none'
            ]">
              <span v-if="msg.senderId !== currentUserId" class="text-[10px] font-black tracking-tight block mb-1"
                :style="{ color: isDarkMode ? '#38bdf8' : 'var(--primary-color, #1d4ed8)' }">
                {{ msg.senderName }}
              </span>
              <p class="leading-relaxed whitespace-pre-wrap select-text selection:bg-blue-200">{{ msg.text }}</p>
            </div>
            <span class="text-[8px] text-slate-400 dark:text-slate-500 mt-1 mx-1.5 font-mono font-bold">{{
              formatMessageTime(msg.createdAt) }}</span>
          </div>
        </div>

        <!-- Send messaging panel with Portuguese Emoji Picker and Image Security warning -->
        <div class="relative shrink-0">

          <!-- Advanced Portuguese Emoji Picker Popover Modal -->
          <div v-if="showEmojiPicker"
            class="absolute bottom-14 right-0 left-0 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl rounded-2xl p-4 z-50 animate-fadeIn flex flex-col">
            <div
              class="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 mb-2 shrink-0">
              <span
                class="text-[10px] font-black text-slate-700 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1">
                <Smile class="w-4 h-4 text-amber-500" />
                {{ t('chat.emojiSelector') }}
              </span>
              <button type="button" @click="showEmojiPicker = false"
                class="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-300 text-xs font-extrabold cursor-pointer select-none">
                {{ t('chat.emojiClose') }}
              </button>
            </div>
            <div class="w-full h-[320px] select-none">
              <EmojiPicker :native="true" :theme="isDarkMode ? 'dark' : 'light'"
                :picker-locale="locale === 'pt' ? ptLocale : enLocale" @select="onSelectEmoji"
                class="!w-full !h-full !border-0 !shadow-none !bg-transparent text-slate-800 dark:text-slate-100" />
            </div>
          </div>

          <!-- Academic safety notice (Image sharing is blocked) -->
          <p
            class="text-[9px] text-gray-400 dark:text-slate-500 font-extrabold mb-1.5 py-0.5 tracking-wide uppercase select-none border-t border-slate-100 dark:border-slate-800 pt-2 shrink-0">
            {{ t('chat.securityTip') }}
          </p>

          <form v-if="activeRoom.status === 'open'" id="form-chat-send-message" @submit.prevent="handleSend"
            class="flex gap-2 items-center">
            <!-- Toggle Emoji Picker Button -->
            <button id="btn-toggle-emoji-picker" type="button" @click="showEmojiPicker = !showEmojiPicker"
              class="p-2.5 border border-gray-250 border-gray-200 hover:border-gray-300 dark:border-slate-705 text-gray-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl transition hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer shrink-0"
              :title="t('chat.insertEmoji')">
              <Smile class="w-4.5 h-4.5" />
            </button>

            <input id="input-chat-message-text" type="text" :placeholder="t('chat.typeMessagePlaceholder')"
              v-model="messageInput" autocomplete="off"
              class="flex-1 text-xs sm:text-xs bg-slate-50 hover:bg-slate-100/30 dark:bg-slate-850 dark:hover:bg-slate-800 dark:focus:bg-slate-900 focus:bg-white border border-gray-200 dark:border-slate-755 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-slate-500 rounded-xl py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />

            <button id="btn-chat-send-message" type="submit"
              class="px-5 py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0 cursor-pointer active:scale-95">
              <Send class="w-4 h-4" />
            </button>
          </form>

          <div v-else
            class="bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/40 rounded-xl p-3 text-center text-xs text-emerald-800 dark:text-emerald-300 font-bold shrink-0 shadow-3xs animate-fadeIn">
            {{ t('chat.archivedChannel') }}
          </div>
        </div>
      </template>

      <!-- Empty state dashboard template -->
      <div v-else class="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400">
        <MessageSquare id="empty-chats-illust" class="w-12 h-12 mb-3 text-blue-500 opacity-60 animate-bounce" />
        <h4 class="font-black text-gray-800 dark:text-slate-200 text-sm mb-1">
          {{ t('chat.supportHeader') }}
        </h4>
        <p class="text-xs max-w-sm text-gray-500 dark:text-slate-400 font-semibold leading-relaxed">
          {{ t('chat.emptyStateDesc') }}
        </p>
      </div>
    </div>

  </div>
</template>
