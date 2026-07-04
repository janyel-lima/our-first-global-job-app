<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { marked } from 'marked';

const props = defineProps<{
  content: string;
}>();

const htmlContent = computed(() => {
  const raw = props.content || '';
  
  // Custom marked renderer to inject custom classes and buttons
  const renderer = new marked.Renderer();
  
  // Custom code blocks with copy action
  renderer.code = function(token) {
    const codeText = token.text || '';
    return `
      <div class="relative group my-4">
        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <button 
            type="button"
            data-code="${encodeURIComponent(codeText)}"
            class="copy-btn text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700 font-bold font-sans cursor-pointer transition-colors"
          >
            Copiar
          </button>
        </div>
        <pre class="p-4 bg-slate-900 text-slate-200 text-xs rounded-xl font-mono overflow-x-auto border border-slate-800 leading-relaxed shadow-sm block whitespace-pre"><code>${codeText}</code></pre>
      </div>
    `;
  };

  // Custom blockquotes based on warning / tip detection
  renderer.blockquote = function(token) {
    const rawText = token.text || '';
    const isWarning = rawText.includes("⚠️") || rawText.toLowerCase().includes("atenc") || rawText.toLowerCase().includes("warning");
    const isIdea = rawText.includes("💡") || rawText.toLowerCase().includes("tip") || rawText.toLowerCase().includes("dica") || rawText.toLowerCase().includes("pro");
    
    let quoteClass = "border-slate-400 bg-slate-50/60 text-slate-800 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-600";
    if (isWarning) {
      quoteClass = "border-amber-500 bg-amber-50/30 text-amber-950 dark:bg-amber-950/20 dark:text-amber-200 dark:border-amber-600";
    } else if (isIdea) {
      quoteClass = "border-emerald-500 bg-emerald-50/30 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-200 dark:border-emerald-600";
    } else {
      quoteClass = "border-indigo-500 bg-indigo-50/40 text-indigo-900 dark:bg-indigo-950/20 dark:text-indigo-200 dark:border-indigo-600";
    }

    const renderedContent = this.parser.parse(token.tokens);

    return `
      <blockquote class="my-4 border-l-4 p-4 rounded-r-xl text-xs sm:text-sm leading-relaxed shadow-2xs font-sans transition-all duration-300 ${quoteClass}">
        ${renderedContent}
      </blockquote>
    `;
  };

  // Parse using isolated options to avoid global marked setting corruption
  return marked.parse(raw, {
    renderer,
    gfm: true,
    breaks: true
  }) as string;
});

// Clipboard copy click handling
function handleCopyClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (target && target.classList.contains('copy-btn')) {
    const code = decodeURIComponent(target.getAttribute('data-code') || '');
    navigator.clipboard.writeText(code);
    const originalText = target.textContent;
    target.textContent = 'Copiado!';
    target.classList.add('bg-emerald-600', 'border-emerald-600', 'text-white');
    setTimeout(() => {
      target.textContent = originalText;
      target.classList.remove('bg-emerald-600', 'border-emerald-600', 'text-white');
    }, 2000);
  }
}

onMounted(() => {
  document.addEventListener('click', handleCopyClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleCopyClick);
});
</script>

<template>
  <div class="markdown-body select-text" v-html="htmlContent"></div>
</template>

<style>
/* Style the compiled markdown content with direct classes using the .markdown-body wrapper */
.markdown-body {
  /* Default light theme values dynamically mixing the active primary brand color */
  --md-text-primary: #0f172a;
  --md-text-secondary: #334155;
  --md-bg-inline-code: color-mix(in srgb, var(--primary-color, #2563eb) 8%, #ffffff);
  --md-border-inline-code: color-mix(in srgb, var(--primary-color, #2563eb) 15%, #ffffff);
  --md-color-inline-code: var(--primary-color, #2563eb);
  --md-border-color: color-mix(in srgb, var(--primary-color, #2563eb) 15%, #e2e8f0);
  --md-table-header-bg: color-mix(in srgb, var(--primary-color, #2563eb) 8%, #ffffff);
  --md-table-row-hover: color-mix(in srgb, var(--primary-color, #2563eb) 4%, #ffffff);
  --md-strong-color: color-mix(in srgb, var(--primary-color, #2563eb) 90%, #000000);
  --md-strong-bg: color-mix(in srgb, var(--primary-color, #2563eb) 10%, #ffffff);
  --md-hr-color: #e2e8f0;
  user-select: text !important;
}

/* Dynamically overridden when dark class is applied to document HTML */
.dark .markdown-body {
  --md-text-primary: #f8fafc;
  --md-text-secondary: #cbd5e1;
  --md-bg-inline-code: color-mix(in srgb, var(--primary-color, #2563eb) 18%, rgba(255, 255, 255, 0.02));
  --md-border-inline-code: color-mix(in srgb, var(--primary-color, #2563eb) 30%, rgba(255, 255, 255, 0.04));
  --md-color-inline-code: color-mix(in srgb, var(--primary-color, #2563eb) 85%, #f8fafc);
  --md-border-color: color-mix(in srgb, var(--primary-color, #2563eb) 20%, rgba(255, 255, 255, 0.08));
  --md-table-header-bg: color-mix(in srgb, var(--primary-color, #2563eb) 15%, rgba(0, 0, 0, 0.45));
  --md-table-row-hover: color-mix(in srgb, var(--primary-color, #2563eb) 8%, rgba(255, 255, 255, 0.02));
  --md-strong-color: color-mix(in srgb, var(--primary-color, #2563eb) 85%, #ffffff);
  --md-strong-bg: color-mix(in srgb, var(--primary-color, #2563eb) 20%, rgba(0, 0, 0, 0.25));
  --md-hr-color: color-mix(in srgb, var(--primary-color, #2563eb) 15%, rgba(255, 255, 255, 0.08));
}

.markdown-body blockquote:not(.border-amber-500):not(.border-emerald-500) {
  border-left-color: var(--primary-color, #2563eb) !important;
  background-color: color-mix(in srgb, var(--primary-color, #2563eb) 8%, #ffffff) !important;
  color: color-mix(in srgb, var(--primary-color, #2563eb) 90%, #0f172a) !important;
}

.dark .markdown-body blockquote:not(.border-amber-500):not(.border-emerald-500) {
  border-left-color: var(--primary-color, #2563eb) !important;
  background-color: color-mix(in srgb, var(--primary-color, #2563eb) 15%, rgba(0, 0, 0, 0.3)) !important;
  color: color-mix(in srgb, var(--primary-color, #2563eb) 85%, #f8fafc) !important;
}

.markdown-body h1 {
  font-size: 1.25rem !important;
  line-height: 1.75rem !important;
  font-weight: 800 !important;
  color: var(--md-text-primary) !important;
  margin-top: 1.5rem !important;
  margin-bottom: 0.75rem !important;
  letter-spacing: -0.025em !important;
  border-bottom: 1px solid var(--md-border-color);
  padding-bottom: 0.5rem !important;
}

@media (min-width: 640px) {
  .markdown-body h1 {
    font-size: 1.5rem !important;
    line-height: 2rem !important;
  }
}

.markdown-body h2 {
  font-size: 1.125rem !important;
  line-height: 1.625rem !important;
  font-weight: 700 !important;
  color: var(--md-text-primary) !important;
  margin-top: 1.25rem !important;
  margin-bottom: 0.625rem !important;
  letter-spacing: -0.025em !important;
  border-bottom: 1px solid var(--md-border-color);
  padding-bottom: 0.375rem !important;
}

@media (min-width: 640px) {
  .markdown-body h2 {
    font-size: 1.25rem !important;
    line-height: 1.75rem !important;
  }
}

.markdown-body h3 {
  font-size: 1rem !important;
  line-height: 1.5rem !important;
  font-weight: 600 !important;
  color: var(--md-text-primary) !important;
  margin-top: 1rem !important;
  margin-bottom: 0.5rem !important;
  letter-spacing: -0.025em !important;
}

.markdown-body p {
  font-size: 0.75rem !important;
  line-height: 1.625 !important;
  color: var(--md-text-secondary) !important;
  margin-bottom: 0.875rem !important;
  font-family: ui-sans-serif, system-ui, sans-serif !important;
}

@media (min-width: 640px) {
  .markdown-body p {
    font-size: 0.875rem !important;
  }
}

.markdown-body ul {
  list-style-type: disc !important;
  padding-left: 1.25rem !important;
  margin-top: 0.875rem !important;
  margin-bottom: 0.875rem !important;
}

.markdown-body ol {
  list-style-type: decimal !important;
  padding-left: 1.25rem !important;
  margin-top: 0.875rem !important;
  margin-bottom: 0.875rem !important;
}

.markdown-body li {
  line-height: 1.625 !important;
  font-size: 0.75rem !important;
  margin-bottom: 0.25rem !important;
  color: var(--md-text-secondary) !important;
}

@media (min-width: 640px) {
  .markdown-body li {
    font-size: 0.875rem !important;
  }
}

.markdown-body code:not(pre code) {
  background-color: var(--md-bg-inline-code) !important;
  border: 1px solid var(--md-border-inline-code) !important;
  color: var(--md-color-inline-code) !important;
  font-size: 11px !important;
  padding: 0.125rem 0.375rem !important;
  border-radius: 0.375rem !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-weight: 700 !important;
}

.markdown-body hr {
  margin-top: 1.25rem !important;
  margin-bottom: 1.25rem !important;
  border-top-width: 1px !important;
  border-color: var(--md-hr-color) !important;
}

.markdown-body table {
  width: 100% !important;
  border-collapse: collapse !important;
  margin-top: 1.25rem !important;
  margin-bottom: 1.25rem !important;
  border-radius: 0.75rem !important;
  overflow: hidden !important;
}

.markdown-body th {
  background-color: var(--md-table-header-bg) !important;
  color: var(--md-text-primary) !important;
  font-weight: 700 !important;
  font-size: 0.7rem !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  border-bottom: 2px solid var(--md-border-color) !important;
  text-align: left !important;
  padding: 0.75rem 1rem !important;
}

.markdown-body td {
  padding: 0.75rem 1rem !important;
  border-bottom: 1px solid var(--md-border-color) !important;
  font-size: 0.75rem !important;
  color: var(--md-text-secondary) !important;
  line-height: 1.5 !important;
}

.markdown-body tr:hover {
  background-color: var(--md-table-row-hover) !important;
}

.markdown-body blockquote {
  border-left-width: 4px !important;
  padding: 1rem 1.25rem !important;
  margin: 1.5rem 0 !important;
  border-radius: 0 0.75rem 0.75rem 0 !important;
}

.markdown-body strong {
  font-weight: 800 !important;
  color: var(--md-strong-color) !important;
  background-color: var(--md-strong-bg) !important;
  padding: 0.05rem 0.25rem !important;
  border-radius: 0.25rem !important;
}

.markdown-body em {
  font-weight: 600 !important;
  color: var(--md-text-primary) !important;
  font-style: italic !important;
  background-color: var(--md-strong-bg) !important;
  padding: 0.05rem 0.25rem !important;
  border-radius: 0.25rem !important;
}

.markdown-body a {
  color: #2563eb !important;
  text-decoration: underline !important;
  font-weight: 600 !important;
  transition: color 0.2s !important;
}

.markdown-body a:hover {
  color: #1d4ed8 !important;
}
</style>
