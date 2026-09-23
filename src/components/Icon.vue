<script setup lang="ts">
defineProps<{
  name: 'grid' | 'codes' | 'templates' | 'analytics' | 'settings' | 'search';
}>();
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    class="h-16px w-16px shrink-0"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      v-if="name === 'grid'"
      d="M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z"
    />
    <path
      v-else-if="name === 'codes'"
      d="M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h2.5M17.5 16.5V19H14M17 14h2v2"
    />
    <path
      v-else-if="name === 'templates'"
      d="M4 5h16v14H4zM4 9.5h16M9.5 9.5V19"
    />
    <path
      v-else-if="name === 'analytics'"
      d="M4 19h16M7 16V11M12 16V7M17 16v-4"
    />
    <path
      v-else-if="name === 'settings'"
      d="M4 8h16M4 16h16M9 8a1.75 1.75 0 1 0 0.01 0M15 16a1.75 1.75 0 1 0 0.01 0"
    />
    <path v-else d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM20 20l-3.2-3.2" />
  </svg>
</template>
