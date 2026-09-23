<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { fetchLiveStats } from '@/api/live';
import { useCodesStore } from '@/store/modules/codes';
import { kindMeta, type QrCode, type QrKind } from '@/types/code';
import { previewPayload } from '@/utils/payload';
import EmptyState from '@/components/ui/EmptyState.vue';
import QrThumb from '@/components/qr/QrThumb.vue';

const router = useRouter();
const codes = useCodesStore();
const keyword = ref('');
const selected = ref<string[]>([]);
const notice = ref('');
const remoteCounts = ref<Record<string, number>>({});
const createOpen = ref(false);
const menuId = ref('');

const createKinds: { id: QrKind; label: string }[] = [
  { id: 'url', label: 'URL' },
  { id: 'text', label: '文本' },
  { id: 'vcard', label: '名片' },
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'rich', label: '图文活码' },
];

onMounted(async () => {
  await Promise.all(
    codes.items
      .filter(item => item.remoteId)
      .map(async item => {
        try {
          const stats = await fetchLiveStats(item.remoteId || '');
          remoteCounts.value = {
            ...remoteCounts.value,
            [item.id]: stats.total,
          };
        } catch {
          return;
        }
      }),
  );
});

const cols =
  'grid grid-cols-[28px_minmax(150px,1.6fr)_84px_92px_148px_88px_minmax(72px,1fr)_128px] items-center gap-8px px-12px';

const filtered = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  return codes.sorted.filter(item => {
    if (!q) return true;
    return `${item.name} ${kindMeta[item.kind].label}`
      .toLowerCase()
      .includes(q);
  });
});

const allChecked = computed(
  () =>
    filtered.value.length > 0 &&
    filtered.value.every(item => selected.value.includes(item.id)),
);

function toggleAll() {
  selected.value = allChecked.value ? [] : filtered.value.map(item => item.id);
}

function toggle(id: string) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter(item => item !== id)
    : [...selected.value, id];
}

function payloadOf(item: QrCode) {
  return previewPayload({
    scanUrl: item.scanUrl,
    kind: item.kind,
    mode: item.mode,
    fields: item.fields,
  });
}

function scansOf(item: QrCode) {
  return remoteCounts.value[item.id] ?? item.scans.length;
}

function liveIds() {
  return selected.value.filter(
    id => codes.items.find(item => item.id === id)?.mode === 'live',
  );
}

async function pause() {
  const ids = liveIds();
  if (!ids.length) {
    notice.value = '静态码不能暂停';
    return;
  }
  try {
    await codes.setStatus(ids, 'paused');
    notice.value = '';
  } catch (reason) {
    notice.value =
      reason instanceof Error ? reason.message : '活码服务没有完成这次请求';
  }
}

async function resume() {
  const ids = liveIds();
  if (!ids.length) {
    notice.value = '静态码没有暂停状态';
    return;
  }
  try {
    await codes.setStatus(ids, 'active');
    notice.value = '';
  } catch (reason) {
    notice.value =
      reason instanceof Error ? reason.message : '活码服务没有完成这次请求';
  }
}

async function remove() {
  if (!window.confirm(`删除选中的 ${selected.value.length} 个码？`)) return;
  await codes.remove(selected.value);
  selected.value = [];
  notice.value = '';
}

function create(kind: QrKind) {
  createOpen.value = false;
  void router.push({ name: 'code-new', query: { kind } });
}

function openItem(item: QrCode) {
  if (item.scanUrl) {
    window.open(item.scanUrl, '_blank', 'noopener');
    return;
  }
  void router.push(`/codes/${item.id}`);
}

async function copyItem(item: QrCode) {
  const text = item.scanUrl || payloadOf(item);
  if (!text) {
    notice.value = '这个码还没有可复制的内容';
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    notice.value = '已复制';
  } catch {
    notice.value = '复制失败';
  }
}

async function removeOne(item: QrCode) {
  menuId.value = '';
  if (!window.confirm(`删除「${item.name}」？`)) return;
  await codes.remove([item.id]);
  selected.value = selected.value.filter(id => id !== item.id);
}

async function toggleOne(item: QrCode) {
  menuId.value = '';
  if (item.mode !== 'live') {
    notice.value = '静态码不能暂停';
    return;
  }
  try {
    await codes.setStatus(
      [item.id],
      item.status === 'paused' ? 'active' : 'paused',
    );
    notice.value = '';
  } catch (reason) {
    notice.value =
      reason instanceof Error ? reason.message : '活码服务没有完成这次请求';
  }
}
</script>

<template>
  <div class="panel flex h-full flex-col overflow-hidden px-22px py-18px">
    <div class="mb-14px flex items-center gap-12px">
      <h1 class="font-serif flex items-center gap-8px text-28px text-[#1c4d34]">
        我的码
        <svg
          class="h-18px w-34px text-[#7eaa8c]"
          viewBox="0 0 34 18"
          fill="currentColor"
          aria-hidden="true"
        >
          <ellipse
            cx="12"
            cy="10"
            rx="5"
            ry="8"
            transform="rotate(-40 12 10)"
          />
          <ellipse cx="22" cy="9" rx="4" ry="7" transform="rotate(25 22 9)" />
        </svg>
      </h1>
      <div class="relative ml-auto w-280px">
        <svg
          class="pointer-events-none absolute left-12px top-1/2 h-14px w-14px -translate-y-1/2 text-text-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4 4" stroke-linecap="round" />
        </svg>
        <input
          v-model="keyword"
          class="field !h-38px !py-0 !pl-34px !pr-32px"
          placeholder="搜索二维码名称或标签"
        />
        <button
          v-if="keyword"
          type="button"
          class="absolute right-8px top-1/2 flex h-22px w-22px -translate-y-1/2 items-center justify-center rounded-full text-text-muted hover:bg-bg-mist"
          aria-label="清除搜索"
          @click="keyword = ''"
        >
          ×
        </button>
      </div>
      <div class="relative">
        <button
          type="button"
          class="flex h-38px items-center gap-6px rounded-full bg-accent px-16px text-14px text-white shadow-[0_8px_16px_rgba(47,155,106,0.28)] hover:bg-accent-hover"
          @click="createOpen = !createOpen"
        >
          + 新建二维码
          <svg
            class="h-12px w-12px"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            aria-hidden="true"
          >
            <path d="M2 4l4 4 4-4" stroke-linecap="round" />
          </svg>
        </button>
        <div
          v-if="createOpen"
          class="absolute right-0 top-44px z-20 w-160px rounded-14px border border-border-glass bg-white/95 p-6px shadow-[0_10px_30px_rgba(36,90,58,0.12)]"
        >
          <button
            v-for="item in createKinds"
            :key="item.id"
            type="button"
            class="block h-34px w-full rounded-10px px-10px text-left text-14px text-text-primary hover:bg-[#e5f4eb]"
            @click="create(item.id)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="selected.length"
      class="mb-10px flex flex-wrap items-center gap-8px text-12px"
    >
      <span class="text-text-secondary">已选 {{ selected.length }}</span>
      <button type="button" class="chip border-border-subtle" @click="pause">
        暂停
      </button>
      <button type="button" class="chip border-border-subtle" @click="resume">
        恢复
      </button>
      <button
        type="button"
        class="chip border-danger text-danger"
        @click="remove"
      >
        删除
      </button>
    </div>
    <p v-if="notice" class="mb-8px text-12px text-accent-deep">{{ notice }}</p>

    <div v-if="!codes.items.length" class="min-h-0 flex-1">
      <EmptyState
        title="还没有二维码"
        description="新建后会出现在这里。"
        action="新建二维码"
        @action="create('url')"
      />
    </div>
    <div v-else class="min-h-0 flex-1 overflow-auto">
      <div class="min-w-920px">
        <div
          :class="cols"
          class="h-40px rounded-12px bg-white/45 text-12px text-text-muted"
        >
          <input
            :checked="allChecked"
            type="checkbox"
            class="accent-[#2F9B6A]"
            @change="toggleAll"
          />
          <span>二维码名称</span>
          <span>类型</span>
          <span>状态</span>
          <span>创建时间</span>
          <span>扫描次数</span>
          <span>标签</span>
          <span>操作</span>
        </div>
        <p
          v-if="!filtered.length"
          class="px-12px py-24px text-14px text-text-secondary"
        >
          没有符合条件的码
        </p>
        <div
          v-for="item in filtered"
          :key="item.id"
          :class="cols"
          class="h-72px border-b border-[rgba(36,90,58,0.08)] last:border-b-0"
        >
          <input
            :checked="selected.includes(item.id)"
            type="checkbox"
            class="accent-[#2F9B6A]"
            @change="toggle(item.id)"
          />
          <div class="flex min-w-0 items-center gap-10px">
            <div class="relative shrink-0">
              <QrThumb :text="payloadOf(item)" :style="item.style" />
              <span
                class="absolute -bottom-6px left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4px text-10px leading-14px shadow-[0_1px_4px_rgba(36,90,58,0.12)]"
                :class="
                  item.mode === 'live' ? 'text-accent' : 'text-text-muted'
                "
              >
                {{ item.mode === 'live' ? '动态' : '静态' }}
              </span>
            </div>
            <RouterLink
              :to="`/codes/${item.id}`"
              class="truncate text-14px font-medium text-[#1a2e24] hover:text-accent"
            >
              {{ item.name }}
            </RouterLink>
          </div>
          <span class="flex items-center gap-6px text-13px text-text-secondary">
            <i
              class="h-6px w-6px rounded-full"
              :class="item.mode === 'live' ? 'bg-accent' : 'bg-text-muted'"
            />
            {{ item.mode === 'live' ? '动态码' : '静态码' }}
          </span>
          <span class="flex items-center gap-6px text-13px text-text-secondary">
            <i
              class="h-7px w-7px rounded-full"
              :class="item.status === 'paused' ? 'bg-[#b7c4bc]' : 'bg-accent'"
            />
            {{ item.status === 'paused' ? '已停用' : '已启用' }}
          </span>
          <span class="text-13px text-text-secondary">
            {{ dayjs(item.createdAt).format('YYYY-MM-DD HH:mm') }}
          </span>
          <span class="flex items-center gap-4px text-13px text-text-secondary">
            {{ scansOf(item).toLocaleString('en-US') }}
            <span class="text-12px text-accent">↑</span>
          </span>
          <span>
            <span
              class="inline-flex rounded-full bg-[#e7f3ec] px-8px py-2px text-12px text-[#3d6b52]"
            >
              {{ kindMeta[item.kind].label }}
            </span>
          </span>
          <div class="relative flex items-center gap-2px text-[#3d5346]">
            <button
              type="button"
              class="flex h-28px w-28px items-center justify-center rounded-8px hover:bg-white/70"
              aria-label="查看"
              @click="openItem(item)"
            >
              <svg
                viewBox="0 0 24 24"
                class="h-15px w-15px"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
              >
                <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            </button>
            <RouterLink
              :to="`/codes/${item.id}`"
              class="flex h-28px w-28px items-center justify-center rounded-8px hover:bg-white/70"
              aria-label="编辑"
            >
              <svg
                viewBox="0 0 24 24"
                class="h-15px w-15px"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
              >
                <path d="M4 20h4l10-10-4-4L4 16z" />
                <path d="M13 7l4 4" />
              </svg>
            </RouterLink>
            <button
              type="button"
              class="flex h-28px w-28px items-center justify-center rounded-8px hover:bg-white/70"
              aria-label="复制"
              @click="copyItem(item)"
            >
              <svg
                viewBox="0 0 24 24"
                class="h-15px w-15px"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
              >
                <rect x="8" y="8" width="11" height="11" rx="2" />
                <path d="M5 15V5h10" />
              </svg>
            </button>
            <button
              type="button"
              class="flex h-28px w-28px items-center justify-center rounded-8px hover:bg-white/70"
              aria-label="更多"
              @click="menuId = menuId === item.id ? '' : item.id"
            >
              <svg
                viewBox="0 0 24 24"
                class="h-15px w-15px"
                fill="currentColor"
              >
                <circle cx="6" cy="12" r="1.3" />
                <circle cx="12" cy="12" r="1.3" />
                <circle cx="18" cy="12" r="1.3" />
              </svg>
            </button>
            <div
              v-if="menuId === item.id"
              class="absolute right-0 top-32px z-20 w-120px rounded-12px border border-border-glass bg-white/95 p-6px shadow-[0_10px_30px_rgba(36,90,58,0.12)]"
            >
              <button
                type="button"
                class="block h-32px w-full rounded-8px px-8px text-left text-13px hover:bg-[#e5f4eb]"
                @click="toggleOne(item)"
              >
                {{ item.status === 'paused' ? '恢复' : '暂停' }}
              </button>
              <button
                type="button"
                class="block h-32px w-full rounded-8px px-8px text-left text-13px text-danger hover:bg-[#fdecec]"
                @click="removeOne(item)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
