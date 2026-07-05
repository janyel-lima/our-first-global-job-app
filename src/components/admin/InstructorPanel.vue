<script setup lang="ts">
import { ref } from 'vue';
import { 
  ShieldCheck, 
  BarChart3, 
  FileText 
} from 'lucide-vue-next';
import { Course, Lesson, Progress, ChatRoom, ClassTurma, UserProfile } from '../../types';
import InstructorAnalytics from './InstructorAnalytics.vue';
import InstructorCourseCreator from './InstructorCourseCreator.vue';
import { useI18n } from '../../composables/useI18n';

const props = defineProps<{
  courses: Course[];
  progressReports: Progress[];
  chatRooms: ChatRoom[];
  classes: ClassTurma[];
  userDisplayName: string;
  lessons: Lesson[];
  users?: UserProfile[];
  instructorId?: string;
  deleteCourseFn?: (courseId: string) => Promise<void>;
  uploadCourseFn?: (course: Course, lessons: Lesson[]) => Promise<void>;
}>();

const emit = defineEmits<{
  (e: 'upload-course', course: Course, lessons: Lesson[]): void;
  (e: 'delete-course', courseId: string): void;
  (e: 'update-course-config', courseId: string, updates: Partial<Course>): void;
}>();

const { t, locale } = useI18n();
const activeTab = ref<'analytics' | 'creator'>('creator');
</script>

<template>
  <div class="space-y-6">
    
    <!-- Header and Toggle Navigation -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
      <div class="text-left">
        <h2 class="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <ShieldCheck id="instructor-shield" class="w-5 h-5 text-blue-600" />
          {{ t('tutor.title') }}
        </h2>
        <p class="text-xs text-gray-500 mt-1">{{ t('tutor.subtitle') }}</p>
      </div>

      <div class="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto whitespace-nowrap scrollbar-none shrink-0 select-none">
        <button
          id="tab-toggle-analytics"
          @click="activeTab = 'analytics'"
          :class="[
            'flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0',
            activeTab === 'analytics' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          ]"
        >
          <BarChart3 class="w-3.5 h-3.5 shrink-0" />
          <span class="shrink-0">{{ locale === 'pt' ? 'Desempenho' : 'Performance' }}</span>
        </button>
        <button
          id="tab-toggle-creator"
          @click="activeTab = 'creator'"
          :class="[
            'flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0',
            activeTab === 'creator' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          ]"
        >
          <FileText class="w-3.5 h-3.5 shrink-0" />
          <span class="shrink-0">{{ locale === 'pt' ? 'Criar Curso' : 'Create Course' }}</span>
        </button>
      </div>
    </div>

    <!-- Tab Contents -->
    <div v-if="activeTab === 'analytics'" class="space-y-8 animate-fadeIn">
      <InstructorAnalytics
        :courses="courses"
        :progressReports="progressReports"
        :classes="classes"
        :lessons="lessons"
        :users="users"
        :instructorId="instructorId"
        :deleteCourseFn="deleteCourseFn"
        @delete-course="(id) => emit('delete-course', id)"
        @update-course-config="(id, updates) => emit('update-course-config', id, updates)"
      />
    </div>

    <div v-else class="space-y-6 animate-fadeIn">
      <InstructorCourseCreator
        :userDisplayName="userDisplayName"
        :uploadCourseFn="uploadCourseFn"
        @upload-course="(course, lessons) => emit('upload-course', course, lessons)"
      />
    </div>

  </div>
</template>
