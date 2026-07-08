<script setup lang="ts">
import { ref } from "vue";
import { Scale, FileText } from "lucide-vue-next";
import { UserProfile } from "../../types";
import { useI18n } from "../../composables/useI18n";

defineProps<{
  onboardName: string;
  onboardRole: "student" | "instructor";
  onboardLevel: UserProfile["level"];
  onboardCode: string;
}>();

defineEmits<{
  (e: "update:onboardName", val: string): void;
  (e: "update:onboardRole", val: "student" | "instructor"): void;
  (e: "update:onboardLevel", val: UserProfile["level"]): void;
  (e: "update:onboardCode", val: string): void;
  (e: "submit"): void;
}>();

const { t, locale } = useI18n();
const lgpdAccepted = ref(false);
const showLgpdModalInOnboard = ref(false);
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-200">
    <form 
      id="form-onboarding"
      @submit.prevent="$emit('submit')" 
      class="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-slate-800 p-8 sm:p-10 shadow-xl space-y-6 text-left animate-fadeIn transition-colors duration-200"
    >
      <div class="text-center space-y-2">
        <h2 class="text-xl font-extrabold text-gray-950 dark:text-white leading-tight">
          {{ t('onboarding.title') }}
        </h2>
        <p class="text-xs text-gray-500 dark:text-slate-400">
          {{ t('onboarding.subtitle') }}
        </p>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            {{ t('profileModal.nameLabel') }}
          </label>
          <input
            id="input-onboard-name"
            type="text"
            required
            class="w-full bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-750 text-xs sm:text-sm border border-gray-250 dark:border-slate-700 rounded-xl p-3 text-slate-950 dark:text-slate-50 font-semibold"
            :value="onboardName"
            @input="$emit('update:onboardName', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {{ t('onboarding.chooseRole') }}
            </label>
            <select
              id="select-onboard-role"
              :value="onboardRole"
              @change="$emit('update:onboardRole', ($event.target as HTMLSelectElement).value as 'student' | 'instructor')"
              class="w-full bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm border border-gray-250 dark:border-slate-700 rounded-xl p-3 cursor-pointer text-gray-700 dark:text-slate-200 font-bold"
            >
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
            <select
              id="select-onboard-level"
              :value="onboardLevel"
              @change="$emit('update:onboardLevel', ($event.target as HTMLSelectElement).value as UserProfile['level'])"
              class="w-full bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm border border-gray-250 dark:border-slate-700 rounded-xl p-3 cursor-pointer text-gray-700 dark:text-slate-200 font-bold"
            >
              <option value="Beginner" class="dark:bg-slate-900">
                {{ t('onboarding.beginner') }}
              </option>
              <option value="Intermediate" class="dark:bg-slate-900">
                {{ t('onboarding.intermediate') }}
              </option>
              <option value="Advanced" class="dark:bg-slate-900">
                {{ t('onboarding.advancedLong') }}
              </option>
              <option value="All" class="dark:bg-slate-900">
                {{ t('onboarding.allLong') }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="onboardRole === 'instructor'" class="space-y-1.5 animate-fadeIn">
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-350 mb-1">
            {{ t('onboarding.teacherCode') }}
          </label>
          <input
            id="input-onboard-code"
            type="text"
            required
            placeholder="Ex: TEACH-XXXX-XXXX"
            class="w-full bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-755 text-xs sm:text-sm border border-gray-200 dark:border-slate-700 rounded-xl p-3 uppercase font-extrabold text-blue-600"
            :value="onboardCode"
            @input="$emit('update:onboardCode', ($event.target as HTMLInputElement).value)"
          />
          <p class="text-[10px] text-gray-400 dark:text-slate-400 font-medium leading-relaxed">
            {{ locale === 'pt' 
              ? 'Professores e voluntários precisam desse token fornecido pelo administrador voluntário para evitar spam ou intrusões na grade de aulas cadastrada.' 
              : 'Teachers and volunteers need this token provided by the volunteer administrator to prevent spam or intrusions into the registered class schedule.' 
            }}
          </p>
        </div>
        <!-- Consent Block for Registration / Google Registrations -->
        <div class="p-3.5 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-left mb-3 shadow-xs">
          <div class="flex items-start gap-2.5">
            <FileText class="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div class="text-[11px] leading-relaxed text-slate-800 dark:text-slate-200">
              <span class="font-extrabold text-slate-900 dark:text-slate-100 block text-xs">
                {{ t('onboarding.termsTitle') }}
              </span>
              {{ locale === 'pt'
                ? 'Para prosseguir com o seu cadastro (incluindo via Google), é obrigatório ler e dar consentimento expresso de processamento para fins pedagógicos.'
                : 'To proceed with your registration (including via Google), it is mandatory to read and give express consent for processing for pedagogical purposes.'
              }}
            </div>
          </div>
          <div class="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="button" 
              @click="showLgpdModalInOnboard = true" 
              class="text-[10px] font-black hover:underline cursor-pointer flex items-center gap-1.5 text-blue-600 dark:text-blue-400"
            >
              <Scale class="w-3.5 h-3.5" />
              {{ t('onboarding.viewFullTerms') }}
            </button>
          </div>
        </div>

        <div class="flex items-start gap-2.5 select-none bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
          <input 
            id="chk-onboard-lgpd"
            type="checkbox"
            v-model="lgpdAccepted"
            class="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer shrink-0"
          />
          <label for="chk-onboard-lgpd" class="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-relaxed cursor-pointer">
            {{ t('onboarding.declarationCheckbox') }}
          </label>
        </div>
      </div>

      <button
        id="btn-submit-onboarding"
        type="submit"
        :disabled="!lgpdAccepted"
        class="w-full py-3.5 text-white font-extrabold text-xs sm:text-sm rounded-2xl transition-all cursor-pointer shadow hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
        style="background-color: var(--primary-color) !important; color: #ffffff !important;"
      >
        {{ t('onboarding.submitButton') }}
      </button>

      <div class="pt-2 text-center select-none text-[10px] text-slate-400 leading-normal">
        {{ t('onboarding.nonProfitAlert') }}
      </div>
    </form>

    <!-- LGPD Full Policy Modal Dialog in Onboarding -->
    <Teleport to="body">
      <div 
        v-if="showLgpdModalInOnboard" 
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 text-left"
      >
        <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 animate-scaleUp shadow-2xl">
          <div class="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 class="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 leading-none">
                <Scale class="w-6 h-6 text-blue-600" />
                {{ t('onboarding.policyGoogleSignup') }}
              </h3>
              <p class="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1.5 uppercase tracking-wider">
                {{ t('onboarding.generalRegulations') }}
              </p>
            </div>
            <button 
              type="button"
              @click="showLgpdModalInOnboard = false"
              class="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xl font-black leading-none p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition"
            >
              ✕
            </button>
          </div>

          <div class="space-y-4 overflow-y-auto max-h-[50vh] pr-4 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 font-medium">
            <p class="font-bold text-slate-900 dark:text-white text-sm sm:text-base border-l-4 pl-3 py-1 border-blue-600">
              {{ t('onboarding.fullPolicyOpening') }}
            </p>
            
            <div class="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850/60 space-y-2.5">
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
            <button
              type="button"
              @click="showLgpdModalInOnboard = false; lgpdAccepted = true"
              class="px-6 py-2.5 text-xs sm:text-sm font-black text-white rounded-xl transition-all duration-150 cursor-pointer shadow-md inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-98"
            >
              {{ t('onboarding.agreeButton') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
