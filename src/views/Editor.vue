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
const styleSelect = ref<{ $el?: HTMLElement } | null>(null);
const colorTrigger = ref<HTMLElement | null>(null);
const styleOpen = ref(false);
const zoom = ref(1);
const advanced = ref(true);
const selectPopup = { contentClass: 'editor-dropdown' };

type SelectValue =
  | string
  | number
  | boolean
  | Record<string, any>
  | (string | number | boolean | Record<string, any>)[];

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

function onLook(id: SelectValue) {
  if (id === 'classic') {
    draft.value.style.module = 'classic';
    draft.value.style.color = '#14181F';
    return;
  }
  draft.value.style.module = 'emerald';
  draft.value.style.color = '#2F9B6A';
}

function onColorValue(value: string) {
  draft.value.style.color = value;
  draft.value.style.module =
    value.toLowerCase() === '#14181f' ? 'classic' : 'emerald';
}

function onExportSize(value: SelectValue) {
  draft.value.style.exportSize = Number(value);
}

function onMargin(value: SelectValue) {
  draft.value.style.margin = Number(value);
}

function zoomBy(step: number) {
  const next = Math.round((zoom.value + step) * 100) / 100;
  zoom.value = Math.min(1.15, Math.max(0.8, next));
}

function openStyle() {
  const el = styleSelect.value?.$el;
  if (el instanceof HTMLElement) el.scrollIntoView({ block: 'nearest' });
  styleOpen.value = true;
}

function openColor() {
  colorTrigger.value?.click();
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
}

async function onRichUpload(
  _list: { file?: File }[],
  current: { file?: File },
) {
  const file = current.file;
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
  <div class="editor page flex h-screen flex-col gap-14px p-16px">
    <header
      class="panel flex h-68px shrink-0 items-center justify-between px-18px"
    >
      <RouterLink to="/" class="flex items-center gap-10px">
        <img src="/images/clover.svg" alt="logo" class="size-30px" />
        <span
          class="text-22px text-[#1c4d34] font-900 font-[cormorant-garamond-light-italic]"
        >
          Weko QR Code
        </span>
      </RouterLink>
      <div class="relative flex items-center gap-8px">
        <a-popover
          trigger="click"
          position="br"
          content-class="editor-pop is-help"
          arrow-class="editor-pop-arrow"
        >
          <a-button type="text" class="help-btn" aria-label="帮助">
            <img src="/images/question_mark.svg" alt="" class="h-18px w-18px" />
          </a-button>
          <template #content>选择类型并填写内容，实时预览二维码效果。</template>
        </a-popover>
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
          <a-button
            v-for="item in kinds"
            :key="item.id"
            type="text"
            class="kind-btn hover:bg-#e5f4eb!"
            :class="{ 'is-on': draft.kind === item.id }"
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
            <span class="kind-label">{{ item.label }}</span>
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
          </a-button>
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
          <a-button type="text" class="tool-btn" @click="zoomBy(0.08)">
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
          </a-button>
          <a-button type="text" class="tool-btn" @click="zoomBy(-0.08)">
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
          </a-button>
          <a-button type="text" class="tool-btn" @click="openStyle">
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
          </a-button>
          <a-popover
            trigger="click"
            position="tr"
            content-class="editor-pop is-more"
            arrow-class="editor-pop-arrow"
          >
            <a-button type="text" class="tool-btn">
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
            </a-button>
            <template #content>
              <label class="mb-8px block text-12px text-text-secondary">
                名称
                <a-input
                  v-model="draft.name"
                  class="mt-4px"
                  placeholder="不填会自动生成"
                />
              </label>
              <a-button
                v-if="draft.kind !== 'rich'"
                type="text"
                class="menu-btn"
                @click="toggleMode"
              >
                {{ draft.mode === 'live' ? '切换为静态码' : '切换为活码' }}
              </a-button>
              <a-button
                v-if="showLiveAddress"
                type="text"
                class="menu-btn"
                @click="copyAddress"
              >
                {{ copied ? '已复制' : '复制活码地址' }}
              </a-button>
              <a-button
                v-if="current?.mode === 'live'"
                type="text"
                class="menu-btn"
                @click="togglePause"
              >
                {{ current.status === 'paused' ? '恢复访问' : '暂停访问' }}
              </a-button>
              <a-button
                v-if="settings.brandLogo || draft.style.logo"
                type="text"
                class="menu-btn"
                @click="toggleLogo"
              >
                {{ draft.style.logo ? '移除标记' : '放入品牌标记' }}
              </a-button>
            </template>
          </a-popover>
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
            <a-input
              v-model="draft.fields.url"
              class="mb-14px"
              placeholder="https://weko.cc"
            >
              <template #prefix>
                <svg
                  class="field-icon"
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
              </template>
              <template v-if="urlReady" #suffix>
                <svg
                  class="h-16px w-16px text-accent"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <circle cx="12" cy="12" r="8" />
                  <path d="M8.5 12.2l2.4 2.4 4.6-5" stroke-linecap="round" />
                </svg>
              </template>
            </a-input>
          </template>
          <template v-else-if="draft.kind === 'text'">
            <label class="mb-6px block text-13px text-text-secondary">
              文本 *
            </label>
            <a-textarea
              v-model="draft.fields.text"
              class="is-tall mb-14px"
              placeholder="要展示的文字"
            />
          </template>
          <template v-else-if="draft.kind === 'vcard'">
            <label class="mb-6px block text-13px text-text-secondary">
              姓名 *
            </label>
            <a-input v-model="draft.fields.fullName" class="mb-10px" />
            <label class="mb-6px block text-13px text-text-secondary">
              公司
            </label>
            <a-input v-model="draft.fields.org" class="mb-10px" />
            <label class="mb-6px block text-13px text-text-secondary">
              职位
            </label>
            <a-input v-model="draft.fields.title" class="mb-10px" />
            <label class="mb-6px block text-13px text-text-secondary">
              电话
            </label>
            <a-input v-model="draft.fields.phone" class="mb-10px" />
            <label class="mb-6px block text-13px text-text-secondary">
              邮箱
            </label>
            <a-input v-model="draft.fields.email" class="mb-10px" />
            <label class="mb-6px block text-13px text-text-secondary">
              网址
            </label>
            <a-input
              v-model="draft.fields.site"
              class="mb-14px"
              placeholder="https://"
            />
          </template>
          <template v-else-if="draft.kind === 'wifi'">
            <label class="mb-6px block text-13px text-text-secondary">
              网络名称 *
            </label>
            <a-input v-model="draft.fields.ssid" class="mb-10px" />
            <label class="mb-6px block text-13px text-text-secondary">
              加密
            </label>
            <div class="select-line mb-10px">
              <a-select
                v-model="draft.fields.encryption"
                :trigger-props="selectPopup"
              >
                <a-option value="WPA">WPA / WPA2</a-option>
                <a-option value="WEP">WEP</a-option>
                <a-option value="nopass">无密码</a-option>
              </a-select>
            </div>
            <label class="mb-6px block text-13px text-text-secondary">
              密码
            </label>
            <a-input
              v-model="draft.fields.password"
              class="mb-10px"
              :disabled="draft.fields.encryption === 'nopass'"
            />
            <a-checkbox v-model="draft.fields.hidden" class="hidden-net">
              隐藏网络
            </a-checkbox>
          </template>
          <template v-else>
            <p class="mb-10px text-12px text-text-secondary">
              图文保存在短链后面。二维码只含固定地址，改内容不用换图。
            </p>
            <label class="mb-6px block text-13px text-text-secondary">
              标题
            </label>
            <a-input v-model="draft.fields.richTitle" class="mb-10px" />
            <label class="mb-6px block text-13px text-text-secondary">
              正文 *
            </label>
            <a-textarea v-model="draft.fields.richBody" class="mb-10px" />
            <div class="mb-14px flex items-center gap-8px">
              <a-upload
                :auto-upload="false"
                accept="image/*"
                :show-file-list="false"
                @change="onRichUpload"
              >
                <template #upload-button>
                  <a-button type="text" class="chip-btn">上传配图</a-button>
                </template>
              </a-upload>
              <a-button
                v-if="draft.fields.richImage"
                type="text"
                class="chip-btn is-quiet"
                @click="draft.fields.richImage = ''"
              >
                移除
              </a-button>
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
          </template>

          <label class="mb-6px block text-13px text-text-secondary">
            二维码样式
          </label>
          <div class="select-line mb-14px">
            <a-select
              ref="styleSelect"
              v-model:popup-visible="styleOpen"
              :model-value="lookId"
              :trigger-props="selectPopup"
              @change="onLook"
            >
              <template #prefix>
                <svg
                  class="field-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                >
                  <rect x="4" y="5" width="16" height="14" rx="2" />
                  <path d="M4 15l4-3 3 2 4-4 5 4" />
                </svg>
              </template>
              <a-option value="classic">经典黑白</a-option>
              <a-option value="art">Art Nouveau 藤蔓风格</a-option>
            </a-select>
          </div>

          <label class="mb-6px block text-13px text-text-secondary">
            纠错级别
          </label>
          <div class="select-line mb-6px">
            <a-select v-model="draft.style.ecc" :trigger-props="selectPopup">
              <template #prefix>
                <svg
                  class="field-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                >
                  <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
                </svg>
              </template>
              <a-option value="L">L（低）</a-option>
              <a-option value="M">M（标准）</a-option>
              <a-option value="Q">Q（较高）</a-option>
              <a-option value="H">H（高）</a-option>
            </a-select>
          </div>
          <p class="mb-12px text-12px text-text-muted">{{ eccHint }}</p>

          <a-button type="text" class="fold-btn" @click="advanced = !advanced">
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
          </a-button>
          <div v-show="advanced">
            <div class="mb-12px grid grid-cols-2 gap-10px">
              <div>
                <span class="mb-6px block text-13px text-text-secondary">
                  尺寸
                </span>
                <div class="select-line">
                  <a-select
                    :model-value="draft.style.exportSize || 1000"
                    :trigger-props="selectPopup"
                    @change="onExportSize"
                  >
                    <a-option :value="512">512 × 512 px</a-option>
                    <a-option :value="1000">1000 × 1000 px</a-option>
                    <a-option :value="2000">2000 × 2000 px</a-option>
                  </a-select>
                </div>
              </div>
              <div>
                <span class="mb-6px block text-13px text-text-secondary">
                  边距
                </span>
                <div class="select-line">
                  <a-select
                    :model-value="draft.style.margin"
                    :trigger-props="selectPopup"
                    @change="onMargin"
                  >
                    <a-option :value="1">10 px</a-option>
                    <a-option :value="2">20 px</a-option>
                    <a-option :value="3">30 px</a-option>
                    <a-option :value="4">40 px</a-option>
                  </a-select>
                </div>
              </div>
            </div>
            <div class="mb-8px flex items-center gap-8px">
              <span class="text-13px text-text-secondary">前景色</span>
              <div class="color-line">
                <a-color-picker
                  format="hex"
                  disabled-alpha
                  :show-text="false"
                  :show-history="false"
                  :show-preset="false"
                  :model-value="draft.style.color || '#2F9B6A'"
                  @change="onColorValue"
                >
                  <div ref="colorTrigger" class="color-swatch">
                    <span
                      class="color-dot"
                      :style="{ background: draft.style.color || '#2F9B6A' }"
                    />
                    <span class="text-13px">{{ ink }}</span>
                  </div>
                </a-color-picker>
              </div>
              <a-button
                type="text"
                class="icon-btn"
                aria-label="选取颜色"
                @click="openColor"
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
              </a-button>
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
          <a-button type="text" class="save-btn" @click="save">
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
          </a-button>
          <a-button type="text" class="export-btn" @click="download">
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
          </a-button>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss">
.editor .arco-input-wrapper,
.editor .arco-textarea-wrapper,
.editor .arco-select-view-single,
.editor-pop .arco-input-wrapper {
  width: 100%;
  border: 1px solid rgba(36, 90, 58, 0.12);
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.7);
  box-shadow: none;
  color: #1a2e24;
  font-size: 14px;
}

.editor .arco-input-wrapper,
.editor .arco-select-view-single,
.editor-pop .arco-input-wrapper {
  height: 42px;
  padding: 0 12px;
}

.editor .arco-textarea-wrapper {
  height: auto;
  min-height: 80px;
  padding: 8px 12px;
}

.editor .arco-textarea-wrapper.is-tall {
  min-height: 96px;
}

.editor .arco-input-wrapper:hover,
.editor .arco-textarea-wrapper:hover,
.editor .arco-select-view-single:hover,
.editor-pop .arco-input-wrapper:hover,
.editor .arco-input-wrapper.arco-input-disabled,
.editor .arco-input-wrapper.arco-input-disabled:hover {
  background-color: rgba(255, 255, 255, 0.7);
  border-color: rgba(36, 90, 58, 0.12);
}

.editor .arco-input-wrapper.arco-input-disabled {
  opacity: 0.4;
}

.editor .arco-input-focus,
.editor .arco-textarea-focus,
.editor .arco-select-view-focus,
.editor-pop .arco-input-focus {
  border-color: #2f9b6a;
  background-color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 0 0 2px rgba(47, 155, 106, 0.22);
}

.editor .arco-input,
.editor .arco-textarea,
.editor-pop .arco-input {
  padding: 0;
  color: #1a2e24;
  font-size: 14px;
  background: transparent;
}

.editor .arco-input::placeholder,
.editor .arco-textarea::placeholder,
.editor-pop .arco-input::placeholder {
  color: #8aa093;
}

.editor .arco-select-view-value,
.editor .arco-select-view-input {
  color: #1a2e24;
  font-size: 14px;
}

.editor .field-icon,
.editor .arco-select-view-prefix,
.editor .arco-input-prefix {
  color: #8aa093;
}

.editor .field-icon {
  width: 14px;
  height: 14px;
}

.editor .arco-input-prefix,
.editor .arco-select-view-prefix {
  padding-right: 8px;
}

.editor .arco-select-view-icon {
  color: #8aa093;
}

.editor .arco-select-view-icon svg {
  width: 12px;
  height: 12px;
}

.editor .kind-btn.arco-btn {
  display: flex;
  width: 100%;
  height: 46px;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  margin-bottom: 0;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.55);
  color: #24382c;
  font-size: 14px;
  font-weight: 400;
  line-height: 1;
  box-shadow: none;
}

.editor .kind-btn.arco-btn.is-on {
  border-color: transparent;
  background: #e5f4eb;
}

.editor .kind-label {
  flex: 1;
  text-align: left;
}

.editor .tool-btn.arco-btn {
  display: flex;
  width: 64px;
  height: 64px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.65);
  color: #24382c;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.2;
  box-shadow: none;
}

.editor .help-btn.arco-btn {
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: none;
}

.editor .fold-btn.arco-btn {
  display: flex;
  width: 100%;
  height: auto;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #5a7264;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.4;
  box-shadow: none;
}

.editor .chip-btn.arco-btn {
  height: auto;
  padding: 6px 10px;
  border: 1px solid rgba(36, 90, 58, 0.22);
  border-radius: 12px;
  background: transparent;
  color: #1a2e24;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.2;
  box-shadow: none;
}

.editor .chip-btn.is-quiet.arco-btn {
  border-color: rgba(36, 90, 58, 0.12);
  color: #5a7264;
}

.editor .icon-btn.arco-btn {
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid rgba(36, 90, 58, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  color: #1a2e24;
  box-shadow: none;
}

.editor .save-btn.arco-btn {
  display: flex;
  height: 42px;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 12px;
  border: 0;
  border-radius: 12px;
  background: #2f9b6a;
  color: #fff;
  font-size: 14px;
  font-weight: 400;
  line-height: 1;
  box-shadow: 0 8px 16px rgba(47, 155, 106, 0.28);
}

.editor .save-btn.arco-btn:hover {
  background: #3cb87e;
  color: #fff;
}

.editor .export-btn.arco-btn {
  display: flex;
  height: 42px;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  border: 1px solid rgba(36, 90, 58, 0.18);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  color: #24382c;
  font-size: 14px;
  font-weight: 400;
  line-height: 1;
  box-shadow: none;
}

.editor .kind-btn.arco-btn:hover {
  border-color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.55);
  color: #24382c;
}

.editor .kind-btn.arco-btn.is-on:hover {
  border-color: transparent;
  background: #e5f4eb;
  color: #24382c;
}

.editor .tool-btn.arco-btn:hover {
  border-color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.65);
  color: #24382c;
}

.editor .help-btn.arco-btn:hover {
  border-color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.7);
}

.editor .fold-btn.arco-btn:hover {
  border-color: transparent;
  background: transparent;
  color: #5a7264;
}

.editor .chip-btn.arco-btn:hover {
  border-color: rgba(36, 90, 58, 0.22);
  background: transparent;
  color: #1a2e24;
}

.editor .chip-btn.is-quiet.arco-btn:hover {
  border-color: rgba(36, 90, 58, 0.12);
  color: #5a7264;
}

.editor .icon-btn.arco-btn:hover,
.editor .export-btn.arco-btn:hover {
  border-color: rgba(36, 90, 58, 0.12);
  background: rgba(255, 255, 255, 0.7);
  color: #24382c;
}

.editor .export-btn.arco-btn:hover {
  border-color: rgba(36, 90, 58, 0.18);
}

.editor .select-line .arco-trigger-wrapper,
.editor .color-line .arco-trigger-wrapper {
  display: block;
  width: 100%;
}

.editor .color-line {
  min-width: 0;
  flex: 1;
}

.editor .color-swatch {
  display: flex;
  height: 36px;
  width: 100%;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(36, 90, 58, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  padding: 0 10px;
  cursor: pointer;
}

.editor .color-dot {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: 1px solid rgba(36, 90, 58, 0.12);
  border-radius: 2px;
}

.editor .hidden-net.arco-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding-left: 0;
  color: #5a7264;
  font-size: 13px;
}

.editor .hidden-net .arco-checkbox-icon {
  width: 14px;
  height: 14px;
  border-color: rgba(36, 90, 58, 0.22);
  border-radius: 3px;
}

.editor .hidden-net.arco-checkbox-checked .arco-checkbox-icon {
  background-color: #2f9b6a;
  border-color: #2f9b6a;
}

.editor .arco-upload {
  display: inline-flex;
  line-height: 1;
}

.editor-pop.arco-popover-popup-content {
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 10px 30px rgba(36, 90, 58, 0.12);
  color: #5a7264;
  font-size: 13px;
  line-height: 1.5;
}

.editor-pop.is-help.arco-popover-popup-content {
  width: 240px;
  padding: 12px;
}

.editor-pop.is-more.arco-popover-popup-content {
  width: 220px;
  padding: 10px;
}

.editor-pop-arrow {
  display: none;
}

.editor-pop .menu-btn.arco-btn {
  display: flex;
  width: 100%;
  height: 32px;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 4px;
  padding: 0 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #1a2e24;
  font-size: 13px;
  font-weight: 400;
  line-height: 32px;
  text-align: left;
  box-shadow: none;
}

.editor-pop .menu-btn.arco-btn:last-child {
  margin-bottom: 0;
}

.editor-pop .menu-btn.arco-btn:hover {
  background: #e5f4eb;
  color: #1a2e24;
}

.editor-dropdown.arco-select-dropdown,
.editor-dropdown .arco-select-dropdown {
  border: 1px solid rgba(36, 90, 58, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 10px 30px rgba(36, 90, 58, 0.12);
}

.editor-dropdown .arco-select-option,
.editor-dropdown.arco-select-dropdown .arco-select-option {
  color: #1a2e24;
  font-size: 14px;
  background: transparent;
}

.editor-dropdown .arco-select-option-selected,
.editor-dropdown .arco-select-option-active,
.editor-dropdown.arco-select-dropdown .arco-select-option-selected,
.editor-dropdown.arco-select-dropdown .arco-select-option-active {
  color: #1a2e24;
  background: #e5f4eb;
}
</style>
