<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import Icon from '@/components/Icon.vue';
import CommandPalette from '@/components/CommandPalette.vue';
import { useSettingsStore } from '@/store/modules/settings';

const route = useRoute();
const settings = useSettingsStore();
const paletteOpen = ref(false);
const shortcut = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘K' : 'Ctrl K';

const nav = [
  { to: '/', label: '工作台', icon: 'grid' },
  { to: '/codes', label: '我的码', icon: 'codes' },
  { to: '/templates', label: '模板库', icon: 'templates' },
  { to: '/analytics', label: '数据', icon: 'analytics' },
  { to: '/settings', label: '设置', icon: 'settings' },
] as const;

const crumb = computed(() => route.meta.title || 'Weko QR Code');

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
  <div class="page flex h-screen overflow-hidden">
    <aside
      class="flex shrink-0 flex-col overflow-hidden border-r border-border-subtle bg-bg-raised shadow-[8px_0_32px_rgba(36,90,58,0.05)] backdrop-blur-xl transition-[width] duration-200"
      :class="settings.sidebarCollapsed ? 'w-56px' : 'w-220px'"
    >
      <div
        class="flex h-56px items-center gap-10px border-b border-border-subtle"
        :class="settings.sidebarCollapsed ? 'justify-center px-0' : 'px-16px'"
      >
        <svg
          viewBox="0 0 24 24"
          class="h-18px w-18px shrink-0 text-accent"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path
            d="M12 21c4-3 7-6.5 7-10.5A6.5 6.5 0 0 0 6 8c0 1.2.4 2.4 1 3.4C5.2 12 4 13.6 4 15.5 4 18.5 7.5 21 12 21z"
          />
          <path d="M12 21V10" />
        </svg>
        <span v-if="!settings.sidebarCollapsed" class="text-16px font-semibold">
          Weko
        </span>
      </div>
      <nav class="flex-1 py-12px">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :title="item.label"
          class="mx-8px mb-4px flex h-40px items-center gap-10px rounded-12px text-14px text-text-secondary transition-colors duration-200 hover:bg-bg-mist hover:text-text-primary"
          :class="[
            settings.sidebarCollapsed ? 'justify-center px-0' : 'px-10px',
            active(item.to) &&
              'bg-accent-muted text-accent hover:bg-accent-muted hover:text-accent',
          ]"
        >
          <Icon :name="item.icon" />
          <span v-if="!settings.sidebarCollapsed">{{ item.label }}</span>
        </RouterLink>
      </nav>
      <button
        type="button"
        class="mx-8px mb-12px flex h-36px items-center rounded-12px text-12px text-text-muted hover:bg-bg-mist hover:text-text-secondary"
        :class="settings.sidebarCollapsed ? 'justify-center' : 'px-10px'"
        @click="settings.sidebarCollapsed = !settings.sidebarCollapsed"
      >
        {{ settings.sidebarCollapsed ? '›' : '‹ 收起' }}
      </button>
    </aside>
    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="flex h-56px shrink-0 items-center justify-between border-b border-border-subtle px-20px"
      >
        <p class="truncate text-14px text-text-secondary">{{ crumb }}</p>
        <button
          type="button"
          class="flex items-center gap-8px rounded-12px border border-border-subtle bg-white/60 px-10px py-6px text-12px text-text-muted backdrop-blur-xl hover:border-border-strong hover:text-text-secondary"
          @click="paletteOpen = true"
        >
          <Icon name="search" />
          搜索
          <kbd class="rounded-4px border border-border-strong px-4px">
            {{ shortcut }}
          </kbd>
        </button>
      </header>
      <main class="min-h-0 flex-1 overflow-hidden">
        <router-view />
      </main>
    </div>
    <CommandPalette v-model:open="paletteOpen" />
  </div>
</template>
