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

  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Custom code blocks with copy action
  renderer.code = function(token) {
    const codeText = token.text || '';
    const safeCodeText = escapeHtml(codeText);
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
        <pre class="p-4 bg-slate-900 text-slate-200 text-xs rounded-xl font-mono overflow-x-auto border border-slate-800 leading-relaxed shadow-sm block whitespace-pre"><code>${safeCodeText}</code></pre>
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
      <blockquote class="my-2.5 border-l-4 p-3 rounded-r-xl text-xs sm:text-sm leading-relaxed shadow-2xs font-sans transition-all duration-300 ${quoteClass}">
        ${renderedContent}
      </blockquote>
    `;
  };

  // Custom table renderer for responsive overflow & dark/light mode compatibility
  renderer.table = function(token) {
    const headerHtml = token.header.map((cell: any) =>
      `<th class="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-extrabold text-xs tracking-wider uppercase text-left whitespace-nowrap">${this.parser.parseInline(cell.tokens)}</th>`
    ).join('');

    const rowsHtml = token.rows.map((row: any) => {
      const cellsHtml = row.map((cell: any) =>
        `<td class="px-3.5 py-2.5 border-b border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-medium leading-relaxed">${this.parser.parseInline(cell.tokens)}</td>`
      ).join('');
      return `<tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">${cellsHtml}</tr>`;
    }).join('');

    return `
      <div class="overflow-x-auto my-3 max-w-full rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-950">
        <table class="w-full text-left border-collapse font-sans min-w-[300px]">
          <thead>
            <tr>${headerHtml}</tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
            ${rowsHtml}
          </tbody>
        </table>
      </div>
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
  --md-text-primary: #0f172a;
  --md-text-secondary: #334155;
  --md-bg-inline-code: #f1f5f9;
  --md-border-inline-code: #e2e8f0;
  --md-color-inline-code: #2563eb;
  --md-border-color: #e2e8f0;
  --md-hr-color: #e2e8f0;
  user-select: text !important;
}

/* Dynamically overridden when dark class is applied to document HTML */
.dark .markdown-body {
  --md-text-primary: #f8fafc;
  --md-text-secondary: #e2e8f0;
  --md-bg-inline-code: #1e293b;
  --md-border-inline-code: #334155;
  --md-color-inline-code: #60a5fa;
  --md-border-color: #334155;
  --md-hr-color: #334155;
}

.markdown-body blockquote:not(.border-amber-500):not(.border-emerald-500) {
  border-left-color: var(--primary-color, #2563eb) !important;
  background-color: rgba(37, 99, 235, 0.08) !important;
  color: #0f172a !important;
}

.dark .markdown-body blockquote:not(.border-amber-500):not(.border-emerald-500) {
  border-left-color: #6366f1 !important;
  background-color: rgba(99, 102, 241, 0.15) !important;
  color: #f1f5f9 !important;
}

.markdown-body h1 {
  font-size: 1.25rem !important;
  line-height: 1.75rem !important;
  font-weight: 800 !important;
  color: var(--md-text-primary) !important;
  margin-top: 0.75rem !important;
  margin-bottom: 0.5rem !important;
  letter-spacing: -0.025em !important;
  border-bottom: 1px solid var(--md-border-color);
  padding-bottom: 0.375rem !important;
}

@media (min-width: 640px) {
  .markdown-body h1 {
    font-size: 1.375rem !important;
    line-height: 1.875rem !important;
  }
}

.markdown-body h2 {
  font-size: 1.125rem !important;
  line-height: 1.5rem !important;
  font-weight: 700 !important;
  color: var(--md-text-primary) !important;
  margin-top: 0.625rem !important;
  margin-bottom: 0.375rem !important;
  letter-spacing: -0.025em !important;
  border-bottom: 1px solid var(--md-border-color);
  padding-bottom: 0.25rem !important;
}

@media (min-width: 640px) {
  .markdown-body h2 {
    font-size: 1.25rem !important;
    line-height: 1.625rem !important;
  }
}

.markdown-body h3 {
  font-size: 1rem !important;
  line-height: 1.375rem !important;
  font-weight: 600 !important;
  color: var(--md-text-primary) !important;
  margin-top: 0.5rem !important;
  margin-bottom: 0.25rem !important;
  letter-spacing: -0.025em !important;
}

.markdown-body p {
  font-size: 0.75rem !important;
  line-height: 1.5 !important;
  color: var(--md-text-secondary) !important;
  margin-bottom: 0.5rem !important;
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
  margin-top: 0.5rem !important;
  margin-bottom: 0.5rem !important;
}

.markdown-body ol {
  list-style-type: decimal !important;
  padding-left: 1.25rem !important;
  margin-top: 0.5rem !important;
  margin-bottom: 0.5rem !important;
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
  display: block !important;
  width: 100% !important;
  overflow-x: auto !important;
  border-collapse: collapse !important;
  margin-top: 1.25rem !important;
  margin-bottom: 1.25rem !important;
  border-radius: 0.75rem !important;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--md-border-color);
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
  min-width: 140px !important;
}

.markdown-body td {
  padding: 0.75rem 1rem !important;
  border-bottom: 1px solid var(--md-border-color) !important;
  font-size: 0.75rem !important;
  color: var(--md-text-secondary) !important;
  line-height: 1.5 !important;
  min-width: 140px !important;
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
  color: var(--md-text-primary) !important;
  background-color: transparent !important;
  padding: 0 !important;
}

.markdown-body em {
  font-weight: 600 !important;
  color: var(--md-text-primary) !important;
  font-style: italic !important;
  background-color: transparent !important;
  padding: 0 !important;
}

.markdown-body a {
  color: #3b82f6 !important;
  text-decoration: underline !important;
  font-weight: 600 !important;
  transition: color 0.2s !important;
}

.dark .markdown-body a {
  color: #60a5fa !important;
}

.markdown-body a:hover {
  color: #1d4ed8 !important;
}

.dark .markdown-body a:hover {
  color: #93c5fd !important;
}
</style>
