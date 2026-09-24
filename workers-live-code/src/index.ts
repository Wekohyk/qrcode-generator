/**
 * Weko QR Code 活码 — Cloudflare Worker 最小实现
 *
 * QR 始终编码：https://<短链域>/r/<short_key>
 * 改内容 = PATCH payload_json，码面不变
 */

export interface Env {
  DB: D1Database;
  SHORT_BASE?: string;
}

type CodeType = 'url' | 'text' | 'vcard' | 'wifi' | 'page';
type CodeStatus = 'active' | 'paused' | 'deleted';

interface CodeRow {
  id: string;
  short_key: string;
  user_id: string | null;
  type: CodeType;
  title: string | null;
  payload_json: string;
  status: CodeStatus;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type, authorization',
      'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
    },
  });
}

function nanoid(len = 8): string {
  const alphabet = '23456789abcdefghjkmnpqrstuvwxyz';
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    char =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char]!,
  );
}

function renderTextPage(title: string, body: string, image = '', status = 200) {
  const safeImage =
    image.startsWith('data:image/') || image.startsWith('https://')
      ? image
      : '';
  const picture = safeImage
    ? `<img alt="" src="${escapeHtml(safeImage)}" />`
    : '';
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
      padding:24px;color:#1A2E24;font-family:Inter,"PingFang SC","Noto Sans SC",system-ui,sans-serif;
      background:#E8F0E9 radial-gradient(420px 260px at 100% 100%, rgba(168,213,181,.55), transparent 70%)}
    .card{width:100%;max-width:480px;padding:24px;border-radius:20px;line-height:1.6;
      background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.7);
      box-shadow:0 8px 32px rgba(36,90,58,.08);backdrop-filter:blur(18px);white-space:pre-wrap}
    h1{margin:0 0 12px;font-size:20px;font-weight:600}
    img{display:block;max-width:100%;max-height:240px;margin:0 0 12px;border-radius:12px;object-fit:cover}
    .brand{margin:0 0 8px;color:#8AA093;font-size:12px}
  </style>
</head>
<body><div class="card"><p class="brand">Weko QR Code</p><h1>${escapeHtml(title)}</h1>${picture}<div>${escapeHtml(body)}</div></div></body>
</html>`;
  return new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

async function getCodeByKey(db: D1Database, key: string) {
  return db
    .prepare(
      `SELECT id, short_key, user_id, type, title, payload_json, status
       FROM codes WHERE short_key = ? AND status != 'deleted' LIMIT 1`,
    )
    .bind(key)
    .first<CodeRow>();
}

async function hashIp(ip: string | null) {
  if (!ip) return null;
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(ip),
  );
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

async function logScan(env: Env, code: CodeRow, req: Request) {
  const ua = req.headers.get('user-agent');
  const referer = req.headers.get('referer');
  const country =
    (req as Request & { cf?: { country?: string } }).cf?.country ?? null;
  const ipHash = await hashIp(req.headers.get('cf-connecting-ip'));
  await env.DB.prepare(
    `INSERT INTO scans (code_id, short_key, ua, referer, country, ip_hash)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(code.id, code.short_key, ua, referer, country, ipHash)
    .run();
}

function readPayload(code: CodeRow) {
  try {
    return JSON.parse(code.payload_json || '{}') as Record<string, unknown>;
  } catch {
    return {};
  }
}

function resolveScan(code: CodeRow): Response {
  const payload = readPayload(code);
  const text = (...parts: unknown[]) => parts.filter(Boolean).join('\n');

  switch (code.type) {
    case 'url': {
      const target = String(payload.url || '');
      if (!/^https?:\/\//i.test(target)) {
        return new Response('Invalid URL', { status: 400 });
      }
      return Response.redirect(target, 302);
    }
    case 'text':
    case 'page':
      return renderTextPage(
        code.title || '内容',
        String(payload.text || payload.html || ''),
        String(payload.image || ''),
      );
    case 'vcard':
      return renderTextPage(
        code.title || '名片',
        text(
          payload.name,
          payload.org,
          payload.tel,
          payload.email,
          payload.url,
        ),
      );
    case 'wifi':
      return renderTextPage(
        code.title || 'Wi-Fi',
        text(
          `网络：${payload.ssid || ''}`,
          payload.password ? `密码：${payload.password}` : '无密码',
        ),
      );
    default:
      return new Response('Unsupported type', { status: 400 });
  }
}

async function createCode(env: Env, req: Request): Promise<Response> {
  const body = (await req.json()) as {
    type?: CodeType;
    title?: string;
    payload?: Record<string, unknown>;
    user_id?: string;
    short_key?: string;
  };
  const type = body.type || 'url';
  const id = crypto.randomUUID();
  const shortKey = body.short_key || nanoid(8);
  const payloadJson = JSON.stringify(body.payload || {});

  await env.DB.prepare(
    `INSERT INTO codes (id, short_key, user_id, type, title, payload_json, status)
     VALUES (?, ?, ?, ?, ?, ?, 'active')`,
  )
    .bind(
      id,
      shortKey,
      body.user_id ?? null,
      type,
      body.title ?? null,
      payloadJson,
    )
    .run();

  const base = env.SHORT_BASE || new URL(req.url).origin;
  return json(
    { id, short_key: shortKey, scan_url: `${base}/r/${shortKey}`, type },
    201,
  );
}

async function patchCode(
  env: Env,
  id: string,
  req: Request,
): Promise<Response> {
  const body = (await req.json()) as {
    title?: string;
    payload?: Record<string, unknown>;
    status?: CodeStatus;
    type?: CodeType;
  };
  const row = await env.DB.prepare(`SELECT id FROM codes WHERE id = ?`)
    .bind(id)
    .first();
  if (!row) return json({ error: 'not_found' }, 404);

  await env.DB.prepare(
    `UPDATE codes SET
       title = COALESCE(?, title),
       payload_json = COALESCE(?, payload_json),
       status = COALESCE(?, status),
       type = COALESCE(?, type),
       updated_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(
      body.title ?? null,
      body.payload ? JSON.stringify(body.payload) : null,
      body.status ?? null,
      body.type ?? null,
      id,
    )
    .run();

  return json({ ok: true, id });
}

export default {
  async fetch(
    req: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    if (req.method === 'OPTIONS') return json({ ok: true });

    const { pathname } = new URL(req.url);
    const scan = pathname.match(/^\/r\/([a-z0-9]+)$/i);
    if (scan && req.method === 'GET') {
      const code = await getCodeByKey(env.DB, scan[1]!);
      if (!code) return new Response('Not Found', { status: 404 });
      if (code.status === 'paused') {
        return renderTextPage('已暂停', '此二维码已暂停', '', 403);
      }
      ctx.waitUntil(logScan(env, code, req).catch(() => undefined));
      return resolveScan(code);
    }

    if (pathname === '/api/codes' && req.method === 'POST') {
      return createCode(env, req);
    }

    const one = pathname.match(/^\/api\/codes\/([^/]+)$/);
    if (one) {
      const id = one[1]!;
      if (req.method === 'GET') {
        const row = await env.DB.prepare(
          `SELECT id, short_key, type, title, payload_json, status, created_at, updated_at
           FROM codes WHERE id = ?`,
        )
          .bind(id)
          .first();
        return row ? json(row) : json({ error: 'not_found' }, 404);
      }
      if (req.method === 'PATCH') return patchCode(env, id, req);
    }

    const stats = pathname.match(/^\/api\/codes\/([^/]+)\/stats$/);
    if (stats && req.method === 'GET') {
      const id = stats[1]!;
      const total = await env.DB.prepare(
        `SELECT COUNT(*) AS c FROM scans WHERE code_id = ?`,
      )
        .bind(id)
        .first<{ c: number }>();
      const recent = await env.DB.prepare(
        `SELECT ts, country, ua FROM scans WHERE code_id = ? ORDER BY id DESC LIMIT 20`,
      )
        .bind(id)
        .all();
      return json({ total: total?.c ?? 0, recent: recent.results ?? [] });
    }

    if (pathname === '/' || pathname === '/health') {
      return json({ service: 'weko-qr-live', ok: true });
    }

    return new Response('Not Found', { status: 404 });
  },
};
