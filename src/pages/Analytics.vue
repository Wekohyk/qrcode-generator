<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fetchLiveStats } from '@/api/live';
import { useCodesStore } from '@/store/modules/codes';
import type { ScanSource } from '@/types/code';

const codes = useCodesStore();
const day = 86_400_000;
const remoteTotal = ref(0);
const remoteEvents = ref<{ at: number; source: ScanSource }[]>([]);

function sourceOf(ua: string | null): ScanSource {
  const agent = (ua || '').toLowerCase();
  if (agent.includes('micromessenger')) return 'wechat';
  return 'direct';
}

onMounted(async () => {
  const events: { at: number; source: ScanSource }[] = [];
  let total = 0;
  await Promise.all(
    codes.items
      .filter(item => item.remoteId)
      .map(async item => {
        try {
          const stats = await fetchLiveStats(item.remoteId || '');
          total += stats.total;
          stats.recent.forEach(row => {
            const at = Date.parse(`${row.ts.replace(' ', 'T')}Z`);
            events.push({
              at: Number.isNaN(at) ? Date.now() : at,
              source: sourceOf(row.ua),
            });
          });
        } catch {
          return;
        }
      }),
  );
  remoteTotal.value = total;
  remoteEvents.value = events;
});

const localScans = computed(() =>
  codes.items.filter(item => !item.remoteId).flatMap(item => item.scans),
);

const summary = computed(() => {
  const live = codes.items.filter(item => item.mode === 'live').length;
  return [
    { label: '全部码', value: codes.items.length },
    { label: '活码', value: live },
    { label: '累计打开', value: remoteTotal.value + localScans.value.length },
  ];
});

const days = computed(() => {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const start = startDate.getTime() - 6 * day;
  const buckets = Array.from({ length: 7 }, (_, index) => {
    const at = start + index * day;
    const date = new Date(at);
    return {
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      count: 0,
    };
  });
  [...localScans.value, ...remoteEvents.value].forEach(scan => {
    if (scan.at < start) return;
    const index = Math.floor((scan.at - start) / day);
    const bucket = buckets[index];
    if (bucket) bucket.count += 1;
  });
  const max = Math.max(...buckets.map(item => item.count), 1);
  return buckets.map(item => ({
    ...item,
    height: `${Math.max(4, Math.round((item.count / max) * 96))}px`,
  }));
});

const weekTotal = computed(() =>
  days.value.reduce((sum, item) => sum + item.count, 0),
);

const sources = computed(() => {
  const tally: Record<ScanSource, number> = { direct: 0, wechat: 0, other: 0 };
  [...localScans.value, ...remoteEvents.value].forEach(scan => {
    tally[scan.source] += 1;
  });
  const total = tally.direct + tally.wechat + tally.other;
  return [
    { label: '直接打开', count: tally.direct },
    { label: '微信', count: tally.wechat },
    { label: '其他来源', count: tally.other },
  ].map(item => ({
    ...item,
    ratio: total ? `${Math.round((item.count / total) * 100)}%` : '0%',
  }));
});
</script>

<template>
  <div class="h-full overflow-y-auto px-24px py-20px">
    <h1 class="text-20px font-semibold">数据</h1>
    <p class="mt-6px max-w-520px text-14px text-text-secondary">
      活码打开次数来自短链服务。静态码不经过短链，没有扫码数。
    </p>
    <div class="mt-20px grid gap-12px sm:grid-cols-3">
      <div
        v-for="item in summary"
        :key="item.label"
        class="panel px-16px py-14px"
      >
        <p class="text-12px text-text-secondary">{{ item.label }}</p>
        <p class="mt-8px text-28px font-semibold">{{ item.value }}</p>
      </div>
    </div>
    <section class="panel mt-16px px-16px py-16px">
      <div class="mb-16px flex items-center justify-between">
        <h2 class="text-14px font-medium">近 7 日</h2>
        <span class="text-12px text-text-muted">{{ weekTotal }} 次</span>
      </div>
      <div class="flex h-140px items-end gap-8px">
        <div
          v-for="item in days"
          :key="item.label"
          class="flex h-full flex-1 flex-col items-center justify-end gap-6px"
        >
          <span class="text-12px text-text-muted">{{ item.count || '' }}</span>
          <div
            class="w-full rounded-t-4px"
            :class="item.count ? 'bg-accent' : 'bg-border-strong'"
            :style="{ height: item.height }"
          />
          <span class="text-12px text-text-muted">{{ item.label }}</span>
        </div>
      </div>
    </section>
    <section class="panel mt-16px px-16px py-8px">
      <h2 class="px-0 py-8px text-14px font-medium">来源</h2>
      <div
        v-for="item in sources"
        :key="item.label"
        class="flex h-44px items-center justify-between border-t border-border-subtle text-14px"
      >
        <span>{{ item.label }}</span>
        <span class="text-text-secondary">
          {{ item.count }} · {{ item.ratio }}
        </span>
      </div>
    </section>
  </div>
</template>
