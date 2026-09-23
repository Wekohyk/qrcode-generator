<script setup lang="ts">
import { ref } from 'vue';
import { useSettingsStore } from '@/store/modules/settings';
import { readImageFile } from '@/utils/image';
import AppButton from '@/components/ui/AppButton.vue';
import Field from '@/components/ui/Field.vue';

const settings = useSettingsStore();
const message = ref('');
const fileRef = ref<HTMLInputElement | null>(null);

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    settings.brandLogo = await readImageFile(file);
    message.value = '已更新品牌标记';
  } catch (error) {
    message.value = error instanceof Error ? error.message : '图片读取失败';
  }
}
</script>

<template>
  <div class="h-full overflow-y-auto px-24px py-20px">
    <h1 class="text-20px font-semibold">设置</h1>
    <p class="mt-6px text-14px text-text-secondary">
      显示名出现在工作台。品牌标记可放进新码。
    </p>
    <div class="panel mt-20px max-w-420px px-16px py-16px">
      <Field label="显示名">
        <input
          v-model="settings.displayName"
          class="field"
          maxlength="24"
          placeholder="你的名字"
        />
      </Field>
      <div>
        <span class="mb-6px block text-12px text-text-secondary">品牌标记</span>
        <div class="flex items-center gap-12px">
          <div
            class="flex h-48px w-48px items-center justify-center overflow-hidden rounded-8px border border-border-subtle bg-bg-overlay"
          >
            <img
              v-if="settings.brandLogo"
              :src="settings.brandLogo"
              alt=""
              class="h-full w-full object-cover"
            />
            <span v-else class="text-12px text-text-muted">无</span>
          </div>
          <AppButton variant="ghost" @click="fileRef?.click()">上传</AppButton>
          <AppButton
            v-if="settings.brandLogo"
            variant="ghost"
            @click="settings.brandLogo = ''"
          >
            移除
          </AppButton>
        </div>
        <p v-if="message" class="mt-8px text-12px text-text-secondary">
          {{ message }}
        </p>
        <input
          ref="fileRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFile"
        />
      </div>
    </div>
  </div>
</template>
