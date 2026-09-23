import { defineStore } from 'pinia';
import {
  defaultName,
  isLive,
  type QrCode,
  type QrDraft,
  type QrStatus,
  type ScanSource,
} from '@/types/code';

function createId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

export const useCodesStore = defineStore('codes', {
  state: () => ({
    items: [] as QrCode[],
  }),
  getters: {
    sorted(state) {
      return [...state.items].sort((a, b) => b.updatedAt - a.updatedAt);
    },
  },
  actions: {
    create(draft: QrDraft) {
      const now = Date.now();
      const mode = draft.kind === 'rich' ? 'live' : draft.mode;
      const code: QrCode = {
        id: createId(),
        name: draft.name.trim() || defaultName(draft.kind),
        kind: draft.kind,
        mode,
        status: isLive(draft.kind, mode) ? 'active' : 'static',
        fields: { ...draft.fields },
        style: { ...draft.style },
        createdAt: now,
        updatedAt: now,
        scans: [],
      };
      this.items.unshift(code);
      return code;
    },
    update(id: string, draft: QrDraft) {
      const current = this.items.find(item => item.id === id);
      if (!current) return;
      const mode = draft.kind === 'rich' ? 'live' : draft.mode;
      current.name = draft.name.trim() || current.name;
      current.kind = draft.kind;
      current.mode = mode;
      current.fields = { ...draft.fields };
      current.style = { ...draft.style };
      if (current.status !== 'paused' || mode === 'static') {
        current.status = isLive(draft.kind, mode) ? 'active' : 'static';
      }
      current.updatedAt = Date.now();
    },
    remove(ids: string[]) {
      const selected = new Set(ids);
      this.items = this.items.filter(item => !selected.has(item.id));
    },
    setStatus(ids: string[], status: Extract<QrStatus, 'active' | 'paused'>) {
      const selected = new Set(ids);
      this.items.forEach(item => {
        if (!selected.has(item.id) || item.mode !== 'live') return;
        item.status = status;
        item.updatedAt = Date.now();
      });
    },
    addScan(id: string, source: ScanSource) {
      const current = this.items.find(item => item.id === id);
      if (!current || current.status === 'paused') return;
      current.scans.push({ at: Date.now(), source });
    },
  },
  persist: true,
});
