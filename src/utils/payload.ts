import type { QrFields, QrKind, QrMode } from '@/types/code';

function escapeWifi(value: string) {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

function escapeMecard(value: string) {
  return value.trim().replace(/([\\;:])/g, '\\$1');
}

export function httpUrl(raw: string) {
  const value = raw.trim();
  if (!value) return '';
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.href;
  } catch {
    return '';
  }
}

export function buildStaticPayload(kind: QrKind, fields: QrFields) {
  if (kind === 'url') return httpUrl(fields.url);

  if (kind === 'text') return fields.text.trim();

  if (kind === 'vcard') {
    const site = httpUrl(fields.site);
    const parts = [
      fields.fullName && `N:${escapeMecard(fields.fullName)}`,
      fields.org && `ORG:${escapeMecard(fields.org)}`,
      fields.phone && `TEL:${escapeMecard(fields.phone)}`,
      fields.email && `EMAIL:${escapeMecard(fields.email)}`,
      site && `URL:${escapeMecard(site)}`,
      fields.title && `NOTE:${escapeMecard(fields.title)}`,
    ].filter(Boolean);
    if (!parts.length) return '';
    return `MECARD:${parts.join(';')};;`;
  }

  if (kind === 'wifi') {
    const ssid = fields.ssid.trim();
    if (!ssid) return '';
    const password =
      fields.encryption === 'nopass' ? '' : `P:${escapeWifi(fields.password)};`;
    const hidden = fields.hidden ? 'H:true' : 'H:false';
    return `WIFI:T:${fields.encryption};S:${escapeWifi(ssid)};${password}${hidden};;`;
  }

  return [fields.richTitle.trim(), fields.richBody.trim()]
    .filter(Boolean)
    .join('\n');
}

export function previewPayload(input: {
  scanUrl?: string;
  kind: QrKind;
  mode: QrMode;
  fields: QrFields;
}) {
  const live = input.kind === 'rich' || input.mode === 'live';
  if (live) return input.scanUrl || '';
  return buildStaticPayload(input.kind, input.fields);
}

const contentMessages: Record<QrKind, string> = {
  url: '填写要打开的网址',
  text: '填写文本内容',
  vcard: '至少填写姓名',
  wifi: '填写网络名称',
  rich: '填写标题或正文',
};

export function contentError(kind: QrKind, fields: QrFields) {
  if (kind === 'vcard') {
    return fields.fullName.trim() ? '' : contentMessages.vcard;
  }
  return buildStaticPayload(kind, fields) ? '' : contentMessages[kind];
}
