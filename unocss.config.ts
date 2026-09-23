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
        base: '#E8F0E9',
        mist: '#F4F8F4',
        raised: 'rgba(255,255,255,0.74)',
        overlay: 'rgba(255,255,255,0.78)',
      },
      border: {
        subtle: 'rgba(36, 90, 58, 0.12)',
        strong: 'rgba(36, 90, 58, 0.22)',
        glass: 'rgba(255,255,255,0.55)',
      },
      text: {
        primary: '#1A2E24',
        secondary: '#5A7264',
        muted: '#8AA093',
      },
      accent: {
        DEFAULT: '#2F9B6A',
        hover: '#3CB87E',
        deep: '#1F6B48',
        muted: 'rgba(47,155,106,0.14)',
        soft: '#A8D5B5',
      },
      ornament: {
        gold: '#C4A574',
      },
      success: '#2F9B6A',
      warning: '#D4A017',
      danger: '#D46565',
    },
  },
  shortcuts: {
    page: 'min-h-screen bg-bg-base text-text-primary',
    panel:
      'bg-bg-raised border border-border-glass backdrop-blur-xl rounded-24px shadow-[0_10px_40px_rgba(36,90,58,0.08)]',
    field:
      'w-full border border-border-subtle rounded-12px bg-white/70 px-12px py-8px text-14px text-text-primary outline-none transition-colors duration-200 focus:border-accent focus:shadow-[0_0_0_2px_rgba(47,155,106,0.22)] placeholder:text-text-muted disabled:opacity-40',
    chip: 'rounded-12px border px-10px py-6px text-12px transition-colors duration-200',
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
