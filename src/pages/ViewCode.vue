<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCodesStore } from '@/store/modules/codes';
import { buildStaticPayload } from '@/utils/payload';
import type { ScanSource } from '@/types/code';

const route = useRoute();
const codes = useCodesStore();

const code = computed(() =>
  codes.items.find(item => item.id === String(route.params.id || '')),
);

const url = computed(() => {
  if (!code.value || code.value.kind !== 'url') return '';
  return buildStaticPayload('url', code.value.fields);
});

function sourceOf(): ScanSource {
  const agent = navigator.userAgent.toLowerCase();
  if (agent.includes('micromessenger')) return 'wechat';
  if (document.referrer) return 'other';
  return 'direct';
}

onMounted(() => {
  const current = code.value;
  if (!current || current.status === 'paused' || current.mode !== 'live')
    return;
  const key = `inkcode-scan-${current.id}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  codes.addScan(current.id, sourceOf());
});
</script>

<template>
  <div
    class="page flex min-h-screen items-center justify-center px-20px py-32px"
  >
    <article class="panel w-full max-w-420px px-24px py-24px">
      <p class="text-12px text-text-muted">Weko QR Code</p>
      <template v-if="!code">
        <h1 class="mt-12px text-20px font-semibold">这个码不存在</h1>
        <p class="mt-8px text-14px text-text-secondary">它可能已经删除。</p>
      </template>
      <template v-else-if="code.status === 'paused'">
        <h1 class="mt-12px text-20px font-semibold">此码已暂停</h1>
        <p class="mt-8px text-14px text-text-secondary">暂时不能查看内容。</p>
      </template>
      <template v-else-if="code.kind === 'url'">
        <h1 class="mt-12px text-20px font-semibold">{{ code.name }}</h1>
        <p class="mt-8px break-all text-14px text-text-secondary">
          {{ url || '网址无法打开' }}
        </p>
        <a
          v-if="url"
          :href="url"
          class="mt-16px inline-flex h-36px items-center rounded-12px bg-accent px-14px text-14px font-medium text-white"
        >
          打开链接
        </a>
      </template>
      <template v-else-if="code.kind === 'text'">
        <h1 class="mt-12px text-20px font-semibold">{{ code.name }}</h1>
        <p
          class="mt-12px whitespace-pre-wrap text-14px leading-[22px] text-text-primary"
        >
          {{ code.fields.text }}
        </p>
      </template>
      <template v-else-if="code.kind === 'vcard'">
        <h1 class="mt-12px text-20px font-semibold">
          {{ code.fields.fullName || code.name }}
        </h1>
        <p
          v-if="code.fields.title || code.fields.org"
          class="mt-4px text-14px text-text-secondary"
        >
          {{ [code.fields.title, code.fields.org].filter(Boolean).join(' · ') }}
        </p>
        <dl class="mt-16px text-14px">
          <div
            v-if="code.fields.phone"
            class="flex justify-between gap-12px border-t border-border-subtle py-8px"
          >
            <dt class="text-text-muted">电话</dt>
            <dd>{{ code.fields.phone }}</dd>
          </div>
          <div
            v-if="code.fields.email"
            class="flex justify-between gap-12px border-t border-border-subtle py-8px"
          >
            <dt class="text-text-muted">邮箱</dt>
            <dd class="break-all">{{ code.fields.email }}</dd>
          </div>
          <div
            v-if="code.fields.site"
            class="flex justify-between gap-12px border-t border-border-subtle py-8px"
          >
            <dt class="text-text-muted">网址</dt>
            <dd class="break-all">{{ code.fields.site }}</dd>
          </div>
        </dl>
      </template>
      <template v-else-if="code.kind === 'wifi'">
        <h1 class="mt-12px text-20px font-semibold">{{ code.fields.ssid }}</h1>
        <p class="mt-8px text-14px text-text-secondary">
          {{
            code.fields.encryption === 'nopass'
              ? '无密码'
              : code.fields.password || '未设置密码'
          }}
        </p>
        <p v-if="code.fields.hidden" class="mt-8px text-12px text-text-muted">
          这是隐藏网络
        </p>
      </template>
      <template v-else>
        <h1 class="mt-12px text-20px font-semibold">
          {{ code.fields.richTitle || code.name }}
        </h1>
        <img
          v-if="code.fields.richImage"
          :src="code.fields.richImage"
          alt=""
          class="mt-16px max-h-240px w-full rounded-8px object-cover"
        />
        <p
          class="mt-12px whitespace-pre-wrap text-14px leading-[22px] text-text-primary"
        >
          {{ code.fields.richBody }}
        </p>
      </template>
    </article>
  </div>
</template>
