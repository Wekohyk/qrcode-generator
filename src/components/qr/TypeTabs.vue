<script setup lang="ts">
import { kindList, kindMeta, type QrKind } from '@/types/code';

defineProps<{ modelValue: QrKind }>();
const emit = defineEmits<{ 'update:modelValue': [QrKind] }>();
</script>

<template>
  <div class="flex gap-8px p-12px xl:flex-col">
    <button
      v-for="kind in kindList"
      :key="kind"
      type="button"
      class="shrink-0 rounded-8px border px-12px py-10px text-left transition-colors duration-150 xl:w-full"
      :class="
        modelValue === kind
          ? 'border-accent bg-accent-muted text-accent'
          : 'border-transparent text-text-secondary hover:bg-bg-overlay hover:text-text-primary'
      "
      @click="emit('update:modelValue', kind)"
    >
      <span class="block text-14px font-medium">
        {{ kindMeta[kind].label }}
      </span>
      <span class="mt-2px block text-12px opacity-80">
        {{ kindMeta[kind].hint }}
      </span>
    </button>
  </div>
</template>
