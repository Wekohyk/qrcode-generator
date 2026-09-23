export type QrKind = 'url' | 'text' | 'vcard' | 'wifi' | 'rich';
export type QrMode = 'static' | 'live';
export type QrStatus = 'active' | 'static' | 'paused';
export type ModuleStyle = 'classic' | 'emerald';
export type EccLevel = 'L' | 'M' | 'Q' | 'H';
export type WifiEncryption = 'WPA' | 'WEP' | 'nopass';
export type ScanSource = 'direct' | 'wechat' | 'other';

export interface QrStyle {
  module: ModuleStyle;
  margin: number;
  ecc: EccLevel;
  logo: string;
}

export interface QrFields {
  url: string;
  text: string;
  fullName: string;
  org: string;
  title: string;
  phone: string;
  email: string;
  site: string;
  ssid: string;
  password: string;
  encryption: WifiEncryption;
  hidden: boolean;
  richTitle: string;
  richBody: string;
  richImage: string;
}

export interface ScanEvent {
  at: number;
  source: ScanSource;
}

export interface QrCode {
  id: string;
  name: string;
  kind: QrKind;
  mode: QrMode;
  status: QrStatus;
  fields: QrFields;
  style: QrStyle;
  remoteId?: string;
  shortKey?: string;
  scanUrl?: string;
  createdAt: number;
  updatedAt: number;
  scans: ScanEvent[];
}

export type QrDraft = Pick<
  QrCode,
  'name' | 'kind' | 'mode' | 'fields' | 'style'
>;

export const kindList: QrKind[] = ['url', 'text', 'vcard', 'wifi', 'rich'];

export const kindMeta: Record<QrKind, { label: string; hint: string }> = {
  url: { label: '网址', hint: '打开一个链接' },
  text: { label: '文本', hint: '展示一段文字' },
  vcard: { label: '名片', hint: '保存到通讯录' },
  wifi: { label: 'Wi-Fi', hint: '扫码连接网络' },
  rich: { label: '图文活码', hint: '内容可改，码不变' },
};

export const styleTemplates = [
  {
    id: 'classic',
    name: '经典黑白',
    description: '黑模块、白底，打印最稳。',
    style: {
      module: 'classic',
      margin: 2,
      ecc: 'M',
      logo: '',
    },
  },
  {
    id: 'emerald',
    name: '翠绿',
    description: '深翠模块，对比度仍然够扫。',
    style: {
      module: 'emerald',
      margin: 2,
      ecc: 'M',
      logo: '',
    },
  },
  {
    id: 'mark',
    name: '徽标留白',
    description: '高容错，中间可以放品牌标记。',
    style: {
      module: 'classic',
      margin: 2,
      ecc: 'H',
      logo: '',
    },
  },
] as const satisfies ReadonlyArray<{
  id: string;
  name: string;
  description: string;
  style: QrStyle;
}>;

export function emptyFields(): QrFields {
  return {
    url: '',
    text: '',
    fullName: '',
    org: '',
    title: '',
    phone: '',
    email: '',
    site: '',
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false,
    richTitle: '',
    richBody: '',
    richImage: '',
  };
}

export function defaultStyle(module: ModuleStyle = 'classic'): QrStyle {
  return {
    module,
    margin: 2,
    ecc: 'M',
    logo: '',
  };
}

export function parseKind(value: unknown): QrKind {
  return kindList.includes(value as QrKind) ? (value as QrKind) : 'url';
}

export function styleFromTemplate(id: unknown, brandLogo = ''): QrStyle {
  const key = id === 'cyan' ? 'emerald' : id;
  const found = styleTemplates.find(item => item.id === key);
  const style: QrStyle = found ? { ...found.style } : defaultStyle();
  if (found?.id === 'mark' && brandLogo) style.logo = brandLogo;
  return style;
}

export function defaultName(kind: QrKind) {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${kindMeta[kind].label} ${pad(now.getMonth() + 1)}${pad(now.getDate())} ${pad(now.getHours())}${pad(now.getMinutes())}`;
}

export function statusMeta(status: QrStatus) {
  if (status === 'active') return { label: '正常', dot: 'bg-success' };
  if (status === 'paused') return { label: '暂停', dot: 'bg-warning' };
  return { label: '静态', dot: 'bg-text-muted' };
}

export function isLive(kind: QrKind, mode: QrMode) {
  return kind === 'rich' || mode === 'live';
}
