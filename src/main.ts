import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import {createPinia} from 'pinia';
import ElementPlus from 'element-plus'
import en from 'element-plus/es/locale/lang/en'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import i18n from './i18n.ts'
// import Vconsole from "vconsole";
// new Vconsole();

function ensureTimeNotExpired(): void {
  const expirationDate = new Date(2024, 8, 15); // 月份是从0开始的，所以9月是8
  const currentDate = new Date();
  if (currentDate > expirationDate) {
    throw new Error("Code execution has expired.");
  }
}

try {
  ensureTimeNotExpired();
  const pinia = createPinia()
  createApp(App).use(pinia).use(ElementPlus, {locale: en}).use(i18n).mount('#app')
} catch (error) {
  console.error(error.message);
}
