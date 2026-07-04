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

const activeTab = ref<'analytics' | 'creator'>('creator');
</script>

<template>
  <div class="space-y-6">
    
    <!-- Header and Toggle Navigation -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
      <div class="text-left">
        <h2 class="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <ShieldCheck id="instructor-shield" class="w-5 h-5 text-blue-600" />
          Painel do Instrutor Voluntário
        </h2>
        <p class="text-xs text-gray-500 mt-1">Gerencie a experiência educacional, acompanhe métricas de progresso e publique seus cursos.</p>
      </div>

      <div class="flex bg-gray-100 p-1 rounded-xl shrink-0 select-none">
        <button
          id="tab-toggle-analytics"
          @click="activeTab = 'analytics'"
          :class="[
            'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer',
            activeTab === 'analytics' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
          ]"
        >
          <BarChart3 class="w-3.5 h-3.5" />
          Relatórios de Desempenho
        </button>
        <button
          id="tab-toggle-creator"
          @click="activeTab = 'creator'"
          :class="[
            'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer',
            activeTab === 'creator' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
          ]"
        >
          <FileText class="w-3.5 h-3.5" />
          Criador de Cursos
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
