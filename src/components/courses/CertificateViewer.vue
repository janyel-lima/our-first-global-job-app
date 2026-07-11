<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Download, Printer, Award, X, Sparkles, AlertCircle } from 'lucide-vue-next';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useI18n } from '../../composables/useI18n';

const { locale } = useI18n();

const props = defineProps<{
  studentName: string;
  courseTitle: string;
  certifiedAt?: string;
  certificateId?: string;
  primaryColor?: string;
  iconUrl?: string;
  creatorId?: string;
  isTransferred?: boolean;
  isMaster?: boolean;
  bgStyle?: "vintage-parchment" | "dark-velvet" | "clean-light";
  frameStyle?: "medieval-gothic" | "classic-imperial" | "modern-border";
  detailColor?: "gold" | "silver" | "bronze" | "ruby" | "emerald" | "theme";
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const svgContent = ref<string | null>(null);
const isLoading = ref(true);
const errorMsg = ref<string | null>(null);

const isDarkCertificate = ref(false);
const bgStyle = ref<"vintage-parchment" | "dark-velvet" | "clean-light">("clean-light");
const frameStyle = ref<"medieval-gothic" | "classic-imperial" | "modern-border">("modern-border");
const detailColor = ref<"gold" | "silver" | "bronze" | "ruby" | "emerald" | "theme">("theme");

watch(() => [props.bgStyle, props.frameStyle, props.detailColor], () => {
  bgStyle.value = props.bgStyle || "clean-light";
  frameStyle.value = props.frameStyle || "modern-border";
  detailColor.value = props.detailColor || "theme";
}, { immediate: true });

const instructorName = ref(locale.value === 'pt' ? "Instrutor Voluntário" : "Volunteer Instructor");
const sigType = ref<"text" | "drawn">("text");
const sigText = ref("");
const sigImage = ref("");
const hasDrawnSignature = ref(false);
const isLoadedProfile = ref(false);

watch(() => props.creatorId, () => {
  isLoadedProfile.value = false;
  instructorName.value = locale.value === 'pt' ? "Instrutor Voluntário" : "Volunteer Instructor";
  sigType.value = "text";
  sigText.value = "";
  sigImage.value = "";
  hasDrawnSignature.value = false;
});

async function loadCertificate() {
  isLoading.value = true;
  errorMsg.value = null;
  try {
    const defaultInstructor = locale.value === 'pt' ? "Instrutor Voluntário" : "Volunteer Instructor";
    const dateString = props.certifiedAt || (locale.value === 'pt' ? new Date().toLocaleDateString("pt-BR") : new Date().toLocaleDateString("en-US"));
    const idString = props.certificateId || `CERT-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const themeColor = props.primaryColor || "#1e3a8a";
    const iconUrl = props.iconUrl;

    if (props.isTransferred) {
      instructorName.value = locale.value === 'pt' ? "Equipe de Admin da Iniciativa" : "Initiative Admin Team";
      sigText.value = instructorName.value;
      sigType.value = "text";
      sigImage.value = "";
      hasDrawnSignature.value = false;
      isLoadedProfile.value = true;
    } else if (props.creatorId && !isLoadedProfile.value) {
      try {
        const docRef = doc(db, "users", props.creatorId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const uProfile = docSnap.data();
          instructorName.value = uProfile.displayName || defaultInstructor;
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
      instructorName.value = defaultInstructor;
      sigText.value = defaultInstructor;
      sigType.value = "text";
      sigImage.value = "";
      hasDrawnSignature.value = false;
    }

    // Set dark indicator
    const isDark = bgStyle.value === "dark-velvet";
    isDarkCertificate.value = isDark;

    // Background color settings
    let bgFill = "#fafaf9";
    if (bgStyle.value === "vintage-parchment") {
      bgFill = "url(#parchment-grad)";
    } else if (bgStyle.value === "dark-velvet") {
      bgFill = "url(#velvet-grad)";
    } else {
      bgFill = "#ffffff";
    }

    // Define accent / stroke colors for chosen style
    let accentColor = themeColor;
    if (detailColor.value === "gold") accentColor = "url(#gold-grad)";
    else if (detailColor.value === "silver") accentColor = "url(#silver-grad)";
    else if (detailColor.value === "bronze") accentColor = "url(#bronze-grad)";
    else if (detailColor.value === "ruby") accentColor = "url(#ruby-grad)";
    else if (detailColor.value === "emerald") accentColor = "url(#emerald-grad)";

    // Fallbacks for non-gradient lines and details (solid representations for thin details)
    let solidAccent = themeColor;
    if (detailColor.value === "gold") solidAccent = "#b8860b";
    else if (detailColor.value === "silver") solidAccent = "#475569";
    else if (detailColor.value === "bronze") solidAccent = "#854d0e";
    else if (detailColor.value === "ruby") solidAccent = "#be123c";
    else if (detailColor.value === "emerald") solidAccent = "#047857";

    const outerBorderStroke = isDark ? "#1e293b" : "#e2e8f0";
    const innerBorderOpacity = isDark ? "0.9" : "0.75";
    
    // Choose font combinations
    const isMedieval = frameStyle.value === "medieval-gothic";
    const isImperial = frameStyle.value === "classic-imperial";

    let titleFont = "'Inter', 'Helvetica Neue', sans-serif";
    if (isMedieval) titleFont = "'Cinzel Decorative', 'Cinzel', serif";
    else if (isImperial) titleFont = "'Cinzel', serif";

    let studentNameFont = "'Space Grotesk', 'Inter', sans-serif";
    if (isMedieval || isImperial) studentNameFont = "'Great Vibes', 'Dancing Script', cursive";

    // Text color combinations
    const titleFill = detailColor.value === "theme" ? (isDark ? "#ffffff" : themeColor) : accentColor;
    const subtitleFill = isDark ? "#94a3b8" : "#57534e";
    const mainTextFill = isDark ? "#cbd5e1" : "#44403c";
    const studentNameFill = isDark ? "#ffffff" : "#1c1917";
    const subTitleLabelFill = isDark ? "#94a3b8" : "#78716c";
    const footerNameFill = isDark ? "#f1f5f9" : "#1c1917";
    const footerLabelFill = isDark ? "#94a3b8" : "#78716c";
    const footerLineStroke = isDark ? "#334155" : "#d6d3d1";
    const watermarkOpacity = isDark ? "0.08" : "0.04";
    const watermarkDashedOpacity = isDark ? "0.05" : "0.02";

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
          <defs>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&amp;family=Cinzel:wght@600;800;900&amp;family=Cinzel+Decorative:wght@700&amp;family=MedievalSharp&amp;family=Great+Vibes&amp;display=swap');
            </style>
            <!-- Premium CSS Inversion filter for drawn signatures in dark mode -->
            <filter id="invert-sig">
              <feColorMatrix type="matrix" values="
                -1  0  0  0  1
                 0 -1  0  0  1
                 0  0 -1  0  1
                 0  0  0  1  0" />
            </filter>

            <!-- Custom Linear Gradients for Medieval Elegance -->
            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#5c3e0e" />
              <stop offset="25%" stop-color="#a27924" />
              <stop offset="50%" stop-color="#eed48f" />
              <stop offset="75%" stop-color="#c29b38" />
              <stop offset="100%" stop-color="#402a0a" />
            </linearGradient>

            <linearGradient id="silver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#334155" />
              <stop offset="25%" stop-color="#64748b" />
              <stop offset="50%" stop-color="#e2e8f0" />
              <stop offset="75%" stop-color="#94a3b8" />
              <stop offset="100%" stop-color="#1e293b" />
            </linearGradient>

            <linearGradient id="bronze-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#451a03" />
              <stop offset="30%" stop-color="#92400e" />
              <stop offset="60%" stop-color="#d97706" />
              <stop offset="100%" stop-color="#291305" />
            </linearGradient>

            <linearGradient id="ruby-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#4c0519" />
              <stop offset="30%" stop-color="#9f1239" />
              <stop offset="60%" stop-color="#fda4af" />
              <stop offset="100%" stop-color="#1c0008" />
            </linearGradient>

            <linearGradient id="emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#022c22" />
              <stop offset="30%" stop-color="#065f46" />
              <stop offset="60%" stop-color="#a7f3d0" />
              <stop offset="100%" stop-color="#01140f" />
            </linearGradient>

            <linearGradient id="parchment-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fcfbf9" />
              <stop offset="50%" stop-color="#f6f3eb" />
              <stop offset="100%" stop-color="#ede3d0" />
            </linearGradient>

            <linearGradient id="velvet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#080c14" />
              <stop offset="50%" stop-color="#0f1424" />
              <stop offset="100%" stop-color="#05070c" />
            </linearGradient>
          </defs>

          <!-- Premium Background Pattern -->
          <rect width="800" height="600" fill="${bgFill}" rx="16"/>
          
          <!-- WATERMARKS -->
          ${isMedieval ? `
            <!-- Medieval Crest Shield Watermark in background center -->
            <g transform="translate(400, 300) scale(1.6)" opacity="${watermarkOpacity}" fill="none" stroke="${accentColor}" stroke-width="2">
              <path d="M -50,-60 L 50,-60 C 50,-60 50,0 0,60 C -50,0 -50,-60 -50,-60 Z" />
              <path d="M -40,-50 L 40,-50 C 40,-50 40,-5 0,50 C -40,-5 -40,-50 -40,-50 Z" stroke-width="0.8" />
              <!-- Medieval Eagle motif -->
              <path d="M 0,-35 L 10,-25 L 25,-25 L 15,-15 L 20,5 L 0,-5 L -20,5 L -15,-15 L -25,-25 L -10,-25 Z" fill="${accentColor}" />
            </g>
          ` : `
            <!-- Classic Circular Watermarks -->
            <circle cx="400" cy="300" r="280" fill="none" stroke="${accentColor}" stroke-opacity="${watermarkOpacity}" stroke-width="6"/>
            <circle cx="400" cy="300" r="270" fill="none" stroke="${accentColor}" stroke-opacity="${watermarkDashedOpacity}" stroke-width="1.5" />
          `}
          
          <!-- BORDERS AND FRAME -->
          ${isMedieval ? `
            <!-- Highly sophisticated Gothic Medieval Borders -->
            <rect x="25" y="25" width="750" height="550" fill="none" stroke="${accentColor}" stroke-width="4.5" rx="14"/>
            <rect x="35" y="35" width="730" height="530" fill="none" stroke="${accentColor}" stroke-opacity="${innerBorderOpacity}" stroke-width="1.5" rx="10"/>
            
            <!-- Ornate Corner scrolls and Fleur-de-lis flourishes -->
            <!-- Top Left -->
            <g transform="translate(45, 45)" stroke="${accentColor}" fill="none" stroke-width="2">
              <path d="M 0,25 C 0,0 25,0 25,0" />
              <path d="M 0,35 C 0,10 35,0 35,0" stroke-width="1" />
              <circle cx="25" cy="0" r="3.5" fill="${solidAccent}" stroke="none" />
              <circle cx="0" cy="25" r="3.5" fill="${solidAccent}" stroke="none" />
              <path d="M 0,0 L 12,12 L 4,16 L 0,24 L -4,16 L -12,12 Z" fill="${accentColor}" stroke="none" transform="rotate(-45) scale(0.9)" />
            </g>
            <!-- Top Right -->
            <g transform="translate(755, 45) scale(-1, 1)" stroke="${accentColor}" fill="none" stroke-width="2">
              <path d="M 0,25 C 0,0 25,0 25,0" />
              <path d="M 0,35 C 0,10 35,0 35,0" stroke-width="1" />
              <circle cx="25" cy="0" r="3.5" fill="${solidAccent}" stroke="none" />
              <circle cx="0" cy="25" r="3.5" fill="${solidAccent}" stroke="none" />
              <path d="M 0,0 L 12,12 L 4,16 L 0,24 L -4,16 L -12,12 Z" fill="${accentColor}" stroke="none" transform="rotate(-45) scale(0.9)" />
            </g>
            <!-- Bottom Left -->
            <g transform="translate(45, 555) scale(1, -1)" stroke="${accentColor}" fill="none" stroke-width="2">
              <path d="M 0,25 C 0,0 25,0 25,0" />
              <path d="M 0,35 C 0,10 35,0 35,0" stroke-width="1" />
              <circle cx="25" cy="0" r="3.5" fill="${solidAccent}" stroke="none" />
              <circle cx="0" cy="25" r="3.5" fill="${solidAccent}" stroke="none" />
              <path d="M 0,0 L 12,12 L 4,16 L 0,24 L -4,16 L -12,12 Z" fill="${accentColor}" stroke="none" transform="rotate(-45) scale(0.9)" />
            </g>
            <!-- Bottom Right -->
            <g transform="translate(755, 555) scale(-1, -1)" stroke="${accentColor}" fill="none" stroke-width="2">
              <path d="M 0,25 C 0,0 25,0 25,0" />
              <path d="M 0,35 C 0,10 35,0 35,0" stroke-width="1" />
              <circle cx="25" cy="0" r="3.5" fill="${solidAccent}" stroke="none" />
              <circle cx="0" cy="25" r="3.5" fill="${solidAccent}" stroke="none" />
              <path d="M 0,0 L 12,12 L 4,16 L 0,24 L -4,16 L -12,12 Z" fill="${accentColor}" stroke="none" transform="rotate(-45) scale(0.9)" />
            </g>
          ` : isImperial ? `
            <!-- Imperial Classic double fine line borders -->
            <rect x="25" y="25" width="750" height="550" fill="none" stroke="${outerBorderStroke}" stroke-width="1.5" rx="12"/>
            <rect x="35" y="35" width="730" height="530" fill="none" stroke="${accentColor}" stroke-opacity="${innerBorderOpacity}" stroke-width="2.5" rx="10"/>
            
            <!-- Standard Line Corner Motifs -->
            <g stroke="${accentColor}" stroke-opacity="0.85" stroke-width="2" fill="none">
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
          ` : `
            <!-- Modern Minimalist Border -->
            <rect x="35" y="35" width="730" height="530" fill="none" stroke="${accentColor}" stroke-width="1.5" rx="8" />
          `}
          
          <!-- Title Section -->
          <g transform="translate(400, 115)" text-anchor="middle">
            <text font-family="${titleFont}" font-weight="900" font-size="${isMedieval ? '30' : '34'}" fill="${titleFill}" letter-spacing="3">${locale.value === 'pt' ? 'CERTIFICADO DE CONCLUSÃO' : 'CERTIFICATE OF COMPLETION'}</text>
            <text font-family="'Inter', sans-serif" font-weight="600" font-size="11" fill="${subtitleFill}" y="30" letter-spacing="5">${locale.value === 'pt' ? 'ENSINO VOLUNTÁRIO DE LÍNGUA INGLESA' : 'VOLUNTEER ENGLISH LANGUAGE TEACHING'}</text>
            <line x1="-120" y1="42" x2="120" y2="42" stroke="${outerBorderStroke}" stroke-width="1.5"/>
          </g>
 
          <!-- Text Section -->
          <g transform="translate(400, 220)" text-anchor="middle">
            <text font-family="'Inter', sans-serif" font-size="14" fill="${mainTextFill}" font-style="italic">${locale.value === 'pt' ? 'Este certificado comprova de forma simbólica e por mérito acadêmico que' : 'This certificate symbolically proves through academic merit that'}</text>
            <text font-family="${studentNameFont}" font-weight="${isMedieval || isImperial ? 'normal' : '805'}" font-size="${isMedieval || isImperial ? '45' : '28'}" fill="${studentNameFill}" y="48">${props.studentName}</text>
            <line x1="-150" y1="65" x2="150" y2="65" stroke="${solidAccent}" stroke-opacity="${isDark ? '0.85' : '0.4'}" stroke-width="1.5"/>
          </g>
 
          <g transform="translate(400, 335)" text-anchor="middle">
            <text font-family="'Inter', sans-serif" font-size="14" fill="${mainTextFill}">${locale.value === 'pt' ? 'concluiu com aproveitamento e dedicação todas as lições do mini-curso:' : 'has successfully completed with dedication all lessons of the mini-course:'}</text>
            <text font-family="'Inter', sans-serif" font-weight="bold" font-size="22" fill="${themeColor}" y="32">${props.courseTitle}</text>
            <text font-family="'Inter', sans-serif" font-size="11" fill="${subTitleLabelFill}" y="60">${locale.value === 'pt' ? 'Programa de Aprendizado Autônomo e Solidário' : 'Autonomous and Solidary Learning Program'}</text>
          </g>
 
          <!-- Seal Icon / Seal Design Below Name -->
          <g transform="translate(400, 465)" text-anchor="middle">
            ${iconUrl ? `
              <!-- Frame for custom image -->
              <circle r="40" fill="${isDark ? '#0c101d' : '#ffffff'}" stroke="${accentColor}" stroke-width="1.5"/>
              <image href="${iconUrl}" x="-30" y="-30" height="60" width="60" />
            ` : isMedieval ? `
              <!-- Exquisite Gothic Melted Wax Seal -->
              <g transform="translate(0, -10)">
                <!-- Melted Wax Base scalloped body -->
                <path d="M 0,-35 C 10,-35 15,-30 25,-25 C 35,-20 35,-10 35,0 C 35,10 30,20 25,25 C 15,30 10,35 0,35 C -10,35 -15,30 -25,25 C -30,20 -35,10 -35,0 C -35,-10 -35,-20 -25,-25 C -15,-30 -10,-35 0,-35 Z" fill="${detailColor.value === 'theme' ? '#9f1239' : solidAccent}" opacity="0.95" />
                <path d="M 0,-32 C 8,-32 13,-28 22,-23 C 31,-18 31,-9 31,0 C 31,9 27,18 22,22 C 13,27 8,32 0,32 C -8,32 -13,27 -22,22 C -27,18 -31,9 -31,0 C -31,-9 -31,-18 -22,-23 C -13,-28 -8,-32 0,-32 Z" fill="none" stroke="${isDark ? '#000000' : '#ffffff'}" stroke-opacity="0.3" stroke-width="1.5" />
                <!-- Seal Inner Emblem -->
                <circle r="21" fill="${detailColor.value === 'theme' ? '#be123c' : accentColor}" stroke="${isDark ? '#000000' : '#ffffff'}" stroke-opacity="0.2" stroke-width="1"/>
                <!-- Fleur-de-lis icon inside seal -->
                <path d="M 0,-10 C 0,-10 2.5,-3 6.5,-3 C 4,-1.5 3,1 3,3 C 3,5 2.5,6.5 0,10 C -2.5,6.5 -3,5 -3,3 C -3,1 -4,-1.5 -6.5,-3 C -2.5,-3 0,-10 0,-10 Z" fill="${detailColor.value === 'theme' ? 'url(#gold-grad)' : '#ffffff'}" />
                <path d="M -6,1 C -3,1.5 0,3 6,1 Z" fill="${detailColor.value === 'theme' ? '#ffffff' : '#9f1239'}" />
              </g>
            ` : `
              <!-- Professional Default Geometric Seal -->
              <g>
                <!-- Left Ribbon Tail -->
                <path d="M -18 15 L -26 48 L -14 41 L -6 46 L -10 15 Z" fill="${accentColor}" opacity="0.85"/>
                <!-- Right Ribbon Tail (Symmetric) -->
                <path d="M 18 15 L 26 48 L 14 41 L 6 46 L 10 15 Z" fill="${accentColor}" opacity="0.85"/>
                
                <!-- Gold Badge with custom details -->
                <circle r="32" fill="${isDark ? '#1e293b' : '#fafaf9'}" stroke="${solidAccent}" stroke-width="3"/>
                <polygon points="0,-16 4,-6 14,-6 6,1 9,11 0,5 -9,11 -6,1 -14,-6 -4,-6" fill="${solidAccent}" opacity="0.9" />
                <circle r="25" fill="none" stroke="${isDark ? '#000000' : '#ffffff'}" stroke-opacity="0.3" stroke-width="1"/>
              </g>
            `}
            <text font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="bold" fill="${subtitleFill}" y="60">${locale.value === 'pt' ? 'CÓD' : 'CODE'}: ${idString}</text>
          </g>
 
          <!-- Footer signatures & Metadata -->
          <g transform="translate(150, 485)" text-anchor="middle">
            <!-- Dynamic Signature Area -->
            <g transform="translate(0, -15)">
              ${sigType.value === 'drawn' && sigImage.value ? `
                <image href="${sigImage.value}" x="-75" y="-35" width="150" height="50" style="${isDark ? 'mix-blend-mode: screen; filter: url(#invert-sig);' : 'mix-blend-mode: multiply;'}" />
              ` : `
                <text font-family="'Dancing Script', 'Brush Script MT', 'Georgia', cursive, serif" font-weight="600" font-size="22" font-style="italic" fill="${isDark ? '#fbbf24' : '#0f172a'}" y="10">${sigText.value || instructorName.value}</text>
              `}
            </g>
            <line x1="-80" y1="0" x2="80" y2="0" stroke="${footerLineStroke}" stroke-width="1"/>
            <text font-family="'Inter', sans-serif" font-weight="bold" font-size="11" fill="${footerNameFill}" y="16">${instructorName.value}</text>
            <text font-family="'Inter', sans-serif" font-size="9" fill="${footerLabelFill}" y="28">${locale.value === 'pt' ? 'Instrutor Voluntário' : 'Volunteer Instructor'}</text>
          </g>
 
          <g transform="translate(650, 485)" text-anchor="middle">
            <text font-family="'Inter', sans-serif" font-weight="bold" font-size="11" fill="${footerNameFill}" y="-10">${dateString}</text>
            <line x1="-80" y1="0" x2="80" y2="0" stroke="${footerLineStroke}" stroke-width="1"/>
            <text font-family="'Inter', sans-serif" font-size="11" fill="${footerNameFill}" y="16">${locale.value === 'pt' ? 'Data de Conclusão' : 'Completion Date'}</text>
            <text font-family="'Inter', sans-serif" font-size="9" fill="${footerLabelFill}" y="28">${locale.value === 'pt' ? 'Validação Eletrônica' : 'Electronic Validation'}</text>
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

watch(() => [props.studentName, props.courseTitle, props.primaryColor, props.iconUrl, props.creatorId, props.isTransferred, sigType.value, bgStyle.value, frameStyle.value, detailColor.value], () => {
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
              background: ${isDarkCertificate.value ? '#0c101d' : '#fafaf9'};
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
      class="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col md:grid md:grid-cols-12"
    >
      
      <!-- Left/Main Side: Interactive Certificate Render -->
      <div 
        class="md:col-span-8 p-6 sm:p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 min-h-[300px] transition-colors duration-300"
        :class="isDarkCertificate ? 'bg-slate-950' : 'bg-slate-50'"
      >
        <div v-if="isLoading" class="text-center space-y-3">
          <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p class="text-xs text-slate-500 dark:text-slate-400 font-semibold">{{ locale === 'pt' ? 'Emitindo Certificado com Assinatura Eletrônica...' : 'Issuing Certificate with Electronic Signature...' }}</p>
        </div>
        <div v-else-if="errorMsg" class="text-center p-6 space-y-3 max-w-sm">
          <AlertCircle class="w-10 h-10 text-rose-500 mx-auto" />
          <h4 class="text-sm font-bold text-slate-900 dark:text-white">{{ locale === 'pt' ? 'Emissão Indisponível' : 'Issuance Unavailable' }}</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{{ errorMsg }}</p>
        </div>
        <div 
          v-else
          id="svg-certificate-frame"
          class="w-full aspect-[4/3] rounded-xl shadow-md border overflow-hidden transition-all duration-300"
          :class="isDarkCertificate ? 'bg-slate-950 border-slate-850 shadow-slate-950/50' : 'bg-white border-slate-200'"
          v-html="svgContent || ''"
        />
      </div>

      <!-- Right Side: Descriptive Info & Download Callouts -->
      <div class="md:col-span-4 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-white dark:bg-slate-900">
        <div class="space-y-4 text-left">
          <div class="flex justify-between items-start">
            <span class="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Award class="w-6 h-6" />
            </span>
            <button
              id="btn-close-certificate-modal"
              @click="emit('close')"
              class="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              :title="locale === 'pt' ? 'Fechar' : 'Close'"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div>
            <span class="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full">
              {{ locale === 'pt' ? 'Selo de Proficiência' : 'Proficiency Seal' }}
            </span>
            <h3 class="text-lg font-black text-slate-900 dark:text-white mt-2 leading-snug">
              {{ locale === 'pt' ? `Parabéns, ${studentName}!` : `Congratulations, ${studentName}!` }}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1.5">
              {{ locale === 'pt' 
                ? `Você assimilou com sucesso todo o conteúdo de ` 
                : `You have successfully absorbed all content of `
              }}<strong>{{ courseTitle }}</strong>{{ locale === 'pt'
                ? ` e concluiu com maestria todas as questões avaliativas do programa de voluntariado.`
                : ` and masterfully completed all evaluation questions of the volunteer program.`
              }}
            </p>
          </div>

          <div class="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex items-start gap-2.5">
            <Sparkles class="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <span class="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
              {{ locale === 'pt'
                ? 'Este certificado simbólico pode ser impresso para comprovação de sua dedicação aos estudos voluntários de língua inglesa.'
                : 'This symbolic certificate can be printed to prove your dedication to volunteer English studies.'
              }}
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
            {{ locale === 'pt' ? 'Imprimir / PDF' : 'Print / PDF' }}
          </button>
          <button
            id="btn-cancel-certificate-view"
            @click="emit('close')"
            class="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {{ locale === 'pt' ? 'Fechar Visualização' : 'Close Preview' }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
