<template>
  <div class="fixed top-5 right-5 z-[10000] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
    <transition-group
      enter-active-class="transform transition duration-300 ease-out"
      enter-from-class="translate-y-[-20px] opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-205 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="toast in notifications"
        :key="toast.id"
        class="pointer-events-auto w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 flex items-start gap-3 text-left relative overflow-hidden animate-scaleIn"
        :style="{
          borderLeft: `5px solid ${
            toast.type === 'success' ? '#10b981' : 
            toast.type === 'error' ? '#f43f5e' : 
            toast.type === 'warning' ? '#f59e0b' : '#3b82f6'
          }`
        }"
      >
        <!-- Accent top-bar for decoration -->
        <div 
          class="absolute top-0 left-0 right-0 h-[3px]"
          :class="{
            'bg-emerald-500': toast.type === 'success',
            'bg-rose-500': toast.type === 'error',
            'bg-amber-500': toast.type === 'warning',
            'bg-blue-500': toast.type === 'info'
          }"
        ></div>

        <!-- Type icons -->
        <div class="shrink-0 mt-0.5">
          <CheckCircle v-if="toast.type === 'success'" class="w-5 h-5 text-emerald-500" />
          <AlertCircle v-else-if="toast.type === 'error'" class="w-5 h-5 text-rose-500" />
          <AlertCircle v-else-if="toast.type === 'warning'" class="w-5 h-5 text-amber-500" />
          <Info v-else class="w-5 h-5 text-blue-500" />
        </div>

        <!-- Notification text -->
        <div class="flex-grow pr-4">
          <p class="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-normal">
            {{ toast.message }}
          </p>
        </div>

        <!-- Dismiss button -->
        <button
          type="button"
          @click="emit('dismiss', toast.id)"
          class="text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 p-0.5 rounded transition cursor-pointer"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, AlertCircle, Info, X } from 'lucide-vue-next';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

defineProps<{
  notifications: ToastItem[];
}>();

const emit = defineEmits<{
  (e: 'dismiss', id: string): void;
}>();
</script>
