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
      <span
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900 animate-pulse"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
      <span
        v-else-if="upcomingEnrolledClasses.length > 0"
        class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
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
                {{ t('reminders.subtitle') }}
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
              class="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline px-1.5 py-1"
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
        <div class="max-h-80 overflow-y-auto custom-scrollbar p-2 space-y-2">
          <!-- Reminder Alerts List -->
          <div v-if="notifications.length > 0" class="space-y-1.5">
            <div
              v-for="item in notifications"
              :key="item.id"
              @click="handleAlertClick(item)"
              :class="[
                'p-3 rounded-xl border transition-all cursor-pointer relative',
                item.read 
                  ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 text-slate-600 dark:text-slate-400'
                  : 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/80 text-slate-900 dark:text-white shadow-2xs'
              ]"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-1.5 font-black text-xs">
                  <span v-if="item.type === '15m'" class="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  <span v-else class="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>{{ item.title }}</span>
                </div>
                <span class="text-[9px] font-mono text-slate-400">{{ item.timestamp }}</span>
              </div>
              <p class="text-[11px] font-medium mt-1 leading-snug">
                {{ item.message }}
              </p>
              <div class="mt-2 flex items-center justify-between text-[10px]">
                <span class="font-extrabold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                  <CalendarDays class="w-3 h-3" />
                  {{ t('reminders.viewClass') }}
                </span>
                <span v-if="!item.read" class="text-rose-500 font-bold">{{ t('reminders.newBadge') }}</span>
              </div>
            </div>
          </div>

          <!-- Empty State when no alerts -->
          <div
            v-if="notifications.length === 0"
            class="text-center py-6 text-slate-400 dark:text-slate-500 text-xs space-y-1"
          >
            <CheckCircle2 class="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 stroke-1" />
            <p class="font-bold text-slate-700 dark:text-slate-300">{{ t('reminders.noAlertsTitle') }}</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">{{ t('reminders.noAlertsSub') }}</p>
          </div>

          <!-- Upcoming Enrolled Summary Section -->
          <div class="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div class="px-2 pb-1.5 flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                {{ t('reminders.nextEnrolledTitle') }}
              </span>
              <span class="text-[10px] font-bold text-slate-500">
                ({{ upcomingEnrolledClasses.length }})
              </span>
            </div>

            <div v-if="upcomingEnrolledClasses.length === 0" class="px-2 py-2 text-[11px] text-slate-400 italic">
              {{ t('reminders.noUpcomingEnrolled') }}
            </div>

            <div v-else class="space-y-1">
              <div
                v-for="cl in upcomingEnrolledClasses.slice(0, 3)"
                :key="cl.id"
                @click="onSelectClass(cl.id)"
                class="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 hover:border-blue-400/50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div class="min-w-0 pr-2">
                  <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {{ cl.courseTitle }}
                  </p>
                  <p class="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>📅 {{ formatDisplayDate(cl.scheduledAt) }}</span>
                    <span>🕒 {{ formatDisplayTime(cl.scheduledAt) }}</span>
                  </p>
                </div>
                <ChevronRight class="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div v-if="notifications.length > 0" class="p-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center">
          <button
            type="button"
            @click="clearAllNotifications"
            class="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-rose-500 transition-colors"
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
import { Bell, BellRing, Volume2, VolumeX, Info, CheckCircle2, CalendarDays, ChevronRight } from 'lucide-vue-next';
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
}>();

const { t } = useI18n();
const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const handleAlertClick = (item: ClassReminderAlert) => {
  props.markAsRead(item.id);
  emit('select-class', item.classId);
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
