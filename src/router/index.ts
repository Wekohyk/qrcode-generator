import { createRouter, createWebHistory } from 'vue-router';
import AppShell from '@/layouts/AppShell.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AppShell,
      children: [
        {
          path: '',
          name: 'workbench',
          component: () => import('@/pages/Workbench.vue'),
          meta: { title: '工作台' },
        },
        {
          path: 'codes',
          name: 'codes',
          component: () => import('@/pages/Codes.vue'),
          meta: { title: '我的码' },
        },
        {
          path: 'codes/new',
          name: 'code-new',
          component: () => import('@/pages/Editor.vue'),
          meta: { title: '新建二维码' },
        },
        {
          path: 'codes/:id',
          name: 'code-edit',
          component: () => import('@/pages/Editor.vue'),
          meta: { title: '编辑二维码' },
        },
        {
          path: 'templates',
          name: 'templates',
          component: () => import('@/pages/Templates.vue'),
          meta: { title: '模板库' },
        },
        {
          path: 'analytics',
          name: 'analytics',
          component: () => import('@/pages/Analytics.vue'),
          meta: { title: '数据' },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/pages/Settings.vue'),
          meta: { title: '设置' },
        },
      ],
    },
    {
      path: '/v/:id',
      name: 'view-code',
      component: () => import('@/pages/ViewCode.vue'),
      meta: { title: '查看' },
    },
  ],
});

router.afterEach(to => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : '';
  document.title = title ? `${title} · 墨码` : '墨码';
});

export default router;
