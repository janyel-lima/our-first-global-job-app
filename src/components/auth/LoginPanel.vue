<script setup lang="ts">
import { ref, computed } from 'vue';
import { Compass, Mail, Lock, User, Check, Scale, Eye, EyeOff, FileText, AlertTriangle } from 'lucide-vue-next';
import { useI18n } from '../../composables/useI18n';

const { t, locale } = useI18n();


const props = defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'google-login'): void;
  (e: 'email-login', data: { email: string, pass: string }): void;
  (e: 'email-signup', data: { name: string, email: string, pass: string }): void;
}>();

// Tabs: "login" (Entrar) | "register" (Criar Conta)
const activeSubTab = ref<'login' | 'register'>('login');

// Non-admin email password states
const userEmail = ref('');
const userPassword = ref('');
const userConfirmPassword = ref('');
const userName = ref('');
const userLgpdAccepted = ref(false);
const hasReadTerms = ref(false);
const showPassword = ref(false);
const showRegisterPassword = ref(false);
const showRegisterConfirmPassword = ref(false);
const showLgpdModal = ref(false);
const localError = ref('');
const localLoading = ref(false);

const isLoading = computed(() => localLoading.value || props.loading || false);

const openLgpdModal = () => {
  showLgpdModal.value = true;
  hasReadTerms.value = true;
};

const handleUserLogin = async () => {
  if (!userEmail.value.trim() || !userPassword.value) {
    localError.value = "Por favor, preencha o e-mail e a senha.";
    return;
  }
  localError.value = "";
  localLoading.value = true;
  try {
    emit('email-login', { email: userEmail.value.trim(), pass: userPassword.value });
  } catch (err: any) {
    localError.value = err.message || "Falha no login.";
  } finally {
    localLoading.value = false;
  }
};

const passMinLength = computed(() => userPassword.value.length >= 8);
const passHasSpecial = computed(() => /[!@#$%^&*(),.?":{}|<>\-_=+]/.test(userPassword.value));
const passHasUpper = computed(() => /[A-Z]/.test(userPassword.value));
const passHasLower = computed(() => /[a-z]/.test(userPassword.value));
const passHasNumber = computed(() => /[0-9]/.test(userPassword.value));

const passScore = computed(() => {
  let score = 0;
  if (passMinLength.value) score++;
  if (passHasSpecial.value) score++;
  if (passHasUpper.value) score++;
  if (passHasLower.value) score++;
  if (passHasNumber.value) score++;
  return score;
});

const isPassValid = computed(() => {
  return passMinLength.value && passHasSpecial.value && passHasUpper.value && passHasLower.value && passHasNumber.value;
});

const passStrengthLabel = computed(() => {
  if (!userPassword.value) return { text: 'Não informada', color: 'text-slate-400 dark:text-slate-500', barBg: 'bg-slate-250 dark:bg-slate-800', width: 'w-0' };
  const score = passScore.value;
  if (score <= 2) return { text: 'Fraca ⚠️', color: 'text-rose-500', barBg: 'bg-rose-500', width: 'w-1/4' };
  if (score === 3) return { text: 'Média ⚡', color: 'text-amber-500', barBg: 'bg-amber-500', width: 'w-2/4' };
  if (score === 4) return { text: 'Forte 💪', color: 'text-blue-500', barBg: 'bg-blue-500', width: 'w-3/4' };
  return { text: 'Excelente ✨', color: 'text-emerald-500 dark:text-emerald-400', barBg: 'bg-emerald-500', width: 'w-full' };
});

const handleUserSignUp = async () => {
  if (!userName.value.trim() || !userEmail.value.trim() || !userPassword.value || !userConfirmPassword.value) {
    localError.value = "Por favor, preencha todos os campos cadastrais, incluindo a repetição da senha.";
    return;
  }
  if (!isPassValid.value) {
    localError.value = "Sua senha deve atender a todos os requisitos mínimos de segurança destacados abaixo.";
    return;
  }
  if (userPassword.value !== userConfirmPassword.value) {
    localError.value = "As senhas digitadas não coincidem. Certifique-se de repetir exatamente a mesma senha.";
    return;
  }
  if (!userLgpdAccepted.value) {
    localError.value = "É obrigatório aceitar os termos de consentimento da LGPD para voluntariado.";
    return;
  }
  if (!hasReadTerms.value) {
    localError.value = "Por favor, abra e consulte os termos de privacidade completos na íntegra clicando no link antes de aceitar.";
    openLgpdModal();
    return;
  }
  localError.value = "";
  localLoading.value = true;
  try {
    emit('email-signup', {
      name: userName.value.trim(),
      email: userEmail.value.trim(),
      pass: userPassword.value
    });
  } catch (err: any) {
    localError.value = err.message || "Falha no cadastro.";
  } finally {
    localLoading.value = false;
  }
};

const handleGoogleLogin = () => {
  localError.value = "";
  emit('google-login');
};
</script>

<template>
  <div id="login-panel" class="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-6 text-center animate-fadeIn">
    
    <!-- Top Header -->
    <div class="space-y-3">
      <div class="inline-flex p-2.5 bg-blue-50/80 dark:bg-blue-950/50 rounded-2xl mx-auto border border-blue-100 dark:border-blue-900/40 shadow-xs">
        <img 
          src="/icon-login.svg" 
          alt="Our First Global Job Logo" 
          class="w-12 h-12 object-contain rounded-xl hover:scale-105 transition-transform duration-300" 
        />
      </div>
      <div class="space-y-1">
        <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">{{ t('auth.title') }}</h1>
        <p class="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto leading-relaxed font-semibold">
          {{ t('auth.subtitle') }}
        </p>
      </div>
    </div>

    <!-- Regular Student/Mentor Login/Register Flows -->
    <div class="space-y-4">
      
      <!-- Selection Tabs: Entrar vs Criar Conta -->
      <div class="bg-slate-100 dark:bg-slate-950 p-1 rounded-xl grid grid-cols-2 gap-1 border border-transparent dark:border-slate-800">
        <button
          type="button"
          @click="activeSubTab = 'login'; localError = ''"
          :class="[
            'py-2 text-xs font-black rounded-lg transition-all cursor-pointer',
            activeSubTab === 'login' 
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          ]"
        >
          {{ t('auth.login') }}
        </button>
        <button
          type="button"
          @click="activeSubTab = 'register'; localError = ''"
          :class="[
            'py-2 text-xs font-black rounded-lg transition-all cursor-pointer',
            activeSubTab === 'register' 
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          ]"
        >
          {{ t('auth.register') }}
        </button>
      </div>

      <!-- Tab 1: Email Password Login -->
      <div v-if="activeSubTab === 'login'" class="space-y-4 text-left animate-fadeIn">
        <form @submit.prevent="handleUserLogin" class="space-y-3 pt-1">
          <div>
            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Seu E-mail</label>
            <div class="relative">
              <Mail class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="email"
                required
                v-model="userEmail"
                placeholder="nome@email.com"
                class="w-full text-xs bg-slate-50 dark:bg-slate-950 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl p-3 pl-10 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Sua Senha</label>
            <div class="relative">
              <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                :type="showPassword ? 'text' : 'password'"
                required
                v-model="userPassword"
                placeholder="Sua senha de acesso"
                class="w-full text-xs bg-slate-50 dark:bg-slate-950 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl p-3 pl-10 pr-10 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden font-medium text-slate-900"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-hidden cursor-pointer flex items-center justify-center"
                title="Mostrar/Ocultar Senha"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div v-if="localError" class="text-xs text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/30 p-3 rounded-lg border border-rose-100 dark:border-rose-900/40 animate-fadeIn">
            ⚠️ {{ localError }}
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style="background-color: var(--primary-color) !important; color: #ffffff !important;"
          >
            <span v-if="isLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>Acessar Plataforma</span>
          </button>
        </form>

        <div class="relative flex py-2 items-center">
          <div class="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
          <span class="flex-shrink mx-4 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">ou entre com</span>
          <div class="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
        </div>

        <button
          id="btn-login-google"
          @click="handleGoogleLogin"
          :disabled="isLoading"
          class="w-full py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-xs active:scale-95 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span class="font-extrabold text-slate-800 dark:text-slate-100">Entrar com Google</span>
        </button>
      </div>

      <!-- Tab 2: Register/Email Sign Up (Includes LGPD and validation) -->
      <div v-else class="space-y-4 text-left animate-fadeIn">
        <form @submit.prevent="handleUserSignUp" class="space-y-3.5 pt-1">
          <div>
            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
            <div class="relative">
              <User class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                required
                v-model="userName"
                placeholder="Como quer ser chamado(a)"
                class="w-full text-xs bg-slate-50 dark:bg-slate-950 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl p-3 pl-10 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">E-mail para Acesso</label>
            <div class="relative">
              <Mail class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="email"
                required
                v-model="userEmail"
                placeholder="seuemail@exemplo.com"
                class="w-full text-xs bg-slate-50 dark:bg-slate-950 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl p-3 pl-10 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-1 select-none">
              <label class="block text-[10px] font-bold text-gray-500 uppercase">Definir Senha de Acesso</label>
              <div v-if="userPassword" class="text-[10px] font-bold flex items-center gap-1">
                <span>Força:</span>
                <span :class="passStrengthLabel.color" class="font-extrabold">{{ passStrengthLabel.text }}</span>
              </div>
            </div>
            <div class="relative mb-2">
              <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                :type="showRegisterPassword ? 'text' : 'password'"
                required
                v-model="userPassword"
                placeholder="Ex: P@ssword123"
                class="w-full text-xs bg-slate-50 dark:bg-slate-950 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl p-3 pl-10 pr-10 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden font-medium text-slate-900"
              />
              <button
                type="button"
                @click="showRegisterPassword = !showRegisterPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-hidden cursor-pointer flex items-center justify-center"
                title="Mostrar/Ocultar Senha"
              >
                <EyeOff v-if="showRegisterPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>

            <!-- Password strength progress bar -->
            <div class="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden mb-3">
              <div 
                class="h-full transition-all duration-300"
                :class="passStrengthLabel.barBg"
                :style="{ width: userPassword ? (passScore === 1 ? '20%' : passScore === 2 ? '40%' : passScore === 3 ? '60%' : passScore === 4 ? '80%' : '100%') : '0%' }"
              ></div>
            </div>

            <!-- Dynamic Password Criteria Checklist -->
            <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-155 dark:border-slate-850/60 space-y-2 select-none text-[10.5px]">
              <span class="text-[9.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Critérios de Segurança Obrigatórios:</span>
              <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-600 dark:text-slate-400 font-medium">
                <div class="flex items-center gap-1.5">
                  <Check v-if="passMinLength" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span v-else class="w-3.5 h-3.5 text-rose-500 font-extrabold shrink-0 text-center leading-none">✕</span>
                  <span :class="{ 'text-emerald-600 dark:text-emerald-400 font-bold': passMinLength }">Mínimo 8 caracteres</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Check v-if="passHasSpecial" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span v-else class="w-3.5 h-3.5 text-rose-500 font-extrabold shrink-0 text-center leading-none">✕</span>
                  <span :class="{ 'text-emerald-600 dark:text-emerald-400 font-bold': passHasSpecial }">1 Caractere Especial</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Check v-if="passHasUpper" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span v-else class="w-3.5 h-3.5 text-rose-500 font-extrabold shrink-0 text-center leading-none">✕</span>
                  <span :class="{ 'text-emerald-600 dark:text-emerald-400 font-bold': passHasUpper }">1 Letra Maiúscula</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Check v-if="passHasLower" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span v-else class="w-3.5 h-3.5 text-rose-500 font-extrabold shrink-0 text-center leading-none">✕</span>
                  <span :class="{ 'text-emerald-600 dark:text-emerald-400 font-bold': passHasLower }">1 Letra Minúscula</span>
                </div>
                <div class="flex items-center gap-1.5 col-span-2">
                  <Check v-if="passHasNumber" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span v-else class="w-3.5 h-3.5 text-rose-500 font-extrabold shrink-0 text-center leading-none">✕</span>
                  <span :class="{ 'text-emerald-600 dark:text-emerald-400 font-bold': passHasNumber }">Ao menos 1 Número (0-9)</span>
                </div>
              </div>
            </div>

            <!-- Confirmar Senha de Acesso -->
            <div class="mt-3.5">
              <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Confirmar Senha de Acesso</label>
              <div class="relative">
                <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  :type="showRegisterConfirmPassword ? 'text' : 'password'"
                  required
                  v-model="userConfirmPassword"
                  placeholder="Repita a senha informada acima"
                  class="w-full text-xs bg-slate-50 dark:bg-slate-950 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl p-3 pl-10 pr-10 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden font-medium text-slate-900"
                />
                <button
                  type="button"
                  @click="showRegisterConfirmPassword = !showRegisterConfirmPassword"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-hidden cursor-pointer flex items-center justify-center"
                  title="Mostrar/Ocultar Senha"
                >
                  <EyeOff v-if="showRegisterConfirmPassword" class="w-4 h-4" />
                  <Eye v-else class="w-4 h-4" />
                </button>
              </div>
              <div v-if="userPassword && userConfirmPassword" class="mt-1.5 text-[10px] font-black select-none flex items-center gap-1.5 animate-fadeIn">
                <span v-if="userPassword === userConfirmPassword" class="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span class="inline-block bg-emerald-100 dark:bg-emerald-950/50 p-0.5 rounded-full">✓</span> As senhas coincidem!
                </span>
                <span v-else class="text-rose-500 flex items-center gap-1">
                  <span class="inline-block bg-rose-100 dark:bg-rose-950/50 px-1 rounded-full">✕</span> As senhas não coincidem.
                </span>
              </div>
            </div>
          </div>

          <!-- LGPD Terms block -->
          <div class="p-3.5 bg-slate-100 border border-slate-200 rounded-xl space-y-2 shadow-xs">
            <div class="flex items-start gap-2.5">
              <FileText class="w-4 h-4 shrink-0 mt-0.5" style="color: var(--primary-color);" />
              <div class="text-[11px] leading-relaxed text-slate-800">
                <span class="font-extrabold text-slate-900 block text-sm">LGPD & Privacidade de Dados v1.0</span>
                Para o voluntariado comunitário, seus dados (nome, e-mail, progresso nos cursos e diálogos de estudo) serão armazenados com fins puramente pedagógicos. Nós não vendemos seus contatos nem repassamos dados para terceiros. Você pode, a qualquer tempo, deletar seu perfil do sistema definitivamente.
              </div>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-slate-200">
              <button 
                type="button" 
                @click="openLgpdModal" 
                class="text-[10px] font-black hover:underline cursor-pointer flex items-center gap-1.5"
                style="color: var(--primary-color) !important;"
              >
                <Scale class="w-3.5 h-3.5" />
                Ver termos completos na íntegra
              </button>
            </div>
          </div>

          <!-- Consent Checkbox -->
          <div class="flex items-start gap-2.5 select-none bg-slate-100 rounded-xl border border-slate-200 p-3 shadow-xs">
            <input 
              id="chk-lgpd-accept"
              type="checkbox"
              v-model="userLgpdAccepted"
              class="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer shrink-0"
            />
            <label for="chk-lgpd-accept" class="text-[11px] font-bold text-slate-800 leading-relaxed cursor-pointer">
              Declaro que li e concordo com os Termos de Voluntariado Pedagógico e a coleta descrita em acordo com as normas da LGPD. *
            </label>
          </div>

          <div v-if="localError" class="text-xs text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/30 p-3 rounded-lg border border-rose-100 dark:border-rose-900/40 animate-fadeIn">
            ⚠️ {{ localError }}
          </div>

          <button
            type="submit"
            :disabled="isLoading || !userLgpdAccepted"
            class="w-full py-3 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style="background-color: var(--primary-color) !important; color: #ffffff !important;"
          >
            <span v-if="isLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>Registrar Nova Conta</span>
          </button>
        </form>
      </div>

    </div>

    <!-- Bottom label -->
    <div class="pt-2 text-[11px] text-slate-400 dark:text-slate-500 font-semibold select-none border-t border-slate-100 dark:border-slate-800 pt-3">
       Our First Global Job · Plataforma de Voluntariado Pedagógico
    </div>

    <!-- LGPD Full Policy Modal Dialog -->
    <Teleport to="body">
      <div 
        v-if="showLgpdModal" 
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 text-left"
      >
        <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 animate-scaleUp shadow-2xl">
          <div class="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 class="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 leading-none">
                <Scale class="w-6 h-6" style="color: var(--primary-color);" />
                Termos de Uso e Política LGPD
              </h3>
              <p class="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1.5 uppercase tracking-wider">Regulamento Geral de Voluntariado Educativo</p>
            </div>
            <button 
              type="button"
              @click="showLgpdModal = false"
              class="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xl font-black leading-none p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition"
            >
              ✕
            </button>
          </div>

          <div class="space-y-4 overflow-y-auto max-h-[50vh] pr-4 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 font-medium">
            <p class="font-bold text-slate-900 dark:text-white text-sm sm:text-base border-l-4 pl-3 py-1" :style="{ borderColor: 'var(--primary-color)' }">
              Este regulamento dita as diretrizes de tratamento de dados pessoais no Our First Global Job, em conformidade com o marco civil da internet e a Lei Geral de Proteção de Dados (LGPD - LEI Nº 13.709/2018):
            </p>
            
            <div class="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850/60 space-y-2.5">
              <div class="space-y-1.5">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: 'var(--primary-color)' }"></span>
                  1. Finalidade do Consentimento
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">Ao se registrar como estudante ou professor colaborador, seus dados pessoais serão utilizados exclusivamente para gerenciar as rotinas das turmas de inglês gratuitas, calcular os índices de quizzes respondidos, facilitar as salas de chats tutoradas e emitir seus respectivos certificados. Não fazemos captação indireta de comportamento.</p>
              </div>

              <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850/40">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: 'var(--primary-color)' }"></span>
                  2. Princípio da Minimização
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">Coletamos apenas as peças mínimas fundamentais de identificação: Nome Completo (para fins de confeecção e segurança jurídica do certificado), Endereço de E-mail (chave de login única de autenticação), Nível Teórico de inglês e dados essenciais de andamento pedagógico (como presenças marcadas).</p>
              </div>

              <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850/40">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: 'var(--primary-color)' }"></span>
                  3. Não-Compartilhamento Comercial
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">Com respeito à integridade dos voluntários, absolutamente nenhum contato ou informação é partilhada com empresas ou entidades do terceiro setor. Nosso banco de dados é restrito, estruturado em ambiente de nuvem seguro.</p>
              </div>

              <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850/40">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: 'var(--primary-color)' }"></span>
                  4. Direito de Revogação e Exclusão
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">Em obediência ao Artigo 18 da LGPD, o voluntário poderá a qualquer momento exigir do Our First Global Job o livre acesso e a total destruição de seus dados pessoais. Seus dados cadastrais serão deletados de forma definitiva e irreversível em até 72 horas úteis. <strong>Salvaguarda Acadêmica:</strong> Visando não romper o progresso pedagógico e certificação de estudantes matriculados, quaisquer matérias didáticas ou minicursos criados pelo voluntário permanecerão sob custódia anônima do sistema/administração.</p>
              </div>

              <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850/40">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: 'var(--primary-color)' }"></span>
                  5. Relação Não-Trabalhista
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">Em acordo com a Lei de Voluntariado nacional, declaramos que a presente atividade ofertada por mentores e usufruída pelos alunos não estabelece qualquer liame de natureza trabalhista ou expectativa de remuneração pecuniária direta ou indireta.</p>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end border-t border-slate-100 dark:border-slate-800 pt-5">
            <button
              type="button"
              @click="showLgpdModal = false"
              class="px-6 py-2.5 text-xs sm:text-sm font-black text-white rounded-xl transition-all duration-150 cursor-pointer shadow-md inline-flex items-center gap-2 hover:opacity-90 active:scale-98"
              :style="{ backgroundColor: 'var(--primary-color)' }"
            >
              Entendido e Concordo
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>
