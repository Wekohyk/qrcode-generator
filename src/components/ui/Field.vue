<script setup lang="ts">
defineProps<{ label: string }>();
</script>

<template>
  <label class="mb-14px block">
    <span class="mb-6px block text-12px text-text-secondary">{{ label }}</span>
    <slot />
  </label>
</template>
