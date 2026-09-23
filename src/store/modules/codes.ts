import { defineStore } from 'pinia';
import { patchLiveCode } from '@/api/live';
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

export interface LiveLink {
  remoteId: string;
  shortKey: string;
  scanUrl: string;
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
    create(draft: QrDraft, link?: LiveLink) {
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
        remoteId: link?.remoteId,
        shortKey: link?.shortKey,
        scanUrl: link?.scanUrl,
        createdAt: now,
        updatedAt: now,
        scans: [],
      };
      this.items.unshift(code);
      return code;
    },
    update(id: string, draft: QrDraft, link?: LiveLink) {
      const current = this.items.find(item => item.id === id);
      if (!current) return;
      const mode = draft.kind === 'rich' ? 'live' : draft.mode;
      current.name = draft.name.trim() || current.name;
      current.kind = draft.kind;
      current.mode = mode;
      current.fields = { ...draft.fields };
      current.style = { ...draft.style };
      if (link) {
        current.remoteId = link.remoteId;
        current.shortKey = link.shortKey;
        current.scanUrl = link.scanUrl;
      }
      if (current.status !== 'paused' || mode === 'static') {
        current.status = isLive(draft.kind, mode) ? 'active' : 'static';
      }
      current.updatedAt = Date.now();
    },
    async remove(ids: string[]) {
      const selected = new Set(ids);
      const remote = this.items.filter(
        item => selected.has(item.id) && item.remoteId,
      );
      await Promise.all(
        remote.map(item =>
          patchLiveCode(item.remoteId || '', { status: 'deleted' }).catch(
            () => undefined,
          ),
        ),
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
        targets
          .filter(item => item.remoteId)
          .map(item => patchLiveCode(item.remoteId || '', { status })),
      );
      targets.forEach(item => {
        item.status = status;
        item.updatedAt = Date.now();
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
  persist: {
    pick: ['items'],
  },
});
