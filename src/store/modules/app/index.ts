import {defineStore} from 'pinia';
import {useStorage} from '@vueuse/core';
import {computed} from "vue";

import zhCn from 'element-plus/es/locale/lang/zh-cn';
import en from 'element-plus/es/locale/lang/en';
import ja from 'element-plus/es/locale/lang/ja';
import {useI18n} from "vue-i18n";

// setup
export const useAppStore = defineStore('app', () => {
  const {locale: i18n} = useI18n()
  const language = useStorage('language', 'zh-cn');
  i18n.value = language.value;
  const locale = computed(() => {
    if (language?.value == 'en') {
      return en;
    } else if (language?.value == 'ja') {
      return ja;
    } else {
      return zhCn;
    }
  });
  function changeLanguage(val: string) {
    language.value = val;
    i18n.value = val;
  }
  return {
    language,
    locale,
    changeLanguage
  };
});
