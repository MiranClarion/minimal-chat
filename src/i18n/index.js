import { createI18n } from 'vue-i18n';
import enMessages from './messages/en.json';
import zhCNMessages from './messages/zh-CN.json';

export default createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: localStorage.getItem('lang') || 'en', // 默认语言
  fallbackLocale: 'en', // 回退语言
  messages: {
    en: enMessages,
    'zh-CN': zhCNMessages
  }
});
