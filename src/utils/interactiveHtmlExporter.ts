import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Course, Lesson } from "../types";

export async function generateInteractiveHTML(course: Course, lessons: Lesson[]) {
  // Safe helper to encode UTF-8 bytes to Base64 in standard environments (using TextEncoder)
  const toBase64Utf8 = (str: string) => {
    const utf8Bytes = new TextEncoder().encode(str);
    let binString = "";
    for (let i = 0; i < utf8Bytes.length; i++) {
      binString += String.fromCharCode(utf8Bytes[i]);
    }
    return btoa(binString);
  };

  const base64Course = toBase64Utf8(JSON.stringify(course));
  const base64Lessons = toBase64Utf8(JSON.stringify(lessons));

  const courseTitle = course.title;
  
  let instructorName = course.creatorName || "Voluntário";
  let sigType = "text";
  let sigText = "";
  let sigImage = "";

  if (course.isTransferred) {
    instructorName = "Equipe de Admin da Iniciativa";
    sigType = "text";
    sigText = "Equipe de Admin da Iniciativa";
    sigImage = "";
  } else if (course.creatorId) {
    try {
      const docRef = doc(db, "users", course.creatorId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const uProfile = docSnap.data();
        instructorName = uProfile.displayName || instructorName;
        sigType = uProfile.signatureType || "text";
        sigText = uProfile.signatureText || "";
        sigImage = uProfile.signatureImage || "";
      }
    } catch (err) {
      console.warn("Falha ao obter assinatura do instrutor do Firestore para offline HTML:", err);
    }
  }

  const courseLevel = course.level;

  const themeColor = course.certificateConfig?.primaryColor || "#1e3a8a";
  const iconUrl = course.certificateConfig?.iconUrl || "";

  const bgStyleVal = course.certificateConfig?.bgStyle || "clean-light";
  const frameStyleVal = course.certificateConfig?.frameStyle || "modern-border";
  const detailColorVal = course.certificateConfig?.detailColor || "theme";

  const isDark = bgStyleVal === "dark-velvet";

  let bgFill = "#fafaf9";
  if (bgStyleVal === "vintage-parchment") {
    bgFill = "url(#parchment-grad)";
  } else if (bgStyleVal === "dark-velvet") {
    bgFill = "url(#velvet-grad)";
  } else {
    bgFill = "#ffffff";
  }

  let accentColor = themeColor;
  if (detailColorVal === "gold") accentColor = "url(#gold-grad)";
  else if (detailColorVal === "silver") accentColor = "url(#silver-grad)";
  else if (detailColorVal === "bronze") accentColor = "url(#bronze-grad)";
  else if (detailColorVal === "ruby") accentColor = "url(#ruby-grad)";
  else if (detailColorVal === "emerald") accentColor = "url(#emerald-grad)";

  let solidAccent = themeColor;
  if (detailColorVal === "gold") solidAccent = "#b8860b";
  else if (detailColorVal === "silver") solidAccent = "#475569";
  else if (detailColorVal === "bronze") solidAccent = "#854d0e";
  else if (detailColorVal === "ruby") solidAccent = "#be123c";
  else if (detailColorVal === "emerald") solidAccent = "#047857";

  const outerBorderStroke = isDark ? "#1e293b" : "#e2e8f0";
  const innerBorderOpacity = isDark ? "0.9" : "0.75";

  const isMedieval = frameStyleVal === "medieval-gothic";
  const isImperial = frameStyleVal === "classic-imperial";

  let titleFont = "'Inter', 'Helvetica Neue', sans-serif";
  if (isMedieval) titleFont = "'Cinzel Decorative', 'Cinzel', serif";
  else if (isImperial) titleFont = "'Cinzel', serif";

  let studentNameFont = "'Space Grotesk', 'Inter', sans-serif";
  if (isMedieval || isImperial) studentNameFont = "'Great Vibes', 'Dancing Script', cursive";

  const titleFill = detailColorVal === "theme" ? (isDark ? "#ffffff" : themeColor) : accentColor;
  const subtitleFill = isDark ? "#94a3b8" : "#57534e";
  const mainTextFill = isDark ? "#cbd5e1" : "#44403c";
  const studentNameFill = isDark ? "#ffffff" : "#1c1917";
  const subTitleLabelFill = isDark ? "#94a3b8" : "#78716c";
  const watermarkOpacity = isDark ? "0.08" : "0.04";
  const watermarkDashedOpacity = isDark ? "0.05" : "0.02";

  const sealSvg = iconUrl 
    ? `<circle r="40" fill="#ffffff" stroke="${solidAccent}" stroke-width="1.5"/><image href="${iconUrl}" x="-30" y="-30" height="60" width="60" />`
    : `<g><path d="M -15 35 L -8 52 L 0 46 L 8 52 L 15 35" fill="${solidAccent}" opacity="0.8"/><path d="M 0 35 L 7 52 L 15 46 L 23 52 L 30 35" fill="${solidAccent}" opacity="0.6"/><circle r="32" fill="${isDark ? '#0f172a' : '#fafaf9'}" stroke="${solidAccent}" stroke-width="3"/><polygon points="0,-16 4,-6 14,-6 6,1 9,11 0,5 -9,11 -6,1 -14,-6 -4,-6" fill="${solidAccent}" opacity="0.95" /><circle r="25" fill="none" stroke="${solidAccent}" stroke-width="1" stroke-dasharray="4 2"/></g>`;

  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  __SCRIPT_START__
    // Silencia avisos externos de CDN (ex.: Tailwind) e cookies/SameSite irrelevantes no iframe
    (function() {
      const filterPatterns = ['cdn.tailwindcss.com', 'SameSite', 'cookie', 'Directive', 'Desconsiderando', 'accelerometer', 'autoplay', 'clipboard-write', 'encrypted-media', 'gyroscope', 'picture-in-picture', 'youtube', '__Secure-YEC'];
      const shouldFilter = (msg) => {
        if (!msg || typeof msg !== 'string') return false;
        return filterPatterns.some(pat => msg.includes(pat));
      };
      
      const originalWarn = console.warn;
      console.warn = function(...args) {
        if (args.some(arg => shouldFilter(arg))) return;
        originalWarn.apply(console, args);
      };
      
      const originalError = console.error;
      console.error = function(...args) {
        if (args.some(arg => shouldFilter(arg))) return;
        originalError.apply(console, args);
      };
    })();
  __SCRIPT_END__
  <title>${courseTitle} - Material de Estudos Interativo</title>
  <!-- Tailwind CSS -->
  __TAILWIND_CDN__
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
  <!-- Marked Markdown Parser -->
  __MARKED_CDN__
  __STYLE_START__
    body {
      font-family: 'Inter', sans-serif;
    }
    .markdown-body {
      font-size: 13.5px;
      line-height: 1.625;
      color: #334155;
    }
    .markdown-body h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.35rem;
    }
    .markdown-body h2 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
      margin-top: 1.25rem;
      margin-bottom: 0.5rem;
    }
    .markdown-body h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #334155;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    .markdown-body p {
      margin-bottom: 0.85rem;
    }
    .markdown-body ul, .markdown-body ol {
      margin-bottom: 0.85rem;
      padding-left: 1.25rem;
      list-style-type: disc;
    }
    .markdown-body ol {
      list-style-type: decimal;
    }
    .markdown-body li {
      margin-bottom: 0.25rem;
    }
    .markdown-body code {
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 0.15rem 0.3rem;
      border-radius: 0.25rem;
      font-family: monospace;
      font-size: 0.85em;
    }
    .markdown-body pre {
      background-color: #f8fafc;
      padding: 0.75rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin-bottom: 0.85rem;
      border: 1px solid #e2e8f0;
    }
    .markdown-body pre code {
      background-color: transparent;
      padding: 0;
      font-size: 0.85rem;
    }
    .markdown-body blockquote {
      border-left: 4px solid #cbd5e1;
      padding-left: 0.75rem;
      color: #475569;
      font-style: italic;
      margin-bottom: 0.85rem;
    }
    /* Simple Animation */
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    /* Estilos para Impressao do Certificado */
    @media print {
      body * {
        visibility: hidden !important;
      }
      .certificate-print-container, .certificate-print-container * {
        visibility: visible !important;
      }
      html, body {
        width: 297mm !important;
        height: 210mm !important;
        max-width: 297mm !important;
        max-height: 210mm !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        background-color: #fafaf9 !important;
        display: block !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        page-break-inside: avoid !important;
      }
      body > :not(.certificate-print-container) {
        display: none !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
      }
      .certificate-print-container {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 297mm !important;
        height: 210mm !important;
        max-width: 297mm !important;
        max-height: 210mm !important;
        margin: 0 !important;
        padding: 0 !important;
        align-items: center !important;
        justify-content: center !important;
        display: flex !important;
        z-index: 99999 !important;
        page-break-inside: avoid !important;
        page-break-after: avoid !important;
        page-break-before: avoid !important;
        box-sizing: border-box !important;
      }
      .certificate-print-inner {
        width: 297mm !important;
        height: 210mm !important;
        max-width: 297mm !important;
        max-height: 210mm !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        padding: 0 !important;
        page-break-inside: avoid !important;
      }
      .certificate-svg-print {
        width: 297mm !important;
        height: 210mm !important;
        max-width: 100% !important;
        max-height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
        page-break-inside: avoid !important;
      }
      @page {
        size: A4 landscape !important;
        margin: 0 !important;
      }
    }
  __STYLE_END__
</head>
<body class="bg-slate-50 min-h-screen text-slate-800 flex flex-col">

  <!-- Header Banner -->
  <header class="text-white relative overflow-hidden shrink-0 shadow-lg" style="background-color: ${themeColor}">
    <!-- Decorative background flow -->
    <div class="absolute inset-0 opacity-15">
      <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z" fill="white"></path>
      </svg>
    </div>
    
    <div class="max-w-6xl mx-auto px-6 py-8 relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="text-left">
        <p class="text-xs uppercase font-black tracking-wider text-white/70 mb-1">Material Autônomo Interativo</p>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight select-all">${courseTitle}</h1>
        <div class="flex items-center gap-2 mt-2">
          <span class="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/10 select-none">
            Nível: ${courseLevel}
          </span>
          <span class="text-xs text-white/80 font-medium">Língua Inglesa</span>
        </div>
      </div>
      
      <!-- Concise offline status card -->
      <div class="bg-black/15 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-left shrink-0 max-w-sm flex items-start gap-2.5">
        <div class="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 mt-0.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
        </div>
        <div>
          <h3 class="text-xs font-bold text-white select-none">Modo 100% Autônomo</h3>
          <p class="text-[10px] text-white/70 leading-normal">Este arquivo contém todas as lições e questionários embutidos. Você pode estudar sem internet e imprimir seu certificado.</p>
        </div>
      </div>
    </div>
  </header>

  <!-- Interactive Grid Container -->
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-grow w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
    
    <!-- Left Navigation: Lessons List -->
    <nav class="lg:col-span-4 flex flex-col gap-5">
      <!-- Progress Bar -->
      <div class="bg-white border border-slate-200/70 p-5 rounded-2xl shadow-sm text-left">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-400 uppercase select-none">Progresso de Estudos</span>
          <span id="progress-percentage-label" class="text-sm font-extrabold" style="color: ${themeColor}">0%</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div id="progress-bar-inner" class="h-full rounded-full transition-all duration-500" style="width: 0%; background-color: ${themeColor}"></div>
        </div>
        <p id="progress-fraction-label" class="text-[11px] text-slate-400 font-bold mt-2 select-none">0 de 0 lições completadas</p>
      </div>

      <!-- Certificate Access Trigger (Visible when course is fully completed) -->
      <div id="certificate-view-sidebar-btn" class="hidden">
        <button
          onclick="toggleCertificateReview(false)"
          class="w-full py-4 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition duration-150 cursor-pointer text-center flex items-center justify-center gap-2 border border-emerald-500"
        >
          🏆 Ver Certificado Desbloqueado
        </button>
      </div>

      <!-- Navigation buttons -->
      <div id="lessons-nav-list" class="flex flex-col gap-2">
         <!-- Injected by JavaScript on load -->
      </div>
    </nav>

    <!-- Right Column: Slide/Lesson study material and visualizer -->
    <main class="lg:col-span-8 flex flex-col">
      <!-- Active Lesson details card -->
      <article id="standard-lesson-article" class="bg-white border border-slate-200/70 rounded-3xl shadow-sm p-6 sm:p-8 flex-grow flex flex-col text-left">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 select-none">
          <div>
            <span id="lesson-index-badge" class="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-slate-100 text-slate-500">LIÇÃO 1</span>
            <h2 id="lesson-title-header" class="text-xl font-bold text-slate-800 mt-1.5">Carregando título da lição...</h2>
          </div>
        </div>

        <!-- Interactive video callout/embed if active -->
        <div id="youtube-player-container" class="mb-6 hidden">
          <!-- Dynamically Injected by JS as a premium embedded YouTube player -->
        </div>

        <!-- Markdown HTML Output -->
        <div id="markdown-rendered-viewport" class="markdown-body prose max-w-none flex-grow">
          <!-- Injected by JS -->
        </div>

        <!-- Finalized action bar inside standard study sheet -->
        <div class="mt-8 pt-5 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-2">
            <svg id="status-icon-pending" class="w-5 h-5 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke-width="2.5"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3"/></svg>
            <svg id="status-icon-completed" class="w-5 h-5 text-emerald-500 shrink-0 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
            <span id="status-text-label" class="text-xs font-bold text-slate-400">Progresso pendente para esta lição</span>
          </div>

          <button
            id="primary-lesson-action-btn"
            onclick="triggerPrimaryLessonAction()"
            class="px-5 py-3 text-white text-xs font-extrabold rounded-xl transition shadow-md shrink-0 cursor-pointer text-center"
            style="background-color: ${themeColor}"
          >
            Aguardando...
          </button>
        </div>
      </article>

      <!-- Quiz Banner Trigger -->
      <div id="lesson-quiz-banner" class="mt-6 bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-left hidden">
        <div class="flex items-start gap-3">
          <div class="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100">Avaliação da Lição Disponível</h3>
            <p class="text-[11px] text-slate-400 leading-normal">Esta lição requer aprovação no questionário com pontuação mínima de 80% para validação.</p>
          </div>
        </div>
        <button 
          onclick="openQuizModal()"
          class="bg-amber-400 hover:bg-amber-500 text-gray-950 px-5 py-3 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer shadow-md"
        >
          Responder Questionário
        </button>
      </div>

      <!-- Floating Quiz Modal Overlay -->
      <div id="quiz-modal-overlay" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white border border-slate-200 shadow-2xl rounded-3xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[90vh]">
          <!-- Header -->
          <div class="p-5 border-b border-slate-100 flex items-center justify-between select-none">
            <div class="text-left">
              <span class="text-[10px] font-black tracking-wider text-slate-400 uppercase">Aproveitamento Acadêmico</span>
              <h3 id="quiz-modal-title" class="text-base font-bold text-slate-800">Avaliação da Lição</h3>
            </div>
            <!-- Close (X) button -->
            <button 
              onclick="closeQuizModal()" 
              class="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 overflow-y-auto flex-1 text-left">
            <div id="quiz-questions-anchor" class="space-y-6">
              <!-- Injected by JS -->
            </div>
          </div>

          <!-- Sticky footer of the modal -->
          <div class="p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="text-left">
              <!-- Feedbacks go here -->
              <p id="quiz-feedback-label" class="text-xs font-bold text-slate-500"></p>
            </div>
            <div class="flex items-center gap-2">
              <button 
                onclick="closeQuizModal()" 
                class="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-5 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                id="submit-quiz-action-btn"
                onclick="submitQuizAnswers()" 
                class="px-5 py-3 text-white text-xs font-black rounded-xl transition shadow-md cursor-pointer"
                style="background-color: ${themeColor}"
              >
                Enviar Respostas
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Congratulations Certificate Panel -->
      <div id="certificate-congratulations-card" class="bg-gradient-to-br from-white to-slate-50 border-2 border-dashed border-emerald-400 rounded-3xl p-6 sm:p-10 text-center shadow-xl flex-grow flex flex-col items-center justify-center hidden animate-fadeIn">
        <div class="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
        </div>
        
        <h2 class="text-xl sm:text-2xl font-black text-slate-800">Congratulations!</h2>
        <p class="text-xs sm:text-sm text-slate-500 font-medium max-w-md mt-1 mb-6">
          Você concluiu com maestria todas as lições deste curso de inglês voluntário. Seu progresso foi coroado com um certificado autônomo e vitalício.
        </p>

        <div class="mt-2 p-5 bg-white border border-slate-200/60 rounded-2xl w-full" style="max-width: 450px; margin-left: auto; margin-right: auto; text-align: left;">
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Seu Nome para o Certificado</label>
            <input 
              id="student-certificate-input" 
              type="text" 
              placeholder="Digite seu nome completo..."
              value="Estudante Independente"
              oninput="updateCertificateOwner(this.value)"
              class="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:bg-white rounded-lg p-2.5 focus:outline-indigo-600 text-slate-900"
            />
          </div>

          <button
            onclick="window.print()"
            class="w-full py-4 px-5 mt-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl transition text-center cursor-pointer whitespace-normal leading-relaxed shadow-sm"
          >
            Imprimir seu Certificado Elegante
          </button>
        </div>

        <div class="mt-6">
          <button
            onclick="toggleCertificateReview(true)"
            class="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer shadow-xs border border-slate-200"
          >
            <span>📚 Rever Lições & Conteúdo do Curso</span>
          </button>
        </div>
      </div>
    </main>
  </div>

  <!-- Footer -->
  <footer class="bg-indigo-950 text-indigo-300 py-6 px-6 border-t border-indigo-900 mt-12 text-center text-xs">
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row sm:justify-between items-center gap-3">
      <p class="font-medium">Our First Global Job • Conexão, Ensino e Solidariedade</p>
      <p class="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
        Keep the knowledge and material, it is free and yours forever!
      </p>
    </div>
  </footer>

  <!-- State & Dynamic Renders Script Injection (concatenated style to prevent Vue template/script tags conflict during bundling) -->
  __SCRIPT_START__
    // Modern robust TextDecoder/TextEncoder compatible Base64 decoding helper
    function decodeBase64Utf8(base64) {
      try {
        const binString = atob(base64.trim());
        const bytes = new Uint8Array(binString.length);
        for (let i = 0; i < binString.length; i++) {
          bytes[i] = binString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
      } catch (e) {
        console.error("Erro ao decodificar Base64:", e);
        return "[]";
      }
    }

    const rawCourse = "${base64Course}";
    const rawLessons = "${base64Lessons}";

    const course = JSON.parse(decodeBase64Utf8(rawCourse));
    const lessons = JSON.parse(decodeBase64Utf8(rawLessons));

    const progressConfig = course.progressConfig || {
      requireReading: true,
      requireQuiz: false,
      minQuizScore: 70,
      requireVideo: false
    };

    let activeIndex = 0;
    let forceHideCertificate = false;
    
    // Core local states
    const completedReadings = JSON.parse(localStorage.getItem('off_reading_' + course.id) || '[]');
    const completedVideos = JSON.parse(localStorage.getItem('off_video_' + course.id) || '[]');
    const completedQuizzes = JSON.parse(localStorage.getItem('off_quiz_' + course.id) || '[]');
    const quizScores = JSON.parse(localStorage.getItem('off_scores_' + course.id) || '{}');

    // Selected state tracker for active quiz
    let currentSelectedAnswers = {};

    function updateCertificateOwner(name) {
      const els = document.querySelectorAll('.cert-owner-name-print');
      els.forEach(el => {
        el.textContent = name || "Estudante Independente";
      });
    }

    function checkPassScore() {
      return progressConfig.requireQuiz ? 80 : (progressConfig.minQuizScore || 70);
    }

    function isLessonCompleted(lessonId) {
      const lesson = lessons.find(l => l.id === lessonId);
      if (!lesson) return false;

      const score = Number(quizScores[lessonId] || 0);
      const isQuizPassed = completedQuizzes.includes(lessonId) && score >= checkPassScore();

      if (lesson.quiz && lesson.quiz.length > 0 && isQuizPassed) {
        return true;
      }

      let readingOk = !progressConfig.requireReading || completedReadings.includes(lessonId);
      let videoOk = !progressConfig.requireVideo || !lesson.videoUrl || completedVideos.includes(lessonId);
      let quizOk = !progressConfig.requireQuiz || !lesson.quiz || lesson.quiz.length === 0 || isQuizPassed;

      return readingOk && videoOk && quizOk;
    }

    function getCompletedCount() {
      let count = 0;
      lessons.forEach(l => {
        if (isLessonCompleted(l.id)) count++;
      });
      return count;
    }

    function updateProgressUI() {
      const count = getCompletedCount();
      const total = lessons.length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;

      document.getElementById('progress-percentage-label').textContent = pct + '%';
      document.getElementById('progress-bar-inner').style.width = pct + '%';
      document.getElementById('progress-fraction-label').textContent = count + ' de ' + total + ' lições completadas';

      const congratsCard = document.getElementById('certificate-congratulations-card');
      const standardMain = document.getElementById('standard-lesson-article');
      const quizBanner = document.getElementById('lesson-quiz-banner');
      const sidebarCertBtn = document.getElementById('certificate-view-sidebar-btn');

      // Update sidebar certificate access button
      if (sidebarCertBtn) {
        if (total > 0 && count >= total) {
          sidebarCertBtn.classList.remove('hidden');
        } else {
          sidebarCertBtn.classList.add('hidden');
        }
      }

      if (total > 0 && count >= total && !forceHideCertificate) {
        congratsCard.classList.remove('hidden');
        if (standardMain) standardMain.classList.add('hidden');
        if (quizBanner) quizBanner.classList.add('hidden');
      } else {
        congratsCard.classList.add('hidden');
        if (standardMain) standardMain.classList.remove('hidden');
        // Restore quiz banner if active lesson has quiz
        const currentLesson = lessons[activeIndex];
        if (currentLesson && currentLesson.quiz && currentLesson.quiz.length > 0) {
          if (quizBanner) quizBanner.classList.remove('hidden');
        } else {
          if (quizBanner) quizBanner.classList.add('hidden');
        }
      }
    }

    window.toggleCertificateReview = function(hide) {
      forceHideCertificate = hide;
      updateProgressUI();
    };

    window.watchVideoExternally = function() {
      const lesson = lessons[activeIndex];
      if (!lesson || !lesson.videoUrl) return;
      window.open(lesson.videoUrl, '_blank');
      
      if (!completedVideos.includes(lesson.id)) {
        completedVideos.push(lesson.id);
        localStorage.setItem('off_video_' + course.id, JSON.stringify(completedVideos));
      }
      
      const watchedBadge = document.getElementById('video-watched-badge');
      if (watchedBadge) {
        watchedBadge.classList.remove('hidden');
        watchedBadge.classList.add('flex');
      }
      
      updateActiveLessonStatusUI();
      updateProgressUI();
    };

    function selectLesson(index, isUserInteraction = true) {
      if (isUserInteraction) {
        forceHideCertificate = true; // Automatically hide certificate when clicking a lesson
      }
      activeIndex = index;
      renderNavigation();
 
      const lesson = lessons[index];
      document.getElementById('lesson-index-badge').textContent = 'LIÇÃO ' + (index + 1);
      document.getElementById('lesson-title-header').textContent = lesson.title;
 
      // Render Markdown content
      const viewport = document.getElementById('markdown-rendered-viewport');
      if (typeof marked !== 'undefined') {
        viewport.innerHTML = marked.parse(lesson.content || '*Nenhum conteúdo adicionado ainda.*');
      } else {
        viewport.innerHTML = '<p>' + (lesson.content || 'Nenhum conteúdo.') + '</p>';
      }
 
      // Render video if available
      const videoContainer = document.getElementById('youtube-player-container');
      if (lesson.videoUrl) {
        const isWatched = completedVideos.includes(lesson.id);
        const badgeClass = isWatched ? 'flex' : 'hidden';
        videoContainer.innerHTML = '<div class="p-5 sm:p-6 rounded-2xl border border-amber-200 bg-amber-50/40 text-left space-y-3.5">' +
            '<div class="flex items-start gap-3">' +
              '<div class="p-2.5 bg-amber-100 text-amber-700 rounded-xl border border-amber-200">' +
                '<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
                  '<path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>' +
                  '<path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>' +
                '</svg>' +
              '</div>' +
              '<div class="space-y-1">' +
                '<h3 class="text-sm font-black text-slate-800 uppercase tracking-wide">Vídeo Explicativo Recomendado</h3>' +
                '<p class="text-xs text-slate-600 leading-relaxed font-semibold">' +
                  'Esta lição conta com uma instrução em vídeo. Para garantir uma reprodução fluida e evitar restrições de segurança ou bloqueios de cookies no ambiente offline, assista abrindo em uma nova janela.' +
                '</p>' +
              '</div>' +
            '</div>' +
            '<div class="flex flex-wrap items-center gap-3 pt-1">' +
              '<button ' +
                'onclick="watchVideoExternally()" ' +
                'class="inline-flex items-center gap-1.5 px-5 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-black rounded-xl transition shadow-sm cursor-pointer"' +
              '>' +
                '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
                  '<path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>' +
                '</svg>' +
                'Abrir Vídeo em Nova Janela ↗' +
              '</button>' +
              '<div id="video-watched-badge" class="' + badgeClass + ' text-xs font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-xl">' +
                '<svg style="width: 18px; height: 18px;" class="text-emerald-500 shrink-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>' +
                'Vídeo marcado como assistido!' +
              '</div>' +
            '</div>' +
          '</div>';
        videoContainer.classList.remove('hidden');
      } else {
        videoContainer.innerHTML = '';
        videoContainer.classList.add('hidden');
      }
 
      updateActiveLessonStatusUI();
      updateProgressUI();
    }

    function updateActiveLessonStatusUI() {
      const lesson = lessons[activeIndex];
      const completed = isLessonCompleted(lesson.id);

      const pendingIcon = document.getElementById('status-icon-pending');
      const completedIcon = document.getElementById('status-icon-completed');
      const statusLabel = document.getElementById('status-text-label');
      const actionBtn = document.getElementById('primary-lesson-action-btn');

      if (completed) {
        pendingIcon.classList.add('hidden');
        completedIcon.classList.remove('hidden');
        statusLabel.textContent = 'Você completou esta lição!';
        statusLabel.className = 'text-xs font-bold text-emerald-500';
        actionBtn.textContent = 'Lição Concluída ✓';
        actionBtn.className = 'px-5 py-2.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl transition cursor-not-allowed';
        actionBtn.disabled = true;
      } else {
        pendingIcon.classList.remove('hidden');
        completedIcon.classList.add('hidden');
        statusLabel.textContent = 'Progresso pendente para esta lição';
        statusLabel.className = 'text-xs font-bold text-slate-400';

        if (progressConfig.requireReading && !completedReadings.includes(lesson.id)) {
          actionBtn.textContent = 'Marcar Leitura como Concluída';
          actionBtn.className = 'px-5 py-2.5 text-white text-xs font-extrabold rounded-xl transition shadow-md shrink-0 cursor-pointer text-center';
          actionBtn.style.backgroundColor = '${themeColor}';
          actionBtn.disabled = false;
        } else if (progressConfig.requireVideo && lesson.videoUrl && !completedVideos.includes(lesson.id)) {
          actionBtn.textContent = 'Marcar Vídeo como Assistido';
          actionBtn.className = 'px-5 py-2.5 text-white text-xs font-extrabold rounded-xl transition shadow-md shrink-0 cursor-pointer text-center';
          actionBtn.style.backgroundColor = '${themeColor}';
          actionBtn.disabled = false;
        } else if (lesson.quiz && lesson.quiz.length > 0) {
          actionBtn.textContent = 'Fazer Prova da Lição';
          actionBtn.className = 'px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl transition shadow-md shrink-0 cursor-pointer text-center';
          actionBtn.style.backgroundColor = '';
          actionBtn.disabled = false;
        } else {
          // Fallback allow complete
          actionBtn.textContent = 'Marcar lição como Concluída';
          actionBtn.className = 'px-5 py-2.5 text-white text-xs font-extrabold rounded-xl transition shadow-md shrink-0 cursor-pointer text-center';
          actionBtn.style.backgroundColor = '${themeColor}';
          actionBtn.disabled = false;
        }
      }
    }

    function triggerPrimaryLessonAction() {
      const lesson = lessons[activeIndex];
      if (progressConfig.requireReading && !completedReadings.includes(lesson.id)) {
        completedReadings.push(lesson.id);
        localStorage.setItem('off_reading_' + course.id, JSON.stringify(completedReadings));
      } else if (progressConfig.requireVideo && lesson.videoUrl && !completedVideos.includes(lesson.id)) {
        completedVideos.push(lesson.id);
        localStorage.setItem('off_video_' + course.id, JSON.stringify(completedVideos));
      } else if (!lesson.quiz || lesson.quiz.length === 0) {
        completedReadings.push(lesson.id);
        completedVideos.push(lesson.id);
        localStorage.setItem('off_reading_' + course.id, JSON.stringify(completedReadings));
        localStorage.setItem('off_video_' + course.id, JSON.stringify(completedVideos));
      } else {
        openQuizModal();
        return;
      }

      updateActiveLessonStatusUI();
      updateProgressUI();
    }

    function openQuizModal() {
      const lesson = lessons[activeIndex];
      currentSelectedAnswers = {};

      document.getElementById('quiz-modal-title').textContent = 'Avaliação - ' + lesson.title;
      document.getElementById('quiz-feedback-label').textContent = '';

      const anchor = document.getElementById('quiz-questions-anchor');
      anchor.innerHTML = '';

      lesson.quiz.forEach((q, qIdx) => {
        const block = document.createElement('div');
        block.className = 'space-y-3';

        const qTitle = document.createElement('h4');
        qTitle.className = 'text-xs font-extrabold text-slate-700 uppercase';
        qTitle.textContent = (qIdx + 1) + '. ' + q.question;
        block.appendChild(qTitle);

        const optionsGrid = document.createElement('div');
        optionsGrid.className = 'grid grid-cols-1 gap-2.5';

        q.options.forEach((opt, oIdx) => {
          const optBtn = document.createElement('button');
          optBtn.id = 'quiz-btn-' + qIdx + '-' + oIdx;
          optBtn.className = 'w-full text-left p-3.5 rounded-xl border border-slate-200/70 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer';
          optBtn.onclick = () => selectQuizOption(qIdx, oIdx, q.options.length);
          optBtn.textContent = opt;
          optionsGrid.appendChild(optBtn);
        });

        block.appendChild(optionsGrid);
        anchor.appendChild(block);
      });

      document.getElementById('quiz-modal-overlay').classList.remove('hidden');
    }

    function selectQuizOption(qIdx, oIdx, totalOptions) {
      currentSelectedAnswers[qIdx] = oIdx;

      for (let i = 0; i < totalOptions; i++) {
        const btn = document.getElementById('quiz-btn-' + qIdx + '-' + i);
        if (btn) {
          if (i === oIdx) {
            btn.className = 'w-full text-left p-3.5 rounded-xl border text-xs font-black transition cursor-pointer';
            btn.style.borderColor = '${themeColor}';
            btn.style.color = '${themeColor}';
            btn.style.backgroundColor = 'color-mix(in srgb, ${themeColor} 8%, #ffffff)';
          } else {
            btn.className = 'w-full text-left p-3.5 rounded-xl border border-slate-200/70 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer';
            btn.style.borderColor = '';
            btn.style.color = '';
            btn.style.backgroundColor = '';
          }
        }
      }
    }

    function closeQuizModal() {
      document.getElementById('quiz-modal-overlay').classList.add('hidden');
    }

    function submitQuizAnswers() {
      const lesson = lessons[activeIndex];
      const totalQs = lesson.quiz.length;

      let answeredCount = 0;
      lesson.quiz.forEach((_, qIdx) => {
        if (currentSelectedAnswers[qIdx] !== undefined) answeredCount++;
      });

      if (answeredCount < totalQs) {
        document.getElementById('quiz-feedback-label').textContent = '⚠️ Responda todas as perguntas antes de enviar.';
        document.getElementById('quiz-feedback-label').className = 'text-xs font-bold text-rose-500';
        return;
      }

      let correctCount = 0;
      lesson.quiz.forEach((q, qIdx) => {
        if (Number(currentSelectedAnswers[qIdx]) === Number(q.correctAnswer)) {
          correctCount++;
        }
      });

      const pct = Math.round((correctCount / totalQs) * 100);
      const minPass = checkPassScore();
      const passed = pct >= minPass;

      quizScores[lesson.id] = Math.max(Number(quizScores[lesson.id] || 0), pct);
      localStorage.setItem('off_scores_' + course.id, JSON.stringify(quizScores));

      if (passed) {
        if (!completedQuizzes.includes(lesson.id)) {
          completedQuizzes.push(lesson.id);
        }
        localStorage.setItem('off_quiz_' + course.id, JSON.stringify(completedQuizzes));
        
        // Also force complete reading and video for cooperative user success
        if (!completedReadings.includes(lesson.id)) {
          completedReadings.push(lesson.id);
          localStorage.setItem('off_reading_' + course.id, JSON.stringify(completedReadings));
        }
        if (lesson.videoUrl && !completedVideos.includes(lesson.id)) {
          completedVideos.push(lesson.id);
          localStorage.setItem('off_video_' + course.id, JSON.stringify(completedVideos));
        }

        document.getElementById('quiz-feedback-label').textContent = '🎉 Aprovado! Nota: ' + pct + '% (' + correctCount + '/' + totalQs + ').';
        document.getElementById('quiz-feedback-label').className = 'text-xs font-bold text-emerald-600';

        setTimeout(() => {
          closeQuizModal();
          updateActiveLessonStatusUI();
          updateProgressUI();
        }, 1500);
      } else {
        document.getElementById('quiz-feedback-label').textContent = '❌ Reprovado. Nota: ' + pct + '% (' + correctCount + '/' + totalQs + '). Mínimo: ' + minPass + '%. Tente novamente!';
        document.getElementById('quiz-feedback-label').className = 'text-xs font-bold text-rose-600';
      }
    }

    function renderNavigation() {
      const lessonsNav = document.getElementById('lessons-nav-list');
      lessonsNav.innerHTML = '';

      lessons.forEach((l, idx) => {
        const btn = document.createElement('button');
        btn.onclick = () => selectLesson(idx);
        
        const isCompleted = isLessonCompleted(l.id);
        const iconMarkup = isCompleted 
          ? '<svg class="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7"></path></svg>'
          : '<svg class="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke-width="2.5"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3"/></svg>';

        btn.innerHTML = 
          '<div class="text-left shrink min-w-0 pr-1">' +
            '<p class="text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">Lição ' + (idx + 1) + '</p>' +
            '<p class="text-xs font-bold text-slate-800 truncate leading-snug select-all">' + l.title + '</p>' +
          '</div>' +
          '<div class="shrink-0 ml-1">' + iconMarkup + '</div>';

        if (idx === activeIndex) {
          btn.className = 'lesson-btn w-full text-left p-3.5 rounded-xl border text-sm transition flex items-center justify-between cursor-pointer font-extrabold min-w-0';
          btn.style.borderColor = '${themeColor}';
          btn.style.color = '${themeColor}';
          btn.style.backgroundColor = 'color-mix(in srgb, ${themeColor} 8%, #ffffff)';
        } else {
          btn.className = 'lesson-btn w-full text-left p-3.5 rounded-xl border border-transparent hover:bg-slate-50 text-slate-700 font-medium text-sm transition flex items-center justify-between cursor-pointer min-w-0';
          btn.style.borderColor = 'transparent';
          btn.style.color = '';
          btn.style.backgroundColor = '';
        }

        lessonsNav.appendChild(btn);
      });
    }

    window.onload = () => {
      // Setup dynamic date
      const dateStr = new Date().toLocaleDateString("pt-BR");
      const dateEl = document.getElementById('cert-date-text-print');
      if (dateEl) {
        dateEl.textContent = dateStr;
      }

      updateProgressUI();
      renderNavigation();
      if (lessons.length > 0) {
        selectLesson(0, false);
      }
    };
  __SCRIPT_END__

  <!-- Special Certificate Print view styling -->
  <div class="hidden print:flex certificate-print-container fixed inset-0 bg-white z-[9999] p-0 items-center justify-center">
    <div style="width: 800px; height: 600px;" class="certificate-print-inner">
      <!-- Elegant SVG Template directly matching the production layout -->
      <svg class="certificate-svg-print" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
        <defs>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&amp;family=Cinzel:wght@600;800;900&amp;family=Cinzel+Decorative:wght@700&amp;family=MedievalSharp&amp;family=Great+Vibes&amp;display=swap');
          </style>
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
            <path d="M 0,-35 L 10,-25 L 25,-25 L 15,-15 L 20,5 L 0,-5 L -20,5 L -15,-15 L -25,-25 L -10,-25 Z" fill="${accentColor}" />
          </g>
        ` : `
          <!-- Classic Circular Watermarks -->
          <circle cx="400" cy="300" r="280" fill="none" stroke="${accentColor}" stroke-opacity="${watermarkOpacity}" stroke-width="6"/>
          <circle cx="400" cy="300" r="270" fill="none" stroke="${accentColor}" stroke-opacity="${watermarkDashedOpacity}" stroke-width="1.5" />
        `}
        
        <!-- BORDERS AND FRAME -->
        ${isMedieval ? `
          <!-- Gothic Medieval Borders -->
          <rect x="25" y="25" width="750" height="550" fill="none" stroke="${accentColor}" stroke-width="4.5" rx="14"/>
          <rect x="35" y="35" width="730" height="530" fill="none" stroke="${accentColor}" stroke-opacity="${innerBorderOpacity}" stroke-width="1.5" rx="10"/>
          
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
        
        <!-- Title -->
        <g transform="translate(400, 115)" text-anchor="middle">
          <text font-family="${titleFont}" font-weight="900" font-size="${isMedieval ? '30' : '34'}" fill="${titleFill}" letter-spacing="3">CERTIFICADO DE CONCLUSÃO</text>
          <text font-family="'Inter', sans-serif" font-weight="600" font-size="11" fill="${subtitleFill}" y="30" letter-spacing="5">ENSINO VOLUNTÁRIO DE LÍNGUA INGLESA</text>
          <line x1="-120" y1="42" x2="120" y2="42" stroke="${outerBorderStroke}" stroke-width="1.5"/>
        </g>

        <!-- Student Owner name -->
        <g transform="translate(400, 220)" text-anchor="middle">
          <text font-family="'Inter', sans-serif" font-size="14" fill="${mainTextFill}" font-style="italic">Este certificado comprova de forma simbólica e por mérito acadêmico que</text>
          <text font-family="${studentNameFont}" font-weight="${isMedieval || isImperial ? 'normal' : '805'}" font-size="${isMedieval || isImperial ? '45' : '28'}" fill="${studentNameFill}" y="48" class="cert-owner-name-print">Estudante Independente</text>
          <line x1="-150" y1="65" x2="150" y2="65" stroke="${solidAccent}" stroke-opacity="${isDark ? '0.85' : '0.4'}" stroke-width="1.5"/>
        </g>

        <!-- Course text -->
        <g transform="translate(400, 335)" text-anchor="middle">
          <text font-family="'Inter', sans-serif" font-size="14" fill="${mainTextFill}">concluiu com aproveitamento e dedicação todas as lições do mini-curso:</text>
          <text font-family="'Inter', sans-serif" font-weight="bold" font-size="22" fill="${themeColor}" y="32">${courseTitle}</text>
          <text font-family="'Inter', sans-serif" font-size="11" fill="${subTitleLabelFill}" y="60">Programa de Aprendizado Autônomo e Solidário</text>
        </g>

        <!-- Seal -->
        <g transform="translate(400, 465)" text-anchor="middle">
          ${sealSvg}
          <text font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="bold" fill="${subTitleLabelFill}" y="60">CÓD: OFFLINE-STUDY</text>
        </g>

        <!-- Footer signatures -->
        <g transform="translate(150, 485)" text-anchor="middle">
          <!-- Dynamic Signature Area -->
          <g transform="translate(0, -15)">
            ${sigType === 'drawn' && sigImage ? `
              <image href="${sigImage}" x="-75" y="-35" width="150" height="50" style="mix-blend-mode: multiply;" />
            ` : `
              <text font-family="'Dancing Script', 'Brush Script MT', 'Georgia', cursive, serif" font-weight="600" font-size="22" font-style="italic" fill="${studentNameFill}" y="10">${sigText || instructorName}</text>
            `}
          </g>
          <line x1="-80" y1="0" x2="80" y2="0" stroke="${isDark ? '#334155' : '#d6d3d1'}" stroke-width="1"/>
          <text font-family="'Inter', sans-serif" font-weight="bold" font-size="11" fill="${studentNameFill}" y="16">${instructorName}</text>
          <text font-family="'Inter', sans-serif" font-size="9" fill="${subTitleLabelFill}" y="28">Instrutor Voluntário</text>
        </g>

        <g transform="translate(650, 485)" text-anchor="middle">
          <text font-family="'Inter', sans-serif" font-weight="bold" font-size="11" fill="${studentNameFill}" y="-10" id="cert-date-text-print"></text>
          <line x1="-80" y1="0" x2="80" y2="0" stroke="${isDark ? '#334155' : '#d6d3d1'}" stroke-width="1"/>
          <text font-family="'Inter', sans-serif" font-size="11" fill="${studentNameFill}" y="16">Data de Emissão</text>
          <text font-family="'Inter', sans-serif" font-size="9" fill="${subTitleLabelFill}" y="28">Validação Offline</text>
        </g>
      </svg>
    </div>
  </div>
</body>
</html>`;

  let processedHtml = htmlContent;
  processedHtml = processedHtml.replaceAll('__TAILWIND_CDN__', '<' + 'script src="https://cdn.tailwindcss.com"><' + '/script>');
  processedHtml = processedHtml.replaceAll('__MARKED_CDN__', '<' + 'script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"><' + '/script>');
  processedHtml = processedHtml.replaceAll('__STYLE_START__', '<' + 'style>');
  processedHtml = processedHtml.replaceAll('__STYLE_END__', '<' + '/style>');
  processedHtml = processedHtml.replaceAll('__SCRIPT_START__', '<' + 'script>');
  processedHtml = processedHtml.replaceAll('__SCRIPT_END__', '<' + '/script>');

  const blob = new Blob([processedHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const element = document.createElement('a');
  element.href = url;
  element.download = `${course.title.toLowerCase().replace(/[^a-z0-9_\-]+/g, '-')}-material-interativo.html`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(url);
}
