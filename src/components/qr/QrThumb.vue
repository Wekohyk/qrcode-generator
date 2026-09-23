<script setup lang="ts">
import { ref, watch } from 'vue';
import type { QrStyle } from '@/types/code';
import { paintQr } from '@/composables/useQr';

const props = defineProps<{
  text: string;
  style: QrStyle;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

watch(
  () => [props.text, props.style, canvasRef.value] as const,
  async () => {
    const canvas = canvasRef.value;
    if (!canvas || !props.text) return;
    try {
      await paintQr(canvas, props.text, props.style, 80);
    } catch {
      return;
    }
  },
  { deep: true, flush: 'post', immediate: true },
);
</script>

<template>
  <div
    class="h-40px w-40px overflow-hidden rounded-8px border border-accent-soft bg-white"
  >
    <canvas v-if="text" ref="canvasRef" class="h-40px w-40px" />
  </div>
</template>
