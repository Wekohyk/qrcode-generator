import zh from './zh.json';
import en from './en.json';
import jp from './ja.json';

import { createI18n } from 'vue-i18n';
import { getLocale } from '@/utils/tool';

const languages = {
  zh,
  en,
  jp,
};
const initLocale = getLocale();

const i18n = createI18n({
  locale: initLocale,
  messages: languages,
  legacy: false,
  fallbackLocale: {
    zh: ['en', 'jp'],
    en: ['zh', 'jp'],
    jp: ['en', 'zh'],
  },
});

// 此处根据实际情况修改
// if (!tw.isPolyfill) {
//   tw.observeLanguageChanged(lang => {
//     /**
//      * 由于tw.language 更新不及时，所以必须传入给getLocale
//      */
//     const locale = getLocale(lang);
//     console.log('change', lang);
//     console.log('cur', locale);

//     setVantLocale[locale]();
//     i18n.global.locale.value = locale;
//   });
// }

export function getI18nGlobal() {
  return i18n.global;
}

export function getI18n() {
  return i18n;
}

export function getI18nLocale() {
  return i18n.global.locale;
}
