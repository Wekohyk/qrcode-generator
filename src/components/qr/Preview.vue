<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { QrStyle } from '@/types/code';
import { paintQr } from '@/composables/useQr';

const props = defineProps<{
  text: string;
  style: QrStyle;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const error = ref('');
const empty = computed(() => !props.text.trim());

async function paint() {
  const canvas = canvasRef.value;
  if (!canvas || empty.value) return;
  try {
    await paintQr(canvas, props.text, props.style);
    error.value = '';
  } catch {
    error.value = '这段内容无法编码成二维码';
  }
}

watch(
  () => [props.text, props.style, canvasRef.value] as const,
  () => {
    void paint();
  },
  { deep: true, flush: 'post', immediate: true },
);
</script>

<template>
  <div
    :key="`${text}:${style.module}:${style.logo}:${style.ecc}:${style.margin}`"
    class="glass-in flex flex-col items-center"
  >
    <div
      class="flex h-252px w-252px items-center justify-center rounded-12px bg-white"
    >
      <canvas
        v-show="!empty && !error"
        ref="canvasRef"
        class="h-220px w-220px"
      />
      <p v-if="empty" class="px-24px text-center text-12px text-[#5A7264]">
        填写内容后生成预览
      </p>
      <p v-else-if="error" class="px-24px text-center text-12px text-[#D46565]">
        {{ error }}
      </p>
    </div>
  </div>
</template>
