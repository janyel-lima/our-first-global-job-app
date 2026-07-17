<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Users, Calendar, Plus, Trash2, Clock, Check, LogOut, CheckCircle, Edit, ExternalLink, Search, Filter, ChevronLeft, ChevronRight, List, X, Info, CalendarDays } from 'lucide-vue-next';
import { ClassTurma, Course, UserProfile } from '../../types';
import { useI18n } from '../../composables/useI18n';

const { t, locale } = useI18n();


const props = defineProps<{
  classes: ClassTurma[];
  courses: Course[];
  users?: UserProfile[];
  currentUserId: string;
  userDisplayName: string;
  isInstructor: boolean;
  isAdmin: boolean;
  userLevel?: string;
  primaryColor?: string;
}>();

const emit = defineEmits<{
  (e: 'join-class', classId: string): void;
  (e: 'leave-class', classId: string): void;
  (e: 'create-class', newClass: Omit<ClassTurma, 'id' | 'studentIds'>): void;
  (e: 'delete-class', classId: string): void;
  (e: 'update-class', updatedClass: ClassTurma): void;
  (e: 'mark-presence', classId: string): void;
  (e: 'start-chat-room', courseId: string, topic: string, classId?: string): void;
}>();

const showAddForm = ref(false);
const selectedEventType = ref<'aula' | 'encontro' | 'conversacao'>('aula');
const selectedAulaType = ref<'curso' | 'avulsa'>('curso');
const selectedCourseId = ref('');
const customClassTitle = ref('');
const scheduledAt = ref('');
const scheduledHour = ref('19:00');
const maxStudents = ref(10);
const isSubmitting = ref(false);

// Edit states
const editingClassId = ref<string | null>(null);
const isEditingInModal = ref(false);
const editEventType = ref<'aula' | 'encontro' | 'conversacao'>('aula');
const editAulaType = ref<'curso' | 'avulsa'>('curso');
const editCourseId = ref('');
const editCustomClassTitle = ref('');
const editMaxStudents = ref(10);
const editCallUrl = ref('');
const editStatus = ref<'scheduled' | 'completed' | 'cancelled'>('scheduled');
const editScheduledDate = ref('');
const editScheduledTime = ref('');

// Advanced search, level filtering and pagination states
const classSearchQuery = ref('');
const classStatusFilter = ref('All');
const classEventTypeFilter = ref('All');
const classCurrentPage = ref(1);
const classItemsPerPage = ref(6);

const filteredClasses = computed(() => {
  return props.classes.filter(cl => {
    // 1. Level check: Hide classes requiring a level above the student's current profile level (unless admin/instructor)
    if (!props.isInstructor && !props.isAdmin) {
      const associatedCourse = props.courses.find(c => c.id === cl.courseId);
      if (associatedCourse) {
        const levelRank: Record<string, number> = { Beginner: 1, Intermediate: 2, Advanced: 3, All: 4 };
        const uLevel = props.userLevel || "Beginner";
        const userPower = levelRank[uLevel] || 1;
        const coursePower = levelRank[associatedCourse.level] || 1;
        if (coursePower > userPower) {
          return false;
        }
      }
    }

    const queryStr = classSearchQuery.value.toLowerCase().trim();
    const courseTitleMatch = cl.courseTitle && cl.courseTitle.toLowerCase().includes(queryStr);
    const instructorMatch = cl.instructorName && cl.instructorName.toLowerCase().includes(queryStr);
    const matchesQuery = !queryStr || courseTitleMatch || instructorMatch;

    let matchesFilter = true;
    if (classStatusFilter.value === "MyClasses") {
      // Participando ou monitorando
      const isEnrolled = cl.studentIds.includes(props.currentUserId);
      const isInstructorForThis = cl.instructorId === props.currentUserId;
      matchesFilter = isEnrolled || isInstructorForThis;
    } else if (classStatusFilter.value !== "All") {
      matchesFilter = cl.status === classStatusFilter.value;
    }

    let matchesEventType = true;
    if (classEventTypeFilter.value !== "All") {
      const et = cl.eventType || "aula";
      matchesEventType = et === classEventTypeFilter.value;
    }

    return matchesQuery && matchesFilter && matchesEventType;
  });
});

const paginatedClasses = computed(() => {
  const start = (classCurrentPage.value - 1) * classItemsPerPage.value;
  const end = start + classItemsPerPage.value;
  return filteredClasses.value.slice(start, end);
});

const totalClassPages = computed(() => {
  return Math.ceil(filteredClasses.value.length / classItemsPerPage.value) || 1;
});

const allowedCourses = computed(() => {
  if (props.isAdmin) {
    return props.courses;
  }
  return props.courses.filter(c => c.creatorId === props.currentUserId);
});

// Reset page when search, status, or event type filter changes
watch([classSearchQuery, classStatusFilter, classEventTypeFilter], () => {
  classCurrentPage.value = 1;
});

// View modes for scheduled classes: 'list' | 'calendar'
const viewType = ref<'list' | 'calendar'>('list');
const calendarViewMode = ref<'month' | 'week'>('month');

const todayDate = new Date();
const currentYear = ref(todayDate.getFullYear());
const currentMonth = ref(todayDate.getMonth()); // 0-indexed

function formatDateToYMD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseClassDateStr(scheduledAtStr: string) {
  return scheduledAtStr.split(' ')[0];
}

function getSunday(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

const currentWeekStart = ref(getSunday(todayDate));
const selectedClass = ref<ClassTurma | null>(null);
const selectedCalendarDayString = ref<string>(formatDateToYMD(todayDate));

const showDayClassesSelector = ref<ClassTurma[] | null>(null);
const selectedDayForSelector = ref<string>('');

const selectCalendarDay = (dateString: string) => {
  selectedCalendarDayString.value = dateString;
};

const handleCalendarDayClick = (day: any) => {
  selectedCalendarDayString.value = day.dateString;
  if (day.classesOnDay && day.classesOnDay.length > 0) {
    if (day.classesOnDay.length === 1) {
      selectedClass.value = day.classesOnDay[0];
    } else {
      selectedDayForSelector.value = day.dateString;
      showDayClassesSelector.value = day.classesOnDay;
    }
  }
};

const selectedDayClasses = computed(() => {
  return props.classes.filter(cl => parseClassDateStr(cl.scheduledAt) === selectedCalendarDayString.value);
});

const monthNames = computed(() => {
  return locale.value === 'pt'
    ? ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
});

const weekdayNames = computed(() => {
  return locale.value === 'pt'
    ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
});

const formatSelectedDayTitle = computed(() => {
  if (!selectedCalendarDayString.value) return '';
  const parts = selectedCalendarDayString.value.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  const dateObj = new Date(y, m - 1, d);
  const weekday = weekdayNames.value[dateObj.getDay()];
  const monthName = monthNames.value[dateObj.getMonth()];
  return locale.value === 'pt'
    ? `${weekday}, ${d} de ${monthName}`
    : `${weekday}, ${monthName} ${d}`;
});


const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const getClassesForDate = (dateStr: string) => {
  return filteredClasses.value.filter(cl => parseClassDateStr(cl.scheduledAt) === dateStr);
};

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
  // Sync week start to the first day of that new month
  const firstDay = new Date(currentYear.value, currentMonth.value, 1);
  currentWeekStart.value = getSunday(firstDay);
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
  // Sync week start to the first day of that new month
  const firstDay = new Date(currentYear.value, currentMonth.value, 1);
  currentWeekStart.value = getSunday(firstDay);
};

const prevWeek = () => {
  const d = new Date(currentWeekStart.value);
  d.setDate(d.getDate() - 7);
  currentWeekStart.value = d;

  // Sync month and year based on the middle of the week
  const mid = new Date(d);
  mid.setDate(mid.getDate() + 3);
  currentMonth.value = mid.getMonth();
  currentYear.value = mid.getFullYear();
};

const nextWeek = () => {
  const d = new Date(currentWeekStart.value);
  d.setDate(d.getDate() + 7);
  currentWeekStart.value = d;

  // Sync month and year based on the middle of the week
  const mid = new Date(d);
  mid.setDate(mid.getDate() + 3);
  currentMonth.value = mid.getMonth();
  currentYear.value = mid.getFullYear();
};

const resetToToday = () => {
  const today = new Date();
  currentMonth.value = today.getMonth();
  currentYear.value = today.getFullYear();
  currentWeekStart.value = getSunday(today);
};

// Open scheduling form with a preselected date from clicking a calendar day cell
const openAddFormWithDate = (dateStr: string) => {
  if (!props.isInstructor) return;
  scheduledAt.value = dateStr;
  showAddForm.value = true;
  // Scroll to form smoothly
  setTimeout(() => {
    document.getElementById('form-add-class')?.scrollIntoView({ behavior: 'smooth' });
  }, 150);
};

// Compute calendar grid (42 cells)
const daysInMonth = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;

  const firstDayInstance = new Date(year, month, 1);
  const firstDayOfWeek = firstDayInstance.getDay();

  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const days: any[] = [];

  // Previous month padding
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    const prevMonthDate = new Date(year, month - 1, dayNum);
    const dateString = formatDateToYMD(prevMonthDate);
    days.push({
      date: prevMonthDate,
      dateString,
      dayNum,
      isCurrentMonth: false,
      isToday: isSameDay(prevMonthDate, todayDate),
      classesOnDay: getClassesForDate(dateString)
    });
  }

  // Current month
  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const date = new Date(year, month, dayNum);
    const dateString = formatDateToYMD(date);
    days.push({
      date,
      dateString,
      dayNum,
      isCurrentMonth: true,
      isToday: isSameDay(date, todayDate),
      classesOnDay: getClassesForDate(dateString)
    });
  }

  // Next month padding to fill exactly 42 cells
  const totalCellsNeeded = 42;
  const remainingCells = totalCellsNeeded - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthDate = new Date(year, month + 1, i);
    const dateString = formatDateToYMD(nextMonthDate);
    days.push({
      date: nextMonthDate,
      dateString,
      dayNum: i,
      isCurrentMonth: false,
      isToday: isSameDay(nextMonthDate, todayDate),
      classesOnDay: getClassesForDate(dateString)
    });
  }

  return days;
});

// Compute weekly view days (7 cells)
const daysInWeek = computed(() => {
  const days: any[] = [];
  const start = new Date(currentWeekStart.value);
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const dateString = formatDateToYMD(dayDate);
    days.push({
      date: dayDate,
      dateString,
      dayNum: dayDate.getDate(),
      isToday: isSameDay(dayDate, todayDate),
      classesOnDay: getClassesForDate(dateString)
    });
  }
  return days;
});

const activeSelectedClass = computed(() => {
  if (!selectedClass.value) return null;
  return props.classes.find(cl => cl.id === selectedClass.value!.id) || selectedClass.value;
});

watch(selectedClass, (val) => {
  if (!val) {
    isEditingInModal.value = false;
  }
});

const studentPage = ref(1);
const studentPageSize = ref(3);

watch(() => activeSelectedClass.value?.id, () => {
  studentPage.value = 1;
});

const enrolledStudentsOfClass = computed(() => {
  if (!activeSelectedClass.value) return [];
  const sIds = activeSelectedClass.value.studentIds || [];
  const allU = props.users || [];
  return sIds.map(uid => {
    const u = allU.find(user => user.uid === uid);
    return u || {
      uid,
      displayName: "Estudante",
      email: "estudante@email.com",
      level: "Beginner" as const,
      isInstructor: false
    };
  });
});

const paginatedStudents = computed(() => {
  const start = (studentPage.value - 1) * studentPageSize.value;
  const end = start + studentPageSize.value;
  return enrolledStudentsOfClass.value.slice(start, end);
});

const totalStudentPages = computed(() => {
  return Math.ceil(enrolledStudentsOfClass.value.length / studentPageSize.value) || 1;
});

const handleStartDoubtChat = (student: any) => {
  if (!activeSelectedClass.value) return;
  const courseId = activeSelectedClass.value.courseId || 'custom-class';
  const topic = `Dúvida One on One: ${activeSelectedClass.value.courseTitle}`;
  emit('start-chat-room', courseId, topic, activeSelectedClass.value.id);
};

const handleCreate = async () => {
  if (!scheduledAt.value || !scheduledHour.value) return;

  let courseId = '';
  let courseTitle = '';

  if (selectedEventType.value === 'aula') {
    if (selectedAulaType.value === 'avulsa') {
      if (!customClassTitle.value.trim()) return;
      courseId = 'custom-class';
      courseTitle = customClassTitle.value.trim();
    } else {
      if (!selectedCourseId.value) return;
      const chosenCourse = props.courses.find(c => c.id === selectedCourseId.value);
      if (!chosenCourse) return;
      courseId = chosenCourse.id;
      courseTitle = chosenCourse.title;
    }
  } else if (selectedEventType.value === 'encontro') {
    courseId = 'one-on-one';
    courseTitle = customClassTitle.value.trim() || `${locale.value === 'pt' ? 'Encontro One-on-one' : 'One-on-one Meeting'} (${props.userDisplayName})`;
  } else if (selectedEventType.value === 'conversacao') {
    courseId = 'conversacao';
    courseTitle = customClassTitle.value.trim() || `${locale.value === 'pt' ? 'Grupo de Conversação' : 'Conversation Group'}`;
  }

  isSubmitting.value = true;
  try {
    const fullDateTime = `${scheduledAt.value} ${scheduledHour.value}`;
    emit('create-class', {
      courseId,
      courseTitle,
      instructorId: props.currentUserId,
      instructorName: props.userDisplayName,
      scheduledAt: fullDateTime,
      maxStudents: selectedEventType.value === 'encontro' ? 1 : maxStudents.value,
      status: 'scheduled',
      callUrl: '',
      presentStudentIds: [],
      eventType: selectedEventType.value,
      aulaType: selectedEventType.value === 'aula' ? selectedAulaType.value : undefined
    });
    showAddForm.value = false;
    selectedCourseId.value = '';
    customClassTitle.value = '';
    scheduledAt.value = '';
    selectedEventType.value = 'aula';
    selectedAulaType.value = 'curso';
  } catch (error) {
    console.error("Erro criando evento:", error);
  } finally {
    isSubmitting.value = false;
  }
};

const startEditing = (cl: ClassTurma) => {
  editingClassId.value = cl.id;
  editEventType.value = cl.eventType || 'aula';
  editAulaType.value = cl.aulaType || (cl.courseId === 'custom-class' ? 'avulsa' : 'curso');
  editCourseId.value = (cl.courseId === 'one-on-one' || cl.courseId === 'conversacao') ? '' : cl.courseId;
  editCustomClassTitle.value = (cl.courseId === 'custom-class' || cl.courseId === 'one-on-one' || cl.courseId === 'conversacao') ? cl.courseTitle : '';
  editMaxStudents.value = cl.maxStudents;
  editCallUrl.value = cl.callUrl || '';
  editStatus.value = cl.status;

  const parts = cl.scheduledAt.split(' ');
  editScheduledDate.value = parts[0] || '';
  editScheduledTime.value = parts[1] || '19:00';
};

const saveEdit = (cl: ClassTurma) => {
  let finalCourseId = editCourseId.value;
  let finalCourseTitle = "";

  if (editEventType.value === 'aula') {
    if (editAulaType.value === 'avulsa') {
      finalCourseId = 'custom-class';
      finalCourseTitle = editCustomClassTitle.value.trim() || cl.courseTitle || "Aula de Conversação";
    } else {
      const chosenCourse = props.courses.find(c => c.id === editCourseId.value);
      finalCourseId = editCourseId.value;
      finalCourseTitle = chosenCourse ? chosenCourse.title : cl.courseTitle;
    }
  } else if (editEventType.value === 'encontro') {
    finalCourseId = 'one-on-one';
    finalCourseTitle = editCustomClassTitle.value.trim() || `${locale.value === 'pt' ? 'Encontro One-on-one' : 'One-on-one Meeting'} (${cl.instructorName})`;
  } else if (editEventType.value === 'conversacao') {
    finalCourseId = 'conversacao';
    finalCourseTitle = editCustomClassTitle.value.trim() || `${locale.value === 'pt' ? 'Grupo de Conversação' : 'Conversation Group'}`;
  }

  const finalScheduledAt = props.isAdmin || props.isInstructor
    ? `${editScheduledDate.value} ${editScheduledTime.value}`
    : cl.scheduledAt;

  let finalLinkSharedAt = cl.linkSharedAt;
  if (editCallUrl.value && editCallUrl.value.trim()) {
    if (!cl.callUrl || !cl.linkSharedAt) {
      finalLinkSharedAt = new Date().toISOString();
    }
  } else {
    finalLinkSharedAt = undefined;
  }

  const updated: ClassTurma = {
    ...cl,
    courseId: finalCourseId,
    courseTitle: finalCourseTitle,
    maxStudents: editEventType.value === 'encontro' ? 1 : editMaxStudents.value,
    callUrl: editCallUrl.value,
    linkSharedAt: finalLinkSharedAt,
    status: editStatus.value,
    scheduledAt: finalScheduledAt,
    eventType: editEventType.value,
    aulaType: editEventType.value === 'aula' ? editAulaType.value : undefined
  };

  emit('update-class', updated);
  editingClassId.value = null;
};

const handleCardClick = (e: Event, cl: ClassTurma) => {
  const target = e.target as HTMLElement;
  if (editingClassId.value === cl.id || target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) {
    return;
  }
  selectedClass.value = cl;
};

// Check if current date and time is before the scheduledTime
const isBeforeClassTime = (scheduledAtStr: string) => {
  try {
    const parts = scheduledAtStr.split(' ');
    const datePart = parts[0];
    const timePart = parts[1] || '00:00';
    const dateString = `${datePart}T${timePart}:00`;
    const scheduledDate = new Date(dateString);
    return new Date() < scheduledDate;
  } catch (e) {
    return false;
  }
};

const isInscriptionsClosed = (cl: ClassTurma) => {
  if (!cl.linkSharedAt) return false;
  try {
    const sharedTime = new Date(cl.linkSharedAt).getTime();
    const diffMin = (Date.now() - sharedTime) / (1000 * 60);
    return diffMin >= 10;
  } catch (e) {
    return false;
  }
};

const handleStudentEnter = (cl: ClassTurma) => {
  if (!cl.callUrl) return;

  // Register student's presence on the platform
  emit('mark-presence', cl.id);

  // Open link in a new window/tab
  window.open(cl.callUrl, '_blank');
};
</script>

<template>
  <div class="space-y-6">

    <!-- Title Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="text-left">
        <h2 class="text-xl font-extrabold text-gray-900 dark:text-white">{{ t('scheduler.agendaTitle') }}</h2>
        <p class="text-sm text-gray-500 mt-1">
          {{ t('scheduler.agendaSubtitle') }}
        </p>
      </div>

      <button
        v-if="isInstructor"
        id="btn-toggle-add-class"
        @click="showAddForm = !showAddForm"
        class="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        {{ showAddForm ? t('scheduler.closeForm') : t('scheduler.addClass') }}
      </button>
    </div>

    <!-- Instructor's Creation Drawer/Modal panel -->
    <form
      v-if="showAddForm"
      id="form-add-class"
      @submit.prevent="handleCreate"
      class="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800/80 mt-2 space-y-4 max-w-2xl text-left shadow-md"
    >
      <p class="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
        {{ locale === 'pt' ? 'Agendar Novo Evento' : 'Schedule New Event' }}
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Event Type Segmented Control -->
        <div class="col-span-1 md:col-span-2">
          <label class="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
            {{ t('scheduler.eventTypeLabel') }}
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              id="btn-event-type-aula"
              @click="selectedEventType = 'aula'"
              :class="[
                'flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer',
                selectedEventType === 'aula'
                  ? 'bg-blue-600 border-transparent text-white shadow-xs'
                  : 'bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-900'
              ]"
            >
              <span class="text-xs font-bold">{{ t('scheduler.eventTypeClass') }}</span>
            </button>
            <button
              type="button"
              id="btn-event-type-encontro"
              @click="selectedEventType = 'encontro'"
              :class="[
                'flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer',
                selectedEventType === 'encontro'
                  ? 'bg-blue-600 border-transparent text-white shadow-xs'
                  : 'bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-900'
              ]"
            >
              <span class="text-xs font-bold">{{ t('scheduler.eventTypeOneOnOne') }}</span>
            </button>
            <button
              type="button"
              id="btn-event-type-conversacao"
              @click="selectedEventType = 'conversacao'"
              :class="[
                'flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer',
                selectedEventType === 'conversacao'
                  ? 'bg-blue-600 border-transparent text-white shadow-xs'
                  : 'bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-900'
              ]"
            >
              <span class="text-xs font-bold">{{ t('scheduler.eventTypeConversationGroup') }}</span>
            </button>
          </div>
        </div>

        <!-- CONDITIONAL FIELDS BY EVENT TYPE -->
        <template v-if="selectedEventType === 'aula'">
          <div>
            <label class="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
              {{ t('scheduler.aulaTypeLabel') }}
            </label>
            <select
              id="select-aula-type"
              v-model="selectedAulaType"
              class="w-full text-xs font-medium bg-white dark:bg-slate-950 dark:text-white border border-gray-200 dark:border-slate-800 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all"
            >
              <option value="curso">{{ t('scheduler.aulaTypeCourse') }}</option>
              <option value="avulsa">{{ t('scheduler.aulaTypeSolo') }}</option>
            </select>
          </div>

          <div v-if="selectedAulaType === 'curso'">
            <label class="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
              {{ t('scheduler.courseTopicChosen') }}
            </label>
            <select
              id="select-class-course"
              required
              v-model="selectedCourseId"
              class="w-full text-xs font-medium bg-white dark:bg-slate-950 dark:text-white border border-gray-200 dark:border-slate-800 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all"
            >
              <option value="" disabled>{{ t('scheduler.selectCourse') }}</option>
              <option v-for="c in allowedCourses" :key="c.id" :value="c.id" class="dark:bg-slate-950">
                {{ c.title }} ({{ c.level }}) - {{ t('scheduler.by') }} {{ c.creatorName || t('scheduler.community') }}
              </option>
            </select>
          </div>

          <div v-if="selectedAulaType === 'avulsa'" class="col-span-1 md:col-span-2">
            <label class="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
              {{ t('scheduler.customClassTitleLabel') }}
            </label>
            <input
              id="input-class-custom-title"
              type="text"
              required
              v-model="customClassTitle"
              :placeholder="t('scheduler.customClassTitlePlaceholder')"
              class="w-full text-xs font-medium bg-white dark:bg-slate-950 dark:text-white border border-gray-200 dark:border-slate-800 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </template>

        <template v-else-if="selectedEventType === 'encontro'">
          <div class="col-span-1 md:col-span-2 space-y-3">
            <div class="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-150/50 dark:border-indigo-900/40 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 font-medium">
              💡 {{ t('scheduler.oneOnOneDesc') }}
            </div>
            <div>
              <label class="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                {{ locale === 'pt' ? 'Foco / Assunto do Encontro (Opcional)' : 'Focus / Topic of the Meeting (Optional)' }}
              </label>
              <input
                id="input-encontro-title"
                type="text"
                v-model="customClassTitle"
                :placeholder="locale === 'pt' ? 'Ex: Tirar dúvidas, Conversação livre, etc.' : 'E.g., Doubts clearing, Free talk, etc.'"
                class="w-full text-xs font-medium bg-white dark:bg-slate-950 dark:text-white border border-gray-200 dark:border-slate-800 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </template>

        <template v-else-if="selectedEventType === 'conversacao'">
          <div class="col-span-1 md:col-span-2 space-y-3">
            <div class="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-150/50 dark:border-amber-900/40 rounded-xl text-xs text-amber-700 dark:text-amber-300 font-medium">
              💡 {{ t('scheduler.conversationGroupDesc') }}
            </div>
            <div>
              <label class="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                {{ locale === 'pt' ? 'Tema da Conversação (Opcional)' : 'Conversation Topic (Optional)' }}
              </label>
              <input
                id="input-conversacao-title"
                type="text"
                v-model="customClassTitle"
                :placeholder="locale === 'pt' ? 'Ex: Viagens, Tecnologia, Cinema, etc.' : 'E.g., Travel, Technology, Cinema, etc.'"
                class="w-full text-xs font-medium bg-white dark:bg-slate-950 dark:text-white border border-gray-200 dark:border-slate-800 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </template>

        <!-- SHARED DATE/TIME & CAPACITY FIELDS -->
        <div v-if="selectedEventType !== 'encontro'">
          <label class="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
            {{ t('scheduler.capacity') }}
          </label>
          <input
            id="input-class-max-students"
            type="number"
            min="2"
            max="50"
            required
            v-model.number="maxStudents"
            class="w-full text-xs font-medium bg-white dark:bg-slate-950 dark:text-white border border-gray-200 dark:border-slate-800 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <div>
          <label class="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
            {{ t('scheduler.day') }}
          </label>
          <input
            id="input-class-date"
            type="date"
            required
            v-model="scheduledAt"
            class="w-full text-xs font-medium bg-white dark:bg-slate-950 dark:text-white border border-gray-200 dark:border-slate-800 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all"
          />
        </div>

        <div>
          <label class="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
            {{ t('scheduler.hour') }}
          </label>
          <input
            id="input-class-hour"
            type="time"
            required
            v-model="scheduledHour"
            class="w-full text-xs font-medium bg-white dark:bg-slate-950 dark:text-white border border-gray-200 dark:border-slate-800 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all"
          />
        </div>
      </div>

      <div class="flex pt-2 justify-end gap-2">
        <button
          id="btn-cancel-create-class"
          type="button"
          @click="showAddForm = false"
          class="px-4 py-2.5 text-xs font-bold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-slate-700 cursor-pointer transition-colors shadow-2xs"
        >
          {{ t('scheduler.cancel') }}
        </button>
        <button
          id="btn-confirm-create-class"
          type="submit"
          :disabled="isSubmitting"
          class="px-5 py-2.5 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
        >
          {{ isSubmitting ? t('scheduler.registering') : t('scheduler.availableSchedule') }}
        </button>
      </div>
    </form>

    <!-- Search & Filter Controls for Classes -->
    <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-850 p-4 rounded-[24px] border border-gray-150 dark:border-slate-800 shadow-3xs">
      <!-- Search input query -->
      <div class="relative flex-1 min-w-0">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
        <input
          id="input-class-search"
          v-model="classSearchQuery"
          type="text"
          :placeholder="t('scheduler.searchPlaceholder')"
          class="w-full text-xs sm:text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-250 dark:border-slate-700 pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      <!-- Filters & Toggles Wrapper -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
        <!-- Filter select status -->
        <div class="relative flex items-center bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-700 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 min-w-[140px] h-[40px]">
          <Filter class="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 mr-1.5 shrink-0" />
          <select
            id="select-class-status-filter"
            v-model="classStatusFilter"
            class="text-xs font-bold text-gray-800 dark:text-white bg-transparent border-0 p-0 pr-6 cursor-pointer focus:ring-0 focus:outline-hidden h-full w-full appearance-none"
          >
            <option value="All" class="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">{{ t('scheduler.allClassesFilter') }}</option>
            <option value="MyClasses" class="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">{{ t('scheduler.myClassesFilter') }}</option>
            <option value="scheduled" class="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">{{ t('scheduler.statusScheduled') }}</option>
            <option value="completed" class="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">{{ t('scheduler.statusCompleted') }}</option>
            <option value="cancelled" class="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">{{ t('scheduler.statusCancelled') }}</option>
          </select>
          <div class="pointer-events-none absolute right-2.5 flex items-center">
            <svg class="h-3.5 w-3.5 text-gray-400 dark:text-slate-500" viewBox="0 0 20 20" fill="none" stroke="currentColor">
              <path d="M7 8l3 3 3-3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- Filter Event Type -->
        <div class="relative flex items-center bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-700 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 min-w-[140px] h-[40px]">
          <Filter class="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 mr-1.5 shrink-0" />
          <select
            id="select-class-event-type-filter"
            v-model="classEventTypeFilter"
            class="text-xs font-bold text-gray-800 dark:text-white bg-transparent border-0 p-0 pr-6 cursor-pointer focus:ring-0 focus:outline-hidden h-full w-full appearance-none"
          >
            <option value="All" class="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">
              {{ locale === 'pt' ? 'Todos os tipos' : 'All event types' }}
            </option>
            <option value="aula" class="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">
              {{ t('scheduler.eventTypeClass') }}
            </option>
            <option value="encontro" class="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">
              {{ t('scheduler.eventTypeOneOnOne') }}
            </option>
            <option value="conversacao" class="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">
              {{ t('scheduler.eventTypeConversationGroup') }}
            </option>
          </select>
          <div class="pointer-events-none absolute right-2.5 flex items-center">
            <svg class="h-3.5 w-3.5 text-gray-400 dark:text-slate-500" viewBox="0 0 20 20" fill="none" stroke="currentColor">
              <path d="M7 8l3 3 3-3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- View mode toggle: List vs Calendar -->
        <div class="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-gray-250 dark:border-slate-700 h-[40px] min-w-[150px]">
          <button
            id="btn-view-list"
            type="button"
            @click="viewType = 'list'"
            :class="[
              'flex-1 flex items-center justify-center gap-1.5 h-full px-3 text-xs font-black rounded-lg transition-all cursor-pointer',
              viewType === 'list'
                ? 'bg-[#0f766e] text-white shadow-3xs'
                : 'text-gray-550 dark:text-gray-400 hover:text-gray-850 dark:hover:text-white'
            ]"
          >
            <List class="w-3.5 h-3.5" />
            <span>{{ t('scheduler.viewList') }}</span>
          </button>
          <button
            id="btn-view-calendar"
            type="button"
            @click="viewType = 'calendar'"
            :class="[
              'flex-1 flex items-center justify-center gap-1.5 h-full px-3 text-xs font-black rounded-lg transition-all cursor-pointer',
              viewType === 'calendar'
                ? 'bg-[#0f766e] text-white shadow-3xs'
                : 'text-gray-550 dark:text-gray-400 hover:text-gray-850 dark:hover:text-white'
            ]"
          >
            <CalendarDays class="w-3.5 h-3.5" />
            <span>{{ t('scheduler.viewCalendar') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-if="viewType === 'list'" class="space-y-6">
      <!-- Classes schedule cards grid -->
      <div v-if="classes.length === 0" class="p-12 text-center bg-gray-50 dark:bg-slate-850 rounded-2xl border border-gray-200/60 dark:border-slate-700 text-gray-500 max-w-sm mx-auto">
        <Calendar id="no-classes-icon" class="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {{ t('scheduler.noClassesScheduled') }}
        </p>
        <p class="text-xs text-gray-400 mt-1">
          {{ t('scheduler.requestSchedules') }}
        </p>
      </div>

      <div v-else class="space-y-6">

        <!-- Empty state when searching yields zero results -->
        <div v-if="filteredClasses.length === 0" class="p-12 text-center bg-gray-50 dark:bg-slate-850 rounded-3xl border border-gray-200/60 dark:border-slate-700 text-gray-500 max-w-sm mx-auto">
          <Search class="w-8 h-8 mx-auto mb-2 text-gray-400 animate-pulse" />
          <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {{ t('scheduler.noClassesMatch') }}
          </p>
          <p class="text-xs text-gray-400 mt-1">
            {{ t('scheduler.tryChangingTerms') }}
          </p>
        </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="cl in paginatedClasses"
          :key="cl.id"
          :id="`class-card-${cl.id}`"
          @click="(e) => handleCardClick(e, cl)"
          :class="[
            'bg-white dark:bg-slate-800 rounded-2xl border transition-all p-5 flex flex-col justify-between text-left cursor-pointer hover:shadow-md hover:scale-[1.005]',
            cl.studentIds.includes(currentUserId) ? 'border-blue-500 ring-1 ring-blue-500/10 shadow-xs' : 'border-gray-150 dark:border-slate-700 shadow-xs hover:border-gray-200'
          ]"
        >
        <!-- EDIT MODE -->
        <div v-if="editingClassId === cl.id" class="space-y-3.5 p-1 w-full">
          <p class="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1">
            <Edit class="w-3.5 h-3.5" />
            <span>{{ t('scheduler.editClass') }}</span>
          </p>

          <div>
            <label class="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              {{ t('scheduler.selectCourse') }}
            </label>
            <select
              v-model="editCourseId"
              class="w-full text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-750 dark:text-white rounded-lg p-2 font-semibold cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="custom-class">⚡ {{ t('scheduler.customClassOption') }}</option>
              <option v-for="c in allowedCourses" :key="c.id" :value="c.id">
                {{ c.title }} - {{ t('scheduler.by') }} {{ c.creatorName || t('courses.comunitario') }}
              </option>
            </select>
          </div>

          <div v-if="editCourseId === 'custom-class'">
            <label class="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              {{ t('scheduler.customClassTitleLabel') }}
            </label>
            <input
              type="text"
              v-model="editCustomClassTitle"
              :placeholder="t('scheduler.customClassTitlePlaceholder')"
              class="w-full text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-755 dark:text-white rounded-lg p-2 font-semibold focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                {{ t('scheduler.capacity') }}
              </label>
              <input
                type="number"
                min="2"
                max="100"
                v-model.number="editMaxStudents"
                class="w-full text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-750 dark:text-white rounded-lg p-2 font-semibold focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                {{ t('scheduler.status') }}
              </label>
              <select
                v-model="editStatus"
                class="w-full text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-750 dark:text-white rounded-lg p-2 font-semibold cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="scheduled">{{ t('scheduler.statusScheduled') }}</option>
                <option value="completed">{{ t('scheduler.statusCompleted') }}</option>
                <option value="cancelled">{{ t('scheduler.statusCancelled') }}</option>
              </select>
            </div>
          </div>

          <!-- ADMIN-ONLY DATE & TIME EDITING -->
          <div v-if="isAdmin" class="grid grid-cols-2 gap-2 bg-rose-50/40 dark:bg-rose-950/10 p-2 rounded-xl border border-rose-100 dark:border-rose-900/30">
            <div>
              <label class="block text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1">
                {{ t('scheduler.day') }} (Admin)
              </label>
              <input
                type="date"
                v-model="editScheduledDate"
                class="w-full text-xs bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 dark:text-white rounded-lg p-2 font-semibold cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1">
                {{ t('scheduler.hour') }} (Admin)
              </label>
              <input
                type="time"
                v-model="editScheduledTime"
                class="w-full text-xs bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 dark:text-white rounded-lg p-2 font-semibold cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div v-else class="bg-gray-50 dark:bg-slate-850 border border-gray-150 dark:border-slate-700/60 rounded-xl p-2.5 text-[10px] text-gray-500 dark:text-gray-400 font-semibold leading-normal">
            {{ t('scheduler.adminRestriction', { time: cl.scheduledAt }) }}
          </div>

          <div>
            <label class="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              {{ t('scheduler.linkLabel') }}
            </label>
            <input
              type="url"
              v-model="editCallUrl"
              :placeholder="t('scheduler.linkPlaceholder')"
              class="w-full text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-750 dark:text-white rounded-lg p-2 font-semibold focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div class="flex gap-2 justify-end pt-2">
            <button
              type="button"
              @click.stop="editingClassId = null"
              class="px-3 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-650 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-slate-700 cursor-pointer"
            >
              {{ t('scheduler.cancel') }}
            </button>
            <button
              type="button"
              @click.stop="saveEdit(cl)"
              class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black cursor-pointer shadow-xs"
              :style="{ backgroundColor: props.primaryColor }"
            >
              {{ t('scheduler.editBtn') }}
            </button>
          </div>
        </div>

        <!-- READ-ONLY CARD VIEWER -->
        <div v-else class="h-full flex flex-col justify-between">
          <div>
            <!-- Status header -->
            <div class="flex justify-between items-center mb-3">
              <span :class="[
                'text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full',
                cl.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                cl.status === 'cancelled' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' :
                'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
               ]">
                {{ cl.status === 'completed' ? t('scheduler.classCompleted') : cl.status === 'cancelled' ? t('scheduler.classCancelled') : t('scheduler.activeClass') }}
              </span>
              <span class="text-xs text-gray-600 dark:text-gray-300 font-mono flex items-center gap-1 font-semibold">
                <Clock class="w-3.5 h-3.5 text-blue-500" />
                {{ cl.scheduledAt }}
              </span>
            </div>

            <!-- Associated Course Info & Event Type Badge -->
            <div class="flex flex-wrap gap-1 mb-2">
              <span v-if="cl.eventType === 'encontro'" class="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
                👤 {{ t('scheduler.eventTypeOneOnOne') }}
              </span>
              <span v-else-if="cl.eventType === 'conversacao'" class="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                💬 {{ t('scheduler.eventTypeConversationGroup') }}
              </span>
              <span v-else class="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                🎓 {{ cl.aulaType === 'avulsa' ? t('scheduler.aulaTypeSolo') : t('scheduler.aulaTypeCourse') }}
              </span>
            </div>

            <p class="text-[10px] text-gray-400 dark:text-gray-550 uppercase tracking-widest font-black mb-1">
              {{ cl.eventType === 'encontro' ? (locale === 'pt' ? 'Detalhes do Encontro' : 'Meeting Details') : cl.eventType === 'conversacao' ? (locale === 'pt' ? 'Detalhes do Grupo' : 'Group Details') : t('scheduler.association') }}
            </p>
            <div class="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-750 rounded-xl mb-3">
              <h3 class="font-extrabold text-sm text-gray-900 dark:text-white line-clamp-1">
                {{ cl.courseTitle }}
              </h3>
              <p class="text-[10px] text-gray-450 dark:text-gray-550 font-bold mt-0.5">
                {{ t('scheduler.autor', { name: (cl.eventType === 'encontro' || cl.eventType === 'conversacao' || cl.courseId === 'custom-class') ? cl.instructorName : (courses.find(c => c.id === cl.courseId)?.creatorName || t('scheduler.community')) }) }}
              </p>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {{ cl.eventType === 'encontro'
                  ? t('scheduler.oneOnOneDesc')
                  : cl.eventType === 'conversacao'
                  ? t('scheduler.conversationGroupDesc')
                  : cl.courseId === 'custom-class'
                  ? t('scheduler.customDesc')
                  : (courses.find(c => c.id === cl.courseId)?.description || t('scheduler.defaultCourseDesc'))
                }}
              </p>
            </div>

            <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              {{ t('scheduler.offeredBy') }} <strong class="ml-1 text-gray-800 dark:text-gray-200 font-bold">{{ cl.instructorName }}</strong>
            </p>

            <!-- CALL LINK & PLATFORM VALIDATION SECTION (Only for confirmed students & teachers) -->
            <div class="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700/80">
              <template v-if="cl.studentIds.includes(currentUserId) || cl.instructorId === currentUserId || isAdmin">
                <p class="text-[10px] text-gray-400 dark:text-gray-555 uppercase tracking-widest font-black mb-1.5">
                  {{ t('scheduler.broadcastRoom') }}
                </p>

                <!-- LINK IS DISPONIBLE -->
                <div v-if="cl.callUrl" class="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/50 rounded-xl flex items-center justify-between gap-2.5">
                  <div class="text-left">
                    <div class="flex items-center gap-1.5">
                      <p class="text-xs font-extrabold text-emerald-850 dark:text-emerald-300 leading-none">
                        {{ t('scheduler.linkAvailable') }}
                      </p>

                      <!-- Presença checkmark for the student -->
                      <span v-if="cl.studentIds.includes(currentUserId) && cl.presentStudentIds?.includes(currentUserId)" class="text-[9px] bg-emerald-200 dark:bg-emerald-900/60 font-black text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-md">
                        {{ t('scheduler.attendanceRecorded') }}
                      </span>
                    </div>
                    <p class="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                      {{ t('scheduler.connectPractice') }}
                    </p>
                  </div>
                  <button
                    @click.stop="handleStudentEnter(cl)"
                    class="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    <span>{{ t('scheduler.joinClassLabel') }}</span>
                    <ExternalLink class="w-3.5 h-3.5" />
                  </button>
                </div>

                <!-- LINK IS EMPTY: PLACEHOLDER CONDITIONAL -->
                <div v-else>
                  <!-- Case 1: Before the class schedule -->
                  <div v-if="isBeforeClassTime(cl.scheduledAt)" class="p-3 bg-blue-50/50 dark:bg-slate-850 border border-blue-100/50 dark:border-slate-700/60 rounded-xl text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2 max-w-full">
                    <Clock class="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      {{ t('scheduler.callLinkCloseTime') }}
                    </span>
                  </div>

                  <!-- Case 2: During or after the class schedule (delayed/professor late) -->
                  <div v-else class="p-3 bg-amber-50/70 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl text-[11px] text-amber-800 dark:text-amber-400 flex items-start gap-2">
                    <Clock class="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <span>
                      {{ t('scheduler.instructorLate') }}
                    </span>
                  </div>
                </div>
              </template>
              <p v-else class="text-[11.5px] italic text-gray-400 dark:text-gray-505">
                {{ t('scheduler.enrollToAccess') }}
              </p>
            </div>
          </div>

          <!-- Seats & interactive controls -->
          <div class="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700/80 flex items-center justify-between">
            <div>
              <span class="text-[10px] font-black text-gray-400 dark:text-gray-505 block">
                {{ t('scheduler.occupation') }}
              </span>
              <div class="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5 flex-wrap">
                <Users class="w-4 h-4 text-gray-400" />
                <span>{{ t('scheduler.studentsCount', { count: cl.studentIds.length, max: cl.maxStudents }) }}</span>
                <span v-if="isInscriptionsClosed(cl)" class="text-[9px] bg-rose-100 dark:bg-rose-950/40 text-rose-750 dark:text-rose-400 font-bold px-1.5 py-0.5 rounded border border-rose-200/50 dark:border-rose-900/30 uppercase tracking-wide">
                  {{ t('scheduler.inscriptionsClosed') }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-1">
              <!-- Edit capabilities for Instructor or Admin -->
              <button
                v-if="isInstructor || isAdmin"
                :id="`btn-edit-class-${cl.id}`"
                @click.stop="startEditing(cl)"
                class="p-2 text-blue-500 hover:bg-blue-55 dark:hover:bg-slate-700/50 rounded-lg transition-colors border border-transparent hover:border-blue-100 dark:hover:border-slate-700 cursor-pointer"
                :title="t('scheduler.editClass')"
              >
                <Edit class="w-4 h-4" />
              </button>

              <!-- Tutor delete capability -->
              <button
                v-if="(isInstructor || isAdmin) && (isAdmin || cl.instructorId === currentUserId || cl.instructorId === 'system-volunteer')"
                :id="`btn-delete-class-${cl.id}`"
                @click.stop="emit('delete-class', cl.id)"
                :title="t('scheduler.deleteClass')"
                class="p-2 text-rose-500 hover:bg-rose-55 dark:hover:bg-slate-700/50 rounded-lg transition-colors border border-transparent hover:border-rose-100 dark:hover:border-slate-700 cursor-pointer"
              >
                <Trash2 class="w-4.5 h-4.5" />
              </button>

              <!-- Join / Leave button for standard students or other tutors/admins -->
              <template v-if="cl.instructorId !== currentUserId">
                <button
                  v-if="cl.studentIds.includes(currentUserId)"
                  :id="`btn-leave-class-${cl.id}`"
                  @click.stop="emit('leave-class', cl.id)"
                  class="flex items-center gap-1 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/25 py-1.5 px-3.5 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut class="w-3.5 h-3.5" />
                  {{ t('scheduler.leaveLabel') }}
                </button>
                <button
                  v-else
                  :id="`btn-join-class-${cl.id}`"
                  @click.stop="emit('join-class', cl.id)"
                  :disabled="cl.studentIds.length >= cl.maxStudents || isInscriptionsClosed(cl)"
                  :class="[
                    'flex items-center gap-1 py-1.5 px-3.5 text-xs font-bold rounded-lg transition-all border cursor-pointer',
                    (cl.studentIds.length >= cl.maxStudents || isInscriptionsClosed(cl))
                      ? 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-slate-750 dark:text-gray-500 dark:border-slate-700 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-xs'
                  ]"
                >
                  <Check class="w-3.5 h-3.5" />
                  {{ cl.studentIds.length >= cl.maxStudents ? t('scheduler.fullLabel') : (isInscriptionsClosed(cl) ? t('scheduler.inscriptionsClosed') : t('scheduler.joinLabel')) }}
                </button>
              </template>

              <!-- If the user is the instructor/creator of this class, show my class badge -->
              <span
                v-if="cl.instructorId === currentUserId"
                class="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-md font-bold flex items-center gap-1"
              >
                <CheckCircle class="w-3 h-3" /> {{ t('scheduler.myClassLabel') }}
              </span>
            </div>
          </div>
        </div>

          <!-- Show confirmed details below if student/user is enrolled -->
          <div
            v-if="cl.studentIds.includes(currentUserId)"
            class="mt-3 bg-blue-50/40 dark:bg-slate-850 border border-blue-100/50 dark:border-slate-700/60 rounded-lg p-2.5 text-[11px] text-blue-700 dark:text-blue-300 text-center font-semibold"
          >
            {{ t('scheduler.confirmedAlert') }}
          </div>
        </div>
      </div>

    <!-- Pagination controls for classes -->
    <div v-if="totalClassPages > 1" class="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-slate-750/50">
      <p class="text-xs font-bold text-gray-500 dark:text-gray-400">
        {{ t('scheduler.showingLabel') }} <span class="text-gray-900 dark:text-white">{{ (classCurrentPage - 1) * classItemsPerPage + 1 }}</span> {{ t('scheduler.toLabel') }}
        <span class="text-gray-900 dark:text-white">{{ Math.min(classCurrentPage * classItemsPerPage, filteredClasses.length) }}</span> {{ t('scheduler.ofLabel') }}
        <span class="text-gray-900 dark:text-white font-extrabold">{{ filteredClasses.length }}</span> {{ t('scheduler.classesLabel') }}
      </p>

      <div class="flex items-center gap-1.5 flex-wrap">
        <button
          id="btn-class-prev-page"
          :disabled="classCurrentPage === 1"
          @click="classCurrentPage--"
          class="p-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
          :title="t('scheduler.prevPage')"
        >
          <ChevronLeft class="w-4 h-4 text-gray-700 dark:text-gray-200" />
        </button>

        <div class="flex items-center gap-1">
          <button
            v-for="page in totalClassPages"
            :key="page"
            @click="classCurrentPage = page"
            :class="[
              'w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer',
              classCurrentPage === page
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
            ]"
          >
            {{ page }}
          </button>
        </div>

        <button
          id="btn-class-next-page"
          :disabled="classCurrentPage === totalClassPages"
          @click="classCurrentPage++"
          class="p-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
          :title="t('scheduler.nextPage')"
        >
          <ChevronRight class="w-4 h-4 text-gray-700 dark:text-gray-200" />
        </button>
      </div>
    </div>
  </div>
</div>

    <div v-else-if="viewType === 'calendar'" class="space-y-6">
      <!-- Calendar Controls & Navigation Header -->
      <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-150 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-3xs">
        <!-- Month Year Navigation -->
        <div class="flex items-center gap-2">
          <button
            id="btn-calendar-prev"
            type="button"
            @click="calendarViewMode === 'month' ? prevMonth() : prevWeek()"
            class="p-2 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
          >
            <ChevronLeft class="w-4 h-4 text-gray-700 dark:text-gray-200" />
          </button>
            <h3 class="text-sm sm:text-base font-black text-gray-900 dark:text-white min-w-[140px] text-center capitalize tracking-tight">
            {{ calendarViewMode === 'month' ? `${monthNames[currentMonth]} ${currentYear}` : t('scheduler.weekOf', { month: monthNames[currentWeekStart.getMonth()] }) }}
          </h3>

          <button
            id="btn-calendar-next"
            type="button"
            @click="calendarViewMode === 'month' ? nextMonth() : nextWeek()"
            class="p-2 bg-slate-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
          >
            <ChevronRight class="w-4 h-4 text-gray-700 dark:text-gray-200" />
          </button>

          <button
            id="btn-calendar-today"
            type="button"
            @click="resetToToday()"
            class="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 text-xs font-bold rounded-xl hover:bg-blue-100/50 cursor-pointer transition-colors ml-1"
          >
            {{ t('scheduler.today') }}
          </button>
        </div>

        <!-- Mode Toggle & Legend -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-850">
            <button
              id="btn-calendar-mode-month"
              type="button"
              @click="calendarViewMode = 'month'"
              :class="[
                'px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer',
                calendarViewMode === 'month'
                  ? 'bg-blue-600 text-white shadow-3xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
              ]"
            >
              {{ t('scheduler.monthly') }}
            </button>
            <button
              id="btn-calendar-mode-week"
              type="button"
              @click="calendarViewMode = 'week'"
              :class="[
                'px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer',
                calendarViewMode === 'week'
                  ? 'bg-blue-600 text-white shadow-3xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
              ]"
            >
              {{ t('scheduler.weekly') }}
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-2.5 text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-950/40 px-3 py-1.5 rounded-xl border border-gray-150 dark:border-slate-800">
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"></span>{{ t('scheduler.statusScheduled') }}</span>
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>{{ t('scheduler.statusCompleted') }}</span>
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400"></span>{{ t('scheduler.statusCancelled') }}</span>
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400"></span>{{ t('scheduler.enrolledLabel') }}</span>
          </div>
        </div>
      </div>

      <!-- MONTHLY GRID VIEW -->
      <div v-if="calendarViewMode === 'month'" class="space-y-4">
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-slate-800/80 shadow-3xs overflow-x-auto scrollbar-thin">
          <div class="min-w-[600px] md:min-w-full">
            <div class="grid grid-cols-7 border-b border-gray-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 text-center py-2">
              <div v-for="dayName in weekdayNames" :key="dayName" class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{{ dayName }}</div>
            </div>
            <div class="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-gray-100 dark:divide-slate-800/60 border-t border-gray-100 dark:border-slate-800/60">
              <div
                v-for="(day, idx) in daysInMonth"
                :key="idx"
                @click="handleCalendarDayClick(day)"
                :class="[
                  'min-h-[55px] md:min-h-[90px] p-1 md:p-1.5 flex flex-col justify-between transition-all relative text-left group cursor-pointer border',
                  day.isCurrentMonth ? 'bg-white dark:bg-slate-900' : 'bg-gray-50/20 dark:bg-slate-950/10',
                  selectedCalendarDayString === day.dateString ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 z-10' : 'border-transparent'
                ]"
              >
                <div class="flex items-center justify-between">
                  <span :class="['text-[10px] md:text-[11px] font-bold w-5 h-5 md:w-5.5 md:h-5.5 flex items-center justify-center rounded-full', day.isToday ? 'bg-blue-600 text-white font-black' : day.isCurrentMonth ? 'text-gray-800 dark:text-gray-250' : 'text-gray-300 dark:text-gray-650']">
                    {{ day.dayNum }}
                  </span>
                  <button v-if="isInstructor" @click.stop="openAddFormWithDate(day.dateString)" class="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md cursor-pointer"><Plus class="w-3 h-3" /></button>
                </div>

                <!-- Desktop view: Show list of courses síncronos, capped at 2 with a + indicator if there are > 3 -->
                <div class="hidden md:block flex-1 space-y-0.5 overflow-y-auto mt-1 max-h-[60px] scrollbar-none">
                  <div
                    v-for="cl in (day.classesOnDay.length > 3 ? day.classesOnDay.slice(0, 2) : day.classesOnDay)"
                    :key="cl.id"
                    @click.stop="selectedClass = cl"
                    :class="[
                      'p-1 text-[9px] rounded-md border text-left cursor-pointer transition-all hover:translate-x-0.5 line-clamp-1 flex items-center justify-between font-bold leading-tight',
                      cl.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
                        : cl.status === 'cancelled'
                          ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30 line-through'
                          : 'text-white border-transparent'
                    ]"
                    :style="cl.status === 'scheduled' ? { backgroundColor: props.primaryColor || '#2563eb', color: '#ffffff', borderColor: 'transparent' } : {}"
                  >
                    <span class="truncate"><strong>{{ cl.scheduledAt.split(' ')[1] }}</strong> {{ cl.courseTitle }}</span>
                    <span v-if="cl.studentIds.includes(currentUserId)" class="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0"></span>
                  </div>

                  <!-- Indicator for more classes on Desktop -->
                  <div
                    v-if="day.classesOnDay.length > 3"
                    @click.stop="handleCalendarDayClick(day)"
                    class="p-0.5 text-[8px] md:text-[9px] font-black rounded-md border border-dashed border-blue-200 text-blue-600 dark:border-blue-500/20 dark:text-blue-400 dark:bg-blue-950/20 text-center hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-all cursor-pointer leading-tight mt-0.5"
                  >
                    +{{ day.classesOnDay.length - 2 }} {{ t('scheduler.more') }}
                  </div>
                </div>

                <!-- Mobile view: Show subtle, clean event dots to keep layout neat and usable -->
                <div class="block md:hidden mt-0.5 flex flex-wrap justify-center gap-0.5 max-w-full">
                  <span
                    v-for="cl in (day.classesOnDay.length > 3 ? day.classesOnDay.slice(0, 2) : day.classesOnDay)"
                    :key="cl.id"
                    :class="['w-1 h-1 rounded-full shrink-0', cl.studentIds.includes(currentUserId) ? 'bg-amber-500' : cl.status === 'completed' ? 'bg-emerald-500' : cl.status === 'cancelled' ? 'bg-rose-500' : 'bg-blue-500']"
                  ></span>
                  <span v-if="day.classesOnDay.length > 3" class="text-[8px] font-black leading-none text-blue-600 dark:text-blue-400 -mt-0.5 ml-0.5">+{{ day.classesOnDay.length - 2 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Day Schedule details list (Mobile & Desktop companion list restored!) -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-slate-800/80 p-4 shadow-3xs space-y-3.5">
          <div class="flex items-center justify-between border-b border-gray-100 dark:border-slate-800/80 pb-2.5">
            <div class="flex items-center gap-2">
              <div class="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <CalendarDays class="w-4 h-4" />
              </div>
              <div>
                <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {{ t('scheduler.classesOfTheDay') }}
                </h4>
                <p class="text-xs font-black text-gray-900 dark:text-white capitalize mt-0.5">{{ formatSelectedDayTitle }}</p>
              </div>
            </div>

            <button
              v-if="isInstructor"
              @click="openAddFormWithDate(selectedCalendarDayString)"
              class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-colors"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>{{ t('scheduler.schedule') }}</span>
            </button>
          </div>

          <div v-if="selectedDayClasses.length === 0" class="py-6 text-center text-gray-400 dark:text-gray-505 flex flex-col items-center justify-center gap-1.5">
            <div class="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-gray-300 dark:text-gray-600">
              <Clock class="w-4 h-4" />
            </div>
            <p class="text-xs font-bold">
              {{ t('scheduler.noSynchronousScheduled') }}
            </p>
            <p v-if="isInstructor" class="text-[10px] text-gray-400">
              {{ t('scheduler.pressScheduleToCreate') }}
            </p>
          </div>

          <div
            v-for="cl in selectedDayClasses"
            :key="cl.id"
            @click="selectedClass = cl"
            :class="[
              'p-3 rounded-xl border border-l-4 text-left cursor-pointer transition-all hover:scale-[1.01] flex flex-col gap-1.5 shadow-3xs',
              cl.status === 'completed'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-850 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                : cl.status === 'cancelled'
                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-450 border-rose-200 dark:border-rose-500/25 line-through'
                  : 'bg-slate-50/50 dark:bg-slate-850 text-gray-900 dark:text-white border-slate-200 dark:border-slate-800'
            ]"
            :style="cl.status === 'scheduled' ? { borderLeftColor: props.primaryColor || '#2563eb' } : { borderLeftColor: 'transparent' }"
          >
            <div class="flex items-center justify-between gap-1">
              <span class="text-[10px] font-mono font-black flex items-center gap-1" :class="cl.status === 'scheduled' ? 'text-gray-600 dark:text-gray-350' : 'text-gray-600 dark:text-gray-350'">
                <Clock class="w-3 h-3" :style="cl.status === 'scheduled' ? { color: props.primaryColor || '#2563eb' } : {}" :class="cl.status !== 'scheduled' ? 'text-blue-500' : ''" />
                {{ cl.scheduledAt.split(' ')[1] }}
              </span>
              <span
                :class="[
                  'text-[8px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-sm',
                  cl.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                  cl.status === 'cancelled' ? 'bg-rose-100 text-rose-850 dark:bg-rose-950/45 dark:text-rose-355' :
                  'border'
                ]"
                :style="cl.status === 'scheduled' ? { backgroundColor: `${props.primaryColor || '#2563eb'}15`, color: props.primaryColor || '#2563eb', borderColor: `${props.primaryColor || '#2563eb'}30` } : {}"
              >
                {{ cl.status === 'completed' ? t('scheduler.endLabel') : cl.status === 'cancelled' ? t('scheduler.cancLabel') : cl.studentIds.includes(currentUserId) ? t('scheduler.enrolledLabel') : t('scheduler.availableLabel') }}
              </span>
            </div>
            <h5 class="text-xs font-extrabold line-clamp-1 leading-snug">{{ cl.courseTitle }}</h5>
            <p class="text-[10px] text-gray-450 dark:text-gray-400">
              {{ t('scheduler.instructorLabel') }} <strong class="font-bold text-gray-600 dark:text-gray-300">{{ cl.instructorName }}</strong>
            </p>
            <div class="mt-2 pt-2 flex items-center justify-between text-[10px] font-semibold border-t border-gray-150/60 dark:border-slate-800/60 text-gray-400">
              <span class="flex items-center gap-1">
                <Users class="w-3 h-3 text-gray-400" />
                {{ t('scheduler.studentsCount', { count: cl.studentIds.length, max: cl.maxStudents }) }}
              </span>
              <span v-if="cl.studentIds.includes(currentUserId)" class="text-blue-600 dark:text-blue-400 font-extrabold flex items-center gap-0.5">★ {{ t('scheduler.enrolledLabel') }}</span>
              <span v-else class="font-extrabold hover:underline" :style="{ color: props.primaryColor || '#2563eb' }">{{ t('scheduler.viewDetails') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- WEEKLY GRID VIEW -->
      <div v-else class="w-full">
        <!-- Desktop: Beautiful 7-column grid layout -->
        <div class="hidden md:block w-full overflow-x-auto pb-2 scrollbar-thin">
          <div class="grid md:grid-cols-7 gap-2 lg:gap-3 min-w-[1020px] xl:min-w-full">
            <div
              v-for="day in daysInWeek"
              :key="day.dateString"
              @click="selectedCalendarDayString = day.dateString"
              :class="[
                'bg-white dark:bg-slate-900 rounded-2xl border p-2 md:p-2.5 lg:p-3 flex flex-col justify-start text-left min-h-[220px] transition-all cursor-pointer hover:border-blue-300 dark:hover:border-slate-750',
                selectedCalendarDayString === day.dateString
                  ? 'border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/10 dark:bg-blue-950/20 shadow-xs'
                  : day.isToday
                    ? 'border-blue-400 ring-1 ring-blue-400/20 bg-blue-50/5'
                    : 'border-gray-200/80 dark:border-slate-800/85'
              ]"
            >
              <div class="border-b border-gray-100 dark:border-slate-800 pb-1.5 mb-2.5 flex items-center justify-between">
                <div>
                  <p class="text-[9px] uppercase font-black text-gray-400 tracking-wider">{{ weekdayNames[day.date.getDay()] }}</p>
                  <h4 class="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1 mt-0.5">
                    {{ day.dayNum }} {{ monthNames[day.date.getMonth()].slice(0, 3) }}
                    <span v-if="day.isToday" class="text-[8px] bg-blue-600 text-white font-bold px-1 rounded-sm scale-90">{{ t('scheduler.today') }}</span>
                  </h4>
                </div>
                <button v-if="isInstructor" @click.stop="openAddFormWithDate(day.dateString)" class="p-0.5 text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer"><Plus class="w-3.5 h-3.5" /></button>
              </div>
              <div class="space-y-2 flex-1">
                <div v-if="day.classesOnDay.length === 0" class="h-full flex flex-col items-center justify-center py-6 text-center text-gray-300">
                  <CalendarDays class="w-5 h-5 text-gray-300 mb-0.5" />
                  <p class="text-[9px] font-semibold">{{ t('scheduler.noClassesDay') }}</p>
                </div>
                <div
                  v-else
                  v-for="cl in (day.classesOnDay.length > 1 ? day.classesOnDay.slice(0, 1) : day.classesOnDay)"
                  :key="cl.id"
                  @click.stop="selectedClass = cl"
                  :class="[
                    'p-2 rounded-xl border text-left cursor-pointer transition-all hover:scale-[1.01] flex flex-col gap-1 shadow-3xs w-full max-w-full overflow-hidden box-border',
                    cl.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-850 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
                      : cl.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-450 dark:border-rose-500/25 line-through'
                        : 'text-white border-transparent'
                  ]"
                  :style="cl.status === 'scheduled' ? { backgroundColor: props.primaryColor || '#2563eb', color: '#ffffff', borderColor: 'transparent' } : {}"
                >
                  <div class="flex items-center justify-between gap-1 w-full overflow-hidden">
                    <span
                      class="text-[10px] font-mono font-black flex items-center gap-0.5 shrink-0"
                      :class="cl.status === 'scheduled' ? 'text-white' : 'text-slate-700 dark:text-slate-300'"
                    >
                      <Clock class="w-3.5 h-3.5" :class="cl.status === 'scheduled' ? 'text-blue-100' : 'text-blue-500'" />
                      {{ cl.scheduledAt.split(' ')[1] }}
                    </span>
                    <span :class="[
                      'text-[8px] font-extrabold tracking-wider uppercase px-1 py-0.5 rounded-sm shrink-0',
                      cl.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                      cl.status === 'cancelled' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/45 dark:text-rose-355' :
                      cl.studentIds.includes(currentUserId) ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' :
                      cl.status === 'scheduled' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                    ]">
                      {{ cl.status === 'completed' ? t('scheduler.endLabel').slice(0, 4) : cl.status === 'cancelled' ? t('scheduler.cancLabel').slice(0, 4) : cl.studentIds.includes(currentUserId) ? t('scheduler.enrolledLabel').slice(0, 4) : t('scheduler.availableLabel').slice(0, 4) }}
                    </span>
                  </div>
                  <h5 class="text-[11px] font-extrabold line-clamp-1 leading-tight">{{ cl.courseTitle }}</h5>
                  <p
                    class="text-[9px] truncate"
                    :class="cl.status === 'scheduled' ? 'text-blue-100/95 font-bold' : 'text-gray-400'"
                  >
                    {{ t('scheduler.instructorLabel') }} {{ cl.instructorName }}
                  </p>
                  <div
                    class="mt-1 pt-1 border-t flex items-center justify-between text-[9px] font-semibold w-full overflow-hidden"
                    :class="cl.status === 'scheduled' ? 'border-white/20 text-blue-50' : 'border-gray-100 dark:border-slate-800 text-gray-450 dark:text-gray-400'"
                  >
                    <span class="flex items-center gap-0.5 shrink-0"><Users class="w-2.5 h-2.5" />{{ cl.studentIds.length }}/{{ cl.maxStudents }}</span>
                    <span v-if="cl.studentIds.includes(currentUserId)" :class="cl.status === 'scheduled' ? 'text-amber-300 font-extrabold shrink-0' : 'text-amber-600 dark:text-amber-400 font-extrabold shrink-0'">★ {{ t('scheduler.enrolledLabel') }}</span>
                  </div>
                </div>

                <!-- Button indicator to show other classes in details or selector -->
                <div
                  v-if="day.classesOnDay.length > 1"
                  @click.stop="handleCalendarDayClick(day)"
                  class="p-1.5 rounded-xl border border-dashed border-blue-200 text-blue-600 dark:border-blue-500/20 dark:text-blue-400 dark:bg-blue-950/20 text-center hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-all cursor-pointer font-black text-[10px] flex items-center justify-center gap-1 mt-1"
                >
                  <span>+{{ t('scheduler.classCount', { count: day.classesOnDay.length - 1 }) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile: Super clean weekly slider -->
        <div class="md:hidden space-y-4">
          <!-- Calendar Week Strip with horizontal scroll -->
          <div class="flex gap-2 overflow-x-auto pb-2.5 px-1 -mx-1 snap-x scrollbar-thin scroll-smooth">
            <button
              v-for="day in daysInWeek"
              :key="day.dateString"
              @click="selectedCalendarDayString = day.dateString"
              :class="[
                'flex-1 min-w-[74px] shrink-0 snap-center py-3.5 px-2 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer select-none',
                selectedCalendarDayString === day.dateString
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/10'
                  : 'bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 border-gray-200/80 dark:border-slate-800/85'
              ]"
            >
              <span :class="['text-[9px] uppercase font-black tracking-wider', selectedCalendarDayString === day.dateString ? 'text-blue-100' : 'text-gray-400']">
                {{ weekdayNames[day.date.getDay()].slice(0, 3) }}
              </span>
              <span class="text-base font-black leading-none">{{ day.dayNum }}</span>
              <span class="text-[8px] font-bold">{{ monthNames[day.date.getMonth()].slice(0, 3) }}</span>

              <!-- Event dots indicator -->
              <div v-if="day.classesOnDay.length > 0" class="flex items-center gap-0.5 mt-1">
                <span
                  v-for="cl in day.classesOnDay.slice(0, 3)"
                  :key="cl.id"
                  :class="['w-1 h-1 rounded-full', selectedCalendarDayString === day.dateString ? 'bg-white' : cl.studentIds.includes(currentUserId) ? 'bg-amber-500' : cl.status === 'completed' ? 'bg-emerald-500' : cl.status === 'cancelled' ? 'bg-rose-500' : 'bg-blue-500']"
                ></span>
                <span v-if="day.classesOnDay.length > 3" :class="['text-[8px] font-black', selectedCalendarDayString === day.dateString ? 'text-blue-100' : 'text-blue-500']">+</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Selected Day details & registration (Unified for Mobile & Desktop!) -->
        <div class="mt-4 space-y-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-slate-800/80 p-4 shadow-3xs">
          <div class="flex items-center justify-between border-b border-gray-100 dark:border-slate-800/80 pb-2.5">
            <div class="flex items-center gap-2">
              <div class="p-2 bg-blue-50 dark:bg-blue-955/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <CalendarDays class="w-4 h-4" />
              </div>
              <div>
                <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {{ t('scheduler.classesOfTheDay') }}
                </h4>
                <p class="text-xs font-black text-gray-900 dark:text-white capitalize mt-0.5">{{ formatSelectedDayTitle }}</p>
              </div>
            </div>

            <button
              v-if="isInstructor"
              @click="openAddFormWithDate(selectedCalendarDayString)"
              class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-colors"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>{{ t('scheduler.schedule') }}</span>
            </button>
          </div>

          <div v-if="selectedDayClasses.length === 0" class="py-12 text-center text-gray-400 dark:text-gray-505 flex flex-col items-center justify-center gap-1.5">
            <div class="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-gray-300 dark:text-gray-600">
              <Clock class="w-4 h-4" />
            </div>
            <p class="text-xs font-bold">
              {{ t('scheduler.noClassesThisDay') }}
            </p>
            <p v-if="isInstructor" class="text-[10px] text-gray-400">
              {{ t('scheduler.pressScheduleToCreate') }}
            </p>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="cl in selectedDayClasses"
              :key="cl.id"
              @click="selectedClass = cl"
              :class="[
                'p-3.5 rounded-xl border border-l-4 text-left cursor-pointer transition-all hover:scale-[1.01] flex flex-col gap-1.5 shadow-3xs',
                cl.status === 'completed'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-850 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                  : cl.status === 'cancelled'
                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-850 dark:text-rose-450 border-rose-200 dark:border-rose-500/25 line-through'
                    : 'bg-slate-50/50 dark:bg-slate-850 text-gray-900 dark:text-white border-slate-200 dark:border-slate-800'
              ]"
              :style="cl.status === 'scheduled' ? { borderLeftColor: props.primaryColor || '#2563eb' } : { borderLeftColor: 'transparent' }"
            >
              <div class="flex items-center justify-between gap-1">
                <span class="text-[10px] font-mono font-black flex items-center gap-1" :class="cl.status === 'scheduled' ? 'text-gray-600 dark:text-gray-350' : 'text-gray-600 dark:text-gray-350'">
                  <Clock class="w-3.5 h-3.5" :style="cl.status === 'scheduled' ? { color: props.primaryColor || '#2563eb' } : {}" :class="cl.status !== 'scheduled' ? 'text-blue-500' : ''" />
                  {{ cl.scheduledAt.split(' ')[1] }}
                </span>
                <span
                  :class="[
                    'text-[8px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-sm',
                    cl.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                    cl.status === 'cancelled' ? 'bg-rose-100 text-rose-850 dark:bg-rose-950/45 dark:text-rose-355' :
                    'border'
                  ]"
                  :style="cl.status === 'scheduled' ? { backgroundColor: `${props.primaryColor || '#2563eb'}15`, color: props.primaryColor || '#2563eb', borderColor: `${props.primaryColor || '#2563eb'}30` } : {}"
                >
                  {{ cl.status === 'completed' ? t('scheduler.endLabel') : cl.status === 'cancelled' ? t('scheduler.cancLabel') : cl.studentIds.includes(currentUserId) ? t('scheduler.enrolledLabel') : t('scheduler.availableLabel') }}
                </span>
              </div>
              <h5 class="text-xs font-extrabold line-clamp-1 leading-snug">{{ cl.courseTitle }}</h5>
              <p class="text-[10px] text-gray-450 dark:text-gray-400">
                {{ t('scheduler.instructorLabel') }} <strong class="font-bold text-gray-600 dark:text-gray-300">{{ cl.instructorName }}</strong>
              </p>
              <div class="mt-2 pt-2 flex items-center justify-between text-[10px] font-semibold border-t border-gray-150/60 dark:border-slate-850 text-gray-400">
                <span class="flex items-center gap-1">
                  <Users class="w-3.5 h-3.5 text-gray-400" />
                  {{ t('scheduler.studentsCount', { count: cl.studentIds.length, max: cl.maxStudents }) }}
                </span>
                <span v-if="cl.studentIds.includes(currentUserId)" class="text-blue-600 dark:text-blue-400 font-extrabold flex items-center gap-0.5">★ {{ t('scheduler.enrolledLabel') }}</span>
                <span v-else class="font-extrabold hover:underline" :style="{ color: props.primaryColor || '#2563eb' }">{{ t('scheduler.viewDetails') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CLASS DETAILS MODAL (Interactive from List and Calendar view) -->
    <div v-if="activeSelectedClass" id="modal-class-details" class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs bg-slate-950/60" @click="selectedClass = null">
      <div class="bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] rounded-2xl shadow-2xl flex flex-col text-left relative overflow-hidden" @click.stop>

        <!-- Subtle Close Button inside Modal -->
        <button v-if="!isEditingInModal" @click="selectedClass = null" class="absolute top-4 right-4 p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 rounded-full transition-colors cursor-pointer z-10" :title="t('scheduler.closeLabel')">
          <X class="w-4 h-4" />
        </button>

        <!-- EDIT MODE INSIDE MODAL -->
        <div v-if="isEditingInModal" class="p-6 space-y-4 flex flex-col overflow-hidden max-h-[95vh] sm:max-h-[90vh]">
          <p class="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-150 dark:border-slate-800 pb-2.5 shrink-0">
            <Edit class="w-4 h-4" />
            <span>{{ t('scheduler.editClass') }}</span>
          </p>

          <div class="space-y-3.5 overflow-y-auto pr-2 scrollbar-thin flex-1 min-h-0">
            <!-- Event Type Segmented Control -->
            <div>
              <label class="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                {{ t('scheduler.eventTypeLabel') }}
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  @click="editEventType = 'aula'"
                  :class="[
                    'flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold',
                    editEventType === 'aula'
                      ? 'bg-blue-600 border-transparent text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  ]"
                >
                  {{ t('scheduler.eventTypeClass') }}
                </button>
                <button
                  type="button"
                  @click="editEventType = 'encontro'"
                  :class="[
                    'flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold',
                    editEventType === 'encontro'
                      ? 'bg-blue-600 border-transparent text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  ]"
                >
                  {{ t('scheduler.eventTypeOneOnOne') }}
                </button>
                <button
                  type="button"
                  @click="editEventType = 'conversacao'"
                  :class="[
                    'flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold',
                    editEventType === 'conversacao'
                      ? 'bg-blue-600 border-transparent text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  ]"
                >
                  {{ t('scheduler.eventTypeConversationGroup') }}
                </button>
              </div>
            </div>

            <!-- CONDITIONAL FIELDS BY EVENT TYPE -->
            <template v-if="editEventType === 'aula'">
              <div>
                <label class="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  {{ t('scheduler.aulaTypeLabel') }}
                </label>
                <select
                  v-model="editAulaType"
                  class="w-full text-xs sm:text-sm bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-750 dark:text-white rounded-xl py-2 px-3 font-semibold cursor-pointer focus:outline-hidden"
                >
                  <option value="curso">{{ t('scheduler.aulaTypeCourse') }}</option>
                  <option value="avulsa">{{ t('scheduler.aulaTypeSolo') }}</option>
                </select>
              </div>

              <div v-if="editAulaType === 'curso'">
                <label class="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  {{ t('scheduler.selectCourse') }}
                </label>
                <select
                  v-model="editCourseId"
                  class="w-full text-xs sm:text-sm bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-750 dark:text-white rounded-xl py-2 px-3 font-semibold cursor-pointer focus:outline-hidden"
                >
                  <option v-for="c in allowedCourses" :key="c.id" :value="c.id">
                    {{ c.title }} - {{ t('scheduler.byLabel') }} {{ c.creatorName || t('courses.comunitario') }}
                  </option>
                </select>
              </div>

              <div v-if="editAulaType === 'avulsa'">
                <label class="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  {{ t('scheduler.customClassTitleLabel') }}
                </label>
                <input
                  type="text"
                  v-model="editCustomClassTitle"
                  :placeholder="t('scheduler.customClassTitlePlaceholder')"
                  class="w-full text-xs sm:text-sm bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-755 dark:text-white rounded-xl py-2.5 px-3.5 font-semibold focus:outline-hidden"
                />
              </div>
            </template>

            <template v-else-if="editEventType === 'encontro'">
              <div>
                <label class="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  {{ locale === 'pt' ? 'Foco / Assunto do Encontro (Opcional)' : 'Focus / Topic of the Meeting (Optional)' }}
                </label>
                <input
                  type="text"
                  v-model="editCustomClassTitle"
                  :placeholder="locale === 'pt' ? 'Ex: Tirar dúvidas, Conversação livre, etc.' : 'E.g., Doubts clearing, Free talk, etc.'"
                  class="w-full text-xs sm:text-sm bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-755 dark:text-white rounded-xl py-2.5 px-3.5 font-semibold focus:outline-hidden"
                />
              </div>
            </template>

            <template v-else-if="editEventType === 'conversacao'">
              <div>
                <label class="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  {{ locale === 'pt' ? 'Tema da Conversação (Opcional)' : 'Conversation Topic (Optional)' }}
                </label>
                <input
                  type="text"
                  v-model="editCustomClassTitle"
                  :placeholder="locale === 'pt' ? 'Ex: Viagens, Tecnologia, Cinema, etc.' : 'E.g., Travel, Technology, Cinema, etc.'"
                  class="w-full text-xs sm:text-sm bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-755 dark:text-white rounded-xl py-2.5 px-3.5 font-semibold focus:outline-hidden"
                />
              </div>
            </template>

            <div class="grid grid-cols-2 gap-2.5">
              <div v-if="editEventType !== 'encontro'">
                <label class="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  {{ t('scheduler.capacity') }}
                </label>
                <input
                  type="number"
                  min="2"
                  max="100"
                  v-model.number="editMaxStudents"
                  class="w-full text-xs sm:text-sm bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-750 dark:text-white rounded-xl py-2.5 px-3.5 font-semibold focus:outline-hidden"
                />
              </div>

              <div :class="editEventType === 'encontro' ? 'col-span-2' : ''">
                <label class="block text-[10px] font-bold text-gray-750 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  {{ t('scheduler.status') }}
                </label>
                <select
                  v-model="editStatus"
                  class="w-full text-xs sm:text-sm bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-750 dark:text-white rounded-xl py-2.5 px-3.5 font-semibold cursor-pointer focus:outline-hidden"
                >
                  <option value="scheduled">{{ t('scheduler.activeStatus') }}</option>
                  <option value="completed">{{ t('scheduler.statusCompleted') }}</option>
                  <option value="cancelled">{{ t('scheduler.statusCancelled') }}</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  {{ t('scheduler.day') }} (Admin)
                </label>
                <input
                  type="date"
                  v-model="editScheduledDate"
                  class="w-full text-xs sm:text-sm bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-750 dark:text-white rounded-xl py-2.5 px-3.5 font-semibold cursor-pointer focus:outline-hidden"
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  {{ t('scheduler.hour') }} (Admin)
                </label>
                <input
                  type="time"
                  v-model="editScheduledTime"
                  class="w-full text-xs sm:text-sm bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-750 dark:text-white rounded-xl py-2.5 px-3.5 font-semibold cursor-pointer focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                {{ t('scheduler.linkLabel') }}
              </label>
              <input
                type="url"
                v-model="editCallUrl"
                :placeholder="t('scheduler.linkPlaceholder')"
                class="w-full text-xs sm:text-sm bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-750 dark:text-white rounded-xl py-2.5 px-3.5 font-semibold focus:outline-hidden"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t border-gray-150 dark:border-slate-800">
            <button
              type="button"
              @click="isEditingInModal = false"
              class="px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-650 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-slate-800 cursor-pointer"
            >
              {{ t('scheduler.cancel') }}
            </button>
            <button
              type="button"
              @click="saveEdit(activeSelectedClass); isEditingInModal = false"
              class="px-5 py-2.5 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs"
              :style="{ backgroundColor: props.primaryColor || '#2563eb' }"
            >
              {{ t('scheduler.editBtn') }}
            </button>
          </div>
        </div>

        <!-- READ-ONLY MODE INSIDE MODAL -->
        <div v-else class="p-6 space-y-4.5 overflow-y-auto max-h-[95vh] sm:max-h-[90vh] scrollbar-thin">
          <!-- Status & Time Header -->
          <div class="flex justify-between items-center pr-8">
            <span :class="[
              'text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md',
              activeSelectedClass.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
              activeSelectedClass.status === 'cancelled' ? 'bg-rose-500/10 text-rose-500 dark:text-rose-450' :
              'bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-750'
            ]">
              {{ activeSelectedClass.status === 'completed' ? t('scheduler.statusCompletedLabel') : activeSelectedClass.status === 'cancelled' ? t('scheduler.statusCancelledLabel') : t('scheduler.statusActiveLabel') }}
            </span>
            <span class="text-xs text-gray-600 dark:text-gray-300 font-mono flex items-center gap-1.5 font-bold">
              <Clock class="w-4 h-4 text-blue-500 dark:text-blue-400" />
              {{ activeSelectedClass.scheduledAt }}
            </span>
          </div>

          <!-- Associated Course Info & Event Type Badge -->
          <div class="space-y-1.5">
            <div class="flex flex-wrap gap-1 mb-1">
              <span v-if="activeSelectedClass.eventType === 'encontro'" class="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
                👤 {{ t('scheduler.eventTypeOneOnOne') }}
              </span>
              <span v-else-if="activeSelectedClass.eventType === 'conversacao'" class="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                💬 {{ t('scheduler.eventTypeConversationGroup') }}
              </span>
              <span v-else class="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                🎓 {{ activeSelectedClass.aulaType === 'avulsa' ? t('scheduler.aulaTypeSolo') : t('scheduler.aulaTypeCourse') }}
              </span>
            </div>

            <h4 class="text-[10px] font-black text-gray-400 dark:text-gray-555 uppercase tracking-widest leading-none">
              {{ activeSelectedClass.eventType === 'encontro' ? (locale === 'pt' ? 'Detalhes do Encontro' : 'Meeting Details') : activeSelectedClass.eventType === 'conversacao' ? (locale === 'pt' ? 'Detalhes do Grupo' : 'Group Details') : t('scheduler.courseTopicAssociation') }}
            </h4>
            <div class="p-3.5 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl">
              <h3 class="font-extrabold text-sm text-gray-900 dark:text-white leading-snug">
                {{ activeSelectedClass.courseTitle }}
              </h3>
              <p class="text-[10px] text-gray-555 dark:text-gray-350 font-bold mt-1.5">
                {{ t('scheduler.authorLabel') }} {{ (activeSelectedClass.eventType === 'encontro' || activeSelectedClass.eventType === 'conversacao' || activeSelectedClass.courseId === 'custom-class') ? activeSelectedClass.instructorName : (courses.find(c => c.id === activeSelectedClass.courseId)?.creatorName || t('courses.comunitario')) }}
              </p>
              <p class="text-[11px] text-gray-700 dark:text-slate-200 mt-2 leading-relaxed font-semibold">
                {{ activeSelectedClass.eventType === 'encontro'
                  ? t('scheduler.oneOnOneDesc')
                  : activeSelectedClass.eventType === 'conversacao'
                  ? t('scheduler.conversationGroupDesc')
                  : activeSelectedClass.courseId === 'custom-class'
                  ? t('scheduler.independentClassDesc')
                  : (courses.find(c => c.id === activeSelectedClass.courseId)?.description || t('scheduler.defaultCourseDesc'))
                }}
              </p>
            </div>
          </div>

          <!-- Instructor info -->
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center leading-none">
            {{ t('scheduler.offeredByLabel') }} <strong class="ml-1 text-gray-800 dark:text-gray-200 font-bold">{{ activeSelectedClass.instructorName }}</strong>
          </p>

          <div class="border-t border-gray-150 dark:border-slate-800/60 my-1"></div>

          <!-- Transmission section -->
          <div class="space-y-1.5">
            <h4 class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
              {{ t('scheduler.broadcastRoomLabel') }}
            </h4>
            <template v-if="activeSelectedClass.studentIds.includes(currentUserId) || activeSelectedClass.instructorId === currentUserId || isAdmin">
              <!-- Case 1: Call URL exists -->
              <div v-if="activeSelectedClass.callUrl" class="p-3 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-2.5">
                <div class="text-left">
                  <div class="flex items-center gap-1.5">
                    <p class="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 leading-none">
                      {{ t('scheduler.linkAvailableLabel') }}
                    </p>
                    <span v-if="activeSelectedClass.studentIds.includes(currentUserId) && activeSelectedClass.presentStudentIds?.includes(currentUserId)" class="text-[9px] bg-emerald-200/50 dark:bg-emerald-900/60 font-black text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-md">
                      ✓ {{ t('scheduler.attendanceRecordedLabel') }}
                    </span>
                  </div>
                  <p class="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5">
                    {{ t('scheduler.connectPracticeLabel') }}
                  </p>
                </div>
                <button
                  @click="handleStudentEnter(activeSelectedClass)"
                  class="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <span>{{ t('scheduler.joinClassBtn') }}</span>
                  <ExternalLink class="w-3.5 h-3.5" />
                </button>
              </div>
              <!-- Case 2: Call URL does not exist -->
              <div v-else>
                <!-- Before class time -->
                <div v-if="isBeforeClassTime(activeSelectedClass.scheduledAt)" class="p-3.5 bg-blue-500/5 dark:bg-slate-950/20 border border-blue-500/20 rounded-xl text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2 max-w-full leading-relaxed">
                  <Clock class="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    {{ t('scheduler.callLinkCloseTimeLabel') }}
                  </span>
                </div>
                <!-- During or after class time -->
                <div v-else class="p-3.5 bg-amber-500/5 dark:bg-amber-950/15 border border-amber-500/20 rounded-xl text-[11px] text-amber-800 dark:text-amber-400 flex items-start gap-2 leading-relaxed">
                  <Clock class="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  <span>
                    {{ t('scheduler.instructorLateLabel') }}
                  </span>
                </div>
              </div>
            </template>
            <p v-else class="text-[11px] italic text-gray-400 dark:text-gray-505 bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-gray-150/40 dark:border-slate-800/40 text-center font-semibold leading-relaxed">
              🔒 {{ t('scheduler.enrollToAccessLabel') }}
            </p>
          </div>

          <div class="border-t border-gray-150 dark:border-slate-800/60 my-1"></div>

          <!-- Occupancy & Buttons -->
          <div class="flex items-center justify-between">
            <div>
              <span class="text-[10px] font-black text-gray-400 dark:text-gray-505 uppercase tracking-widest block leading-none">
                {{ t('scheduler.occupationLabel') }}
              </span>
              <div class="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 mt-1.5 flex-wrap">
                <Users class="w-4 h-4 text-gray-400" />
                <span>{{ activeSelectedClass.studentIds.length }} / {{ activeSelectedClass.maxStudents }} {{ t('scheduler.studentsLabel') }}</span>
                <span v-if="isInscriptionsClosed(activeSelectedClass)" class="text-[9px] bg-rose-100 dark:bg-rose-950/40 text-rose-750 dark:text-rose-400 font-bold px-1.5 py-0.5 rounded border border-rose-200/50 dark:border-rose-900/30 uppercase tracking-wide">
                  {{ t('scheduler.inscriptionsClosed') }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <!-- Edit capabilities for Instructor or Admin inside details modal -->
              <button
                v-if="isInstructor || isAdmin"
                @click="isEditingInModal = true; startEditing(activeSelectedClass);"
                class="p-2 text-blue-500 hover:bg-blue-55 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-blue-100 dark:hover:border-slate-700 cursor-pointer"
                :title="t('scheduler.editPropertiesTitle')"
              >
                <Edit class="w-4 h-4" />
              </button>

              <!-- Tutor delete capability inside details modal -->
              <button
                v-if="(isInstructor || isAdmin) && (isAdmin || activeSelectedClass.instructorId === currentUserId || activeSelectedClass.instructorId === 'system-volunteer')"
                @click="emit('delete-class', activeSelectedClass.id); selectedClass = null;"
                :title="t('scheduler.removeTimeslotTitle')"
                class="p-2 text-rose-500 hover:bg-rose-55 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-rose-100 dark:hover:border-slate-700 cursor-pointer"
              >
                <Trash2 class="w-4.5 h-4.5" />
              </button>

              <!-- Join / Leave button for standard students or other tutors/admins -->
              <template v-if="activeSelectedClass.instructorId !== currentUserId">
                <button
                  v-if="activeSelectedClass.studentIds.includes(currentUserId)"
                  @click="emit('leave-class', activeSelectedClass.id); selectedClass = null;"
                  class="flex items-center gap-1 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/25 py-1.5 px-3 text-xs font-black rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut class="w-3.5 h-3.5 mr-0.5" />
                  {{ t('scheduler.leaveLabel') }}
                </button>
                <button
                  v-else
                  @click="emit('join-class', activeSelectedClass.id)"
                  :disabled="activeSelectedClass.studentIds.length >= activeSelectedClass.maxStudents || isInscriptionsClosed(activeSelectedClass)"
                  :class="[
                    'flex items-center gap-1 py-1.5 px-3.5 text-xs font-black rounded-lg transition-all border cursor-pointer',
                    (activeSelectedClass.studentIds.length >= activeSelectedClass.maxStudents || isInscriptionsClosed(activeSelectedClass))
                      ? 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-slate-800 dark:text-gray-600 dark:border-slate-750 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-xs'
                  ]"
                >
                  <Check class="w-3.5 h-3.5 mr-0.5" />
                  {{ activeSelectedClass.studentIds.length >= activeSelectedClass.maxStudents ? t('scheduler.fullLabel') : (isInscriptionsClosed(activeSelectedClass) ? t('scheduler.inscriptionsClosed') : t('scheduler.joinLabel')) }}
                </button>
              </template>
              <span
                v-if="activeSelectedClass.instructorId === currentUserId"
                class="text-[10px] text-emerald-650 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-lg border border-emerald-500/15 font-black flex items-center gap-1"
              >
                <CheckCircle class="w-3.5 h-3.5" /> {{ t('scheduler.myClassLabel') }}
              </span>
            </div>
          </div>

          <!-- Bottom Alert Banner -->
          <div
            v-if="activeSelectedClass.studentIds.includes(currentUserId)"
            class="bg-blue-500/5 dark:bg-slate-950/20 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-600 dark:text-blue-300 text-center font-bold"
          >
            {{ t('scheduler.confirmedAlert') }}
          </div>

          <!-- ENROLLED STUDENTS LIST (Unique per Event Type with Pagination) -->
          <div class="border-t border-gray-150 dark:border-slate-800/60 pt-4 space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                {{ locale === 'pt' ? 'Alunos Inscritos' : 'Enrolled Students' }}
                ({{ enrolledStudentsOfClass.length }})
              </h4>
              <span v-if="activeSelectedClass.eventType === 'encontro'" class="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                Individual (1-on-1)
              </span>
              <span v-else-if="activeSelectedClass.eventType === 'conversacao'" class="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                Conversação (Círculo)
              </span>
              <span v-else class="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                Aula de Grupo
              </span>
            </div>

            <!-- Empty State -->
            <div v-if="enrolledStudentsOfClass.length === 0" class="text-center py-4 bg-slate-50/50 dark:bg-slate-950/20 border border-dashed border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-400 dark:text-slate-500 italic font-semibold">
              {{ locale === 'pt' ? 'Nenhum aluno inscrito ainda.' : 'No students enrolled yet.' }}
            </div>

            <div v-else class="space-y-3">
              <!-- UNIQUE VIEW 1: ENCONTRO (1-ON-1) PREMIUM PROFILE LAYOUT -->
              <template v-if="activeSelectedClass.eventType === 'encontro'">
                <div v-for="student in enrolledStudentsOfClass" :key="student.uid" class="p-3.5 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-950/35 rounded-xl flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 text-left">
                    <!-- Custom Avatar with levels -->
                    <div class="w-10 h-10 rounded-full border-2 border-indigo-200 dark:border-indigo-800 flex items-center justify-center bg-indigo-100 dark:bg-indigo-950/60 font-black text-sm text-indigo-700 dark:text-indigo-300 uppercase shrink-0">
                      {{ student.displayName ? student.displayName.slice(0, 2) : 'ST' }}
                    </div>
                    <div class="text-left min-w-0">
                      <p class="text-xs font-black text-gray-900 dark:text-white truncate">
                        {{ student.displayName }}
                      </p>
                      <p class="text-[10px] text-gray-500 dark:text-slate-400 truncate font-semibold mt-0.5">
                        {{ student.email || 'estudante@email.com' }}
                      </p>
                      <div class="flex items-center gap-1.5 mt-1">
                        <span class="text-[8px] font-black px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded uppercase">
                          {{ student.level }}
                        </span>
                        <span class="text-[8px] text-gray-400 dark:text-slate-500 font-bold">
                          1-on-1 Student
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Tutor action: open doubt chat -->
                  <button
                    v-if="isInstructor || isAdmin || currentUserId === student.uid"
                    type="button"
                    @click="handleStartDoubtChat(student)"
                    class="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-3xs"
                  >
                    <MessageSquare class="w-3 h-3" />
                    <span>{{ locale === 'pt' ? 'Dúvida' : 'Doubt' }}</span>
                  </button>
                </div>
              </template>

              <!-- UNIQUE VIEW 2: CONVERSACAO (CONVERSATION CIRCLE BUBBLE LAYOUT) -->
              <template v-else-if="activeSelectedClass.eventType === 'conversacao'">
                <!-- Visual Circle Bubble Container -->
                <div class="flex flex-wrap gap-1.5 pb-2 border-b border-gray-150/50 dark:border-slate-800/50">
                  <span
                    v-for="student in enrolledStudentsOfClass"
                    :key="'bubble-' + student.uid"
                    class="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-900/30 px-2 py-1 rounded-full"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {{ student.displayName }}
                  </span>
                </div>

                <!-- Paginated grid list of circular cards -->
                <div class="grid grid-cols-1 gap-2">
                  <div
                    v-for="student in paginatedStudents"
                    :key="student.uid"
                    class="p-2.5 bg-amber-50/10 dark:bg-amber-950/5 border border-amber-100/30 dark:border-amber-950/20 rounded-xl flex items-center justify-between"
                  >
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-full bg-amber-100/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-extrabold text-xs flex items-center justify-center uppercase shrink-0">
                        {{ student.displayName.slice(0, 1) }}
                      </div>
                      <div class="text-left">
                        <p class="text-xs font-bold text-gray-800 dark:text-gray-200 leading-none">
                          {{ student.displayName }}
                        </p>
                        <p class="text-[9px] text-gray-500 dark:text-slate-400 mt-0.5 font-medium">
                          Nível: <strong class="text-amber-600 dark:text-amber-400 uppercase">{{ student.level }}</strong>
                        </p>
                      </div>
                    </div>

                    <!-- Open doubt chat button -->
                    <button
                      v-if="isInstructor || isAdmin || currentUserId === student.uid"
                      type="button"
                      @click="handleStartDoubtChat(student)"
                      class="px-2 py-1 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-[9px] font-bold rounded-lg hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-colors cursor-pointer animate-pulse"
                    >
                      Dúvida
                    </button>
                  </div>
                </div>
              </template>

              <!-- UNIQUE VIEW 3: AULA (ROLL CALL LIST GRID WITH LEVEL & ATTENDANCE SNAPSHOT) -->
              <template v-else>
                <div class="space-y-2">
                  <div
                    v-for="student in paginatedStudents"
                    :key="student.uid"
                    class="p-2.5 bg-blue-50/10 dark:bg-slate-850/40 border border-blue-100/10 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 text-left"
                  >
                    <div class="flex items-center gap-2.5 min-w-0">
                      <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs uppercase shrink-0">
                        {{ student.displayName ? student.displayName.slice(0, 2) : 'ST' }}
                      </div>
                      <div class="min-w-0">
                        <p class="text-xs font-bold text-gray-900 dark:text-white truncate leading-tight">
                          {{ student.displayName }}
                        </p>
                        <p class="text-[9.5px] text-gray-500 dark:text-slate-400 mt-0.5 font-semibold">
                          {{ student.level }} • {{ student.email || 'estudante@email.com' }}
                        </p>
                      </div>
                    </div>

                    <!-- Attendance record & Doubt button -->
                    <div class="flex items-center gap-1 shrink-0">
                      <button
                        v-if="isInstructor || isAdmin || currentUserId === student.uid"
                        type="button"
                        @click="handleStartDoubtChat(student)"
                        class="p-1 px-2 border border-blue-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 text-[9px] font-bold rounded-md transition-colors cursor-pointer"
                        title="Abrir Canal de Dúvida"
                      >
                        Dúvida
                      </button>
                      <span v-if="activeSelectedClass.presentStudentIds?.includes(student.uid)" class="text-[9px] bg-emerald-100 dark:bg-emerald-950/60 font-black text-emerald-800 dark:text-emerald-300 px-1.5 py-1 rounded">
                        ✓ Presença
                      </span>
                    </div>
                  </div>
                </div>
              </template>

              <!-- STUDENT LIST PAGINATOR (If count > PageSize) -->
              <div v-if="totalStudentPages > 1" class="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-slate-800 shrink-0">
                <p class="text-[9.5px] font-bold text-gray-400 dark:text-slate-500">
                  Pág. {{ studentPage }} de {{ totalStudentPages }}
                </p>
                <div class="flex items-center gap-1.5">
                  <button
                    id="btn-student-prev"
                    type="button"
                    :disabled="studentPage === 1"
                    @click="studentPage--"
                    class="p-1 px-1.5 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer text-[9px] font-bold text-gray-600 dark:text-slate-300 flex items-center justify-center gap-0.5"
                  >
                    <ChevronLeft class="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    id="btn-student-next"
                    type="button"
                    :disabled="studentPage === totalStudentPages"
                    @click="studentPage++"
                    class="p-1 px-1.5 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer text-[9px] font-bold text-gray-600 dark:text-slate-300 flex items-center justify-center gap-0.5"
                  >
                    <ChevronRight class="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- CHOOSE CLASS OF SELECTED DAY MODAL (Mobile and Desktop helper) -->
    <div v-if="showDayClassesSelector" id="modal-day-classes-selector" class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs bg-slate-950/60" @click="showDayClassesSelector = null">
      <div class="bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 w-full max-w-md rounded-2xl shadow-2xl flex flex-col text-left relative overflow-hidden animate-fadeIn" @click.stop>
        <!-- Modal Close Button -->
        <button @click="showDayClassesSelector = null" class="absolute top-4 right-4 p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 rounded-full transition-colors cursor-pointer z-10" :title="t('scheduler.closeLabel')">
          <X class="w-4 h-4" />
        </button>

        <div class="p-6 space-y-4">
          <div class="flex items-center gap-2 border-b border-gray-100 dark:border-slate-800/80 pb-3">
            <div class="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <CalendarDays class="w-4 h-4" />
            </div>
            <div>
              <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                {{ t('scheduler.classesOfTheDay') }}
              </h4>
              <p class="text-xs font-black text-gray-900 dark:text-white capitalize mt-1.5">
                {{ formatSelectedDayTitle }}
              </p>
            </div>
          </div>

          <div class="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
            <div
              v-for="cl in showDayClassesSelector"
              :key="cl.id"
              @click="selectedClass = cl; showDayClassesSelector = null;"
              :class="[
                'p-3 border rounded-xl cursor-pointer transition-all hover:scale-[1.01] flex flex-col gap-1.5',
                cl.studentIds.includes(currentUserId)
                  ? 'bg-amber-50 text-amber-850 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30'
                  : cl.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-850 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
                    : cl.status === 'cancelled'
                      ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-450 dark:border-rose-500/30 line-through'
                      : 'bg-blue-50 text-blue-850 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30'
              ]"
            >
              <div class="flex items-center justify-between gap-1">
                <span class="text-[10px] font-mono font-black flex items-center gap-1 text-gray-600 dark:text-gray-350"><Clock class="w-3.5 h-3.5 text-blue-500" />{{ cl.scheduledAt.split(' ')[1] }}</span>
                <span :class="[
                  'text-[8px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-sm',
                  cl.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                  cl.status === 'cancelled' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' :
                  cl.studentIds.includes(currentUserId) ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                ]">
                  {{ cl.status === 'completed' ? t('scheduler.endLabel') : cl.status === 'cancelled' ? t('scheduler.cancLabel') : cl.studentIds.includes(currentUserId) ? t('scheduler.enrolledLabel') : t('scheduler.availableLabel') }}
                </span>
              </div>
              <h5 class="text-xs font-extrabold line-clamp-1 leading-snug">{{ cl.courseTitle }}</h5>
              <p class="text-[10px] text-gray-450 dark:text-gray-400">
                {{ t('scheduler.instructorLabel') }} <strong class="text-gray-600 dark:text-gray-300 font-bold">{{ cl.instructorName }}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
