import { createI18n } from "vue-i18n";
import enLocale from './locales/en.ts'
import zhLocale from './locales/zh.ts'
import jaLocale from './locales/ja.ts'

const messages = {
  "en": {
    ...enLocale,
  },
  "zh": {
    ...zhLocale,
  },
  "ja": {
    ...jaLocale,
  },
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'en',
  messages: messages
})
export default i18n
