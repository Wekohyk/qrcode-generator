import { defineConfig, toEscapedSelector as e } from 'unocss';
import presetWind from '@unocss/preset-wind';
import presetRemToPx from './src/assets/uno/preset-rem-to-px';
import presetResolveRpx from './src/assets/uno/preset-resolve-rpx';
import transformerVariantGroup from '@unocss/transformer-variant-group';

const normalizeSize = (size: string) => {
  if (+size + '' === size) {
    return `${size}px`;
  }
  if (size.endsWith('rpx')) {
    return `${(100 * +size.replace('rpx', '')) / 390}vw`;
  }
  return size;
};

export default defineConfig({
  theme: {
    colors: {
      bg: {
        base: '#0B0F14',
        raised: '#12181F',
        overlay: '#1A222D',
      },
      border: {
        subtle: '#1E2630',
        strong: '#2A3441',
      },
      text: {
        primary: '#E8EEF5',
        secondary: '#8B9BB0',
        muted: '#5A6A7D',
      },
      accent: {
        DEFAULT: '#22D3EE',
        hover: '#67E8F9',
        muted: 'rgba(34,211,238,0.12)',
      },
      success: '#34D399',
      warning: '#FBBF24',
      danger: '#F87171',
    },
  },
  shortcuts: {
    page: 'min-h-screen bg-bg-base text-text-primary',
    panel: 'bg-bg-raised border border-border-subtle rounded-12px',
    field:
      'w-full border border-border-subtle rounded-8px bg-bg-raised px-12px py-8px text-14px text-text-primary outline-none transition-colors duration-150 focus:border-accent placeholder:text-text-muted disabled:opacity-40',
    chip: 'rounded-8px border px-10px py-6px text-12px transition-colors duration-150',
  },
  presets: [
    presetWind(),
    presetRemToPx({ baseFontSize: 4 }),
    presetResolveRpx(),
  ],
  transformers: [transformerVariantGroup()],
  rules: [
    // 隐藏滚动条
    [
      /^scrollbar-hidden$/,
      () => {
        return `.scrollbar-hidden::-webkit-scrollbar { display: none; } `;
      },
    ],
    // flex居中
    [
      /^flex-center$/,
      () => {
        return `.flex-center { display: flex; justify-content: center; align-items: center; }`;
      },
    ],
    // 处理文本溢出并应用省略号
    [
      /^ellipsis-(\d+)$/,
      ([, d], { rawSelector }) => {
        const selector = e(rawSelector);
        return `
          ${selector} {
            -webkit-box-orient: vertical;
            -webkit-line-clamp: ${+d};
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
          }
        `;
      },
    ],
    [
      /^adapt-mb-(.+)$/,
      ([, d], { rawSelector }) => {
        const selector = e(rawSelector);
        const size = normalizeSize(d);
        return `
          ${selector} {
            margin-bottom: calc(constant(safe-area-inset-bottom) + ${size});
            margin-bottom: calc(env(safe-area-inset-bottom) + ${size});
          }
      `;
      },
    ],
    [
      /^adapt-mt-(.+)$/,
      ([, d], { rawSelector }) => {
        const selector = e(rawSelector);
        const size = normalizeSize(d);
        return `
          ${selector} {
            margin-top: calc(constant(safe-area-inset-top) + ${size});
            margin-top: calc(env(safe-area-inset-top) + ${size});
          }
        `;
      },
    ],
    [
      /^adapt-pb-(.+)$/,
      ([, d], { rawSelector }) => {
        const selector = e(rawSelector);
        const size = normalizeSize(d);
        return `
          ${selector} {
            padding-bottom: calc(constant(safe-area-inset-bottom) + ${size});
            padding-bottom: calc(env(safe-area-inset-bottom) + ${size});
          }
        `;
      },
    ],
    [
      /^adapt-pt-(.+)$/,
      ([, d], { rawSelector }) => {
        const selector = e(rawSelector);
        const size = normalizeSize(d);
        return `
          ${selector} {
            padding-top: calc(constant(safe-area-inset-top) + ${size});
            padding-top: calc(env(safe-area-inset-top) + ${size});
          }
        `;
      },
    ],
    [
      /^adapt-top-(.+)$/,
      ([, d], { rawSelector }) => {
        const negative = rawSelector.startsWith('-');
        const selector = e(rawSelector);
        const size = normalizeSize(d);
        return `
          ${selector} {
            top: calc(constant(safe-area-inset-top) ${negative ? '-' : '+'} ${size});
            top: calc(env(safe-area-inset-top) ${negative ? '-' : '+'} ${size});
          }
        `;
      },
    ],
    [
      /^adapt-bottom-(.+)$/,
      ([, d], { rawSelector }) => {
        const selector = e(rawSelector);
        const size = normalizeSize(d);
        return `
          ${selector} {
            bottom: calc(constant(safe-area-inset-bottom) + ${size});
            bottom: calc(env(safe-area-inset-bottom) + ${size});
          }
        `;
      },
    ],
    [
      /^adapt-h-(.+)$/,
      ([, d], { rawSelector }) => {
        const selector = e(rawSelector);
        const size = normalizeSize(d);
        return `
          ${selector} {
            height: calc(constant(safe-area-inset-bottom) + ${size});
            height: calc(env(safe-area-inset-bottom) + ${size});
          }
        `;
      },
    ],
  ],
});
