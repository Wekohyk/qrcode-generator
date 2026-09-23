<script setup lang="ts">
import { useRouter } from 'vue-router';
import { kindList, kindMeta, styleTemplates, type QrKind } from '@/types/code';

const router = useRouter();

function openKind(kind: QrKind) {
  void router.push({ name: 'code-new', query: { kind } });
}

function openTemplate(id: string) {
  void router.push({
    name: 'code-new',
    query: { kind: 'url', template: id },
  });
}
</script>

<template>
  <div class="h-full overflow-y-auto px-24px py-20px">
    <h1 class="text-20px font-semibold">模板库</h1>
    <p class="mt-6px text-14px text-text-secondary">
      先选类型，或套用一套样式。
    </p>
    <section class="mt-20px">
      <h2 class="mb-12px text-12px text-text-muted">类型</h2>
      <div class="grid gap-12px sm:grid-cols-2 xl:grid-cols-5">
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
    </section>
    <section class="mt-28px">
      <h2 class="mb-12px text-12px text-text-muted">样式</h2>
      <div class="grid gap-12px md:grid-cols-3">
        <button
          v-for="item in styleTemplates"
          :key="item.id"
          type="button"
          class="panel px-16px py-14px text-left transition-colors duration-150 hover:border-border-strong"
          @click="openTemplate(item.id)"
        >
          <span class="block text-16px font-medium">{{ item.name }}</span>
          <span class="mt-4px block text-12px text-text-secondary">
            {{ item.description }}
          </span>
        </button>
      </div>
    </section>
  </div>
</template>
