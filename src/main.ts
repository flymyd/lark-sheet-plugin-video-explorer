import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import i18n from './i18n.ts'
const pinia = createPinia()
// import Vconsole from "vconsole";

// new Vconsole();

createApp(App).use(pinia).use(ElementPlus, {locale: zhCn}).use(i18n).mount('#app')
