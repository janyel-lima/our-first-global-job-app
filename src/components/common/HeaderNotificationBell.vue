<template>
  <div class="relative inline-block text-left" ref="containerRef">
    <!-- Bell Button -->
    <button
      type="button"
      @click="toggleDropdown"
      class="relative p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer focus:outline-hidden"
      :title="t('reminders.bellTitle')"
    >
      <Bell class="w-5 h-5" />
      <!-- Real notification count badge -->
      <span
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900 animate-pulse"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
      <!-- Scheduled classes dot badge (ponto sem número) when 0 unread alerts -->
      <span
        v-else-if="upcomingEnrolledClasses.length > 0"
        class="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
        title="Possui aulas agendadas"
      ></span>
    </button>

    <!-- Dropdown Menu -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
      >
        <!-- Header -->
        <div class="p-3.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="p-2 rounded-xl bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/60 shadow-xs">
              <BellRing class="w-4 h-4 stroke-[2.3] text-emerald-600 dark:text-emerald-300" />
            </div>
            <div>
              <h3 class="text-xs font-black text-slate-900 dark:text-slate-100 leading-none">
                {{ t('reminders.title') }}
              </h3>
              <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Central de notificações e comunicados
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <!-- Sound Chime Toggle -->
            <button
              type="button"
              @click="toggleAudio"
              class="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              :title="isAudioEnabled ? t('reminders.muteAudio') : t('reminders.enableAudio')"
            >
              <Volume2 v-if="isAudioEnabled" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <VolumeX v-else class="w-4 h-4 text-slate-400" />
            </button>

            <!-- Mark Read Button -->
            <button
              v-if="unreadCount > 0"
              type="button"
              @click="markAllAsRead"
              class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:underline px-1.5 py-1 cursor-pointer"
            >
              {{ t('reminders.markRead') }}
            </button>
          </div>
        </div>

        <!-- Web Notification Banner Prompt if not granted -->
        <div
          v-if="webNotificationPermission === 'default'"
          class="p-3 bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2"
        >
          <div class="flex items-center gap-2 text-amber-900 dark:text-amber-200 text-[11px] font-medium leading-tight">
            <Info class="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{{ t('reminders.systemPrompt') }}</span>
          </div>
          <button
            type="button"
            @click="requestNotificationPermission"
            class="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-extrabold rounded-lg shrink-0 cursor-pointer shadow-2xs"
          >
            {{ t('reminders.enable') }}
          </button>
        </div>

        <!-- Body Scroll Content -->
        <div class="max-h-80 overflow-y-auto custom-scrollbar p-2.5 space-y-3 bg-white dark:bg-slate-950">
          <!-- Reminder Alerts List -->
          <div v-if="notifications.length > 0" class="space-y-2">
            <div
              v-for="item in notifications"
              :key="item.id"
              @click="handleAlertClick(item)"
              :class="[
                'p-3 rounded-2xl transition-all cursor-pointer relative hover:scale-[1.01]',
                getNotificationCardClass(item)
              ]"
            >
              <!-- Card Header Bar -->
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <!-- Type Badge Tag -->
                  <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 border shadow-2xs', getNotificationTagBadgeClass(item)]">
                    <span v-if="item.type === '15m'" class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    <span v-else-if="item.type === '60m'" class="w-1.5 h-1.5 rounded-full bg-white"></span>
                    <span>{{ getNotificationTagLabel(item) }}</span>
                  </span>
                </div>
                <span class="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 shrink-0">{{ item.timestamp }}</span>
              </div>

              <!-- Title & Content Message -->
              <p class="text-xs font-black text-slate-900 dark:text-slate-100 leading-snug mt-2">
                {{ cleanMarkdownPreview(item.title) }}
              </p>
              <p v-if="item.message" class="text-[11.5px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed mt-1 line-clamp-2">
                {{ cleanMarkdownPreview(item.message) }}
              </p>

              <!-- Footer Actions -->
              <div class="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                <span
                  v-if="item.category === 'chat' || item.type === 'chat_message'"
                  :class="['font-black inline-flex items-center gap-1', getNotificationActionClass(item)]"
                >
                  <MessageSquare class="w-3 h-3" />
                  Responder / Abrir Chat
                </span>
                <span
                  v-else-if="item.category === 'announcement' || item.type.startsWith('announcement_')"
                  :class="['font-black inline-flex items-center gap-1', getNotificationActionClass(item)]"
                >
                  <Megaphone class="w-3 h-3" />
                  Ver Comunicado
                </span>
                <span
                  v-else
                  :class="['font-black inline-flex items-center gap-1', getNotificationActionClass(item)]"
                >
                  <CalendarDays class="w-3 h-3" />
                  {{ t('reminders.viewClass') }}
                </span>

                <span v-if="!item.read" class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-500 text-white shadow-2xs">
                  {{ t('reminders.newBadge') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Empty State when no alerts -->
          <div
            v-if="notifications.length === 0"
            class="text-center py-5 px-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs space-y-1"
          >
            <CheckCircle2 class="w-7 h-7 mx-auto text-emerald-500 stroke-[2.2]" />
            <p class="font-black text-slate-800 dark:text-slate-100">{{ t('reminders.noAlertsTitle') }}</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Você está em dia com todas as notificações e avisos.</p>
          </div>

          <!-- Upcoming Enrolled Summary Section -->
          <div class="pt-2.5 border-t border-slate-200 dark:border-slate-800">
            <div class="px-1 pb-2 flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider flex items-center gap-1">
                <CalendarDays class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {{ t('reminders.nextEnrolledTitle') }}
              </span>
              <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                {{ upcomingEnrolledClasses.length }}
              </span>
            </div>

            <div v-if="upcomingEnrolledClasses.length === 0" class="px-2 py-2 text-[11px] text-slate-500 dark:text-slate-400 italic">
              {{ t('reminders.noUpcomingEnrolled') }}
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="cl in upcomingEnrolledClasses.slice(0, 4)"
                :key="cl.id"
                @click="onSelectClass(cl.id)"
                class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-400/60 transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
              >
                <div class="min-w-0 pr-2 space-y-1.5">
                  <p class="text-xs font-black text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                    {{ cl.courseTitle }}
                  </p>
                  <div class="flex items-center gap-2 text-[10.5px] flex-wrap">
                    <span class="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600/70 font-black flex items-center gap-1 shadow-2xs">
                      <span class="text-xs">📅</span> {{ formatDisplayDate(cl.scheduledAt) }}
                    </span>
                    <span class="px-2.5 py-1 rounded-lg bg-emerald-900 dark:bg-emerald-950 text-emerald-100 dark:text-emerald-300 border border-emerald-700 dark:border-emerald-600/70 font-black flex items-center gap-1 shadow-2xs">
                      <span class="text-xs">🕒</span> {{ formatDisplayTime(cl.scheduledAt) }}
                    </span>
                  </div>
                </div>
                <ChevronRight class="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 shrink-0 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center">
          <button
            type="button"
            @click="clearAllNotifications"
            class="text-[11px] font-black text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
          >
            {{ t('reminders.clearHistory') }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Bell, BellRing, Volume2, VolumeX, Info, CheckCircle2, CalendarDays, ChevronRight, Megaphone, MessageSquare } from 'lucide-vue-next';
import { useI18n } from '../../composables/useI18n';
import { formatDisplayDate, formatDisplayTime } from '../../utils/helpers';
import { ClassReminderAlert } from '../../composables/useClassReminders';

const props = defineProps<{
  notifications: ClassReminderAlert[];
  unreadCount: number;
  upcomingEnrolledClasses: any[];
  isAudioEnabled: boolean;
  webNotificationPermission: NotificationPermission;
  requestNotificationPermission: () => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  toggleAudio: () => void;
}>();

const emit = defineEmits<{
  (e: 'select-class', classId: string): void;
  (e: 'select-chat-room', roomId: string): void;
  (e: 'select-announcement', announcementId: string): void;
}>();

const { t } = useI18n();
const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

const cleanMarkdownPreview = (text: string) => {
  if (!text) return '';
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .trim();
};

const getNotificationCardClass = (item: ClassReminderAlert) => {
  const isAnnouncement = item.category === 'announcement' || item.type.startsWith('announcement_');

  if (isAnnouncement) {
    if (item.type === 'announcement_important' || item.tag === 'Aviso Importante') {
      return item.read
        ? 'bg-rose-50/40 dark:bg-slate-900 border border-rose-200/60 dark:border-rose-900/50 text-slate-800 dark:text-slate-200'
        : 'bg-rose-50 dark:bg-slate-900 border-2 border-rose-300 dark:border-rose-800/90 text-slate-900 dark:text-slate-100 shadow-2xs';
    }
    if (item.type === 'announcement_class' || item.tag === 'Nova Turma') {
      return item.read
        ? 'bg-blue-50/40 dark:bg-slate-900 border border-blue-200/60 dark:border-blue-900/50 text-slate-800 dark:text-slate-200'
        : 'bg-blue-50 dark:bg-slate-900 border-2 border-blue-300 dark:border-blue-800/90 text-slate-900 dark:text-slate-100 shadow-2xs';
    }
    if (item.type === 'announcement_event' || item.tag === 'Evento') {
      return item.read
        ? 'bg-purple-50/40 dark:bg-slate-900 border border-purple-200/60 dark:border-purple-900/50 text-slate-800 dark:text-slate-200'
        : 'bg-purple-50 dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-800/90 text-slate-900 dark:text-slate-100 shadow-2xs';
    }
    if (item.type === 'announcement_tip' || item.tag === 'Dica Semanal') {
      return item.read
        ? 'bg-emerald-50/40 dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-900/50 text-slate-800 dark:text-slate-200'
        : 'bg-emerald-50 dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-800/90 text-slate-900 dark:text-slate-100 shadow-2xs';
    }
    return item.read
      ? 'bg-indigo-50/40 dark:bg-slate-900 border border-indigo-200/60 dark:border-indigo-900/50 text-slate-800 dark:text-slate-200'
      : 'bg-indigo-50 dark:bg-slate-900 border-2 border-indigo-300 dark:border-indigo-800/90 text-slate-900 dark:text-slate-100 shadow-2xs';
  }

  if (item.category === 'chat' || item.type === 'chat_message') {
    return item.read
      ? 'bg-sky-50/40 dark:bg-slate-900 border border-sky-200/60 dark:border-sky-900/50 text-slate-800 dark:text-slate-200'
      : 'bg-sky-50 dark:bg-slate-900 border-2 border-sky-300 dark:border-sky-800/90 text-slate-900 dark:text-slate-100 shadow-2xs';
  }

  if (item.type === '15m') {
    return item.read
      ? 'bg-rose-50/40 dark:bg-slate-900 border border-rose-200/60 dark:border-rose-900/50 text-slate-800 dark:text-slate-200'
      : 'bg-rose-50 dark:bg-slate-900 border-2 border-rose-400 dark:border-rose-800/90 text-slate-900 dark:text-slate-100 shadow-2xs';
  }
  if (item.type === '60m') {
    return item.read
      ? 'bg-amber-50/40 dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/50 text-slate-800 dark:text-slate-200'
      : 'bg-amber-50 dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-800/90 text-slate-900 dark:text-slate-100 shadow-2xs';
  }

  return item.read
    ? 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
    : 'bg-emerald-50 dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-800/90 text-slate-900 dark:text-slate-100 shadow-2xs';
};

const getNotificationTagBadgeClass = (item: ClassReminderAlert) => {
  if (item.type === 'announcement_important' || item.tag === 'Aviso Importante' || item.type === '15m') {
    return 'bg-rose-600 text-white border-rose-700 shadow-2xs';
  }
  if (item.type === 'announcement_class' || item.tag === 'Nova Turma') {
    return 'bg-blue-600 text-white border-blue-700 shadow-2xs';
  }
  if (item.type === 'announcement_event' || item.tag === 'Evento') {
    return 'bg-purple-600 text-white border-purple-700 shadow-2xs';
  }
  if (item.type === 'announcement_tip' || item.tag === 'Dica Semanal') {
    return 'bg-emerald-600 text-white border-emerald-700 shadow-2xs';
  }
  if (item.type === 'announcement_general' || item.category === 'announcement') {
    return 'bg-indigo-600 text-white border-indigo-700 shadow-2xs';
  }
  if (item.type === '60m') {
    return 'bg-amber-600 text-white border-amber-700 shadow-2xs';
  }
  if (item.category === 'chat' || item.type === 'chat_message') {
    return 'bg-sky-600 text-white border-sky-700 shadow-2xs';
  }
  return 'bg-emerald-600 text-white border-emerald-700 shadow-2xs';
};

const getNotificationTagLabel = (item: ClassReminderAlert) => {
  if (item.type === '15m') return '15 min';
  if (item.type === '60m') return '1 hora';
  if (item.type === 'announcement_important' || item.tag === 'Aviso Importante') return `🚨 ${item.tag || 'Aviso Importante'}`;
  if (item.type === 'announcement_class' || item.tag === 'Nova Turma') return `🎓 ${item.tag || 'Nova Turma'}`;
  if (item.type === 'announcement_event' || item.tag === 'Evento') return `📅 ${item.tag || 'Evento'}`;
  if (item.type === 'announcement_tip' || item.tag === 'Dica Semanal') return `💡 ${item.tag || 'Dica Semanal'}`;
  if (item.category === 'announcement' || item.type.startsWith('announcement_')) return `📢 ${item.tag || 'Comunicado'}`;
  if (item.category === 'chat' || item.type === 'chat_message') return '💬 Chat';
  return '🔔 Lembrete';
};

const getNotificationActionClass = (item: ClassReminderAlert) => {
  if (item.type === 'announcement_important' || item.tag === 'Aviso Importante') {
    return 'text-rose-600 dark:text-rose-400 hover:underline';
  }
  if (item.type === 'announcement_class' || item.tag === 'Nova Turma') {
    return 'text-blue-600 dark:text-blue-400 hover:underline';
  }
  if (item.type === 'announcement_event' || item.tag === 'Evento') {
    return 'text-purple-600 dark:text-purple-400 hover:underline';
  }
  if (item.type === 'announcement_tip' || item.tag === 'Dica Semanal') {
    return 'text-emerald-600 dark:text-emerald-400 hover:underline';
  }
  if (item.type === 'announcement_general' || item.category === 'announcement') {
    return 'text-indigo-600 dark:text-indigo-400 hover:underline';
  }
  if (item.category === 'chat' || item.type === 'chat_message') {
    return 'text-sky-600 dark:text-sky-400 hover:underline';
  }
  return 'text-emerald-600 dark:text-emerald-400 hover:underline';
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const handleAlertClick = (item: ClassReminderAlert) => {
  props.markAsRead(item.id);
  if (item.category === 'chat' || item.roomId) {
    if (item.roomId) emit('select-chat-room', item.roomId);
  } else if (item.category === 'announcement' || item.announcementId) {
    emit('select-announcement', item.announcementId || '');
  } else if (item.classId) {
    emit('select-class', item.classId);
  }
  isOpen.value = false;
};

const onSelectClass = (classId: string) => {
  emit('select-class', classId);
  isOpen.value = false;
};

// Close on click outside
const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

