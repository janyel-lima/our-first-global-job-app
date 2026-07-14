<script setup lang="ts">
import { AlertCircle, Check, Edit3, Eye, EyeOff, Lock, Mail, Trash2 } from 'lucide-vue-next';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { showToast } from '../../composables/useAppState';
import { useI18n } from '../../composables/useI18n';

const { t, locale } = useI18n();


const props = defineProps<{
  isOpen: boolean;
  initialName: string;
  initialLevel: string;
  initialBio: string;
  initialEmail?: string;
  primaryColor: string;
  isInstructor?: boolean;
  initialSignatureType?: "text" | "drawn";
  initialSignatureText?: string;
  initialSignatureImage?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update-profile', data: {
    displayName: string,
    level: string,
    bio: string,
    email?: string,
    password?: string,
    signatureType?: "text" | "drawn",
    signatureText?: string,
    signatureImage?: string
  }): void;
  (e: 'delete-account'): void;
}>();

const profileEditName = ref("");
const profileEditLevel = ref("Beginner");
const profileEditBio = ref("");
const profileEditEmail = ref("");
const profileEditPassword = ref("");
const profileConfirmPassword = ref("");
const showEditPassword = ref(false);
const showConfirmPassword = ref(false);
const showConfirmDelete = ref(false);

const signatureType = ref<"text" | "drawn">("text");
const signatureText = ref("");
const signatureImage = ref("");
const signatureCanvas = ref<HTMLCanvasElement | null>(null);
const isDrawing = ref(false);

const syncPropsToRefs = () => {
  profileEditName.value = props.initialName;
  profileEditLevel.value = props.initialLevel;
  profileEditBio.value = props.initialBio;
  profileEditEmail.value = props.initialEmail || "";
  profileEditPassword.value = "";
  profileConfirmPassword.value = "";
  showEditPassword.value = false;
  showConfirmPassword.value = false;
  showConfirmDelete.value = false;
  signatureType.value = props.initialSignatureType || "text";
  signatureText.value = props.initialSignatureText || props.initialName || "";
  signatureImage.value = props.initialSignatureImage || "";

  if (signatureType.value === "drawn") {
    nextTick(() => {
      initCanvas();
    });
  }
};

onMounted(() => {
  syncPropsToRefs();
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    syncPropsToRefs();
  }
});

watch(signatureType, (newVal) => {
  if (newVal === "drawn") {
    nextTick(() => {
      initCanvas();
    });
  }
});

const getCoordinates = (event: MouseEvent | TouchEvent) => {
  const canvas = signatureCanvas.value;
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();

  let clientX = 0;
  let clientY = 0;

  if (typeof TouchEvent !== "undefined" && event instanceof TouchEvent) {
    if (event.touches && event.touches[0]) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if (event.changedTouches && event.changedTouches[0]) {
      clientX = event.changedTouches[0].clientX;
      clientY = event.changedTouches[0].clientY;
    }
  } else {
    clientX = (event as MouseEvent).clientX;
    clientY = (event as MouseEvent).clientY;
  }

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
};

const initCanvas = () => {
  const canvas = signatureCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#0f172a"; // deep slate black pen

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (signatureImage.value) {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
    };
    img.src = signatureImage.value;
  }
};

const startDrawing = (e: MouseEvent | TouchEvent) => {
  e.preventDefault();
  const canvas = signatureCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  isDrawing.value = true;
  const coords = getCoordinates(e);
  ctx.beginPath();
  ctx.moveTo(coords.x, coords.y);
};

const draw = (e: MouseEvent | TouchEvent) => {
  if (!isDrawing.value) return;
  e.preventDefault();
  const canvas = signatureCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const coords = getCoordinates(e);
  ctx.lineTo(coords.x, coords.y);
  ctx.stroke();
};

const stopDrawing = () => {
  if (!isDrawing.value) return;
  isDrawing.value = false;

  const canvas = signatureCanvas.value;
  if (canvas) {
    signatureImage.value = canvas.toDataURL("image/png");
  }
};

const clearSignature = () => {
  const canvas = signatureCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  signatureImage.value = "";
};

const passMinLength = computed(() => !profileEditPassword.value || profileEditPassword.value.length >= 8);
const passHasSpecial = computed(() => !profileEditPassword.value || /[!@#$%^&*(),.?":{}|<>\-_=+]/.test(profileEditPassword.value));
const passHasUpper = computed(() => !profileEditPassword.value || /[A-Z]/.test(profileEditPassword.value));
const passHasLower = computed(() => !profileEditPassword.value || /[a-z]/.test(profileEditPassword.value));
const passHasNumber = computed(() => !profileEditPassword.value || /[0-9]/.test(profileEditPassword.value));

const realMinLength = computed(() => !!profileEditPassword.value && profileEditPassword.value.length >= 8);
const realSpecial = computed(() => !!profileEditPassword.value && /[!@#$%^&*(),.?":{}|<>\-_=+]/.test(profileEditPassword.value));
const realUpper = computed(() => !!profileEditPassword.value && /[A-Z]/.test(profileEditPassword.value));
const realLower = computed(() => !!profileEditPassword.value && /[a-z]/.test(profileEditPassword.value));
const realNumber = computed(() => !!profileEditPassword.value && /[0-9]/.test(profileEditPassword.value));

const passScore = computed(() => {
  if (!profileEditPassword.value) return 0;
  let score = 0;
  if (profileEditPassword.value.length >= 8) score++;
  if (/[!@#$%^&*(),.?":{}|<>\-_=+]/.test(profileEditPassword.value)) score++;
  if (/[A-Z]/.test(profileEditPassword.value)) score++;
  if (/[a-z]/.test(profileEditPassword.value)) score++;
  if (/[0-9]/.test(profileEditPassword.value)) score++;
  return score;
});

const isPassValid = computed(() => {
  if (!profileEditPassword.value) return true; // optional
  return (
    profileEditPassword.value.length >= 8 &&
    /[!@#$%^&*(),.?":{}|<>\-_=+]/.test(profileEditPassword.value) &&
    /[A-Z]/.test(profileEditPassword.value) &&
    /[a-z]/.test(profileEditPassword.value) &&
    /[0-9]/.test(profileEditPassword.value)
  );
});

const passStrengthLabel = computed(() => {
  if (!profileEditPassword.value) return { text: t('profileModal.passStrengthNotChanged'), color: 'text-slate-400 dark:text-slate-500', barBg: 'bg-slate-200 dark:bg-slate-800', width: 'w-0' };
  const score = passScore.value;
  if (score <= 2) return { text: t('profileModal.passStrengthWeak'), color: 'text-rose-500', barBg: 'bg-rose-500', width: 'w-1/4' };
  if (score === 3) return { text: t('profileModal.passStrengthMedium'), color: 'text-amber-500', barBg: 'bg-amber-500', width: 'w-2/4' };
  if (score === 4) return { text: t('profileModal.passStrengthStrong'), color: 'text-blue-500', barBg: 'bg-blue-500', width: 'w-3/4' };
  return { text: t('profileModal.passStrengthExcellent'), color: 'text-emerald-500 dark:text-emerald-400', barBg: 'bg-emerald-500', width: 'w-full' };
});

const submit = () => {
  const updatedName = profileEditName.value.trim();
  const updatedLevel = profileEditLevel.value;
  const updatedBio = profileEditBio.value.trim();
  const updatedEmail = profileEditEmail.value.trim();
  const updatedPass = profileEditPassword.value;

  if (!updatedName) {
    showToast(t('profileModal.errNameRequired'), "warning");
    return;
  }

  if (updatedPass) {
    if (!isPassValid.value) {
      showToast(t('profileModal.errPassCriteria'), "error");
      return;
    }
    if (!profileConfirmPassword.value) {
      showToast(t('profileModal.errConfirmPassRequired'), "warning");
      return;
    }
    if (updatedPass !== profileConfirmPassword.value) {
      showToast(t('profileModal.errPassMismatch'), "error");
      return;
    }
  }

  emit('update-profile', {
    displayName: updatedName,
    level: updatedLevel,
    bio: updatedBio,
    email: updatedEmail || undefined,
    password: updatedPass || undefined,
    signatureType: signatureType.value,
    signatureText: signatureText.value.trim() || updatedName,
    signatureImage: signatureImage.value
  });
};
</script>

<template>
  <div v-if="isOpen"
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left shadow-2xl">
    <div
      class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 animate-scaleUp">
      <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 select-none">
        <div>
          <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white">{{ t('profileModal.title') }}</h3>
          <p class="text-xs text-slate-400 font-bold">{{ t('profileModal.keepUpdated') }}</p>
        </div>
        <button type="button" @click="$emit('close')"
          class="text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg font-black leading-none p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
          ✕
        </button>
      </div>

      <form @submit.prevent="submit"
        class="space-y-4 overflow-y-auto max-h-[480px] px-3.5 py-1.5 pr-2.5 scrollbar-thin">

        <!-- DISPLAY NAME -->
        <div class="space-y-1.5">
          <label
            class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-bold">{{
              t('profileModal.nameLabel') }}</label>
          <input v-model="profileEditName" type="text" required :placeholder="t('profileModal.placeholderName')"
            class="w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500" />
        </div>

        <!-- ENGLISH LEVEL -->
        <div class="space-y-1.5">
          <label
            class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-bold">{{
              t('header.englishLevel') }}</label>
          <select v-model="profileEditLevel"
            class="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500 cursor-pointer">
            <option value="Beginner">{{ t('profileModal.levelBeginner') }}</option>
            <option value="Intermediate">{{ t('profileModal.levelIntermediate') }}</option>
            <option value="Advanced">{{ t('profileModal.levelAdvanced') }}</option>
            <option value="All">{{ t('profileModal.levelAll') }}</option>
          </select>
          <p class="text-[9.5px] text-slate-400 dark:text-slate-500 leading-normal font-semibold">
            {{ t('profileModal.levelDesc') }}
          </p>
        </div>

        <!-- BIO -->
        <div class="space-y-1.5">
          <label
            class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-bold">{{
              t('profileModal.bioLabel') }}</label>
          <textarea v-model="profileEditBio" rows="2" :placeholder="t('profileModal.bioPlaceholder')"
            class="w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500 resize-none"></textarea>
        </div>

        <!-- INSTRUCTOR SIGNATURE SECTION (Only for voluntary instructors) -->
        <div v-if="isInstructor" class="pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-3.5 select-none">
          <div class="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <Edit3 class="w-4 h-4" />
            <h4 class="text-xs font-black uppercase tracking-wider">{{ t('profileModal.certSignatureTitle') }}</h4>
          </div>
          <p class="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-normal">
            {{ t('profileModal.certSignatureDesc') }}
          </p>

          <!-- Type Selector Options -->
          <div class="grid grid-cols-2 gap-2">
            <button type="button" @click="signatureType = 'text'" :class="[
              'py-2 px-3 text-xs font-black rounded-xl border transition-all text-center cursor-pointer flex items-center justify-center gap-1.5',
              signatureType === 'text'
                ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
            ]">
              <Check v-if="signatureType === 'text'" class="w-3.5 h-3.5 text-white" />
              {{ t('profileModal.digitalText') }}
            </button>
            <button type="button" @click="signatureType = 'drawn'" :class="[
              'py-2 px-3 text-xs font-black rounded-xl border transition-all text-center cursor-pointer flex items-center justify-center gap-1.5',
              signatureType === 'drawn'
                ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
            ]">
              <Check v-if="signatureType === 'drawn'" class="w-3.5 h-3.5 text-white" />
              {{ t('profileModal.drawManually') }}
            </button>
          </div>

          <!-- OPTION 1: TEXT SIGNATURE -->
          <div v-if="signatureType === 'text'" class="space-y-2 animate-fadeIn">
            <label class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{{
              t('profileModal.signatureTextLabel') }}</label>
            <input v-model="signatureText" type="text" :placeholder="t('profileModal.signatureTextPlaceholder')"
              class="w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500" />

            <!-- Real-time design cursive font preview -->
            <div
              class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-center space-y-1">
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{{
                t('profileModal.certPreview') }}</span>
              <!-- Cursive signature preview with google-like handwriting style -->
              <p class="text-xl py-2 select-none text-slate-950 dark:text-white font-semibold italic"
                style="font-family: 'Dancing Script', 'Brush Script MT', 'Georgia', cursive, serif;">
                {{ signatureText || profileEditName || t('profileModal.yourSignature') }}
              </p>
            </div>
          </div>

          <!-- OPTION 2: DRAWN CANVAS SIGNATURE -->
          <div v-if="signatureType === 'drawn'" class="space-y-2.5 animate-fadeIn">
            <div class="flex items-center justify-between">
              <label class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{{
                t('profileModal.drawSignatureLabel') }}</label>
              <button type="button" @click="clearSignature"
                class="text-[10px] font-black text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1">
                <Trash2 class="w-3 h-3" /> {{ t('profileModal.clearScreen') }}
              </button>
            </div>

            <!-- Drawing Pad Canvas (background always white) -->
            <div
              class="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-white select-none">
              <!-- Overlay instruction text when empty -->
              <div v-if="!signatureImage"
                class="absolute inset-0 flex items-center justify-center pointer-events-none text-center p-4">
                <span class="text-[10.5px] font-bold text-slate-400">
                  {{ t('profileModal.drawInstruction') }}
                </span>
              </div>
              <canvas ref="signatureCanvas" width="400" height="150"
                class="w-full h-[150px] block cursor-crosshair touch-none bg-transparent" @mousedown="startDrawing"
                @mousemove="draw" @mouseup="stopDrawing" @mouseleave="stopDrawing" @touchstart="startDrawing"
                @touchmove="draw" @touchend="stopDrawing"></canvas>
            </div>

            <p class="text-[9px] text-slate-400 dark:text-slate-500 font-semibold leading-snug">
              {{ t('profileModal.canvasTip') }}
            </p>
          </div>
        </div>

        <!-- SECURITY UPDATES SECTION -->
        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div class="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <Lock class="w-4 h-4" />
            <h4 class="text-xs font-bold uppercase tracking-wider">{{ t('profileModal.changeCredentialsTitle') }}</h4>
          </div>
          <p class="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
            {{ t('profileModal.changeCredentialsDesc') }}
          </p>

          <!-- NEW EMAIL INPUT -->
          <div class="space-y-1">
            <label class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block font-bold">{{
              t('profileModal.changeEmailLabel') }}</label>
            <div class="relative">
              <Mail class="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-slate-450" />
              <input v-model="profileEditEmail" type="email" placeholder="novoemail@exemplo.com"
                class="w-full text-xs font-bold pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white focus:outline-hidden focus:border-blue-500" />
            </div>
          </div>

          <!-- NEW PASSWORD INPUT -->
          <div class="space-y-1">
            <div class="flex justify-between items-center mb-0.5 select-none">
              <label class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block font-bold">{{
                t('profileModal.changePasswordLabel') }}</label>
              <div v-if="profileEditPassword" class="text-[9px] font-bold flex items-center gap-1">
                <span>{{ t('profileModal.strengthLabel') }}</span>
                <span :class="passStrengthLabel.color" class="font-extrabold">{{ passStrengthLabel.text }}</span>
              </div>
            </div>
            <div class="relative mb-2">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-450" />
              <input v-model="profileEditPassword" :type="showEditPassword ? 'text' : 'password'"
                :placeholder="t('profileModal.passwordPlaceholder')"
                class="w-full text-xs font-bold pl-9 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white focus:outline-hidden focus:border-blue-500" />
              <button type="button" @click="showEditPassword = !showEditPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-hidden cursor-pointer flex items-center justify-center"
                :title="t('profileModal.showHidePassword')">
                <EyeOff v-if="showEditPassword" class="w-3.5 h-3.5" />
                <Eye v-else class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Password strength progress bar & checklist when typing -->
            <div v-if="profileEditPassword" class="space-y-2.5 animate-fadeIn">
              <div class="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-300" :class="passStrengthLabel.barBg"
                  :style="{ width: (passScore === 1 ? '20%' : passScore === 2 ? '40%' : passScore === 3 ? '60%' : passScore === 4 ? '80%' : '100%') }">
                </div>
              </div>

              <!-- Dynamic Password Criteria Checklist -->
              <div
                class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-155 dark:border-slate-850/60 space-y-2 select-none text-[10px]">
                <span
                  class="text-[9px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-1">{{
                    t('profileModal.requiredCriteria') }}</span>
                <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-600 dark:text-slate-400 font-semibold">
                  <div class="flex items-center gap-1.5">
                    <Check v-if="realMinLength" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span v-else
                      class="w-3.5 h-3.5 text-rose-500 font-extrabold shrink-0 text-center leading-none">✕</span>
                    <span :class="{ 'text-emerald-600 dark:text-emerald-400 font-bold': realMinLength }">{{
                      t('profileModal.minChars') }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <Check v-if="realSpecial" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span v-else
                      class="w-3.5 h-3.5 text-rose-500 font-extrabold shrink-0 text-center leading-none">✕</span>
                    <span :class="{ 'text-emerald-600 dark:text-emerald-400 font-bold': realSpecial }">{{
                      t('profileModal.oneSpecial') }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <Check v-if="realUpper" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span v-else
                      class="w-3.5 h-3.5 text-rose-500 font-extrabold shrink-0 text-center leading-none">✕</span>
                    <span :class="{ 'text-emerald-600 dark:text-emerald-400 font-bold': realUpper }">{{
                      t('profileModal.oneUpper') }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <Check v-if="realLower" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span v-else
                      class="w-3.5 h-3.5 text-rose-500 font-extrabold shrink-0 text-center leading-none">✕</span>
                    <span :class="{ 'text-emerald-600 dark:text-emerald-400 font-bold': realLower }">{{
                      t('profileModal.oneLower') }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 col-span-2">
                    <Check v-if="realNumber" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span v-else
                      class="w-3.5 h-3.5 text-rose-500 font-extrabold shrink-0 text-center leading-none">✕</span>
                    <span :class="{ 'text-emerald-600 dark:text-emerald-400 font-bold': realNumber }">{{
                      t('profileModal.oneNumber') }}</span>
                  </div>
                </div>
              </div>

              <!-- Confirmar Nova Senha de Acesso -->
              <div class="space-y-1 pt-1">
                <label class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block font-bold">{{
                  t('profileModal.confirmPasswordLabel') }}</label>
                <div class="relative">
                  <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-450" />
                  <input :type="showConfirmPassword ? 'text' : 'password'" v-model="profileConfirmPassword"
                    :placeholder="t('profileModal.confirmPasswordPlaceholder')"
                    class="w-full text-xs font-bold pl-9 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white focus:outline-hidden focus:border-blue-500" />
                  <button type="button" @click="showConfirmPassword = !showConfirmPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-hidden cursor-pointer"
                    :title="t('profileModal.showHidePassword')">
                    <EyeOff v-if="showConfirmPassword" class="w-3.5 h-3.5" />
                    <Eye v-else class="w-3.5 h-3.5" />
                  </button>
                </div>
                <div v-if="profileConfirmPassword"
                  class="text-[9px] font-black select-none flex items-center gap-1 animate-fadeIn">
                  <span v-if="profileEditPassword === profileConfirmPassword"
                    class="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span class="inline-block bg-emerald-100 dark:bg-emerald-950/50 p-0.5 rounded-full">✓</span> {{
                      t('profileModal.passwordsMatch') }}
                  </span>
                  <span v-else class="text-rose-500 flex items-center gap-1">
                    <span class="inline-block bg-rose-100 dark:bg-rose-950/50 px-1 rounded-full">✕</span> {{
                      t('profileModal.passwordsMismatch') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Security note warnings -->
          <div
            class="p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100/40 dark:border-amber-900/40 flex items-start gap-2">
            <AlertCircle class="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p class="text-[9.5px] text-amber-800 dark:text-amber-300 font-bold leading-relaxed">
              {{ t('profileModal.securityNote') }}
            </p>
          </div>
        </div>

        <!-- FORM ACTIONS -->
        <div class="flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <!-- In-App LGPD Deletion Confirmation Block -->
          <div v-if="showConfirmDelete"
            class="p-4 bg-red-50 dark:bg-rose-950/30 border border-red-200 dark:border-red-900/40 rounded-2xl space-y-3 animate-fadeIn">
            <p class="text-xs font-bold text-red-700 dark:text-red-300 leading-relaxed">
              {{ t('profileModal.lgpdWarning') }}
              <br /><br />
              <span
                class="inline-block p-2 bg-red-100/50 dark:bg-rose-950/40 rounded-lg text-[11px] font-black uppercase text-red-800 dark:text-red-400 border border-red-200/40 mt-1">
                🛡️ {{ t('profileModal.academicSafeguardTitle') }}
              </span>
              {{ t('profileModal.academicSafeguardDesc') }}
            </p>
            <div class="flex flex-wrap gap-2.5">
              <button type="button" @click="$emit('delete-account')"
                class="px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black rounded-xl transition cursor-pointer">
                {{ t('profileModal.btnDeletePermanently') }}
              </button>
              <button type="button" @click="showConfirmDelete = false"
                class="px-4 py-2 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 text-xs font-black rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer">
                {{ t('profileModal.btnCancel') }}
              </button>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3">
            <button v-if="!showConfirmDelete" type="button" @click="showConfirmDelete = true"
              class="px-3.5 py-2 text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1">
              🗑️ {{ t('profileModal.btnDeleteAccount') }}
            </button>
            <div v-else
              class="text-[10px] text-red-650 dark:text-red-400 font-extrabold uppercase tracking-widest animate-pulse">
              ⚠️ {{ t('profileModal.criticalActionActive') }}
            </div>

            <div class="flex items-center gap-3">
              <button type="button" @click="$emit('close')"
                class="px-4 py-2 text-xs font-black text-slate-500 hover:text-slate-850 dark:hover:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer">
                {{ t('profileModal.btnCancel') }}
              </button>
              <button type="submit"
                class="px-5 py-2 text-xs font-black text-white rounded-xl shadow-md cursor-pointer transition-all active:scale-95 text-center flex items-center gap-1.5"
                :style="{ backgroundColor: primaryColor }">
                {{ t('profileModal.btnSaveChanges') }}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
