import { defineStore } from 'pinia';
import {
  createLiveCode,
  listLiveCodes,
  patchLiveCode,
  recordToCode,
  storedPayload,
  toLiveType,
} from '@/api/live';
import {
  defaultName,
  isLive,
  type QrCode,
  type QrDraft,
  type QrStatus,
  type ScanSource,
} from '@/types/code';

let inflight: Promise<void> | null = null;

function readLocal(): QrCode[] {
  try {
    const raw = localStorage.getItem('codes');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: QrCode[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function writeLocal(items: QrCode[]) {
  if (!items.length) localStorage.removeItem('codes');
  else localStorage.setItem('codes', JSON.stringify({ items }));
}

export const useCodesStore = defineStore('codes', {
  state: () => ({
    items: [] as QrCode[],
    ready: false,
    loadError: '',
  }),
  getters: {
    sorted(state) {
      return [...state.items].sort((a, b) => b.updatedAt - a.updatedAt);
    },
  },
  actions: {
    load() {
      if (this.ready) return Promise.resolve();
      if (!inflight) inflight = this.pull();
      return inflight;
    },
    async pull() {
      try {
        let local = readLocal();
        const pending = local.filter(item => !item.remoteId);
        for (const item of pending) {
          const mode = item.kind === 'rich' ? 'live' : item.mode;
          await createLiveCode({
            type: toLiveType(item.kind),
            title: item.name,
            payload: storedPayload({
              name: item.name,
              kind: item.kind,
              mode,
              fields: item.fields,
              style: item.style,
            }),
          });
          local = local.filter(row => row.id !== item.id);
          writeLocal(local);
        }
        const listed = await listLiveCodes();
        writeLocal([]);
        this.items = listed.items.map(recordToCode);
        this.loadError = '';
      } catch (reason) {
        this.items = [];
        this.loadError =
          reason instanceof Error ? reason.message : '后端没有完成这次请求';
      } finally {
        this.ready = true;
        inflight = null;
      }
    },
    async create(draft: QrDraft) {
      const mode = draft.kind === 'rich' ? 'live' : draft.mode;
      const name = draft.name.trim() || defaultName(draft.kind);
      const created = await createLiveCode({
        type: toLiveType(draft.kind),
        title: name,
        payload: storedPayload({ ...draft, name, mode }),
      });
      const now = Date.now();
      const code: QrCode = {
        id: created.id,
        name,
        kind: draft.kind,
        mode,
        status: isLive(draft.kind, mode) ? 'active' : 'static',
        fields: { ...draft.fields },
        style: { ...draft.style },
        remoteId: created.id,
        shortKey: created.short_key,
        scanUrl: created.scan_url,
        createdAt: now,
        updatedAt: now,
        scans: [],
      };
      this.items.unshift(code);
      return code;
    },
    async update(id: string, draft: QrDraft) {
      const current = this.items.find(item => item.id === id);
      if (!current) return;
      const mode = draft.kind === 'rich' ? 'live' : draft.mode;
      const name = draft.name.trim() || current.name;
      await patchLiveCode(id, {
        type: toLiveType(draft.kind),
        title: name,
        payload: storedPayload({ ...draft, name, mode }),
        status: mode === 'static' ? 'active' : undefined,
      });
      current.name = name;
      current.kind = draft.kind;
      current.mode = mode;
      current.fields = { ...draft.fields };
      current.style = { ...draft.style };
      if (current.status !== 'paused' || mode === 'static') {
        current.status = isLive(draft.kind, mode) ? 'active' : 'static';
      }
      current.updatedAt = Date.now();
    },
    async remove(ids: string[]) {
      const selected = new Set(ids);
      const targets = this.items.filter(item => selected.has(item.id));
      await Promise.all(
        targets.map(item => patchLiveCode(item.id, { status: 'deleted' })),
      );
      this.items = this.items.filter(item => !selected.has(item.id));
    },
    async setStatus(
      ids: string[],
      status: Extract<QrStatus, 'active' | 'paused'>,
    ) {
      const selected = new Set(ids);
      const targets = this.items.filter(
        item => selected.has(item.id) && item.mode === 'live',
      );
      await Promise.all(
        targets.map(item => patchLiveCode(item.id, { status })),
      );
      const now = Date.now();
      targets.forEach(item => {
        item.status = status;
        item.updatedAt = now;
      });
    },
    addScan(id: string, source: ScanSource) {
      const current = this.items.find(item => item.id === id);
      if (!current || current.status === 'paused' || current.mode === 'live') {
        return;
      }
      current.scans.push({ at: Date.now(), source });
    },
  },
});
