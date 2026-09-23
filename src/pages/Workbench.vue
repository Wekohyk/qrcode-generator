<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCodesStore } from '@/store/modules/codes';
import { useSettingsStore } from '@/store/modules/settings';
import { kindList, kindMeta, type QrKind } from '@/types/code';
import { previewPayload } from '@/utils/payload';
import QrThumb from '@/components/qr/QrThumb.vue';

const router = useRouter();
const codes = useCodesStore();
const settings = useSettingsStore();
const recent = computed(() => codes.sorted.slice(0, 6));

function openKind(kind: QrKind) {
  void router.push({ name: 'code-new', query: { kind } });
}

function payload(id: string) {
  const code = codes.items.find(item => item.id === id);
  if (!code) return '';
  return previewPayload({
    id: code.id,
    kind: code.kind,
    mode: code.mode,
    fields: code.fields,
  });
}
</script>

<template>
  <div class="h-full overflow-y-auto px-24px py-20px">
    <h1 class="text-28px font-semibold">工作台</h1>
    <p class="mt-6px text-14px text-text-secondary">
      {{
        settings.displayName
          ? `${settings.displayName}，选一种内容开始。`
          : '选一种内容，马上生成。'
      }}
    </p>
    <div class="mt-20px grid gap-12px sm:grid-cols-2 xl:grid-cols-5">
      <button
        v-for="kind in kindList"
        :key="kind"
        type="button"
        class="panel px-16px py-14px text-left transition-colors duration-150 hover:border-border-strong"
        @click="openKind(kind)"
      >
        <span class="block text-16px font-medium">
          {{ kindMeta[kind].label }}
        </span>
        <span class="mt-4px block text-12px text-text-secondary">
          {{ kindMeta[kind].hint }}
        </span>
      </button>
    </div>
    <section class="mt-28px">
      <div class="mb-12px flex items-center justify-between">
        <h2 class="text-16px font-medium">最近</h2>
        <RouterLink
          v-if="codes.items.length"
          to="/codes"
          class="text-12px text-text-secondary hover:text-accent"
        >
          全部
        </RouterLink>
      </div>
      <div v-if="!recent.length" class="panel px-16px py-20px">
        <p class="text-14px text-text-secondary">
          还没有码。从上面选一种内容开始。
        </p>
      </div>
      <div v-else class="panel overflow-hidden">
        <RouterLink
          v-for="item in recent"
          :key="item.id"
          :to="`/codes/${item.id}`"
          class="flex h-60px items-center gap-12px border-b border-border-subtle px-16px last:border-b-0 hover:bg-bg-overlay"
        >
          <QrThumb :text="payload(item.id)" :style="item.style" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-14px font-medium">
              {{ item.name }}
            </span>
            <span class="block text-12px text-text-muted">
              {{ kindMeta[item.kind].label }}
            </span>
          </span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
