<script setup lang="ts">
import { ref } from 'vue';
import type { EccLevel, QrStyle } from '@/types/code';
import { readImageFile } from '@/utils/image';

const props = defineProps<{
  modelValue: QrStyle;
  brandLogo: string;
}>();

const emit = defineEmits<{ 'update:modelValue': [QrStyle] }>();
const fileRef = ref<HTMLInputElement | null>(null);
const logoError = ref('');

const levels: EccLevel[] = ['L', 'M', 'Q', 'H'];

function patch(partial: Partial<QrStyle>) {
  emit('update:modelValue', { ...props.modelValue, ...partial });
}

function choose(level: EccLevel) {
  if (props.modelValue.logo && level !== 'H') return;
  patch({ ecc: level });
}

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    const logo = await readImageFile(file);
    logoError.value = '';
    patch({ logo, ecc: 'H' });
  } catch (error) {
    logoError.value = error instanceof Error ? error.message : '图片读取失败';
  }
}

function useBrand() {
  logoError.value = '';
  patch({ logo: props.brandLogo, ecc: 'H' });
}
</script>

<template>
  <section class="border-b border-border-subtle px-20px py-16px">
    <h2 class="mb-12px text-12px text-text-muted">样式</h2>
    <div class="mb-14px flex gap-8px">
      <button
        type="button"
        class="chip"
        :class="
          modelValue.module === 'classic'
            ? 'border-accent bg-accent-muted text-accent'
            : 'border-border-subtle text-text-secondary'
        "
        @click="patch({ module: 'classic' })"
      >
        经典黑白
      </button>
      <button
        type="button"
        class="chip"
        :class="
          modelValue.module === 'cyan'
            ? 'border-accent bg-accent-muted text-accent'
            : 'border-border-subtle text-text-secondary'
        "
        @click="patch({ module: 'cyan' })"
      >
        青模块
      </button>
    </div>
    <label class="mb-14px block">
      <span
        class="mb-6px flex items-center justify-between text-12px text-text-secondary"
      >
        <span>边距</span>
        <span>{{ modelValue.margin }}</span>
      </span>
      <input
        :value="modelValue.margin"
        type="range"
        min="1"
        max="4"
        step="1"
        class="w-full accent-[#22D3EE]"
        @input="
          patch({ margin: Number(($event.target as HTMLInputElement).value) })
        "
      />
    </label>
    <div>
      <span class="mb-6px block text-12px text-text-secondary">容错</span>
      <div class="flex gap-8px">
        <button
          v-for="level in levels"
          :key="level"
          type="button"
          class="chip"
          :class="
            modelValue.ecc === level
              ? 'border-accent bg-accent-muted text-accent'
              : 'border-border-subtle text-text-secondary'
          "
          :disabled="Boolean(modelValue.logo) && level !== 'H'"
          @click="choose(level)"
        >
          {{ level }}
        </button>
      </div>
      <p v-if="modelValue.logo" class="mt-8px text-12px text-text-muted">
        有标记时使用 H，避免中间被挡住后扫不出。
      </p>
    </div>
  </section>
  <section class="border-b border-border-subtle px-20px py-16px">
    <h2 class="mb-12px text-12px text-text-muted">LOGO</h2>
    <div class="flex items-center gap-12px">
      <div
        class="flex h-48px w-48px items-center justify-center overflow-hidden rounded-8px border border-border-subtle bg-bg-overlay"
      >
        <img
          v-if="modelValue.logo"
          :src="modelValue.logo"
          alt=""
          class="h-full w-full object-cover"
        />
        <span v-else class="text-12px text-text-muted">无</span>
      </div>
      <div class="flex flex-wrap gap-8px">
        <button
          type="button"
          class="chip border-border-strong text-text-primary"
          @click="fileRef?.click()"
        >
          上传
        </button>
        <button
          v-if="brandLogo"
          type="button"
          class="chip border-border-strong text-text-primary"
          @click="useBrand"
        >
          用品牌标记
        </button>
        <button
          v-if="modelValue.logo"
          type="button"
          class="chip border-border-subtle text-text-secondary"
          @click="patch({ logo: '' })"
        >
          移除
        </button>
      </div>
    </div>
    <p v-if="logoError" class="mt-8px text-12px text-danger">{{ logoError }}</p>
    <input
      ref="fileRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFile"
    />
  </section>
</template>
