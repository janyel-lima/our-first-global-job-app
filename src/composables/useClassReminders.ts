import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ClassTurma, Announcement, ChatRoom } from '../types';
import { formatDisplayDate, formatDisplayTime } from '../utils/helpers';

export interface ClassReminderAlert {
  id: string;
  category?: 'class' | 'announcement' | 'chat';
  classId?: string;
  courseTitle?: string;
  eventType?: string;
  scheduledAt?: string;
  roomId?: string;
  announcementId?: string;
  type: '60m' | '15m' | 'now' | 'announcement_important' | 'announcement_class' | 'announcement_event' | 'announcement_tip' | 'announcement_general' | 'chat_message';
  tag?: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export function useClassReminders(
  classesRef: { value: ClassTurma[] },
  currentUserIdRef: { value: string | undefined },
  announcementsRef?: { value: Announcement[] },
  chatRoomsRef?: { value: ChatRoom[] },
  activeTabRef?: { value: string },
  selectedRoomIdRef?: { value: string | null }
) {
  const notifications = ref<ClassReminderAlert[]>([]);
  const isAudioEnabled = ref(localStorage.getItem('reminder_audio_enabled') !== 'false');
  const webNotificationPermission = ref<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );

  // Track triggered reminders & notifications to prevent duplicates (e.g. "classId_60m", "announcement_id", "chat_msg_id_timestamp")
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
      // Keep up to 40 latest notifications
      if (notifications.value.length > 40) {
        notifications.value = notifications.value.slice(0, 40);
      }
      localStorage.setItem('class_reminders_list', JSON.stringify(notifications.value));
      localStorage.setItem('class_reminders_triggered', JSON.stringify(Array.from(triggeredSet.value)));
      localStorage.setItem('reminder_audio_enabled', isAudioEnabled.value ? 'true' : 'false');
    } catch (e) {
      console.warn('[Reminders] Failed to save state', e);
    }
  };

  const parseToTimestamp = (val: any): number => {
    if (!val) return 0;
    if (typeof val.toDate === 'function') return val.toDate().getTime();
    if (typeof val.seconds === 'number') return val.seconds * 1000;
    const time = new Date(val).getTime();
    return isNaN(time) ? 0 : time;
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
        new Notification('Our First Global Job', {
          body: '🔔 Notificações ativadas com sucesso! Você receberá avisos e lembretes.',
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
          tag: 'ofgj-notification'
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

  // Check class reminders logic
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
          category: 'class',
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
          category: 'class',
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

  // Check announcements (comunicados da coordenação)
  const checkAnnouncements = () => {
    const userId = currentUserIdRef.value;
    if (!userId || !announcementsRef || !announcementsRef.value) return;

    const list = announcementsRef.value;
    if (!list || list.length === 0) return;

    const isFirstRun = !triggeredSet.value.has('__announcements_initialized__');
    if (isFirstRun) {
      triggeredSet.value.add('__announcements_initialized__');
    }

    list.forEach(item => {
      const key = `announcement_${item.id}`;
      if (triggeredSet.value.has(key)) return;

      triggeredSet.value.add(key);

      let typeVal: ClassReminderAlert['type'] = 'announcement_general';
      let tagEmoji = '📢';

      if (item.tag === 'Aviso Importante') {
        typeVal = 'announcement_important';
        tagEmoji = '🚨';
      } else if (item.tag === 'Nova Turma') {
        typeVal = 'announcement_class';
        tagEmoji = '🎓';
      } else if (item.tag === 'Evento') {
        typeVal = 'announcement_event';
        tagEmoji = '📅';
      } else if (item.tag === 'Dica Semanal') {
        typeVal = 'announcement_tip';
        tagEmoji = '💡';
      }

      // Check if item is recent (created within 48h) or historic
      const itemTime = item.createdAt ? new Date(item.createdAt).getTime() : Date.now();
      const isRecent = (Date.now() - itemTime) < (48 * 3600 * 1000);

      // On first run for an existing account, historic announcements are tracked silently without ringing a bell
      if (!isFirstRun || isRecent) {
        const alertItem: ClassReminderAlert = {
          id: `ann_alert_${item.id}_${Date.now()}`,
          category: 'announcement',
          announcementId: item.id,
          type: typeVal,
          tag: item.tag || 'Geral',
          title: `${tagEmoji} ${item.title}`,
          message: item.content ? (item.content.length > 85 ? item.content.slice(0, 82) + '...' : item.content) : '',
          timestamp: item.createdAt ? formatDisplayDate(item.createdAt) : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          read: isFirstRun && !isRecent
        };

        notifications.value.unshift(alertItem);
        if (!alertItem.read) {
          playChimeSound();
          sendWebNotification(alertItem.title, alertItem.message);
        }
        saveState();
      }
    });
  };

  // Check chat rooms for new messages received from other users
  const checkChatRooms = () => {
    const userId = currentUserIdRef.value;
    if (!userId || !chatRoomsRef || !chatRoomsRef.value) return;

    const rooms = chatRoomsRef.value;
    if (!rooms || rooms.length === 0) return;

    const isFirstRun = !triggeredSet.value.has('__chats_initialized__');
    if (isFirstRun) {
      triggeredSet.value.add('__chats_initialized__');
    }

    rooms.forEach(room => {
      if (room.status !== 'open') return;
      const lastSenderId = (room as any).lastSenderId;
      if (!lastSenderId || lastSenderId === userId) return;

      const updatedAtTime = parseToTimestamp(room.updatedAt) || parseToTimestamp(room.createdAt) || Date.now();
      const key = `chat_msg_${room.id}_${updatedAtTime}`;
      if (triggeredSet.value.has(key)) return;

      triggeredSet.value.add(key);

      const isViewingCurrentRoom = activeTabRef?.value === 'chats' && selectedRoomIdRef?.value === room.id;

      const senderName = userId === room.studentId
        ? (room.instructorName || 'Professor/Tutor')
        : (room.studentName || 'Estudante');

      if (!isFirstRun && !isViewingCurrentRoom) {
        const alertItem: ClassReminderAlert = {
          id: `chat_alert_${room.id}_${updatedAtTime}`,
          category: 'chat',
          roomId: room.id,
          type: 'chat_message',
          tag: senderName,
          title: `💬 Nova mensagem: ${senderName}`,
          message: room.lastMessage || 'Envio de mensagem no chat de dúvidas.',
          timestamp: new Date(updatedAtTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
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

  watch(
    [
      () => classesRef.value,
      () => currentUserIdRef.value,
      () => announcementsRef?.value,
      () => chatRoomsRef?.value
    ],
    () => {
      checkReminders();
      checkAnnouncements();
      checkChatRooms();
    },
    { deep: true, immediate: true }
  );

  onMounted(() => {
    loadState();
    checkReminders();
    checkAnnouncements();
    checkChatRooms();
    timer = setInterval(() => {
      checkReminders();
      checkAnnouncements();
      checkChatRooms();
    }, 15000); // Check every 15s
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

