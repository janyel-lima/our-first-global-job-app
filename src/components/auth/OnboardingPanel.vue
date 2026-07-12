<script setup lang="ts">
import { FileText, Scale } from "lucide-vue-next";
import { ref } from "vue";
import { useI18n } from "../../composables/useI18n";
import { UserProfile } from "../../types";

defineProps<{
  onboardName: string;
  onboardRole: "student" | "instructor";
  onboardLevel: UserProfile["level"];
  onboardCode: string;
}>();

const emit = defineEmits<{
  (e: "update:onboardName", val: string): void;
  (e: "update:onboardRole", val: "student" | "instructor"): void;
  (e: "update:onboardLevel", val: UserProfile["level"]): void;
  (e: "update:onboardCode", val: string): void;
  (e: "submit"): void;
}>();

const { t, locale } = useI18n();
const lgpdAccepted = ref(false);
const showLgpdModalInOnboard = ref(false);

const currentStep = ref(1);

const handleNextOrSubmit = () => {
  if (currentStep.value === 1) {
    currentStep.value = 2;
  } else {
    emit("submit");
  }
};
</script>

<template>
  <div
    class="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-200">
    <form id="form-onboarding" @submit.prevent="handleNextOrSubmit"
      class="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-slate-800 p-8 sm:p-10 shadow-xl space-y-6 text-left animate-fadeIn transition-colors duration-200">
      <!-- Step Indicator Dots -->
      <div class="flex items-center justify-center gap-2">
        <div class="h-1.5 rounded-full transition-all duration-300"
          :class="currentStep === 1 ? 'w-8 bg-blue-600' : 'w-1.5 bg-slate-200 dark:bg-slate-700'"></div>
        <div class="h-1.5 rounded-full transition-all duration-300"
          :class="currentStep === 2 ? 'w-8 bg-blue-600' : 'w-1.5 bg-slate-200 dark:bg-slate-700'"></div>
      </div>

      <div class="text-center space-y-2">
        <h2 class="text-xl font-extrabold text-gray-950 dark:text-white leading-tight">
          {{ currentStep === 1 ? t('onboarding.title') : t('onboarding.step2Title') }}
        </h2>
        <p class="text-xs text-gray-500 dark:text-slate-400">
          {{ currentStep === 1 ? t('onboarding.subtitle') : t('onboarding.step2Subtitle') }}
        </p>
      </div>

      <!-- STEP 1: Profile Customization -->
      <div v-if="currentStep === 1" class="space-y-4 animate-fadeIn">
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            {{ t('profileModal.nameLabel') }}
          </label>
          <input id="input-onboard-name" type="text" required
            class="w-full bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-750 text-xs sm:text-sm border border-gray-250 dark:border-slate-700 rounded-xl p-3 text-slate-950 dark:text-slate-50 font-semibold"
            :value="onboardName" @input="$emit('update:onboardName', ($event.target as HTMLInputElement).value)" />
        </div>

        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {{ t('onboarding.chooseRole') }}
            </label>
            <select id="select-onboard-role" :value="onboardRole"
              @change="$emit('update:onboardRole', ($event.target as HTMLSelectElement).value as 'student' | 'instructor')"
              class="w-full bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm border border-gray-250 dark:border-slate-700 rounded-xl p-3 cursor-pointer text-gray-700 dark:text-slate-200 font-bold">
              <option value="student" class="dark:bg-slate-900">
                {{ t('onboarding.student') }}
              </option>
              <option value="instructor" class="dark:bg-slate-900">
                {{ t('onboarding.instructor') }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {{ t('profileModal.levelLabel') }}
            </label>
            <select id="select-onboard-level" :value="onboardLevel"
              @change="$emit('update:onboardLevel', ($event.target as HTMLSelectElement).value as UserProfile['level'])"
              class="w-full bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm border border-gray-250 dark:border-slate-700 rounded-xl p-3 cursor-pointer text-gray-700 dark:text-slate-200 font-bold">
              <option value="Beginner" class="dark:bg-slate-900">
                {{ t('onboarding.beginner') }}
              </option>
              <option value="Intermediate" class="dark:bg-slate-900">
                {{ t('onboarding.intermediate') }}
              </option>
              <option value="Advanced" class="dark:bg-slate-900">
                {{ t('onboarding.advanced') }}
              </option>
              <option value="All" class="dark:bg-slate-900">
                {{ t('onboarding.all') }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="onboardRole === 'instructor'" class="space-y-1.5 animate-fadeIn">
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-350 mb-1">
            {{ t('onboarding.teacherCode') }}
          </label>
          <input id="input-onboard-code" type="text" required placeholder="Ex: TEACH-XXXX-XXXX"
            class="w-full bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-755 text-xs sm:text-sm border border-gray-200 dark:border-slate-700 rounded-xl p-3 uppercase font-extrabold text-blue-600"
            :value="onboardCode" @input="$emit('update:onboardCode', ($event.target as HTMLInputElement).value)" />
          <p class="text-[10px] text-gray-400 dark:text-slate-400 font-medium leading-relaxed">
            {{ t('onboarding.teacherCodeNote') }}
          </p>
        </div>

        <!-- Consent Block for Registration / Google Registrations -->
        <div
          class="p-3.5 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-left mb-3 shadow-xs">
          <div class="flex items-start gap-2.5">
            <FileText class="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div class="text-[11px] leading-relaxed text-slate-800 dark:text-slate-200">
              <span class="font-extrabold text-slate-900 dark:text-slate-100 block text-xs">
                {{ t('onboarding.termsTitle') }}
              </span>
              {{ t('onboarding.consentText') }}
            </div>
          </div>
          <div class="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" @click="showLgpdModalInOnboard = true"
              class="text-[10px] font-black hover:underline cursor-pointer flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <Scale class="w-3.5 h-3.5" />
              {{ t('onboarding.viewFullTerms') }}
            </button>
          </div>
        </div>

        <div
          class="flex items-start gap-2.5 select-none bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
          <input id="chk-onboard-lgpd" type="checkbox" v-model="lgpdAccepted"
            class="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer shrink-0" />
          <label for="chk-onboard-lgpd"
            class="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-relaxed cursor-pointer">
            {{ t('onboarding.declarationCheckbox') }}
          </label>
        </div>

        <button id="btn-submit-onboarding-next" type="submit" :disabled="!lgpdAccepted"
          class="w-full py-3.5 text-white font-extrabold text-xs sm:text-sm rounded-2xl transition-all cursor-pointer shadow hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-center"
          style="background-color: var(--primary-color) !important; color: #ffffff !important;">
          {{ t('onboarding.continueButton') }}
        </button>
      </div>

      <!-- STEP 2: Social Media & Group Integration -->
      <div v-if="currentStep === 2" class="space-y-6 animate-fadeIn">
        <div class="space-y-4">
          <!-- WhatsApp Card -->
          <a href="https://chat.whatsapp.com/LiZZEd9O4ko7hYQhXIQq44" target="_blank" rel="noopener noreferrer"
            class="block p-4 bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl transition-all hover:scale-[1.01] hover:shadow-sm group text-left">
            <div class="flex items-center gap-4">
              <!-- WhatsApp Icon SVG -->
              <div class="p-2.5 bg-emerald-500 rounded-xl text-white shadow-md shadow-emerald-500/20 shrink-0">
                <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path
                    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div class="flex-1">
                <h4
                  class="font-extrabold text-xs sm:text-sm text-emerald-950 dark:text-emerald-400 group-hover:underline">
                  {{ t('onboarding.whatsappTitle') }}
                </h4>
                <p class="text-[10px] text-emerald-700/80 dark:text-emerald-500 font-semibold mt-0.5 leading-snug">
                  {{ t('onboarding.whatsappDesc') }}
                </p>
              </div>
              <div
                class="text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider shrink-0 bg-emerald-100 dark:bg-emerald-950 px-2 py-1 rounded-lg">
                {{ t('onboarding.joinLabel') }}
              </div>
            </div>
          </a>

          <!-- Telegram Card -->
          <a href="https://t.me/+mwC7pnv770A4MDQx" target="_blank" rel="noopener noreferrer"
            class="block p-4 bg-sky-50/50 hover:bg-sky-50 dark:bg-sky-950/20 dark:hover:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 rounded-2xl transition-all hover:scale-[1.01] hover:shadow-sm group text-left">
            <div class="flex items-center gap-4">
              <!-- Telegram Icon SVG -->
              <div class="p-2.5 bg-sky-500 rounded-xl text-white shadow-md shadow-sky-500/20 shrink-0">
                <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path
                    d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.18l-1.91 9c-.14.65-.53.81-1.08.5l-2.91-2.15-1.4 1.35c-.15.15-.28.27-.58.27l.21-2.97 5.41-4.89c.23-.21-.05-.33-.36-.12L10 13.01l-2.88-.9c-.63-.2-1.25-.33-.63-.57l11.23-4.33c.52-.19.98.12.84.97z" />
                </svg>
              </div>
              <div class="flex-1">
                <h4 class="font-extrabold text-xs sm:text-sm text-sky-950 dark:text-sky-400 group-hover:underline">
                  {{ t('onboarding.telegramTitle') }}
                </h4>
                <p class="text-[10px] text-sky-700/80 dark:text-sky-500 font-semibold mt-0.5 leading-snug">
                  {{ t('onboarding.telegramDesc') }}
                </p>
              </div>
              <div
                class="text-sky-600 dark:text-sky-400 font-extrabold text-[10px] uppercase tracking-wider shrink-0 bg-sky-100 dark:bg-sky-950 px-2 py-1 rounded-lg">
                {{ t('onboarding.joinLabel') }}
              </div>
            </div>
          </a>
        </div>

        <div class="flex gap-3 pt-2">
          <button type="button" @click="currentStep = 1"
            class="flex-1 py-3 text-slate-700 dark:text-slate-300 font-extrabold text-xs sm:text-sm rounded-2xl transition-all border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer text-center">
            {{ t('onboarding.backButton') }}
          </button>
          <button id="btn-submit-onboarding" type="submit"
            class="flex-[2] py-3 text-white font-extrabold text-xs sm:text-sm rounded-2xl transition-all cursor-pointer shadow hover:brightness-110 text-center"
            style="background-color: var(--primary-color) !important; color: #ffffff !important;">
            {{ t('onboarding.submitButton') }}
          </button>
        </div>
      </div>

      <div class="pt-2 text-center select-none text-[10px] text-slate-400 leading-normal">
        {{ t('onboarding.nonProfitAlert') }}
      </div>
    </form>

    <!-- LGPD Full Policy Modal Dialog in Onboarding -->
    <Teleport to="body">
      <div v-if="showLgpdModalInOnboard"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 text-left">
        <div
          class="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 animate-scaleUp shadow-2xl">
          <div class="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3
                class="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 leading-none">
                <Scale class="w-6 h-6 text-blue-600" />
                {{ t('onboarding.policyGoogleSignup') }}
              </h3>
              <p class="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1.5 uppercase tracking-wider">
                {{ t('onboarding.generalRegulations') }}
              </p>
            </div>
            <button type="button" @click="showLgpdModalInOnboard = false"
              class="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xl font-black leading-none p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition">
              ✕
            </button>
          </div>

          <div
            class="space-y-4 overflow-y-auto max-h-[50vh] pr-4 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 font-medium">
            <p
              class="font-bold text-slate-900 dark:text-white text-sm sm:text-base border-l-4 pl-3 py-1 border-blue-600">
              {{ t('onboarding.fullPolicyOpening') }}
            </p>

            <div
              class="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850/60 space-y-2.5">
              <div class="space-y-1.5">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  {{ t('onboarding.policyTitle1') }}
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">
                  {{ t('onboarding.policyContent1') }}
                </p>
              </div>

              <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850/40">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  {{ t('onboarding.policyTitle2') }}
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">
                  {{ t('onboarding.policyContent2') }}
                </p>
              </div>

              <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850/40">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  {{ t('onboarding.policyTitle3') }}
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">
                  {{ t('onboarding.policyContent3') }}
                </p>
              </div>

              <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850/40">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  {{ t('onboarding.policyTitle4') }}
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">
                  {{ t('onboarding.policyContent4') }}
                </p>
              </div>

              <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850/40">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  {{ t('onboarding.policyTitle5') }}
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">
                  {{ t('onboarding.policyContent5') }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end border-t border-slate-100 dark:border-slate-800 pt-5">
            <button type="button" @click="showLgpdModalInOnboard = false; lgpdAccepted = true"
              class="px-6 py-2.5 text-xs sm:text-sm font-black text-white rounded-xl transition-all duration-150 cursor-pointer shadow-md inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-98">
              {{ t('onboarding.agreeButton') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
