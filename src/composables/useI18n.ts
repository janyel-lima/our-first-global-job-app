import { ref, computed } from "vue";
import { translations, Locale } from "../utils/translations";

export type { Locale };

const savedLocale = (localStorage.getItem("app_locale") as Locale) || "pt";
export const locale = ref<Locale>(savedLocale);

export const setLocale = (lang: Locale) => {
  locale.value = lang;
  localStorage.setItem("app_locale", lang);
};

export const isPt = computed(() => locale.value === "pt");
export const isEn = computed(() => locale.value === "en");

export { translations };

export function t(key: string, args?: Record<string, string | number>): string {
  const currentLang = (locale.value === 'en' || locale.value === 'pt') ? locale.value : 'pt';
  const keys = key.split(".");
  let value: any = translations[currentLang];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      value = null;
      break;
    }
  }

  if (!value) {
    // Try PT fallback
    value = translations.pt;
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        value = null;
        break;
      }
    }
  }

  if (!value || typeof value !== "string") {
    // Hardened fallbacks for key UI actions
    if (key === 'common.cancel') return currentLang === 'en' ? 'Cancel' : 'Cancelar';
    if (key === 'common.save') return currentLang === 'en' ? 'Save' : 'Salvar';
    if (key === 'common.saving') return currentLang === 'en' ? 'Saving...' : 'Salvando...';
    if (key === 'common.edit') return currentLang === 'en' ? 'Edit' : 'Editar';
    if (key === 'common.delete') return currentLang === 'en' ? 'Delete' : 'Excluir';
    if (key === 'common.close') return currentLang === 'en' ? 'Close' : 'Fechar';
    return key;
  }

  if (args) {
    let result = value;
    for (const [argKey, argVal] of Object.entries(args)) {
      result = result.replace(new RegExp(`{${argKey}}`, "g"), String(argVal));
    }
    return result;
  }

  return value;
}

export function useI18n() {
  return {
    locale,
    setLocale,
    isPt,
    isEn,
    t,
  };
}
