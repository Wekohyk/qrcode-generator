// 自定义指令
import backToTop from './directive/back-to-top';
import { createApp } from 'vue';
// pinia and pinia-plugin-persistedstate
import pinia from './store';
// vue-router
import router from './router';
// i18n
import { getI18n } from './lang';
/**
 * Import the Unocss core styles
 * Best placed after reset style, before uno.css
 */
import './assets/styles/index.scss';
// Import the Unocss utilities styles
import 'uno.css';
// App
import App from './App.vue';

const app = createApp(App);

app.use(pinia).use(router).use(getI18n()).directive('back-to-top', backToTop);
app.mount('#app');
