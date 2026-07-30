import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ClassTurma } from '../types';
import { formatDisplayDate, formatDisplayTime } from '../utils/helpers';

export interface ClassReminderAlert {
  id: string;
  classId: string;
  courseTitle: string;
  eventType?: string;
  scheduledAt: string;
  type: '60m' | '15m' | 'now';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export function useClassReminders(
  classesRef: { value: ClassTurma[] },
  currentUserIdRef: { value: string | undefined }
) {
  const notifications = ref<ClassReminderAlert[]>([]);
  const isAudioEnabled = ref(localStorage.getItem('reminder_audio_enabled') !== 'false');
  const webNotificationPermission = ref<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );

  // Track triggered reminders to prevent duplicate alerts (e.g. "classId_60m", "classId_15m")
  const triggeredSet = ref<Set<string>>(new Set());

  // Load persisted notifications and triggered set from localStorage
  const loadState = () => {
    if (typeof window === 'undefined') return;
    try {
      const savedNotifs = localStorage.getItem('class_reminders_list');
      if (savedNotifs) {
        notifications.value = JSON.parse(savedNotifs);
      }
      const savedTriggered = localStorage.getItem('class_reminders_triggered');
      if (savedTriggered) {
        triggeredSet.value = new Set(JSON.parse(savedTriggered));
      }
    } catch (e) {
      console.warn('[Reminders] Failed to load cached state', e);
    }
  };

  const saveState = () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('class_reminders_list', JSON.stringify(notifications.value));
      localStorage.setItem('class_reminders_triggered', JSON.stringify(Array.from(triggeredSet.value)));
      localStorage.setItem('reminder_audio_enabled', isAudioEnabled.value ? 'true' : 'false');
    } catch (e) {
      console.warn('[Reminders] Failed to save state', e);
    }
  };

  // Synthesize a pleasant 2-tone melodic chime using Web Audio API
  const playChimeSound = () => {
    if (!isAudioEnabled.value) return;
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      
      // Tone 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Tone 2: A5 (880 Hz) - slightly delayed
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0.2, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.65);
    } catch (err) {
      console.warn('[Reminders] Audio chime playback skipped:', err);
    }
  };

  // Request browser Notification permission
  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Seu navegador não suporta notificações de sistema.');
      return;
    }
    try {
      const res = await Notification.requestPermission();
      webNotificationPermission.value = res;
      if (res === 'granted') {
        new Notification('English Volunteer Platform', {
          body: '🔔 Notificações ativadas com sucesso! Você receberá lembretes de aulas.',
          icon: '/favicon.ico'
        });
      }
    } catch (e) {
      console.warn('[Reminders] Error requesting notification permission:', e);
    }
  };

  // Trigger web notification
  const sendWebNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'class-reminder'
        });
      } catch (err) {
        console.warn('[Reminders] System notification failed:', err);
      }
    }
  };

  // Upcoming enrolled classes sorted by time
  const upcomingEnrolledClasses = computed(() => {
    const userId = currentUserIdRef.value;
    if (!userId || !classesRef.value) return [];

    return classesRef.value
      .filter(cl => {
        if (cl.status !== 'scheduled') return false;
        const isStudent = cl.studentIds && cl.studentIds.includes(userId);
        const isInstructor = cl.instructorId === userId;
        return isStudent || isInstructor;
      })
      .map(cl => {
        const parts = cl.scheduledAt.split(' ');
        let timestamp = 0;
        if (parts.length === 2) {
          timestamp = new Date(`${parts[0]}T${parts[1]}:00`).getTime();
        }
        return {
          ...cl,
          parsedTimestamp: timestamp
        };
      })
      .filter(cl => cl.parsedTimestamp > Date.now() - 30 * 60 * 1000) // Keep current/upcoming within 30 min past
      .sort((a, b) => a.parsedTimestamp - b.parsedTimestamp);
  });

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);

  // Check reminders logic
  const checkReminders = () => {
    const userId = currentUserIdRef.value;
    if (!userId) return;

    const now = Date.now();

    upcomingEnrolledClasses.value.forEach(cl => {
      if (!cl.parsedTimestamp) return;

      const diffMs = cl.parsedTimestamp - now;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      const timeStr = formatDisplayTime(cl.scheduledAt);
      const dateStr = formatDisplayDate(cl.scheduledAt);

      // Milestone 1: 1 hour reminder (50 to 65 min before)
      const key60m = `${cl.id}_60m`;
      if (diffMinutes >= 50 && diffMinutes <= 65 && !triggeredSet.value.has(key60m)) {
        triggeredSet.value.add(key60m);

        const alertItem: ClassReminderAlert = {
          id: `alert_${Date.now()}_60m`,
          classId: cl.id,
          courseTitle: cl.courseTitle,
          eventType: cl.eventType,
          scheduledAt: cl.scheduledAt,
          type: '60m',
          title: '⏰ Aula em 1 hora!',
          message: `Sua aula "${cl.courseTitle}" começará às ${timeStr} (${dateStr}).`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          read: false
        };

        notifications.value.unshift(alertItem);
        playChimeSound();
        sendWebNotification(alertItem.title, alertItem.message);
        saveState();
      }

      // Milestone 2: 15 min reminder (3 to 18 min before)
      const key15m = `${cl.id}_15m`;
      if (diffMinutes >= 3 && diffMinutes <= 18 && !triggeredSet.value.has(key15m)) {
        triggeredSet.value.add(key15m);

        const alertItem: ClassReminderAlert = {
          id: `alert_${Date.now()}_15m`,
          classId: cl.id,
          courseTitle: cl.courseTitle,
          eventType: cl.eventType,
          scheduledAt: cl.scheduledAt,
          type: '15m',
          title: '🚨 Aula em 15 minutos!',
          message: `Prepare-se! "${cl.courseTitle}" começará às ${timeStr}. Clique para ver o link da chamada.`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          read: false
        };

        notifications.value.unshift(alertItem);
        playChimeSound();
        sendWebNotification(alertItem.title, alertItem.message);
        saveState();
      }
    });
  };

  const markAllAsRead = () => {
    notifications.value = notifications.value.map(n => ({ ...n, read: true }));
    saveState();
  };

  const markAsRead = (id: string) => {
    notifications.value = notifications.value.map(n => n.id === id ? { ...n, read: true } : n);
    saveState();
  };

  const clearAllNotifications = () => {
    notifications.value = [];
    saveState();
  };

  const toggleAudio = () => {
    isAudioEnabled.value = !isAudioEnabled.value;
    saveState();
  };

  let timer: any = null;

  onMounted(() => {
    loadState();
    checkReminders();
    timer = setInterval(checkReminders, 20000); // Check every 20s
  });

  onUnmounted(() => {
    if (timer) clearInterval(timer);
  });

  return {
    notifications,
    unreadCount,
    upcomingEnrolledClasses,
    isAudioEnabled,
    webNotificationPermission,
    requestNotificationPermission,
    markAllAsRead,
    markAsRead,
    clearAllNotifications,
    toggleAudio,
    playChimeSound
  };
}
