<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';

defineProps<{
  title: string;
  description?: string;
  action?: string;
}>();

defineEmits<{ action: [] }>();
</script>

<template>
  <div class="flex flex-col items-start gap-8px py-28px">
    <svg
      viewBox="0 0 32 32"
      class="h-28px w-28px text-accent-deep"
      fill="none"
      stroke="currentColor"
      stroke-width="1.25"
      aria-hidden="true"
    >
      <path
        d="M16 28c6-4 10-9 10-14a8 8 0 0 0-15-3.5A6 6 0 0 0 8 16c0 2 .7 3.6 1.8 5C7.2 22 6 24 6 26c0 1.2 1.4 2 4 2 2.2 0 4.2-.6 6-2z"
      />
      <path d="M16 28V12" />
    </svg>
    <p class="text-14px text-text-primary">{{ title }}</p>
    <p v-if="description" class="text-12px text-text-secondary">
      {{ description }}
    </p>
    <AppButton v-if="action" class="mt-8px" @click="$emit('action')">
      {{ action }}
    </AppButton>
  </div>
</template>
