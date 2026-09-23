<template>
  <div
    class="h-100vh w-full flex flex-col items-stretch bg-top bg-contain bg-no-repeat bg-$primaryBackground"
    :style="{
      background,
    }"
  >
    <!-- backdrop-filter backdrop-blur-2 -->
    <header
      class="top-0 w-full flex-shrink-0 adapt-pt-44 z-9999999999"
      :class="{
        'bg-transparent': transparentNavigationBar,
        '!fixed left-0': floatHeader,
      }"
      :style="{ backgroundColor: navBackgroundColor ?? 'unset' }"
    >
      <div class="navigation-bar grid grid-cols-[1fr_auto_1fr]">
        <div class="flex-1 flex items-center h-44 pl-16px">
          <div class="flex items-center mt-1" v-if="!hideBack" @click="back">
            <div class="relative">
              <img
                :src="
                  backBtnDeepShallowMode
                    ? '/backButton_dark.png'
                    : '/backButton_light.png'
                "
                alt=""
                :style="{
                  width: goBackWidth,
                  height: goBackHeight,
                }"
              />
            </div>
          </div>
          <slot name="navigationBarLeading"></slot>
        </div>
        <div
          class="adapt-top-0 left-0 w-full flex-shrink flex items-center justify-center text-18 font-semibold"
        >
          <slot name="navigationBarCenter">
            <div v-if="pageTitle" class="h-44 flex items-center justify-center">
              {{ pageTitle }}
            </div>
          </slot>
        </div>
        <div class="flex-1 pr-16px flex items-center justify-end h-44">
          <slot name="navigationBarTrailing"></slot>
        </div>
      </div>
      <slot name="navigationBarContainer"></slot>
    </header>
    <main
      ref="mainElement"
      v-back-to-top="enableBackToTop"
      class="relative flex-1 overflow-x-hidden"
      :style="{ overflowY: scrollable ? 'scroll' : 'hidden' }"
      @scroll="handleScroll"
    >
      <div
        class="fixed left-0 z-50 adapt-top-44 bottom-0"
        style="width: 15pt"
        @touchmove.passive.prevent
      ></div>
      <slot></slot>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAttrs, ref } from 'vue';
import { useRouter } from 'vue-router';

interface Props {
  transparentNavigationBar?: boolean;
  hideBack?: boolean;
  pageTitle?: string;
  floatHeader?: boolean;
  scrollable?: boolean;
  background?: string;
  navBackgroundColor?: string;
  enableBackToTop?: boolean;
  currentColor?: string;
  goBackWidth?: string;
  goBackHeight?: string;
  backBtnDeepShallowMode?: boolean;
}

withDefaults(defineProps<Props>(), {
  scrollable: true,
  goBackHeight: '18px',
  goBackWidth: '18px',
  backBtnDeepShallowMode: true,
});

interface Emits {
  (e: 'back'): void;
  (e: 'scroll', top: number): void;
}
const emit = defineEmits<Emits>();

const mainElement = ref();

const navigatorOpacity = ref(1);

const handleScroll = () => {
  navigatorOpacity.value = Math.min(1, mainElement.value.scrollTop / 64);
  emit('scroll', mainElement.value.scrollTop);
};

interface Slots {
  default(param: any): void;
  navigationBarLeading(param: any): any;
  navigationBarCenter(param: any): any;
  navigationBarTrailing(param: any): any;
  navigationBarContainer(param: any): any;
}
defineSlots<Slots>();

const router = useRouter();
const attrs = useAttrs();
const back = () => {
  if (Reflect.has(attrs, 'onBack')) {
    emit('back');
  } else {
    // 利用vue-router返回上一页
    router.back();
  }
};
</script>
