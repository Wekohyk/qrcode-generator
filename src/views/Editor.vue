<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCodesStore } from '@/store/modules/codes';
import { useSettingsStore } from '@/store/modules/settings';
import {
  defaultStyle,
  emptyFields,
  isLive,
  parseKind,
  styleFromTemplate,
  type QrDraft,
  type QrKind,
} from '@/types/code';
import { contentError, httpUrl, previewPayload } from '@/utils/payload';
import {
  createLiveCode,
  patchLiveCode,
  toLivePayload,
  toLiveType,
} from '@/api/live';
import { downloadQr } from '@/composables/useQr';
import { readImageFile } from '@/utils/image';
import EmptyState from '@/components/ui/EmptyState.vue';
import ArtFrame from '@/components/ornament/ArtFrame.vue';
import Preview from '@/components/qr/Preview.vue';

const route = useRoute();
const router = useRouter();
const codes = useCodesStore();
const settings = useSettingsStore();

const kinds: { id: QrKind; label: string }[] = [
  { id: 'url', label: 'URL' },
  { id: 'text', label: '文本' },
  { id: 'vcard', label: '名片' },
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'rich', label: '图文活码' },
];

const draft = ref<QrDraft>({
  name: '',
  kind: 'url',
  mode: 'static',
  fields: emptyFields(),
  style: defaultStyle(),
});
const missing = ref(false);
const error = ref('');
const savedHint = ref(false);
const copied = ref(false);
const imageError = ref('');
const richFile = ref<HTMLInputElement | null>(null);
const styleSelect = ref<HTMLSelectElement | null>(null);
const colorInput = ref<HTMLInputElement | null>(null);
const zoom = ref(1);
const advanced = ref(true);
const helpOpen = ref(false);
const moreOpen = ref(false);

const savedId = computed(() =>
  route.name === 'code-edit' ? String(route.params.id || '') : '',
);
const current = computed(() =>
  codes.items.find(item => item.id === savedId.value),
);

const payload = computed(() =>
  previewPayload({
    scanUrl: isLive(draft.value.kind, draft.value.mode)
      ? current.value?.scanUrl
      : undefined,
    kind: draft.value.kind,
    mode: draft.value.kind === 'rich' ? 'live' : draft.value.mode,
    fields: draft.value.fields,
  }),
);

const showLiveAddress = computed(
  () =>
    Boolean(current.value?.scanUrl) &&
    isLive(draft.value.kind, draft.value.mode),
);
const liveFixed = computed(() => showLiveAddress.value);
const lookId = computed(() =>
  draft.value.style.module === 'classic' ? 'classic' : 'art',
);
const ink = computed(() =>
  (draft.value.style.color || '#2F9B6A').toUpperCase(),
);
const eccHint = computed(() => {
  const hints: Record<string, string> = {
    L: '容量更大，适合很短的内容',
    M: '推荐用于印刷或美观场景',
    Q: '适合轻度遮挡或小标记',
    H: '容错最高，适合放徽标',
  };
  return hints[draft.value.style.ecc];
});
const urlReady = computed(
  () => draft.value.kind === 'url' && Boolean(httpUrl(draft.value.fields.url)),
);

function applyRoute() {
  missing.value = false;
  imageError.value = '';
  if (route.name === 'code-new') {
    const kind = parseKind(route.query.kind);
    draft.value = {
      name: '',
      kind,
      mode: kind === 'rich' ? 'live' : 'static',
      fields: emptyFields(),
      style: styleFromTemplate(route.query.template, settings.brandLogo),
    };
    return;
  }
  const found = codes.items.find(item => item.id === String(route.params.id));
  if (!found) {
    missing.value = true;
    return;
  }
  draft.value = {
    name: found.name,
    kind: found.kind,
    mode: found.mode,
    fields: { ...found.fields },
    style: { ...found.style },
  };
}

watch(
  () => route.fullPath,
  () => {
    error.value = '';
    savedHint.value = false;
    applyRoute();
  },
  { immediate: true },
);

function onKind(kind: QrKind) {
  draft.value.kind = kind;
  if (kind === 'rich') draft.value.mode = 'live';
}

function setLook(event: Event) {
  const id = (event.target as HTMLSelectElement).value;
  if (id === 'classic') {
    draft.value.style.module = 'classic';
    draft.value.style.color = '#14181F';
    return;
  }
  draft.value.style.module = 'emerald';
  draft.value.style.color = '#2F9B6A';
}

function onColor(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  draft.value.style.color = value;
  draft.value.style.module =
    value.toLowerCase() === '#14181f' ? 'classic' : 'emerald';
}

function setExportSize(event: Event) {
  draft.value.style.exportSize = Number(
    (event.target as HTMLSelectElement).value,
  );
}

function setMargin(event: Event) {
  draft.value.style.margin = Number((event.target as HTMLSelectElement).value);
}

function zoomBy(step: number) {
  const next = Math.round((zoom.value + step) * 100) / 100;
  zoom.value = Math.min(1.15, Math.max(0.8, next));
}

function openStyle() {
  const el = styleSelect.value;
  el?.focus();
  if (el && 'showPicker' in el) el.showPicker();
}

function toggleLogo() {
  if (draft.value.style.logo) {
    draft.value.style.logo = '';
    return;
  }
  if (!settings.brandLogo) return;
  draft.value.style.logo = settings.brandLogo;
  draft.value.style.ecc = 'H';
}

function toggleMode() {
  if (draft.value.kind === 'rich') return;
  draft.value.mode = draft.value.mode === 'live' ? 'static' : 'live';
  moreOpen.value = false;
}

async function onRichImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    draft.value.fields.richImage = await readImageFile(file);
    imageError.value = '';
  } catch (reason) {
    imageError.value =
      reason instanceof Error ? reason.message : '图片读取失败';
  }
}

async function save() {
  const problem = contentError(draft.value.kind, draft.value.fields);
  if (problem) {
    error.value = problem;
    savedHint.value = false;
    return;
  }
  error.value = '';
  const next: QrDraft = {
    ...draft.value,
    name: draft.value.name.trim(),
    mode: draft.value.kind === 'rich' ? 'live' : draft.value.mode,
    fields: { ...draft.value.fields },
    style: { ...draft.value.style },
  };
  let link = current.value?.remoteId
    ? {
        remoteId: current.value.remoteId,
        shortKey: current.value.shortKey || '',
        scanUrl: current.value.scanUrl || '',
      }
    : undefined;
  if (isLive(next.kind, next.mode)) {
    const body = {
      type: toLiveType(next.kind),
      title: next.name.trim(),
      payload: toLivePayload(next.kind, next.fields),
    };
    try {
      if (link?.remoteId) {
        await patchLiveCode(link.remoteId, body);
      } else {
        const created = await createLiveCode(body);
        link = {
          remoteId: created.id,
          shortKey: created.short_key,
          scanUrl: created.scan_url,
        };
      }
    } catch (reason) {
      error.value =
        reason instanceof Error ? reason.message : '活码服务没有完成这次请求';
      savedHint.value = false;
      return;
    }
  }
  if (!savedId.value) {
    const created = codes.create(next, link);
    await router.replace({ name: 'code-edit', params: { id: created.id } });
  } else {
    codes.update(savedId.value, next, link);
  }
  savedHint.value = true;
  window.setTimeout(() => {
    savedHint.value = false;
  }, 2000);
}

async function download() {
  if (!payload.value) {
    error.value = '先填写内容，再下载';
    return;
  }
  try {
    const ok = await downloadQr(
      payload.value,
      draft.value.style,
      draft.value.name.trim() || 'weko-qr',
    );
    if (!ok) error.value = '下载失败';
  } catch {
    error.value = '这段内容无法编码成二维码';
  }
}

async function copyAddress() {
  const address = current.value?.scanUrl || '';
  if (!address) return;
  try {
    await navigator.clipboard.writeText(address);
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 1500);
  } catch {
    error.value = '复制失败';
  }
}

async function togglePause() {
  if (!current.value || current.value.mode !== 'live') return;
  try {
    await codes.setStatus(
      [current.value.id],
      current.value.status === 'paused' ? 'active' : 'paused',
    );
  } catch (reason) {
    error.value =
      reason instanceof Error ? reason.message : '活码服务没有完成这次请求';
  }
}
</script>

<template>
  <div class="page flex h-screen flex-col gap-14px p-16px">
    <header
      class="panel flex h-68px shrink-0 items-center justify-between px-18px"
    >
      <RouterLink to="/" class="flex items-center gap-10px">
        <span
          class="text-22px text-[#1c4d34] font-900 font-[cormorant-garamond-light-italic]"
        >
          Weko QR Code
        </span>
      </RouterLink>
      <div class="relative flex items-center gap-8px">
        <div
          class="size-36px flex-center rounded-12px bg-#fff b-1 b-solid b-#fff/80 bg-#fff/70 cursor-pointer"
        >
          <img
            src="/images/question_mark.svg"
            alt=""
            class="h-18px w-18px"
            @click="helpOpen = !helpOpen"
          />
        </div>

        <div
          v-if="helpOpen"
          class="absolute right-0 top-46px z-20 w-240px rounded-14px border border-border-glass bg-white/95 p-12px text-13px text-text-secondary shadow-[0_10px_30px_rgba(36,90,58,0.12)]"
        >
          选择类型并填写内容，实时预览二维码效果。
        </div>
      </div>
    </header>

    <div v-if="missing" class="panel flex flex-1 items-center justify-center">
      <EmptyState
        title="找不到这个码"
        description="它可能已经删除。"
        action="返回列表"
        @action="router.push({ name: 'codes' })"
      />
    </div>

    <div
      v-else
      class="grid min-h-0 flex-1 grid-cols-[232px_minmax(0,1fr)_360px] gap-14px"
    >
      <section class="panel flex min-h-0 flex-col p-16px">
        <h2
          class="flex items-center gap-8px text-16px font-medium text-[#1c4d34]"
        >
          <svg
            viewBox="0 0 24 24"
            class="h-16px w-16px"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
          >
            <path
              d="M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z"
            />
          </svg>
          类型
        </h2>
        <div class="mt-14px flex flex-col gap-8px">
          <button
            v-for="item in kinds"
            :key="item.id"
            type="button"
            class="flex h-46px items-center gap-10px rounded-14px px-12px text-14px text-[#24382c]"
            :class="
              draft.kind === item.id
                ? 'bg-[#e5f4eb]'
                : 'border border-white/70 bg-white/55'
            "
            @click="onKind(item.id)"
          >
            <svg
              v-if="item.id === 'url'"
              viewBox="0 0 24 24"
              class="h-16px w-16px"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
            >
              <path
                d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"
                stroke-linecap="round"
              />
              <path
                d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"
                stroke-linecap="round"
              />
            </svg>
            <span
              v-else-if="item.id === 'text'"
              class="w-16px text-center text-15px font-semibold"
            >
              T
            </span>
            <svg
              v-else-if="item.id === 'vcard'"
              viewBox="0 0 24 24"
              class="h-16px w-16px"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
            >
              <circle cx="12" cy="8" r="3" />
              <path
                d="M5 19c1.4-3 3.8-4.5 7-4.5S17.6 16 19 19"
                stroke-linecap="round"
              />
            </svg>
            <svg
              v-else-if="item.id === 'wifi'"
              viewBox="0 0 24 24"
              class="h-16px w-16px"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
            >
              <path d="M5 10a10 10 0 0 1 14 0" stroke-linecap="round" />
              <path d="M8 13.2a6 6 0 0 1 8 0" stroke-linecap="round" />
              <path d="M12 17.5h.01" stroke-linecap="round" />
            </svg>
            <svg
              v-else
              viewBox="0 0 24 24"
              class="h-16px w-16px"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
            >
              <rect x="4" y="5" width="16" height="14" rx="2" />
              <path d="M4 15l4-4 3 3 3-3 6 5" />
            </svg>
            <span class="flex-1 text-left">{{ item.label }}</span>
            <svg
              v-if="draft.kind === item.id"
              viewBox="0 0 24 24"
              class="h-16px w-16px text-accent"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <circle cx="12" cy="12" r="8" />
              <path
                d="M8.5 12.2l2.4 2.4 4.6-5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
        <div class="mt-auto rounded-16px bg-white/45 p-12px">
          <p
            class="flex items-center gap-6px text-13px font-medium text-[#1c4d34]"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-14px w-14px"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
            >
              <path
                d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11c.5.6.8 1.2 1 2h4c.2-.8.5-1.4 1-2A6 6 0 0 0 12 3z"
              />
            </svg>
            小贴士
          </p>
          <p class="mt-6px text-12px leading-[18px] text-text-secondary">
            选择类型并填写内容，实时预览二维码效果。
          </p>
        </div>
      </section>

      <section class="panel flex min-h-0 flex-col items-center px-18px py-16px">
        <h2
          class="flex w-full items-center gap-4px text-16px font-medium text-[#1c4d34]"
        >
          <img class="size-20px" src="/images/star.svg" alt="" />
          <span>QR 预览</span>
        </h2>
        <div class="flex min-h-0 flex-1 items-center justify-center">
          <div
            class="relative h-400px w-400px transition-transform duration-200"
            :style="{ transform: `scale(${zoom})` }"
          >
            <ArtFrame />
            <div class="absolute inset-0 flex items-center justify-center">
              <Preview plain :text="payload" :style="draft.style" />
            </div>
          </div>
        </div>
        <p
          class="mb-14px flex items-center gap-6px text-12px text-text-secondary"
        >
          <svg
            viewBox="0 0 24 24"
            class="h-14px w-14px"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
          >
            <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
            <path d="M9 12l2 2 4-4" stroke-linecap="round" />
          </svg>
          高质量 · 抗扫描 · 美观大方
        </p>
        <div class="flex items-start gap-10px">
          <button
            type="button"
            class="flex h-64px w-64px flex-col items-center justify-center gap-4px rounded-16px border border-white/80 bg-white/65 text-12px text-[#24382c]"
            @click="zoomBy(0.08)"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-16px w-16px"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
            >
              <circle cx="11" cy="11" r="6" />
              <path d="M11 8.5v5M8.5 11h5M16 16l4 4" stroke-linecap="round" />
            </svg>
            放大
          </button>
          <button
            type="button"
            class="flex h-64px w-64px flex-col items-center justify-center gap-4px rounded-16px border border-white/80 bg-white/65 text-12px text-[#24382c]"
            @click="zoomBy(-0.08)"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-16px w-16px"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
            >
              <circle cx="11" cy="11" r="6" />
              <path d="M8.5 11h5M16 16l4 4" stroke-linecap="round" />
            </svg>
            缩小
          </button>
          <button
            type="button"
            class="flex h-64px w-64px flex-col items-center justify-center gap-4px rounded-16px border border-white/80 bg-white/65 text-12px text-[#24382c]"
            @click="openStyle"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-16px w-16px"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"
                stroke-linecap="round"
              />
            </svg>
            样式
          </button>
          <div class="relative">
            <button
              type="button"
              class="flex h-64px w-64px flex-col items-center justify-center gap-4px rounded-16px border border-white/80 bg-white/65 text-12px text-[#24382c]"
              @click="moreOpen = !moreOpen"
            >
              <svg
                viewBox="0 0 24 24"
                class="h-16px w-16px"
                fill="currentColor"
              >
                <circle cx="6" cy="12" r="1.4" />
                <circle cx="12" cy="12" r="1.4" />
                <circle cx="18" cy="12" r="1.4" />
              </svg>
              更多
            </button>
            <div
              v-if="moreOpen"
              class="absolute bottom-72px right-0 z-20 w-220px rounded-14px border border-border-glass bg-white/95 p-10px shadow-[0_10px_30px_rgba(36,90,58,0.12)]"
            >
              <label class="mb-8px block text-12px text-text-secondary">
                名称
                <input
                  v-model="draft.name"
                  class="field mt-4px"
                  placeholder="不填会自动生成"
                />
              </label>
              <button
                v-if="draft.kind !== 'rich'"
                type="button"
                class="mb-4px h-32px w-full rounded-8px text-left text-13px hover:bg-[#e5f4eb] px-8px"
                @click="toggleMode"
              >
                {{ draft.mode === 'live' ? '切换为静态码' : '切换为活码' }}
              </button>
              <button
                v-if="showLiveAddress"
                type="button"
                class="mb-4px h-32px w-full rounded-8px px-8px text-left text-13px hover:bg-[#e5f4eb]"
                @click="copyAddress"
              >
                {{ copied ? '已复制' : '复制活码地址' }}
              </button>
              <button
                v-if="current?.mode === 'live'"
                type="button"
                class="mb-4px h-32px w-full rounded-8px px-8px text-left text-13px hover:bg-[#e5f4eb]"
                @click="togglePause"
              >
                {{ current.status === 'paused' ? '恢复访问' : '暂停访问' }}
              </button>
              <button
                v-if="settings.brandLogo || draft.style.logo"
                type="button"
                class="h-32px w-full rounded-8px px-8px text-left text-13px hover:bg-[#e5f4eb]"
                @click="toggleLogo"
              >
                {{ draft.style.logo ? '移除标记' : '放入品牌标记' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="panel flex min-h-0 flex-col p-16px">
        <h2
          class="mb-14px flex items-center gap-8px text-16px font-medium text-[#1c4d34]"
        >
          <svg
            viewBox="0 0 24 24"
            class="h-16px w-16px"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
          >
            <path d="M4 20h4l10.5-10.5-4-4L4 16z" />
            <path d="M13.5 6.5l4 4" />
          </svg>
          内容设置
        </h2>
        <div class="min-h-0 flex-1 overflow-y-auto pr-2px">
          <template v-if="draft.kind === 'url'">
            <label class="mb-6px block text-13px text-text-secondary">
              URL 链接 *
            </label>
            <div class="relative mb-14px">
              <svg
                class="pointer-events-none absolute left-12px top-1/2 h-14px w-14px -translate-y-1/2 text-text-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
              >
                <path
                  d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"
                  stroke-linecap="round"
                />
                <path
                  d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"
                  stroke-linecap="round"
                />
              </svg>
              <input
                v-model="draft.fields.url"
                class="field !h-42px !py-0 !pl-34px !pr-34px"
                placeholder="https://weko.cc"
              />
              <svg
                v-if="urlReady"
                class="absolute right-12px top-1/2 h-16px w-16px -translate-y-1/2 text-accent"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <circle cx="12" cy="12" r="8" />
                <path d="M8.5 12.2l2.4 2.4 4.6-5" stroke-linecap="round" />
              </svg>
            </div>
          </template>
          <template v-else-if="draft.kind === 'text'">
            <label class="mb-6px block text-13px text-text-secondary">
              文本 *
            </label>
            <textarea
              v-model="draft.fields.text"
              class="field mb-14px min-h-96px"
              placeholder="要展示的文字"
            />
          </template>
          <template v-else-if="draft.kind === 'vcard'">
            <label class="mb-6px block text-13px text-text-secondary">
              姓名 *
            </label>
            <input
              v-model="draft.fields.fullName"
              class="field !h-42px !py-0 mb-10px"
            />
            <label class="mb-6px block text-13px text-text-secondary">
              公司
            </label>
            <input
              v-model="draft.fields.org"
              class="field !h-42px !py-0 mb-10px"
            />
            <label class="mb-6px block text-13px text-text-secondary">
              职位
            </label>
            <input
              v-model="draft.fields.title"
              class="field !h-42px !py-0 mb-10px"
            />
            <label class="mb-6px block text-13px text-text-secondary">
              电话
            </label>
            <input
              v-model="draft.fields.phone"
              class="field !h-42px !py-0 mb-10px"
            />
            <label class="mb-6px block text-13px text-text-secondary">
              邮箱
            </label>
            <input
              v-model="draft.fields.email"
              class="field !h-42px !py-0 mb-10px"
            />
            <label class="mb-6px block text-13px text-text-secondary">
              网址
            </label>
            <input
              v-model="draft.fields.site"
              class="field !h-42px !py-0 mb-14px"
              placeholder="https://"
            />
          </template>
          <template v-else-if="draft.kind === 'wifi'">
            <label class="mb-6px block text-13px text-text-secondary">
              网络名称 *
            </label>
            <input
              v-model="draft.fields.ssid"
              class="field !h-42px !py-0 mb-10px"
            />
            <label class="mb-6px block text-13px text-text-secondary">
              加密
            </label>
            <select
              v-model="draft.fields.encryption"
              class="field !h-42px !py-0 mb-10px"
            >
              <option value="WPA">WPA / WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">无密码</option>
            </select>
            <label class="mb-6px block text-13px text-text-secondary">
              密码
            </label>
            <input
              v-model="draft.fields.password"
              class="field !h-42px !py-0 mb-10px"
              :disabled="draft.fields.encryption === 'nopass'"
            />
            <label
              class="mb-14px flex items-center gap-8px text-13px text-text-secondary"
            >
              <input
                v-model="draft.fields.hidden"
                type="checkbox"
                class="accent-[#2F9B6A]"
              />
              隐藏网络
            </label>
          </template>
          <template v-else>
            <p class="mb-10px text-12px text-text-secondary">
              图文保存在短链后面。二维码只含固定地址，改内容不用换图。
            </p>
            <label class="mb-6px block text-13px text-text-secondary">
              标题
            </label>
            <input
              v-model="draft.fields.richTitle"
              class="field !h-42px !py-0 mb-10px"
            />
            <label class="mb-6px block text-13px text-text-secondary">
              正文 *
            </label>
            <textarea
              v-model="draft.fields.richBody"
              class="field mb-10px min-h-80px"
            />
            <div class="mb-14px flex items-center gap-8px">
              <button
                type="button"
                class="chip border-border-strong text-text-primary"
                @click="richFile?.click()"
              >
                上传配图
              </button>
              <button
                v-if="draft.fields.richImage"
                type="button"
                class="chip border-border-subtle text-text-secondary"
                @click="draft.fields.richImage = ''"
              >
                移除
              </button>
            </div>
            <img
              v-if="draft.fields.richImage"
              :src="draft.fields.richImage"
              alt=""
              class="mb-10px max-h-100px rounded-8px"
            />
            <p v-if="imageError" class="mb-10px text-12px text-danger">
              {{ imageError }}
            </p>
            <input
              ref="richFile"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onRichImage"
            />
          </template>

          <label class="mb-6px block text-13px text-text-secondary">
            二维码样式
          </label>
          <div class="relative mb-14px">
            <svg
              class="pointer-events-none absolute left-12px top-1/2 h-14px w-14px -translate-y-1/2 text-text-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
            >
              <rect x="4" y="5" width="16" height="14" rx="2" />
              <path d="M4 15l4-3 3 2 4-4 5 4" />
            </svg>
            <select
              ref="styleSelect"
              class="field !h-42px appearance-none !py-0 !pl-34px !pr-28px"
              :value="lookId"
              @change="setLook"
            >
              <option value="art">Art Nouveau 藤蔓风格</option>
              <option value="classic">经典黑白</option>
            </select>
            <svg
              class="pointer-events-none absolute right-12px top-1/2 h-12px w-12px -translate-y-1/2 text-text-muted"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
            >
              <path d="M2 4l4 4 4-4" stroke-linecap="round" />
            </svg>
          </div>

          <label class="mb-6px block text-13px text-text-secondary">
            纠错级别
          </label>
          <div class="relative mb-6px">
            <svg
              class="pointer-events-none absolute left-12px top-1/2 h-14px w-14px -translate-y-1/2 text-text-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
            >
              <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
            </svg>
            <select
              v-model="draft.style.ecc"
              class="field !h-42px appearance-none !py-0 !pl-34px !pr-28px"
            >
              <option value="L">L（低）</option>
              <option value="M">M（标准）</option>
              <option value="Q">Q（较高）</option>
              <option value="H">H（高）</option>
            </select>
            <svg
              class="pointer-events-none absolute right-12px top-1/2 h-12px w-12px -translate-y-1/2 text-text-muted"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
            >
              <path d="M2 4l4 4 4-4" stroke-linecap="round" />
            </svg>
          </div>
          <p class="mb-12px text-12px text-text-muted">{{ eccHint }}</p>

          <button
            type="button"
            class="mb-10px flex w-full items-center justify-between text-13px text-text-secondary"
            @click="advanced = !advanced"
          >
            高级选项
            <svg
              class="h-12px w-12px transition-transform"
              :class="advanced ? '' : 'rotate-180'"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
            >
              <path d="M2 8l4-4 4 4" stroke-linecap="round" />
            </svg>
          </button>
          <div v-show="advanced">
            <div class="mb-12px grid grid-cols-2 gap-10px">
              <label class="block">
                <span class="mb-6px block text-13px text-text-secondary">
                  尺寸
                </span>
                <select
                  class="field !h-42px !py-0"
                  :value="draft.style.exportSize || 1000"
                  @change="setExportSize"
                >
                  <option :value="512">512 × 512 px</option>
                  <option :value="1000">1000 × 1000 px</option>
                  <option :value="2000">2000 × 2000 px</option>
                </select>
              </label>
              <label class="block">
                <span class="mb-6px block text-13px text-text-secondary">
                  边距
                </span>
                <select
                  class="field !h-42px !py-0"
                  :value="draft.style.margin"
                  @change="setMargin"
                >
                  <option :value="1">10 px</option>
                  <option :value="2">20 px</option>
                  <option :value="3">30 px</option>
                  <option :value="4">40 px</option>
                </select>
              </label>
            </div>
            <div class="mb-8px flex items-center gap-8px">
              <span class="text-13px text-text-secondary">前景色</span>
              <label
                class="flex h-36px flex-1 items-center gap-8px rounded-12px border border-border-subtle bg-white/70 px-10px"
              >
                <input
                  ref="colorInput"
                  type="color"
                  class="h-16px w-16px cursor-pointer border-0 bg-transparent p-0"
                  :value="draft.style.color || '#2F9B6A'"
                  @input="onColor"
                />
                <span class="text-13px">{{ ink }}</span>
              </label>
              <button
                type="button"
                class="flex h-36px w-36px items-center justify-center rounded-12px border border-border-subtle bg-white/70"
                aria-label="选取颜色"
                @click="colorInput?.click()"
              >
                <svg
                  viewBox="0 0 24 24"
                  class="h-14px w-14px"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                >
                  <path d="M4 20h4l10.5-10.5-4-4L4 16z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <p v-if="error" class="mt-8px text-12px text-danger">{{ error }}</p>
        <p v-else-if="savedHint" class="mt-8px text-12px text-success">
          已保存
        </p>
        <p
          v-else-if="current?.status === 'paused'"
          class="mt-8px text-12px text-warning"
        >
          此码已暂停，打开地址不会显示内容。
        </p>
        <p
          v-else-if="isLive(draft.kind, draft.mode) && !liveFixed"
          class="mt-8px text-12px text-warning"
        >
          保存后会生成固定短链，请再下载一次
        </p>
        <div class="mt-12px flex items-center gap-8px">
          <button
            type="button"
            class="flex h-42px flex-1 items-center justify-center gap-6px rounded-12px bg-accent text-14px text-white shadow-[0_8px_16px_rgba(47,155,106,0.28)] hover:bg-accent-hover"
            @click="save"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-15px w-15px"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
            >
              <path d="M5 4h11l3 3v13H5z" />
              <path d="M8 4v5h7V4M8 20v-6h8v6" />
            </svg>
            保存二维码
          </button>
          <button
            type="button"
            class="flex h-42px items-center gap-6px rounded-12px border border-[rgba(36,90,58,0.18)] bg-white/70 px-12px text-14px text-[#24382c]"
            @click="download"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-15px w-15px"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
            >
              <path d="M12 4v10" stroke-linecap="round" />
              <path d="M8 11l4 4 4-4" stroke-linecap="round" />
              <path d="M5 19h14" stroke-linecap="round" />
            </svg>
            导出图片
            <svg
              viewBox="0 0 12 12"
              class="h-10px w-10px"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
            >
              <path d="M2 4l4 4 4-4" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
