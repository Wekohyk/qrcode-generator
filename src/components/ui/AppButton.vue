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
    class="inline-flex h-36px items-center justify-center gap-8px rounded-12px px-14px text-14px font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40"
    :class="{
      'bg-accent text-white hover:bg-accent-hover': variant === 'primary',
      'border border-border-strong bg-white/55 text-text-primary backdrop-blur-xl hover:bg-bg-overlay':
        variant === 'ghost',
      'border border-danger bg-white/55 text-danger hover:bg-bg-overlay':
        variant === 'danger',
    }"
  >
    <slot />
  </button>
</template>
