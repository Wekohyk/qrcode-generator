<script setup lang="ts">
defineProps<{
  name:
    | 'grid'
    | 'home'
    | 'codes'
    | 'templates'
    | 'analytics'
    | 'settings'
    | 'search';
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
    <path v-if="name === 'home'" d="M4 11.5 12 5l8 6.5V20h-5.5v-5.5h-5V20H4z" />
    <path
      v-else-if="name === 'grid'"
      d="M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z"
    />
    <path
      v-else-if="name === 'codes'"
      d="M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h2.5M17.5 16.5V19H14M17 14h2v2"
    />
    <path v-else-if="name === 'templates'" d="M7 7h10M5 12h14M8 17h8" />
    <path
      v-else-if="name === 'analytics'"
      d="M4 19h16M7 16V11M12 16V7M17 16v-4"
    />
    <path
      v-else-if="name === 'settings'"
      d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM12 4.5v1.8M12 17.7V19.5M4.5 12h1.8M17.7 12h1.8M6.7 6.7l1.3 1.3M16 16l1.3 1.3M17.3 6.7 16 8M8 16l-1.3 1.3"
    />
    <path v-else d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM20 20l-3.2-3.2" />
  </svg>
</template>
