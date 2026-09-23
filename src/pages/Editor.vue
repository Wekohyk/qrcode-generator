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
import { contentError, previewPayload } from '@/utils/payload';
import {
  createLiveCode,
  patchLiveCode,
  toLivePayload,
  toLiveType,
} from '@/api/live';
import { downloadQr } from '@/composables/useQr';
import { readImageFile } from '@/utils/image';
import AppButton from '@/components/ui/AppButton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import Field from '@/components/ui/Field.vue';
import ArtFrame from '@/components/ornament/ArtFrame.vue';
import Preview from '@/components/qr/Preview.vue';
import StylePicker from '@/components/qr/StylePicker.vue';
import TypeTabs from '@/components/qr/TypeTabs.vue';

const route = useRoute();
const router = useRouter();
const codes = useCodesStore();
const settings = useSettingsStore();

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

function chipClass(on: boolean) {
  return on
    ? 'border-accent bg-accent-muted text-accent'
    : 'border-border-subtle text-text-secondary';
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
  <div v-if="missing" class="h-full overflow-y-auto px-24px py-20px">
    <EmptyState
      title="找不到这个码"
      description="它可能已经删除。"
      action="返回列表"
      @action="router.push({ name: 'codes' })"
    />
  </div>
  <div
    v-else
    class="h-full overflow-y-auto xl:grid xl:grid-cols-[188px_minmax(0,1fr)_320px] xl:overflow-hidden"
  >
    <aside class="border-border-subtle xl:overflow-y-auto xl:border-r">
      <TypeTabs :model-value="draft.kind" @update:model-value="onKind" />
    </aside>
    <section class="flex items-center justify-center px-24px py-28px">
      <div
        class="panel relative flex w-full max-w-360px flex-col items-center px-28px py-28px"
      >
        <ArtFrame />
        <Preview :text="payload" :style="draft.style" />
        <p
          class="mt-16px max-w-280px break-all text-center text-12px text-text-muted"
        >
          {{ payload || '填写内容后，这里会显示码里的文字' }}
        </p>
        <p v-if="liveFixed" class="mt-8px text-center text-12px text-accent">
          活码地址已固定，改内容不会改变这张图
        </p>
        <p
          v-else-if="isLive(draft.kind, draft.mode)"
          class="mt-8px text-center text-12px text-warning"
        >
          保存后会生成固定短链，请再下载一次
        </p>
      </div>
    </section>
    <aside
      class="flex flex-col border-border-subtle bg-bg-raised backdrop-blur-xl xl:min-h-0 xl:border-l"
    >
      <div class="xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
        <section class="border-b border-border-subtle px-20px py-16px">
          <div class="mb-12px flex items-center justify-between">
            <h2 class="text-12px text-text-muted">内容</h2>
            <button
              v-if="current?.mode === 'live'"
              type="button"
              class="text-12px text-text-secondary hover:text-text-primary"
              @click="togglePause"
            >
              {{ current.status === 'paused' ? '恢复访问' : '暂停访问' }}
            </button>
          </div>
          <p
            v-if="current?.status === 'paused'"
            class="mb-12px text-12px text-warning"
          >
            此码已暂停，打开地址不会显示内容。
          </p>
          <Field label="名称">
            <input
              v-model="draft.name"
              class="field"
              placeholder="不填会自动生成"
            />
          </Field>
          <Field v-if="draft.kind === 'url'" label="网址">
            <input
              v-model="draft.fields.url"
              class="field"
              placeholder="example.com"
            />
          </Field>
          <Field v-else-if="draft.kind === 'text'" label="文本">
            <textarea
              v-model="draft.fields.text"
              class="field min-h-120px"
              placeholder="要展示的文字"
            />
          </Field>
          <template v-else-if="draft.kind === 'vcard'">
            <Field label="姓名">
              <input v-model="draft.fields.fullName" class="field" />
            </Field>
            <Field label="公司">
              <input v-model="draft.fields.org" class="field" />
            </Field>
            <Field label="职位">
              <input v-model="draft.fields.title" class="field" />
            </Field>
            <Field label="电话">
              <input v-model="draft.fields.phone" class="field" />
            </Field>
            <Field label="邮箱">
              <input v-model="draft.fields.email" class="field" />
            </Field>
            <Field label="网址">
              <input
                v-model="draft.fields.site"
                class="field"
                placeholder="example.com"
              />
            </Field>
          </template>
          <template v-else-if="draft.kind === 'wifi'">
            <Field label="网络名称">
              <input v-model="draft.fields.ssid" class="field" />
            </Field>
            <Field label="加密">
              <select v-model="draft.fields.encryption" class="field">
                <option value="WPA">WPA / WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">无密码</option>
              </select>
            </Field>
            <Field label="密码">
              <input
                v-model="draft.fields.password"
                class="field"
                :disabled="draft.fields.encryption === 'nopass'"
              />
            </Field>
            <label
              class="mb-14px flex items-center gap-8px text-14px text-text-secondary"
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
            <Field label="标题">
              <input v-model="draft.fields.richTitle" class="field" />
            </Field>
            <Field label="正文">
              <textarea
                v-model="draft.fields.richBody"
                class="field min-h-120px"
              />
            </Field>
            <div class="mb-14px">
              <span class="mb-6px block text-12px text-text-secondary">
                配图
              </span>
              <div class="flex items-center gap-8px">
                <button
                  type="button"
                  class="chip border-border-strong text-text-primary"
                  @click="richFile?.click()"
                >
                  上传
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
                class="mt-8px max-h-120px rounded-8px border border-border-subtle"
              />
              <p v-if="imageError" class="mt-8px text-12px text-danger">
                {{ imageError }}
              </p>
              <input
                ref="richFile"
                type="file"
                accept="image/*"
                class="hidden"
                @change="onRichImage"
              />
            </div>
          </template>
          <div
            v-if="draft.kind === 'rich'"
            class="text-12px text-text-secondary"
          >
            图文保存在短链后面。二维码只含固定地址，改内容不用换图。
          </div>
          <div v-else>
            <div class="mb-8px flex gap-8px">
              <button
                type="button"
                class="chip"
                :class="chipClass(draft.mode === 'static')"
                @click="draft.mode = 'static'"
              >
                静态码
              </button>
              <button
                type="button"
                class="chip"
                :class="chipClass(draft.mode === 'live')"
                @click="draft.mode = 'live'"
              >
                活码
              </button>
            </div>
            <p class="text-12px text-text-muted">
              {{
                draft.mode === 'live'
                  ? '保存后地址固定，内容可以再改。'
                  : '内容直接印在码里，改内容需要重新发图。'
              }}
            </p>
          </div>
        </section>
        <StylePicker v-model="draft.style" :brand-logo="settings.brandLogo" />
        <section class="px-20px py-16px">
          <h2 class="mb-12px text-12px text-text-muted">导出</h2>
          <div class="flex flex-col gap-8px">
            <AppButton variant="ghost" :disabled="!payload" @click="download">
              下载 PNG
            </AppButton>
            <AppButton
              v-if="showLiveAddress"
              variant="ghost"
              @click="copyAddress"
            >
              {{ copied ? '已复制' : '复制活码地址' }}
            </AppButton>
          </div>
        </section>
      </div>
      <div class="border-t border-border-subtle px-20px py-12px">
        <p v-if="error" class="mb-8px text-12px text-danger">{{ error }}</p>
        <p v-else-if="savedHint" class="mb-8px text-12px text-success">
          已保存
        </p>
        <AppButton class="w-full" @click="save">保存</AppButton>
      </div>
    </aside>
  </div>
</template>
