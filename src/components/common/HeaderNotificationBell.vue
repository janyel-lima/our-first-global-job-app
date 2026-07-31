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
        class="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
      >
        <!-- Header -->
        <div class="p-3.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <BellRing class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-xs font-black text-slate-900 dark:text-white leading-none">
                {{ t('reminders.title') }}
              </h3>
              <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Central de notificações e comunicados
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <!-- Sound Chime Toggle -->
            <button
              type="button"
              @click="toggleAudio"
              class="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
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
              class="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline px-1.5 py-1 cursor-pointer"
            >
              {{ t('reminders.markRead') }}
            </button>
          </div>
        </div>

        <!-- Web Notification Banner Prompt if not granted -->
        <div
          v-if="webNotificationPermission === 'default'"
          class="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-2"
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
        <div class="max-h-80 overflow-y-auto custom-scrollbar p-2.5 space-y-3">
          <!-- Reminder Alerts List -->
          <div v-if="notifications.length > 0" class="space-y-2">
            <div
              v-for="item in notifications"
              :key="item.id"
              @click="handleAlertClick(item)"
              :class="[
                'p-3 rounded-2xl border transition-all cursor-pointer relative hover:scale-[1.01]',
                item.read 
                  ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/70 text-slate-600 dark:text-slate-400'
                  : 'bg-indigo-50/90 dark:bg-slate-900 border-indigo-300 dark:border-indigo-800 text-slate-900 dark:text-slate-100 shadow-xs'
              ]"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-1.5 font-black text-xs flex-wrap">
                  <!-- Type Badge Tags -->
                  <span
                    v-if="item.type === '15m'"
                    class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/90 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                    15 min
                  </span>
                  <span
                    v-else-if="item.type === '60m'"
                    class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    1 hora
                  </span>
                  <span
                    v-else-if="item.type === 'announcement_important'"
                    class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 flex items-center gap-1"
                  >
                    🚨 {{ item.tag || 'Aviso' }}
                  </span>
                  <span
                    v-else-if="item.type === 'announcement_class'"
                    class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/90 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800 flex items-center gap-1"
                  >
                    🎓 {{ item.tag || 'Nova Turma' }}
                  </span>
                  <span
                    v-else-if="item.type === 'announcement_event'"
                    class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/90 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-800 flex items-center gap-1"
                  >
                    📅 {{ item.tag || 'Evento' }}
                  </span>
                  <span
                    v-else-if="item.type === 'announcement_tip'"
                    class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1"
                  >
                    💡 {{ item.tag || 'Dica' }}
                  </span>
                  <span
                    v-else-if="item.type === 'announcement_general' || item.category === 'announcement'"
                    class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center gap-1"
                  >
                    📢 {{ item.tag || 'Comunicado' }}
                  </span>
                  <span
                    v-else-if="item.type === 'chat_message' || item.category === 'chat'"
                    class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-950/90 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 flex items-center gap-1"
                  >
                    💬 Chat
                  </span>

                  <span class="text-slate-900 dark:text-slate-100 font-extrabold truncate max-w-[180px] sm:max-w-[220px]">
                    {{ item.title }}
                  </span>
                </div>
                <span class="text-[9px] font-mono font-semibold text-slate-400 dark:text-slate-500 shrink-0">{{ item.timestamp }}</span>
              </div>
              <p class="text-[11px] font-medium mt-1.5 text-slate-700 dark:text-slate-300 leading-snug">
                {{ item.message }}
              </p>
              <div class="mt-2.5 flex items-center justify-between text-[10px]">
                <span v-if="item.category === 'chat' || item.type === 'chat_message'" class="font-extrabold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1">
                  <MessageSquare class="w-3 h-3" />
                  Responder / Abrir Chat
                </span>
                <span v-else-if="item.category === 'announcement' || item.type.startsWith('announcement_')" class="font-extrabold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1">
                  <Megaphone class="w-3 h-3" />
                  Ver Comunicado
                </span>
                <span v-else class="font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
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
            class="text-center py-5 px-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs space-y-1"
          >
            <CheckCircle2 class="w-7 h-7 mx-auto text-emerald-500/80 stroke-2" />
            <p class="font-black text-slate-800 dark:text-slate-200">{{ t('reminders.noAlertsTitle') }}</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Você está em dia com todas as notificações e avisos.</p>
          </div>

          <!-- Upcoming Enrolled Summary Section -->
          <div class="pt-2.5 border-t border-slate-200 dark:border-slate-800">
            <div class="px-1 pb-2 flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                <CalendarDays class="w-3 h-3 text-indigo-500" />
                {{ t('reminders.nextEnrolledTitle') }}
              </span>
              <span class="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {{ upcomingEnrolledClasses.length }}
              </span>
            </div>

            <div v-if="upcomingEnrolledClasses.length === 0" class="px-2 py-2 text-[11px] text-slate-400 dark:text-slate-500 italic">
              {{ t('reminders.noUpcomingEnrolled') }}
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="cl in upcomingEnrolledClasses.slice(0, 4)"
                :key="cl.id"
                @click="onSelectClass(cl.id)"
                class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
              >
                <div class="min-w-0 pr-2 space-y-1">
                  <p class="text-xs font-black text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {{ cl.courseTitle }}
                  </p>
                  <div class="flex items-center gap-1.5 text-[10px] flex-wrap">
                    <span class="px-2 py-0.5 rounded-md bg-blue-100/80 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 font-bold">
                      📅 {{ formatDisplayDate(cl.scheduledAt) }}
                    </span>
                    <span class="px-2 py-0.5 rounded-md bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 font-bold">
                      🕒 {{ formatDisplayTime(cl.scheduledAt) }}
                    </span>
                  </div>
                </div>
                <ChevronRight class="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div v-if="notifications.length > 0" class="p-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center">
          <button
            type="button"
            @click="clearAllNotifications"
            class="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
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

