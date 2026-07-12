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
  Pencil,
  Users,
  Menu,
  X
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
const showCommunityPanel = ref(false);
const showMobileMenu = ref(false);

const toggleThemePanel = () => {
  showThemePanel.value = !showThemePanel.value;
  if (showThemePanel.value) {
    showCommunityPanel.value = false;
  }
};

const toggleCommunityPanel = () => {
  showCommunityPanel.value = !showCommunityPanel.value;
  if (showCommunityPanel.value) {
    showThemePanel.value = false;
  }
};

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

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
    <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3 flex items-center justify-between">
      <!-- Brand & Logo -->
      <div class="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer shrink-0 animate-fadeIn" @click="handleTabClick('courses', true)">
        <div class="p-1.5 rounded-xl bg-blue-600 shadow-sm flex items-center justify-center text-white shrink-0 relative">
          <BookMarked id="main-brand-logo" class="w-4 h-4" />
          <!-- Small dot indicator on mobile, hidden on sm where the full badge is shown -->
          <span class="sm:hidden absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-blue-600 shrink-0" :class="isOnline ? 'bg-emerald-500' : 'bg-red-500'"></span>
        </div>
        <div class="flex flex-col text-left">
          <span class="font-black text-[11px] min-[400px]:text-xs sm:text-sm tracking-tight text-slate-900 leading-tight">
            <span class="min-[400px]:hidden">OFGJ</span>
            <span class="hidden min-[400px]:inline">Our First Global Job</span>
          </span>
          <span class="text-[8px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest leading-none mt-0.5 hidden sm:block">Learning App</span>
        </div>
        
        <!-- CONNECTION STATUS BADGE -->
        <span 
          class="hidden sm:flex text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-full items-center gap-1.5 shrink-0 ml-3 sm:ml-5 mr-4 md:mr-8 border border-slate-150 bg-slate-50"
          :title="isOnline ? t('header.connected') : t('header.offlineMode')"
        >
          <span class="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" :class="isOnline ? 'bg-emerald-500' : 'bg-red-500'"></span>
          <span class="text-slate-600">{{ isOnline ? 'Online' : 'Offline' }}</span>
        </span>
      </div>

      <!-- Navigation Controls & User block -->
      <div class="flex items-center gap-1.5 sm:gap-6">
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
            v-if="userProfile?.isInstructor || userProfile?.isAdmin || isMasterEnabled"
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
        <div class="flex items-center gap-1.5 sm:gap-3 border-l border-slate-250 dark:border-slate-300 pl-1.5 sm:pl-4 shrink-0">
          <!-- Adaptive User Profile Card (Adapts beautifully to Mobile and Desktop) -->
          <div 
            v-if="userProfile"
            @click="emit('open-profile')"
            class="flex items-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 p-0.5 sm:p-1 rounded-xl border border-slate-150 dark:border-slate-800 cursor-pointer transition-all duration-200 shrink-0 group active:scale-95 animate-fadeIn"
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

            <!-- Name & Level badge - visible on desktop, beautifully formatted -->
            <div class="hidden sm:flex flex-col text-left leading-tight shrink-0 pl-1.5 pr-0.5">
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
            class="hidden sm:flex w-8 h-8 lg:w-auto lg:h-9 lg:px-3 rounded-xl transition-all border cursor-pointer items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-200 border-slate-200 dark:border-slate-250 shadow-sm hover:shadow active:scale-95 shrink-0 bg-white dark:bg-slate-100 text-slate-600 hover:text-slate-900"
          >
            <span class="text-sm select-none leading-none">{{ locale === 'pt' ? '🇺🇸' : '🇧🇷' }}</span>
            <span class="hidden lg:inline uppercase font-black text-[10px] tracking-wider text-slate-700 dark:text-slate-300 select-none">{{ locale === 'pt' ? 'EN' : 'PT' }}</span>
          </button>

          <!-- Communities Dropdown -->
          <div class="relative shrink-0">
            <button
              id="btn-community-dropdown"
              type="button"
              @click="toggleCommunityPanel"
              :title="locale === 'pt' ? 'Nossas Comunidades' : 'Our Communities'"
              :class="[
                'hidden sm:flex w-8 h-8 lg:w-auto lg:h-9 lg:px-3 items-center justify-center rounded-xl transition-all border cursor-pointer gap-1.5 shadow-sm hover:shadow active:scale-95 shrink-0',
                showCommunityPanel 
                  ? 'text-white border-transparent bg-emerald-600' 
                  : 'bg-white dark:bg-slate-100 border-slate-200 dark:border-slate-250 text-slate-600 hover:text-slate-900'
              ]"
              :style="showCommunityPanel ? { backgroundColor: '#059669', color: '#ffffff' } : {}"
            >
              <Users class="w-4 h-4" :class="showCommunityPanel ? 'text-white' : 'text-emerald-600'" />
              <span class="hidden lg:inline text-[10px] font-black uppercase tracking-wider select-none">
                {{ locale === 'pt' ? 'Comunidades' : 'Communities' }}
              </span>
            </button>

            <!-- Dropdown Community Panel -->
            <div v-if="showCommunityPanel" class="absolute right-0 mt-2.5 w-72 sm:w-80 bg-white dark:bg-slate-100 border border-slate-200 dark:border-slate-250 rounded-2xl shadow-xl p-4 sm:p-5 z-50 text-left space-y-4 animate-fadeIn">
              <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h4 class="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    💬 {{ locale === 'pt' ? 'Nossos Grupos' : 'Our Groups' }}
                  </h4>
                  <p class="text-[9px] text-slate-400 font-bold">
                    {{ locale === 'pt' ? 'Participe dos nossos canais oficiais' : 'Join our official channels' }}
                  </p>
                </div>
                <button 
                  type="button" 
                  @click="showCommunityPanel = false"
                  class="text-slate-400 hover:text-slate-900 text-xs font-black leading-none cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              <!-- Community Cards -->
              <div class="space-y-3">
                <!-- WhatsApp -->
                <a 
                  href="https://chat.whatsapp.com/B5OAkftoHjlAxYb12NRWRA" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="block p-3 bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl transition-all hover:scale-[1.01] hover:shadow-xs group text-left"
                >
                  <div class="flex items-center gap-3">
                    <div class="p-2 bg-emerald-500 rounded-lg text-white shrink-0">
                      <svg class="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <div class="flex-1">
                      <h5 class="font-extrabold text-[11px] text-emerald-950 dark:text-emerald-400 group-hover:underline leading-tight">
                        {{ locale === 'pt' ? 'Grupo do WhatsApp' : 'WhatsApp Group' }}
                      </h5>
                      <p class="text-[9px] text-emerald-700/80 dark:text-emerald-500 font-semibold leading-tight mt-0.5">
                        {{ locale === 'pt' ? 'Avisos de aulas, links e interação rápida.' : 'Class notices, links, and fast interaction.' }}
                      </p>
                    </div>
                  </div>
                </a>

                <!-- Telegram -->
                <a 
                  href="https://t.me/+mwC7pnv770A4MDQx" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="block p-3 bg-sky-50/50 hover:bg-sky-50 dark:bg-sky-950/20 dark:hover:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 rounded-xl transition-all hover:scale-[1.01] hover:shadow-xs group text-left"
                >
                  <div class="flex items-center gap-3">
                    <div class="p-2 bg-sky-500 rounded-lg text-white shrink-0">
                      <svg class="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.18l-1.91 9c-.14.65-.53.81-1.08.5l-2.91-2.15-1.4 1.35c-.15.15-.28.27-.58.27l.21-2.97 5.41-4.89c.23-.21-.05-.33-.36-.12L10 13.01l-2.88-.9c-.63-.2-1.25-.33-.63-.57l11.23-4.33c.52-.19.98.12.84.97z"/>
                      </svg>
                    </div>
                    <div class="flex-1">
                      <h5 class="font-extrabold text-[11px] text-sky-950 dark:text-sky-400 group-hover:underline leading-tight">
                        {{ locale === 'pt' ? 'Canal do Telegram' : 'Telegram Channel' }}
                      </h5>
                      <p class="text-[9px] text-sky-700/80 dark:text-sky-500 font-semibold leading-tight mt-0.5">
                        {{ locale === 'pt' ? 'Avisos importantes e materiais de estudo.' : 'Important notices and study materials.' }}
                      </p>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <!-- Theme trigger & settings -->
          <div class="relative shrink-0">
            <button
              type="button"
              @click="toggleThemePanel"
              :title="t('header.themeTitle')"
              :class="[
                'hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 lg:w-auto lg:px-3 items-center justify-center rounded-xl transition-all border cursor-pointer gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-200 border-slate-200 dark:border-slate-250 shadow-sm hover:shadow active:scale-95 shrink-0',
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
                    🎨 {{ t('header.colorsAppearance') }}
                  </h4>
                  <p class="text-[9px] text-slate-400 font-bold">{{ t('header.themeSub') }}</p>
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
                  {{ t('header.visual') }}
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
                    {{ t('header.light') }}
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
                    {{ t('header.dark') }}
                  </button>
                </div>
              </div>

              <!-- Color choices -->
              <div class="space-y-1.5">
                <span class="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                  {{ t('header.highlight') }}
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
                    :title="t('header.customColor')"
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
            :title="t('header.logoutTitle')"
            class="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 items-center justify-center text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded-xl border border-rose-100 dark:border-rose-910/25 cursor-pointer transition-all bg-white dark:bg-slate-100 shadow-xs hover:shadow active:scale-95 shrink-0"
          >
            <LogOut class="w-4 h-4" />
          </button>

          <!-- Mobile Menu Button (Only visible on screens < sm) -->
          <button
            id="btn-mobile-menu"
            type="button"
            @click="toggleMobileMenu"
            :class="[
              'sm:hidden w-8 h-8 flex items-center justify-center rounded-xl transition-all border cursor-pointer gap-1.5 shadow-sm active:scale-95 shrink-0',
              showMobileMenu 
                ? 'text-white border-transparent' 
                : 'bg-white dark:bg-slate-100 border-slate-200 dark:border-slate-250 text-slate-600 hover:text-slate-900'
            ]"
            :style="showMobileMenu ? { backgroundColor: primaryColor, color: '#ffffff' } : {}"
          >
            <Menu class="w-4.5 h-4.5" />
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
      v-if="userProfile?.isInstructor || userProfile?.isAdmin || isMasterEnabled"
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

  <!-- Mobile Menu Drawer (Slide-over right panel, hidden on sm and above) -->
  <div v-if="showMobileMenu" class="sm:hidden fixed inset-0 z-50">
    <!-- Backdrop Overlay with blur effect -->
    <div 
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
      @click="showMobileMenu = false"
    ></div>

    <!-- Drawer Panel (slide-over) -->
    <div 
      class="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-slate-900 border-l border-slate-150 dark:border-slate-850 shadow-2xl flex flex-col z-50 overflow-hidden transform transition-transform duration-300 translate-x-0"
    >
      <!-- Drawer Header -->
      <div class="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/20">
        <div class="flex items-center gap-2">
          <span class="text-base select-none">⚙️</span>
          <span class="font-black text-[11px] uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {{ locale === 'pt' ? 'Configurações' : 'Settings' }}
          </span>
        </div>
        <button 
          type="button" 
          @click="showMobileMenu = false"
          class="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-150 dark:border-slate-750 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Drawer Scrollable Content -->
      <div class="flex-1 overflow-y-auto p-5 space-y-6 text-left">
        <!-- User Quick Info -->
        <div v-if="userProfile" class="bg-slate-50 dark:bg-slate-950/25 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-3">
          <div class="flex items-center gap-3">
            <div 
              class="w-10 h-10 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-sm font-mono uppercase shrink-0 relative overflow-hidden"
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
            </div>
            <div>
              <h4 class="font-black text-xs text-slate-900 dark:text-white leading-tight">
                {{ userProfile?.displayName }}
              </h4>
              <p class="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 truncate max-w-[180px]">
                {{ userProfile?.email }}
              </p>
            </div>
          </div>
          
          <div class="flex items-center justify-between pt-2.5 border-t border-slate-200/60 dark:border-slate-800/50">
            <span 
              class="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded bg-white dark:bg-slate-850 border border-slate-150 dark:border-slate-750 leading-none flex items-center gap-1"
              :style="{ color: primaryColor }"
            >
              <Award class="w-3 h-3 shrink-0" />
              {{ t('header.level', { level: userProfile?.level || '' }) }}
            </span>
            <div class="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span class="w-2 h-2 rounded-full animate-pulse" :class="isOnline ? 'bg-emerald-500' : 'bg-red-500'"></span>
              <span>{{ isOnline ? 'Online' : 'Offline' }}</span>
            </div>
          </div>
        </div>

        <!-- 1. Language Section -->
        <div class="space-y-2">
          <h4 class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            🌐 {{ locale === 'pt' ? 'Idioma / Language' : 'Language / Idioma' }}
          </h4>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="setLocale('pt')"
              :class="[
                'py-2 px-3 rounded-xl border font-black text-[11px] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95',
                locale === 'pt' 
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white' 
                  : 'bg-white dark:bg-slate-950/25 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              ]"
              :style="locale === 'pt' ? { borderColor: primaryColor, borderWidth: '2px' } : {}"
            >
              <span class="text-sm">🇧🇷</span>
              <span>Português</span>
            </button>
            <button
              type="button"
              @click="setLocale('en')"
              :class="[
                'py-2 px-3 rounded-xl border font-black text-[11px] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95',
                locale === 'en' 
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white' 
                  : 'bg-white dark:bg-slate-950/25 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              ]"
              :style="locale === 'en' ? { borderColor: primaryColor, borderWidth: '2px' } : {}"
            >
              <span class="text-sm">🇺🇸</span>
              <span>English</span>
            </button>
          </div>
        </div>

        <!-- 2. Communities Section -->
        <div class="space-y-2">
          <h4 class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            💬 {{ locale === 'pt' ? 'Nossas Comunidades' : 'Our Communities' }}
          </h4>
          <div class="space-y-2.5">
            <!-- WhatsApp -->
            <a 
              href="https://chat.whatsapp.com/B5OAkftoHjlAxYb12NRWRA" 
              target="_blank" 
              rel="noopener noreferrer"
              class="block p-3.5 bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl transition-all active:scale-[0.98] group"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 bg-emerald-500 rounded-lg text-white shrink-0 shadow-sm shadow-emerald-500/20">
                  <svg class="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <h5 class="font-extrabold text-[11px] text-emerald-950 dark:text-emerald-400 group-hover:underline leading-none">
                    {{ locale === 'pt' ? 'Grupo do WhatsApp' : 'WhatsApp Group' }}
                  </h5>
                  <p class="text-[9px] text-emerald-700/80 dark:text-emerald-500/70 font-bold mt-1 leading-tight">
                    {{ locale === 'pt' ? 'Avisos de aulas, links e interação rápida.' : 'Class notices, links, and fast interaction.' }}
                  </p>
                </div>
              </div>
            </a>

            <!-- Telegram -->
            <a 
              href="https://t.me/+mwC7pnv770A4MDQx" 
              target="_blank" 
              rel="noopener noreferrer"
              class="block p-3.5 bg-sky-50/50 hover:bg-sky-50 dark:bg-sky-950/10 dark:hover:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/40 rounded-xl transition-all active:scale-[0.98] group"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 bg-sky-500 rounded-lg text-white shrink-0 shadow-sm shadow-sky-500/20">
                  <svg class="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.18l-1.91 9c-.14.65-.53.81-1.08.5l-2.91-2.15-1.4 1.35c-.15.15-.28.27-.58.27l.21-2.97 5.41-4.89c.23-.21-.05-.33-.36-.12L10 13.01l-2.88-.9c-.63-.2-1.25-.33-.63-.57l11.23-4.33c.52-.19.98.12.84.97z"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <h5 class="font-extrabold text-[11px] text-sky-950 dark:text-sky-400 group-hover:underline leading-none">
                    {{ locale === 'pt' ? 'Canal do Telegram' : 'Telegram Channel' }}
                  </h5>
                  <p class="text-[9px] text-sky-700/80 dark:text-sky-500/70 font-bold mt-1 leading-tight">
                    {{ locale === 'pt' ? 'Avisos importantes e materiais de estudo.' : 'Important notices and study materials.' }}
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>

        <!-- 3. Appearance Section -->
        <div class="space-y-3 pb-4">
          <h4 class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            🎨 {{ t('header.colorsAppearance') }}
          </h4>
          
          <div class="space-y-1.5">
            <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {{ t('header.visual') }}
            </span>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="emit('update:isDarkMode', false)"
                :class="[
                  'py-2 px-3 rounded-xl border font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95',
                  !isDarkMode ? 'shadow-xs border-transparent text-white font-black' : 'bg-white dark:bg-slate-950/25 border-slate-200 dark:border-slate-800 text-slate-500'
                ]"
                :style="!isDarkMode ? { backgroundColor: primaryColor } : {}"
              >
                <Sun class="w-3.5 h-3.5" :style="!isDarkMode ? { color: '#ffffff' } : { color: '#f59e0b' }" />
                {{ t('header.light') }}
              </button>
              <button
                type="button"
                @click="emit('update:isDarkMode', true)"
                :class="[
                  'py-2 px-3 rounded-xl border font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95',
                  isDarkMode ? 'shadow-xs border-transparent text-white font-black' : 'bg-white dark:bg-slate-950/25 border-slate-200 dark:border-slate-800 text-slate-500'
                ]"
                :style="isDarkMode ? { backgroundColor: primaryColor } : {}"
              >
                <Moon class="w-3.5 h-3.5" :style="isDarkMode ? { color: '#ffffff' } : { color: '#6366f1' }" />
                {{ t('header.dark') }}
              </button>
            </div>
          </div>

          <div class="space-y-1.5">
            <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {{ t('header.highlight') }}
            </span>
            <div class="grid grid-cols-6 gap-2">
              <button
                v-for="color in ['#2563EB', '#4F46E5', '#0891B2', '#059669', '#DC2626']"
                :key="color"
                type="button"
                @click="updatePrimaryAndSecondary(color)"
                :style="{ backgroundColor: color }"
                class="w-9 h-9 rounded-full border-2 border-slate-100 dark:border-slate-800 hover:scale-105 active:scale-95 cursor-pointer relative"
              >
                <span v-if="primaryColor === color" class="absolute inset-0 flex items-center justify-center text-white text-xs font-black">✓</span>
              </button>

              <label 
                class="w-9 h-9 rounded-full border-2 hover:scale-105 active:scale-95 cursor-pointer relative block overflow-hidden shadow-2xs transition-transform"
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
                  class="absolute inset-0 flex items-center justify-center text-white text-xs font-black drop-shadow-sm select-none"
                >
                  +
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Drawer Footer (Sticky Logout) -->
      <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
        <button
          type="button"
          @click="emit('logout')"
          class="w-full py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 hover:border-rose-200 cursor-pointer transition-all bg-white dark:bg-slate-800 shadow-xs active:scale-95"
        >
          <LogOut class="w-4 h-4" />
          <span>{{ locale === 'pt' ? 'Sair do Aplicativo' : 'Log Out App' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
