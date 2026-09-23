<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'ghost' | 'danger';
    type?: 'button' | 'submit';
    disabled?: boolean;
  }>(),
  {
    variant: 'primary',
    type: 'button',
    disabled: false,
  },
);
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex h-36px items-center justify-center gap-8px rounded-8px px-14px text-14px font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40"
    :class="{
      'bg-accent text-bg-base hover:bg-accent-hover': variant === 'primary',
      'border border-border-strong bg-transparent text-text-primary hover:bg-bg-overlay':
        variant === 'ghost',
      'border border-danger bg-transparent text-danger hover:bg-bg-overlay':
        variant === 'danger',
    }"
  >
    <slot />
  </button>
</template>
