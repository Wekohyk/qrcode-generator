<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { useCodesStore } from '@/store/modules/codes';
import { kindMeta, statusMeta, type QrCode } from '@/types/code';
import { previewPayload } from '@/utils/payload';
import AppButton from '@/components/ui/AppButton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import QrThumb from '@/components/qr/QrThumb.vue';

const router = useRouter();
const codes = useCodesStore();
const keyword = ref('');
const filter = ref<'all' | 'live' | 'static' | 'paused'>('all');
const selected = ref<string[]>([]);
const notice = ref('');

const filters = [
  { id: 'all', label: '全部' },
  { id: 'live', label: '活码' },
  { id: 'static', label: '静态' },
  { id: 'paused', label: '暂停' },
] as const;

const cols =
  'grid grid-cols-[28px_48px_minmax(0,1fr)_80px_56px_96px] items-center gap-12px px-16px';

const filtered = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  return codes.sorted.filter(item => {
    if (filter.value === 'live' && item.mode !== 'live') return false;
    if (filter.value === 'static' && item.mode !== 'static') return false;
    if (filter.value === 'paused' && item.status !== 'paused') return false;
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
    id: item.id,
    kind: item.kind,
    mode: item.mode,
    fields: item.fields,
  });
}

function liveIds() {
  return selected.value.filter(
    id => codes.items.find(item => item.id === id)?.mode === 'live',
  );
}

function pause() {
  const ids = liveIds();
  if (!ids.length) {
    notice.value = '静态码不能暂停';
    return;
  }
  codes.setStatus(ids, 'paused');
  notice.value = '';
}

function resume() {
  const ids = liveIds();
  if (!ids.length) {
    notice.value = '静态码没有暂停状态';
    return;
  }
  codes.setStatus(ids, 'active');
  notice.value = '';
}

function remove() {
  if (!window.confirm(`删除选中的 ${selected.value.length} 个码？`)) return;
  codes.remove(selected.value);
  selected.value = [];
  notice.value = '';
}
</script>

<template>
  <div class="h-full overflow-y-auto px-24px py-20px">
    <div class="mb-16px flex items-center justify-between gap-12px">
      <h1 class="text-20px font-semibold">我的码</h1>
      <AppButton @click="router.push({ name: 'code-new' })">
        + 新建二维码
      </AppButton>
    </div>
    <div class="mb-12px flex flex-wrap items-center gap-8px">
      <button
        v-for="item in filters"
        :key="item.id"
        type="button"
        class="chip"
        :class="
          filter === item.id
            ? 'border-accent bg-accent-muted text-accent'
            : 'border-border-subtle text-text-secondary'
        "
        @click="filter = item.id"
      >
        {{ item.label }}
      </button>
      <input
        v-model="keyword"
        class="field ml-auto !w-240px"
        placeholder="搜索名称"
      />
    </div>
    <div
      v-if="selected.length"
      class="mb-12px flex flex-wrap items-center gap-8px"
    >
      <span class="text-12px text-text-secondary">
        已选 {{ selected.length }}
      </span>
      <AppButton variant="ghost" @click="pause">暂停</AppButton>
      <AppButton variant="ghost" @click="resume">恢复</AppButton>
      <AppButton variant="danger" @click="remove">删除</AppButton>
      <span v-if="notice" class="text-12px text-warning">{{ notice }}</span>
    </div>
    <div v-if="!codes.items.length" class="panel px-16px">
      <EmptyState
        title="还没有二维码"
        description="新建后会出现在这里。"
        action="新建二维码"
        @action="router.push({ name: 'code-new' })"
      />
    </div>
    <div v-else class="panel">
      <div class="min-w-720px">
        <div
          :class="cols"
          class="sticky top-0 z-10 h-40px border-b border-border-subtle bg-bg-raised text-12px text-text-muted"
        >
          <input
            :checked="allChecked"
            type="checkbox"
            class="accent-[#22D3EE]"
            @change="toggleAll"
          />
          <span />
          <span>名称</span>
          <span>状态</span>
          <span>扫码</span>
          <span>更新</span>
        </div>
        <p
          v-if="!filtered.length"
          class="px-16px py-20px text-14px text-text-secondary"
        >
          没有符合条件的码
        </p>
        <div
          v-for="item in filtered"
          :key="item.id"
          :class="cols"
          class="h-60px border-b border-border-subtle last:border-b-0"
        >
          <input
            :checked="selected.includes(item.id)"
            type="checkbox"
            class="accent-[#22D3EE]"
            @change="toggle(item.id)"
          />
          <QrThumb :text="payloadOf(item)" :style="item.style" />
          <div class="min-w-0">
            <RouterLink
              :to="`/codes/${item.id}`"
              class="block truncate text-14px font-medium hover:text-accent"
            >
              {{ item.name }}
            </RouterLink>
            <p class="text-12px text-text-muted">
              {{ kindMeta[item.kind].label }}
            </p>
          </div>
          <span
            class="inline-flex items-center gap-6px text-12px text-text-secondary"
          >
            <i
              class="h-6px w-6px rounded-full"
              :class="statusMeta(item.status).dot"
            />
            {{ statusMeta(item.status).label }}
          </span>
          <span class="text-12px text-text-secondary">
            {{ item.scans.length }}
          </span>
          <span class="text-12px text-text-muted">
            {{ dayjs(item.updatedAt).format('MM-DD HH:mm') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
