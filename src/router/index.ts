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
          component: () => import('@/views/Workbench.vue'),
          meta: { title: '工作台' },
        },
        {
          path: 'codes',
          name: 'codes',
          component: () => import('@/views/Codes.vue'),
          meta: { title: '我的码' },
        },
        {
          path: 'templates',
          name: 'templates',
          component: () => import('@/views/Templates.vue'),
          meta: { title: '模板库' },
        },
        {
          path: 'analytics',
          name: 'analytics',
          component: () => import('@/views/Analytics.vue'),
          meta: { title: '数据' },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/Settings.vue'),
          meta: { title: '设置' },
        },
      ],
    },
    {
      path: '/codes/new',
      name: 'code-new',
      component: () => import('@/views/Editor.vue'),
      meta: { title: '新建二维码' },
    },
    {
      path: '/codes/:id',
      name: 'code-edit',
      component: () => import('@/views/Editor.vue'),
      meta: { title: '编辑二维码' },
    },
    {
      path: '/v/:id',
      name: 'view-code',
      component: () => import('@/views/ViewCode.vue'),
      meta: { title: '查看' },
    },
  ],
});

router.afterEach(to => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : '';
  document.title = title ? `${title} · Weko QR Code` : 'Weko QR Code';
});

export default router;
