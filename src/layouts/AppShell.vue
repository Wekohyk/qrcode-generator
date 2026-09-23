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

const crumb = computed(() => route.meta.title || '墨码');

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
  <div class="flex h-screen overflow-hidden bg-bg-base text-text-primary">
    <aside
      class="flex shrink-0 flex-col overflow-hidden border-r border-border-subtle bg-bg-raised transition-[width] duration-200"
      :class="settings.sidebarCollapsed ? 'w-56px' : 'w-220px'"
    >
      <div
        class="flex h-56px items-center gap-10px border-b border-border-subtle"
        :class="settings.sidebarCollapsed ? 'justify-center px-0' : 'px-16px'"
      >
        <span
          class="grid h-16px w-16px shrink-0 grid-cols-2 gap-2px"
          aria-hidden="true"
        >
          <i class="bg-text-primary" />
          <i class="bg-text-primary" />
          <i class="bg-accent" />
          <i class="bg-text-primary" />
        </span>
        <span v-if="!settings.sidebarCollapsed" class="text-16px font-semibold">
          墨码
        </span>
      </div>
      <nav class="flex-1 py-12px">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :title="item.label"
          class="mx-8px mb-4px flex h-40px items-center gap-10px rounded-8px text-14px text-text-secondary transition-colors duration-150 hover:bg-bg-overlay hover:text-text-primary"
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
        class="mx-8px mb-12px flex h-36px items-center rounded-8px text-12px text-text-muted hover:bg-bg-overlay hover:text-text-secondary"
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
          class="flex items-center gap-8px rounded-8px border border-border-subtle bg-bg-raised px-10px py-6px text-12px text-text-muted hover:border-border-strong hover:text-text-secondary"
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
