import { computed, inject } from 'vue';
import { LangString } from './en';
import type { CodeLayoutLangConfig } from '../CodeLayout';

export type CodeLayoutLangDefine = typeof LangString;

export function useCodeLayoutLang() {

  const internalLangs = {
    'en': LangString,
  } as Record<string, CodeLayoutLangDefine>;

  const langConfig = inject('codeLayoutLangConfig') as CodeLayoutLangConfig;
  const langStrings = computed(() => {
    return {
      ...internalLangs[langConfig.lang],
      ...langConfig.stringsOverride,
    };
  });

  function t(key: keyof CodeLayoutLangDefine) {
    return langStrings.value[key] || key;
  }

  return {
    t,
  }
}