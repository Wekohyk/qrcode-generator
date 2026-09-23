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
    <p class="text-14px text-text-primary">{{ title }}</p>
    <p v-if="description" class="text-12px text-text-secondary">
      {{ description }}
    </p>
    <AppButton v-if="action" class="mt-8px" @click="$emit('action')">
      {{ action }}
    </AppButton>
  </div>
</template>
