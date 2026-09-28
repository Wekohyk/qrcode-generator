import { httpUrl, buildStaticPayload } from '@/utils/payload';
import {
  defaultStyle,
  emptyFields,
  kindMeta,
  parseKind,
  type QrCode,
  type QrDraft,
  type QrFields,
  type QrKind,
  type QrMode,
  type QrStyle,
} from '@/types/code';

// 本地开发走 Vite 的 /live 代理；线上与 Worker 同源，直接请求 /api。
const root =
  import.meta.env.VITE_LIVE_API || (import.meta.env.DEV ? '/live' : '');

export type LiveType = 'url' | 'text' | 'vcard' | 'wifi' | 'page';
export type LiveStatus = 'active' | 'paused' | 'deleted';

export interface LiveCodeResult {
  id: string;
  short_key: string;
  scan_url: string;
  type: LiveType;
}

export interface LiveStats {
  total: number;
  recent: { ts: string; country: string | null; ua: string | null }[];
}

export function toLiveType(kind: QrKind): LiveType {
  return kind === 'rich' ? 'page' : kind;
}

export function toLivePayload(kind: QrKind, fields: QrFields) {
  if (kind === 'url') return { url: httpUrl(fields.url) };
  if (kind === 'text') return { text: fields.text.trim() };
  if (kind === 'vcard') {
    return {
      name: fields.fullName.trim(),
      org: fields.org.trim(),
      tel: fields.phone.trim(),
      email: fields.email.trim(),
      url: httpUrl(fields.site),
    };
  }
  if (kind === 'wifi') {
    return {
      ssid: fields.ssid.trim(),
      password: fields.encryption === 'nopass' ? '' : fields.password,
    };
  }
  return {
    text: buildStaticPayload('rich', fields),
    image: fields.richImage,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${root}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init?.headers,
      },
    });
  } catch {
    throw new Error('后端未启动。请在 workers-live-code 运行 npm run dev');
  }
  if (!response.ok) {
    throw new Error('后端没有完成这次请求');
  }
  return response.json() as Promise<T>;
}

export interface LiveCodeRecord {
  id: string;
  short_key: string;
  scan_url: string;
  type: LiveType;
  title: string | null;
  payload_json: string;
  status: LiveStatus;
  created_at: string;
  updated_at: string;
}

function textOf(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === 'string' ? value : '';
}

function fieldsFromPayload(
  kind: QrKind,
  payload: Record<string, unknown>,
): QrFields {
  const fields = emptyFields();
  if (kind === 'url') fields.url = textOf(payload, 'url');
  else if (kind === 'text') fields.text = textOf(payload, 'text');
  else if (kind === 'vcard') {
    fields.fullName = textOf(payload, 'name');
    fields.org = textOf(payload, 'org');
    fields.phone = textOf(payload, 'tel');
    fields.email = textOf(payload, 'email');
    fields.site = textOf(payload, 'url');
  } else if (kind === 'wifi') {
    fields.ssid = textOf(payload, 'ssid');
    fields.password = textOf(payload, 'password');
  } else {
    fields.richBody = textOf(payload, 'text');
    fields.richImage = textOf(payload, 'image');
  }
  return fields;
}

function parseSqlTime(value: string) {
  const at = Date.parse(
    value.includes('T') ? value : `${value.replace(' ', 'T')}Z`,
  );
  return Number.isNaN(at) ? Date.now() : at;
}

export function storedPayload(draft: QrDraft) {
  const mode: QrMode = draft.kind === 'rich' ? 'live' : draft.mode;
  return {
    ...toLivePayload(draft.kind, draft.fields),
    mode,
    kind: draft.kind,
    fields: draft.fields,
    style: draft.style,
  };
}

export function recordToCode(row: LiveCodeRecord): QrCode {
  let payload: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(row.payload_json || '{}') as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      payload = parsed as Record<string, unknown>;
    }
  } catch {
    payload = {};
  }
  const kind = parseKind(
    payload.kind || (row.type === 'page' ? 'rich' : row.type),
  );
  const mode: QrMode =
    kind === 'rich'
      ? 'live'
      : payload.mode === 'static' || payload.mode === 'live'
        ? payload.mode
        : 'live';
  const storedFields = payload.fields;
  const fields =
    storedFields &&
    typeof storedFields === 'object' &&
    !Array.isArray(storedFields)
      ? { ...emptyFields(), ...(storedFields as Partial<QrFields>) }
      : fieldsFromPayload(kind, payload);
  const storedStyle = payload.style;
  const style: QrStyle =
    storedStyle &&
    typeof storedStyle === 'object' &&
    !Array.isArray(storedStyle)
      ? { ...defaultStyle(), ...(storedStyle as Partial<QrStyle>) }
      : defaultStyle();
  return {
    id: row.id,
    name: row.title?.trim() || kindMeta[kind].label,
    kind,
    mode,
    status:
      mode === 'static'
        ? 'static'
        : row.status === 'paused'
          ? 'paused'
          : 'active',
    fields,
    style,
    remoteId: row.id,
    shortKey: row.short_key,
    scanUrl: row.scan_url,
    createdAt: parseSqlTime(row.created_at),
    updatedAt: parseSqlTime(row.updated_at),
    scans: [],
  };
}

export function listLiveCodes() {
  return request<{ items: LiveCodeRecord[] }>('/api/codes');
}

export function createLiveCode(input: {
  type: LiveType;
  title: string;
  payload: Record<string, unknown>;
}) {
  return request<LiveCodeResult>('/api/codes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function patchLiveCode(
  id: string,
  input: {
    type?: LiveType;
    title?: string;
    payload?: Record<string, unknown>;
    status?: LiveStatus;
  },
) {
  return request<{ ok: boolean; id: string }>(`/api/codes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function fetchLiveStats(id: string) {
  return request<LiveStats>(`/api/codes/${id}/stats`);
}
