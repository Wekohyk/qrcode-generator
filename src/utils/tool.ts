export type Languages = 'zh' | 'en' | 'jp';

export function getLocale(lang?: string): Languages {
  // 此处可以根据实际情况修改 tw.language
  // lang = lang || tw.language;
  if (lang?.includes('ja')) {
    return 'jp';
  }
  if (lang?.includes('en')) {
    return 'en';
  }
  return 'zh';
}
