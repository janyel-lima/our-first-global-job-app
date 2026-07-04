<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Download, Printer, Award, X, Sparkles, AlertCircle } from 'lucide-vue-next';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const props = defineProps<{
  studentName: string;
  courseTitle: string;
  certifiedAt?: string;
  certificateId?: string;
  primaryColor?: string;
  iconUrl?: string;
  creatorId?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const svgContent = ref<string | null>(null);
const isLoading = ref(true);
const errorMsg = ref<string | null>(null);

const instructorName = ref("Instrutor Voluntário");
const sigType = ref<"text" | "drawn">("text");
const sigText = ref("");
const sigImage = ref("");
const hasDrawnSignature = ref(false);
const isLoadedProfile = ref(false);

watch(() => props.creatorId, () => {
  isLoadedProfile.value = false;
  instructorName.value = "Instrutor Voluntário";
  sigType.value = "text";
  sigText.value = "";
  sigImage.value = "";
  hasDrawnSignature.value = false;
});

async function loadCertificate() {
  isLoading.value = true;
  errorMsg.value = null;
  try {
    const dateString = props.certifiedAt || new Date().toLocaleDateString("pt-BR");
    const idString = props.certificateId || `CERT-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const themeColor = props.primaryColor || "#1e3a8a";
    const iconUrl = props.iconUrl;

    if (props.creatorId && !isLoadedProfile.value) {
      try {
        const docRef = doc(db, "users", props.creatorId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const uProfile = docSnap.data();
          instructorName.value = uProfile.displayName || "Instrutor Voluntário";
          sigText.value = uProfile.signatureText || instructorName.value;
          sigImage.value = uProfile.signatureImage || "";
          hasDrawnSignature.value = !!uProfile.signatureImage;
          sigType.value = uProfile.signatureType || "text";
        }
      } catch (err) {
        console.warn("Falha ao obter assinatura do instrutor do Firestore:", err);
      }
      isLoadedProfile.value = true;
    } else if (!props.creatorId) {
      instructorName.value = "Instrutor Voluntário";
      sigText.value = "Instrutor Voluntário";
      sigType.value = "text";
      sigImage.value = "";
      hasDrawnSignature.value = false;
    }

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
          <defs>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&amp;display=swap');
            </style>
          </defs>
          <!-- Premium Background Pattern -->
          <rect width="800" height="600" fill="#fafaf9" rx="16"/>
          
          <!-- Subtle professional background watermark/accent lines -->
          <circle cx="400" cy="300" r="280" fill="none" stroke="${themeColor}" stroke-opacity="0.03" stroke-width="6"/>
          <circle cx="400" cy="300" r="270" fill="none" stroke="${themeColor}" stroke-opacity="0.02" stroke-width="1.5" stroke-dasharray="10 5"/>
          
          <!-- Outer border -->
          <rect x="25" y="25" width="750" height="550" fill="none" stroke="#e7e5e4" stroke-width="1.5" rx="12"/>
          <!-- Inner border in brand theme color -->
          <rect x="35" y="35" width="730" height="530" fill="none" stroke="${themeColor}" stroke-opacity="0.7" stroke-width="2.5" rx="10" stroke-dasharray="15 5"/>
          
          <!-- Exquisite Corner Motifs -->
          <g stroke="${themeColor}" stroke-opacity="0.8" stroke-width="2" fill="none">
            <!-- Top Left -->
            <path d="M 45 75 L 45 45 L 75 45" />
            <path d="M 52 75 L 52 52 L 75 52" />
            <!-- Top Right -->
            <path d="M 755 75 L 755 45 L 725 45" />
            <path d="M 748 75 L 748 52 L 725 52" />
            <!-- Bottom Left -->
            <path d="M 45 525 L 45 555 L 75 555" />
            <path d="M 52 525 L 52 548 L 75 548" />
            <!-- Bottom Right -->
            <path d="M 755 525 L 755 555 L 725 555" />
            <path d="M 748 525 L 748 548 L 725 548" />
          </g>
          
          <!-- Title Section -->
          <g transform="translate(400, 115)" text-anchor="middle">
            <text font-family="'Inter', 'Helvetica Neue', sans-serif" font-weight="800" font-size="34" fill="${themeColor}" letter-spacing="3">CERTIFICADO DE CONCLUSÃO</text>
            <text font-family="'Inter', sans-serif" font-weight="600" font-size="11" fill="#78716c" y="30" letter-spacing="5">ENSINO VOLUNTÁRIO DE LÍNGUA INGLESA</text>
            <line x1="-120" y1="42" x2="120" y2="42" stroke="#e7e5e4" stroke-width="1.5"/>
          </g>
 
          <!-- Text Section -->
          <g transform="translate(400, 220)" text-anchor="middle">
            <text font-family="'Inter', sans-serif" font-size="14" fill="#78716c" font-style="italic">Este certificado comprova de forma simbólica e por mérito acadêmico que</text>
            <text font-family="'Space Grotesk', 'Inter', sans-serif" font-weight="805" font-size="28" fill="#1c1917" y="48">${props.studentName}</text>
            <line x1="-150" y1="65" x2="150" y2="65" stroke="${themeColor}" stroke-opacity="0.3" stroke-width="1.5"/>
          </g>
 
          <g transform="translate(400, 335)" text-anchor="middle">
            <text font-family="'Inter', sans-serif" font-size="14" fill="#78716c">concluiu com aproveitamento e dedicação todas as lições do mini-curso:</text>
            <text font-family="'Inter', sans-serif" font-weight="bold" font-size="22" fill="${themeColor}" y="32">${props.courseTitle}</text>
            <text font-family="'Inter', sans-serif" font-size="11" fill="#a8a29e" y="60">Programa de Aprendizado Autônomo e Solidário</text>
          </g>
 
          <!-- Seal Icon / Seal Design Below Name -->
          <g transform="translate(400, 465)" text-anchor="middle">
            ${iconUrl ? `
              <!-- Frame for custom image -->
              <circle r="40" fill="#ffffff" stroke="${themeColor}" stroke-width="1.5"/>
              <image href="${iconUrl}" x="-30" y="-30" height="60" width="60" />
            ` : `
              <!-- Professional Default Geometric Seal -->
              <g>
                <!-- Left Ribbon Tail -->
                <path d="M -18 15 L -26 48 L -14 41 L -6 46 L -10 15 Z" fill="${themeColor}" opacity="0.85"/>
                <!-- Right Ribbon Tail (Symmetric) -->
                <path d="M 18 15 L 26 48 L 14 41 L 6 46 L 10 15 Z" fill="${themeColor}" opacity="0.85"/>
                
                <!-- Gold Badge with custom details -->
                <circle r="32" fill="#fafaf9" stroke="#d97706" stroke-width="3"/>
                <polygon points="0,-16 4,-6 14,-6 6,1 9,11 0,5 -9,11 -6,1 -14,-6 -4,-6" fill="#f59e0b" stroke="#b45309" stroke-width="1" />
                <circle r="25" fill="none" stroke="#f59e0b" stroke-width="1" stroke-dasharray="4 2"/>
              </g>
            `}
            <text font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="bold" fill="#78716c" y="60">CÓD: ${idString}</text>
          </g>
 
          <!-- Footer signatures & Metadata -->
          <g transform="translate(150, 485)" text-anchor="middle">
            <!-- Dynamic Signature Area -->
            <g transform="translate(0, -15)">
              ${sigType.value === 'drawn' && sigImage.value ? `
                <image href="${sigImage.value}" x="-75" y="-35" width="150" height="50" style="mix-blend-mode: multiply;" />
              ` : `
                <text font-family="'Dancing Script', 'Brush Script MT', 'Georgia', cursive, serif" font-weight="600" font-size="22" font-style="italic" fill="#0f172a" y="10">${sigText.value || instructorName.value}</text>
              `}
            </g>
            <line x1="-80" y1="0" x2="80" y2="0" stroke="#d6d3d1" stroke-width="1"/>
            <text font-family="'Inter', sans-serif" font-weight="bold" font-size="11" fill="#1c1917" y="16">${instructorName.value}</text>
            <text font-family="'Inter', sans-serif" font-size="9" fill="#a8a29e" y="28">Instrutor Voluntário</text>
          </g>
 
          <g transform="translate(650, 485)" text-anchor="middle">
            <text font-family="'Inter', sans-serif" font-weight="bold" font-size="11" fill="#1c1917" y="-10">${dateString}</text>
            <line x1="-80" y1="0" x2="80" y2="0" stroke="#d6d3d1" stroke-width="1"/>
            <text font-family="'Inter', sans-serif" font-size="11" fill="#1c1917" y="16">Data de Conclusão</text>
            <text font-family="'Inter', sans-serif" font-size="9" fill="#a8a29e" y="28">Validação Eletrônica</text>
          </g>
        </svg>
      `;
    svgContent.value = svg;
  } catch (err: any) {
    console.error("Erro gerando certificado no cliente:", err);
    errorMsg.value = "Não foi possível gerar seu certificado.";
  } finally {
    isLoading.value = false;
  }
}

watch(() => [props.studentName, props.courseTitle, props.primaryColor, props.iconUrl, props.creatorId, sigType.value], () => {
  loadCertificate();
}, { immediate: true });

const handlePrint = () => {
  if (!svgContent.value) return;
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificado - ${props.studentName}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 0;
            }
            html, body {
              margin: 0;
              padding: 0;
              width: 297mm;
              height: 210mm;
              overflow: hidden;
              background: #fafaf9;
              display: flex;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              page-break-inside: avoid;
              page-break-after: avoid;
              page-break-before: avoid;
            }
            svg {
              width: 297mm !important;
              height: 210mm !important;
              max-width: 100% !important;
              max-height: 100% !important;
              object-fit: contain !important;
              display: block !important;
              margin: 0 !important;
              padding: 0 !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
              page-break-before: avoid !important;
              box-sizing: border-box !important;
            }
          </style>
        </head>
        <body>
          ${svgContent.value}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div 
      id="certificate-modal-container"
      class="bg-white rounded-3xl max-w-4xl w-full border border-slate-100 shadow-2xl overflow-hidden flex flex-col md:grid md:grid-cols-12"
    >
      
      <!-- Left/Main Side: Interactive Certificate Render -->
      <div class="md:col-span-8 bg-slate-50 p-6 sm:p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 min-h-[300px]">
        <div v-if="isLoading" class="text-center space-y-3">
          <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p class="text-xs text-slate-500 font-semibold">Emitindo Certificado com Assinatura Eletrônica...</p>
        </div>
        <div v-else-if="errorMsg" class="text-center p-6 space-y-3 max-w-sm">
          <AlertCircle class="w-10 h-10 text-rose-505 mx-auto text-rose-500" />
          <h4 class="text-sm font-bold text-slate-900">Emissão Indisponível</h4>
          <p class="text-xs text-slate-500 leading-relaxed">{{ errorMsg }}</p>
        </div>
        <div 
          v-else
          id="svg-certificate-frame"
          class="w-full aspect-[4/3] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden"
          v-html="svgContent || ''"
        />
      </div>

      <!-- Right Side: Descriptive Info & Download Callouts -->
      <div class="md:col-span-4 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-white">
        <div class="space-y-4 text-left">
          <div class="flex justify-between items-start">
            <span class="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Award class="w-6 h-6" />
            </span>
            <button
              id="btn-close-certificate-modal"
              @click="emit('close')"
              class="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              title="Fechar"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div>
            <span class="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              Selo de Proficiência
            </span>
            <h3 class="text-lg font-black text-slate-900 mt-2 leading-snug">Parabéns, {{ studentName }}!</h3>
            <p class="text-xs text-slate-500 leading-relaxed mt-1.5">
              Você assimilou com sucesso todo o conteúdo de <strong>{{ courseTitle }}</strong> e concluiu com maestria todas as questões avaliativas do programa de voluntariado.
            </p>
          </div>

          <div class="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-2.5">
            <Sparkles class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span class="text-[11px] text-blue-800 leading-relaxed">
              Este certificado simbólico pode ser impresso para comprovação de sua dedicação aos estudos voluntários de língua inglesa.
            </span>
          </div>

          </div>

        <div class="space-y-2">
          <button
            id="btn-print-certificate"
            :disabled="!svgContent"
            @click="handlePrint"
            class="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer class="w-4 h-4" />
            Imprimir / PDF
          </button>
          <button
            id="btn-cancel-certificate-view"
            @click="emit('close')"
            class="w-full py-2.5 bg-white border border-slate-200 text-slate-755 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-slate-700"
          >
            Fechar Visualização
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
