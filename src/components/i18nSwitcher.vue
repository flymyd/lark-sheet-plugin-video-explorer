<template>
  <div>
    <el-dropdown trigger="click" @command="handleLanguageChange">
      <!--    <div>-->
      <!--      <svg-icon icon-class="language" />-->
      <!--    </div>-->
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item :disabled="appStore.language === 'zh-cn'" command="zh-cn"> 中文</el-dropdown-item>
          <el-dropdown-item :disabled="appStore.language === 'en'" command="en"> English</el-dropdown-item>
          <el-dropdown-item :disabled="appStore.language === 'ja'" command="en"> 日本语</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import {useI18n} from 'vue-i18n'
// import SvgIcon from '@/components/SvgIcon/index.vue'
import {useAppStore} from '../store/modules/app'
const appStore = useAppStore()
const {locale} = useI18n()

function handleLanguageChange(lang: string) {
  locale.value = lang
  appStore.changeLanguage(lang)
  if (lang == 'en') {
    // ElMessage.success('Switch Language Successfully!')
  } else {
    // ElMessage.success('切换语言成功！')
  }
}
</script>
