<script setup lang="ts">
import { ref } from "vue";
import { 
  BookMarked, 
  User, 
  Paintbrush, 
  Sun, 
  Moon, 
  LogOut, 
  ShieldAlert, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  Award,
  Pencil
} from "lucide-vue-next";
import { UserProfile } from "../../types";
import { useI18n } from "../../composables/useI18n";

const { t, locale, setLocale } = useI18n();

const toggleLocale = () => {
  setLocale(locale.value === "pt" ? "en" : "pt");
};

const props = defineProps<{
  activeTab: "courses" | "scheduler" | "chats" | "instructor" | "master" | "tracking";
  activeCourseId: string | null;
  userProfile: UserProfile | null;
  isOnline: boolean;
  isMasterEnabled: boolean;
  primaryColor: string;
  secondaryColor: string;
  isDarkMode: boolean;
  autoBg: boolean;
  bgColor: string;
  unreadChatsCount?: number;
}>();

const emit = defineEmits<{
  (e: "update:activeTab", value: "courses" | "scheduler" | "chats" | "instructor" | "master" | "tracking"): void;
  (e: "update:activeCourseId", value: string | null): void;
  (e: "update:primaryColor", value: string): void;
  (e: "update:secondaryColor", value: string): void;
  (e: "update:isDarkMode", value: boolean): void;
  (e: "update:autoBg", value: boolean): void;
  (e: "update:bgColor", value: string): void;
  (e: "open-profile"): void;
  (e: "logout"): void;
}>();

const showThemePanel = ref(false);

const handleTabClick = (tab: typeof props.activeTab, resetCourse = false) => {
  emit("update:activeTab", tab);
  if (resetCourse) {
    emit("update:activeCourseId", null);
  }
};

const updatePrimaryAndSecondary = (color: string) => {
  emit("update:primaryColor", color);
  emit("update:secondaryColor", color + "dd");
};

const handleColorSelect = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  emit("update:primaryColor", val);
  emit("update:secondaryColor", val + "dd");
};
</script>

<template>
  <!-- Dynamic Header -->
  <header class="bg-white dark:bg-slate-50 border-b border-slate-100 dark:border-slate-150 sticky top-0 z-40 transition-colors duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between">
      <!-- Brand & Logo -->
      <div class="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer shrink-0 animate-fadeIn" @click="handleTabClick('courses', true)">
        <div class="p-1.5 rounded-xl bg-blue-600 shadow-sm flex items-center justify-center text-white shrink-0">
          <BookMarked id="main-brand-logo" class="w-4 h-4" />
        </div>
        <div class="flex flex-col text-left">
          <span class="font-black text-[10px] xs:text-xs sm:text-sm tracking-tight text-slate-900 leading-tight">Our First Global Job</span>
          <span class="text-[8px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest leading-none mt-0.5">Learning App</span>
        </div>
        
        <!-- CONNECTION STATUS BADGE -->
        <span 
          class="text-[8px] font-black uppercase tracking-wider px-2 xs:px-3 py-1 rounded-full flex items-center gap-1.5 shrink-0 ml-3 sm:ml-5 mr-4 md:mr-8 border border-slate-150 bg-slate-50"
          :title="isOnline ? (locale === 'pt' ? 'Conectado à Internet' : 'Connected to Internet') : (locale === 'pt' ? 'Modo Offline Ativo' : 'Offline Mode Active')"
        >
          <span class="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" :class="isOnline ? 'bg-emerald-500' : 'bg-red-500'"></span>
          <span class="text-slate-600 hidden xs:inline">{{ isOnline ? 'Online' : 'Offline' }}</span>
        </span>
      </div>

      <!-- Navigation Controls & User block -->
      <div class="flex items-center gap-2 sm:gap-6">
        <nav class="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-150 shadow-inner">
          <button
            id="nav-tab-courses"
            @click="handleTabClick('courses', true)"
            :class="[
              'px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer select-none',
              activeTab === 'courses' 
                ? 'text-blue-600 dark:text-slate-900 bg-white dark:bg-slate-200 shadow-sm border border-slate-200 dark:border-slate-250' 
                : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            {{ t('nav.grade') }}
          </button>
          <button
            id="nav-tab-scheduler"
            @click="handleTabClick('scheduler')"
            :class="[
              'px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer select-none',
              activeTab === 'scheduler' 
                ? 'text-blue-600 dark:text-slate-900 bg-white dark:bg-slate-200 shadow-sm border border-slate-200 dark:border-slate-250' 
                : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            {{ t('nav.turmas') }}
          </button>
          <button
            id="nav-tab-chats"
            @click="handleTabClick('chats')"
            :class="[
              'px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer select-none flex items-center justify-center gap-1.5',
              activeTab === 'chats' 
                ? 'text-blue-600 dark:text-slate-900 bg-white dark:bg-slate-200 shadow-sm border border-slate-200 dark:border-slate-250' 
                : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            <span>{{ t('nav.duvidas') }}</span>
            <span 
              v-if="unreadChatsCount" 
              class="bg-red-500 text-white text-[8.5px] font-black leading-none px-1.5 py-0.5 rounded-full select-none"
            >
              {{ unreadChatsCount }}
            </span>
          </button>
          <button
            id="nav-tab-tracking"
            @click="handleTabClick('tracking')"
            :class="[
              'px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer select-none',
              activeTab === 'tracking' 
                ? 'text-blue-600 dark:text-slate-900 bg-white dark:bg-slate-200 shadow-sm border border-slate-200 dark:border-slate-250' 
                : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            {{ t('nav.progresso') }}
          </button>
          <button
            v-if="userProfile?.isInstructor || userProfile?.isAdmin"
            id="nav-tab-instructor"
            @click="handleTabClick('instructor')"
            :class="[
              'px-3.5 py-1.5 text-xs font-black rounded-lg border transition-all duration-150 cursor-pointer select-none flex items-center gap-1 active:scale-95',
              activeTab === 'instructor' 
                ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/45 border-amber-300 dark:border-amber-700/60 shadow-md ring-2 ring-amber-500/15' 
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-100'
            ]"
          >
            <User class="w-3.5 h-3.5 shrink-0" />
            {{ t('nav.tutor') }}
          </button>
          <button
            v-if="isMasterEnabled"
            id="nav-tab-master"
            @click="handleTabClick('master')"
            :class="[
              'px-3.5 py-1.5 text-xs font-black rounded-lg border transition-all duration-150 cursor-pointer select-none flex items-center gap-1.5 active:scale-95',
              activeTab === 'master'
                ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/45 border-indigo-300 dark:border-indigo-700/60 shadow-md ring-2 ring-indigo-500/15'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-100'
            ]"
          >
            <span class="text-sm select-none">👑</span>
            {{ t('nav.master') }}
          </button>
        </nav>
        <!-- User controls and settings combo -->
        <div class="flex items-center gap-2 sm:gap-3 border-l border-slate-250 dark:border-slate-300 pl-2 sm:pl-4 shrink-0">
          <!-- Adaptive User Profile Card (Adapts beautifully to Mobile and Desktop) -->
          <div 
            v-if="userProfile"
            @click="emit('open-profile')"
            class="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 p-1 sm:p-1.5 rounded-xl border border-slate-150 dark:border-slate-800 cursor-pointer transition-all duration-200 shrink-0 group active:scale-95 animate-fadeIn"
            :title="t('header.editProfile')"
          >
            <!-- Avatar circle -->
            <div 
              class="w-7 h-7 sm:w-8 sm:h-8 text-white rounded-lg flex items-center justify-center font-black text-xs sm:text-sm shadow-xs font-mono uppercase shrink-0 relative overflow-hidden"
              :style="{ backgroundColor: primaryColor }"
            >
              <img 
                v-if="userProfile?.photoURL" 
                :src="userProfile.photoURL" 
                alt="Profile" 
                referrerpolicy="no-referrer"
                class="w-full h-full object-cover"
              />
              <template v-else>
                {{ (userProfile?.displayName?.charAt(0) || 'U').toUpperCase() }}
              </template>
              <!-- Subtle hover edit overlay on the avatar -->
              <div class="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="text-[8px] text-white">✏️</span>
              </div>
            </div>
            
            <!-- Mobile Only level icon and edit pencil -->
            <div class="flex sm:hidden items-center gap-1 px-1">
              <div 
                class="p-0.5 rounded bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 flex items-center justify-center"
                :title="t('header.englishLevel')"
              >
                <Award class="w-3 h-3" :style="{ color: primaryColor }" />
              </div>
              <Pencil class="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>

            <!-- Name & Level badge - visible on desktop, beautifully formatted -->
            <div class="hidden sm:flex flex-col text-left leading-tight shrink-0 pl-1">
              <p class="text-xs font-extrabold text-slate-800 dark:text-slate-200 max-w-[100px] md:max-w-[150px] truncate leading-none mb-1 flex items-center gap-1">
                <span>{{ userProfile?.displayName }}</span>
                <Pencil class="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
              </p>
              <span 
                class="text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 leading-none flex items-center gap-1 w-max"
                :style="{ color: primaryColor }"
              >
                <Award class="w-2.5 h-2.5 shrink-0" />
                {{ t('header.level', { level: userProfile?.level || '' }) }}
              </span>
            </div>
          </div>

          <!-- Bilingual Translator Button -->
          <button
            id="btn-lang-toggle"
            type="button"
            @click="toggleLocale"
            :title="t('header.selectLang')"
            class="p-2 rounded-xl transition-all border cursor-pointer flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-200 border-slate-200 dark:border-slate-250 shadow-sm hover:shadow active:scale-95 shrink-0 bg-white dark:bg-slate-100 text-slate-600 hover:text-slate-900"
          >
            <span class="text-sm select-none leading-none">{{ locale === 'pt' ? '🇺🇸' : '🇧🇷' }}</span>
            <span class="uppercase font-black text-[10px] tracking-wider text-slate-700 dark:text-slate-300 select-none">{{ locale === 'pt' ? 'EN' : 'PT' }}</span>
          </button>

          <!-- Theme trigger & settings -->
          <div class="relative shrink-0">
            <button
              type="button"
              @click="showThemePanel = !showThemePanel"
              :title="locale === 'pt' ? 'Personalizar Cores e Tema' : 'Customize Colors & Theme'"
              :class="[
                'p-2 rounded-xl transition-all border cursor-pointer flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-200 border-slate-200 dark:border-slate-250 shadow-sm hover:shadow active:scale-95 shrink-0',
                showThemePanel 
                  ? 'text-white border-transparent bg-transparent' 
                  : 'bg-white dark:bg-slate-100 text-slate-600 hover:text-slate-900'
              ]"
              :style="showThemePanel ? { backgroundColor: primaryColor } : {}"
            >
              <Paintbrush class="w-4 h-4" :class="showThemePanel ? 'text-white' : 'text-blue-600'" />
              <span class="hidden lg:inline text-[10px] font-extrabold" :class="showThemePanel ? 'text-white' : 'text-slate-700'">{{ locale === 'pt' ? 'Tema' : 'Theme' }}</span>
            </button>

            <!-- Dropdown Config Panel -->
            <div v-if="showThemePanel" class="absolute right-0 mt-2.5 w-72 sm:w-80 bg-white dark:bg-slate-100 border border-slate-200 dark:border-slate-250 rounded-2xl shadow-xl p-4 sm:p-5 z-50 text-left space-y-4 animate-fadeIn">
              <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h4 class="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    🎨 {{ locale === 'pt' ? 'Cores & Aparência' : 'Colors & Theme' }}
                  </h4>
                  <p class="text-[9px] text-slate-400 font-bold">{{ locale === 'pt' ? 'Personalize seu ambiente comunitário' : 'Personalize your community space' }}</p>
                </div>
                <button 
                  type="button" 
                  @click="showThemePanel = false"
                  class="text-slate-400 hover:text-slate-900 text-xs font-black leading-none cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              <!-- Dark/Light mode toggle -->
              <div class="space-y-1.5 pb-2 border-b border-slate-100/60">
                <span class="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                  {{ locale === 'pt' ? 'Visualização' : 'Appearance' }}
                </span>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    @click="emit('update:isDarkMode', false)"
                    :class="[
                      'py-1.5 px-2.5 rounded-lg border font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all',
                      !isDarkMode ? 'shadow-xs border-transparent' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    ]"
                    :style="!isDarkMode ? { backgroundColor: primaryColor, borderColor: primaryColor, color: '#ffffff' } : {}"
                  >
                    <Sun class="w-3.5 h-3.5" :style="!isDarkMode ? { color: '#ffffff' } : { color: '#f59e0b' }" />
                    {{ locale === 'pt' ? 'Claro' : 'Light' }}
                  </button>
                  <button
                    type="button"
                    @click="emit('update:isDarkMode', true)"
                    :class="[
                      'py-1.5 px-2.5 rounded-lg border font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all',
                      isDarkMode ? 'shadow-xs border-transparent' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    ]"
                    :style="isDarkMode ? { backgroundColor: primaryColor, borderColor: primaryColor, color: '#ffffff' } : {}"
                  >
                    <Moon class="w-3.5 h-3.5" :style="isDarkMode ? { color: '#ffffff' } : { color: '#6366f1' }" />
                    {{ locale === 'pt' ? 'Escuro' : 'Dark' }}
                  </button>
                </div>
              </div>

              <!-- Color choices -->
              <div class="space-y-1.5">
                <span class="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                  {{ locale === 'pt' ? 'Cor de Destaque' : 'Highlight Color' }}
                </span>
                <div class="grid grid-cols-6 gap-1.5">
                  <button
                    v-for="color in ['#2563EB', '#4F46E5', '#0891B2', '#059669', '#DC2626']"
                    :key="color"
                    type="button"
                    @click="updatePrimaryAndSecondary(color)"
                    :style="{ backgroundColor: color }"
                    class="w-8 h-8 rounded-full border-2 border-slate-100 dark:border-slate-800 hover:scale-110 active:scale-95 cursor-pointer relative"
                    :title="color"
                  >
                    <span v-if="primaryColor === color" class="absolute inset-0 flex items-center justify-center text-white text-xs font-black">✓</span>
                  </button>

                  <!-- Custom HTML Color Picker styled circular button -->
                  <label 
                    class="w-8 h-8 rounded-full border-2 hover:scale-110 active:scale-95 cursor-pointer relative block overflow-hidden shadow-2xs transition-transform"
                    :style="{ 
                      background: !['#2563EB', '#4F46E5', '#0891B2', '#059669', '#DC2626'].includes(primaryColor) 
                        ? primaryColor 
                        : 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' 
                    }"
                    :class="[
                      !['#2563EB', '#4F46E5', '#0891B2', '#059669', '#DC2626'].includes(primaryColor)
                        ? 'border-white dark:border-slate-900 ring-2 ring-blue-500'
                        : 'border-slate-100 dark:border-slate-800'
                    ]"
                    :title="locale === 'pt' ? 'Escolher Cor Personalizada' : 'Choose Custom Color'"
                  >
                    <input 
                      type="color" 
                      :value="primaryColor"
                      @input="handleColorSelect"
                      class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <span 
                      v-if="!['#2563EB', '#4F46E5', '#0891B2', '#059669', '#DC2626'].includes(primaryColor)" 
                      class="absolute inset-0 flex items-center justify-center text-white text-xs font-black mix-blend-difference"
                    >
                      ✓
                    </span>
                    <span 
                      v-else 
                      class="absolute inset-0 flex items-center justify-center text-white text-[11px] font-black drop-shadow-sm select-none"
                    >
                      +
                    </span>
                  </label>
                </div>
              </div>


            </div>
          </div>

          <!-- Logout Button -->
          <button
            id="btn-nav-logout"
            @click="emit('logout')"
            :title="locale === 'pt' ? 'Sair da plataforma' : 'Logout of Platform'"
            class="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded-xl border border-rose-100 dark:border-rose-910/25 cursor-pointer flex items-center justify-center transition-all bg-white dark:bg-slate-100 shadow-xs hover:shadow active:scale-95 shrink-0"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Navigation Bar for Mobile and Small Viewports (Scrollable flex row to prevent cut-offs for tutors/admins) -->
  <div 
    class="md:hidden bg-white dark:bg-slate-50 border-b border-gray-100 dark:border-slate-150 flex items-center justify-start xs:justify-around gap-0.5 xs:gap-1 px-1.5 xs:px-3 py-1.5 overflow-x-auto whitespace-nowrap scrollbar-none flex-nowrap shrink-0 select-none"
    style="-ms-overflow-style: none; scrollbar-width: none;"
  >
    <button
      @click="handleTabClick('courses', true)"
      :class="[
        'flex flex-col items-center gap-0.5 p-1 px-1.5 xs:px-2.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer shrink-0',
        activeTab === 'courses' ? 'text-blue-600 dark:text-slate-900 bg-blue-50/50 dark:bg-slate-150/50' : 'text-slate-600'
      ]"
    >
      <BookOpen class="w-4 h-4 shrink-0" />
      <span class="shrink-0">{{ t('nav.grade') }}</span>
    </button>

    <button
      @click="handleTabClick('scheduler')"
      :class="[
        'flex flex-col items-center gap-0.5 p-1 px-1.5 xs:px-2.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer shrink-0',
        activeTab === 'scheduler' ? 'text-blue-600 dark:text-slate-900 bg-blue-50/50 dark:bg-slate-150/50' : 'text-slate-600'
      ]"
    >
      <Calendar class="w-4 h-4 shrink-0" />
      <span class="shrink-0">{{ t('nav.turmas') }}</span>
    </button>

    <button
      @click="handleTabClick('chats')"
      :class="[
        'flex flex-col items-center gap-0.5 p-1 px-1.5 xs:px-2.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer relative shrink-0',
        activeTab === 'chats' ? 'text-blue-600 dark:text-slate-900 bg-blue-50/50 dark:bg-slate-150/50' : 'text-slate-600'
      ]"
    >
      <div class="relative shrink-0 flex items-center justify-center">
        <MessageSquare class="w-4 h-4 shrink-0" />
        <span 
          v-if="unreadChatsCount" 
          class="absolute -top-1.5 -right-2 bg-red-500 text-white text-[7.5px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white dark:border-slate-50 select-none animate-pulse shrink-0"
        >
          {{ unreadChatsCount }}
        </span>
      </div>
      <span class="shrink-0">{{ t('nav.duvidas') }}</span>
    </button>

    <button
      @click="handleTabClick('tracking')"
      :class="[
        'flex flex-col items-center gap-0.5 p-1 px-1.5 xs:px-2.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer shrink-0',
        activeTab === 'tracking' ? 'text-blue-600 dark:text-slate-900 bg-blue-50/50 dark:bg-slate-150/50' : 'text-slate-600'
      ]"
    >
      <Award class="w-4 h-4 shrink-0" />
      <span class="shrink-0">{{ t('nav.progresso') }}</span>
    </button>

    <button
      v-if="userProfile?.isInstructor || userProfile?.isAdmin"
      @click="handleTabClick('instructor')"
      :class="[
        'flex flex-col items-center gap-0.5 p-1 px-1.5 xs:px-2.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer active:scale-95 shrink-0',
        activeTab === 'instructor' ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/45 border-amber-200 dark:border-amber-900/40' : 'text-slate-600'
      ]"
    >
      <User class="w-4 h-4 shrink-0" />
      <span class="shrink-0">{{ t('nav.tutor') }}</span>
    </button>

    <button
      v-if="isMasterEnabled"
      @click="handleTabClick('master')"
      :class="[
        'flex flex-col items-center gap-0.5 p-1 px-1.5 xs:px-2.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer active:scale-95 shrink-0',
        activeTab === 'master' ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/45 border-indigo-200 dark:border-indigo-900/40' : 'text-slate-600'
      ]"
    >
      <ShieldAlert class="w-4 h-4 shrink-0" />
      <span class="shrink-0">{{ t('nav.master') }}</span>
    </button>
  </div>
</template>
