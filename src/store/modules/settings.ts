import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    displayName: '',
    brandLogo: '',
    sidebarCollapsed: false,
  }),
  persist: true,
});
