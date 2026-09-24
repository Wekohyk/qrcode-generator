<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import Icon from '@/components/Icon.vue';
import CommandPalette from '@/components/CommandPalette.vue';

const route = useRoute();
const paletteOpen = ref(false);

const nav = [
  { to: '/', label: '工作台', icon: 'home' },
  { to: '/codes', label: '我的码', icon: 'grid' },
  { to: '/templates', label: '模板', icon: 'templates' },
  { to: '/analytics', label: '数据', icon: 'analytics' },
  { to: '/settings', label: '设置', icon: 'settings' },
] as const;

function active(path: string) {
  if (path === '/') return route.path === '/';
  return route.path === path || route.path.startsWith(`${path}/`);
}

function onKey(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    paletteOpen.value = !paletteOpen.value;
  }
}

onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <div
    class="page flex h-screen gap-14px p-16px bg-[url(/images/background_image.webp)] bg-cover bg-no-repeat bg-center"
  >
    <aside
      class="panel relative flex w-228px shrink-0 flex-col overflow-hidden px-18px py-22px"
    >
      <svg
        class="pointer-events-none absolute left-0 top-0 h-92px w-92px text-[#c4a574]"
        viewBox="0 0 92 92"
        fill="none"
        stroke="currentColor"
        stroke-width="1.2"
        aria-hidden="true"
      >
        <path d="M10 46C18 28 32 16 54 12" />
        <path d="M16 34c12-2 18 8 14 18" />
        <path d="M28 18c4 12 2 20-8 24" />
        <path d="M22 26c8 2 12 8 8 14" />
      </svg>
      <svg
        class="pointer-events-none absolute bottom--15px right-8px h-80px w-70px text-[#c4a574] rotate-270"
        viewBox="0 0 70 80"
        fill="none"
        stroke="currentColor"
        stroke-width="1.15"
        aria-hidden="true"
      >
        <path d="M64 70C40 62 28 46 22 18" />
        <path d="M58 74c-4-16-12-24-26-28" />
        <path d="M48 58c-8 6-16 4-18-6" />
      </svg>

      <RouterLink to="/" class="relative z-1 mt-8px flex flex-col items-center">
        <span class="relative inline-block">
          <span
            class="font-script text-64px leading-none text-[#1c4d34] font-900"
          >
            Wk
          </span>
        </span>
        <span
          class="font-serif mt-2px text-15px tracking-wide text-[#1c4d34] font-600"
        >
          Weko QR Code
        </span>
        <span class="mt-10px h-1px w-64px bg-[#c4a574]" />
      </RouterLink>

      <nav class="relative z-1 mt-18px flex flex-col gap-4px">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex h-42px items-center gap-10px rounded-12px px-14px text-14px text-[#24382c] transition-colors duration-200 hover:bg-#e5f4eb',
            active(item.to) &&
              'bg-[#e5f4eb] font-medium text-[#1f6b48] hover:bg-[#e5f4eb]',
          ]"
        >
          <Icon :name="item.icon" />
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>
    <main class="min-w-0 flex-1">
      <router-view />
    </main>
    <CommandPalette v-model:open="paletteOpen" />
  </div>
</template>
