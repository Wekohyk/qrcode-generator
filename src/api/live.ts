import { httpUrl, buildStaticPayload } from '@/utils/payload';
import type { QrFields, QrKind } from '@/types/code';

const root = '/live';

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
    throw new Error('活码服务未启动。请在 workers-live-code 运行 npm run dev');
  }
  if (!response.ok) {
    throw new Error('活码服务没有完成这次请求');
  }
  return response.json() as Promise<T>;
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
