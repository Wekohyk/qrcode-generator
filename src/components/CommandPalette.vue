<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCodesStore } from '@/store/modules/codes';
import { kindMeta } from '@/types/code';

const open = defineModel<boolean>('open', { required: true });
const router = useRouter();
const codes = useCodesStore();
const query = ref('');
const active = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);

const pages = [
  { label: '工作台', hint: '页面', to: '/' },
  { label: '我的码', hint: '页面', to: '/codes' },
  { label: '新建二维码', hint: '页面', to: '/codes/new' },
  { label: '模板库', hint: '页面', to: '/templates' },
  { label: '数据', hint: '页面', to: '/analytics' },
  { label: '设置', hint: '页面', to: '/settings' },
];

const items = computed(() => {
  const keyword = query.value.trim().toLowerCase();
  const pageHits = pages.filter(item =>
    item.label.toLowerCase().includes(keyword),
  );
  const codeHits = codes.sorted
    .filter(item => {
      const label = `${item.name} ${kindMeta[item.kind].label}`.toLowerCase();
      return !keyword || label.includes(keyword);
    })
    .slice(0, 6)
    .map(item => ({
      label: item.name,
      hint: kindMeta[item.kind].label,
      to: `/codes/${item.id}`,
    }));
  if (!keyword) return [...pageHits, ...codeHits];
  return [...pageHits, ...codeHits].slice(0, 12);
});

watch(open, value => {
  if (!value) return;
  query.value = '';
  active.value = 0;
  void nextTick(() => inputRef.value?.focus());
});

watch(items, list => {
  if (active.value > list.length - 1) active.value = 0;
});

function close() {
  open.value = false;
}

function go(to: string) {
  close();
  void router.push(to);
}

function onKey(event: KeyboardEvent) {
  if (!open.value) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    close();
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    active.value = Math.min(active.value + 1, items.value.length - 1);
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    active.value = Math.max(active.value - 1, 0);
  }
  if (event.key === 'Enter') {
    const item = items.value[active.value];
    if (!item) return;
    event.preventDefault();
    go(item.to);
  }
}

onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-40 flex items-start justify-center bg-[rgba(0,0,0,0.55)] px-16px pt-[15vh]"
    @click.self="close"
  >
    <div class="panel w-full max-w-520px overflow-hidden">
      <input
        ref="inputRef"
        v-model="query"
        class="w-full border-b border-border-subtle bg-transparent px-16px py-14px text-14px text-text-primary outline-none placeholder:text-text-muted"
        placeholder="搜索页面或二维码"
      />
      <div class="max-h-320px overflow-y-auto p-8px">
        <p
          v-if="!items.length"
          class="px-8px py-16px text-12px text-text-muted"
        >
          没有匹配项
        </p>
        <button
          v-for="(item, index) in items"
          :key="`${item.to}-${item.label}`"
          type="button"
          class="flex w-full items-center justify-between rounded-8px px-10px py-8px text-left text-14px"
          :class="
            index === active
              ? 'bg-accent-muted text-accent'
              : 'text-text-primary hover:bg-bg-overlay'
          "
          @mouseenter="active = index"
          @click="go(item.to)"
        >
          <span class="truncate">{{ item.label }}</span>
          <span class="ml-12px shrink-0 text-12px text-text-muted">
            {{ item.hint }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
