import { pt } from './locales/pt';
import { en } from './locales/en';

export type Locale = "pt" | "en";

export const translations: Record<Locale, Record<string, any>> = {
  pt,
  en
};
