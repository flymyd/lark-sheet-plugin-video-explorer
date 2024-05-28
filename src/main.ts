import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import {createPinia} from 'pinia';
import ElementPlus from 'element-plus'
import en from 'element-plus/es/locale/lang/en'
import 'element-plus/dist/index.css'
import i18n from './i18n.ts'
// import Vconsole from "vconsole";
// new Vconsole();

const pinia = createPinia()
createApp(App).use(pinia).use(ElementPlus, {locale: en}).use(i18n).mount('#app')
