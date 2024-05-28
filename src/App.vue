<template>
  <el-config-provider :locale="appStore.locale">
    <div class="flex flex-col overflow-x-hidden">
      <div class="flex flex-wrap items-center justify-between w-full pr-2">
        <el-popover
            placement="top-start"
            :width="300"
            trigger="hover"
            :content="$t('hint.useHint')"
        >
          <template #reference>
            <el-button class="m-2">
              <el-icon class="mr-1">
                <QuestionFilled/>
              </el-icon>
              {{ $t('hint.help') }}
            </el-button>
          </template>
        </el-popover>
        <el-dropdown @command="switchLang">
          <div class="flex flex-row items-center">
            <svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24" width="1.2em" height="1.2em"
                 data-v-12008bb2="">
              <path fill="currentColor"
                    d="m18.5 10l4.4 11h-2.155l-1.201-3h-4.09l-1.199 3h-2.154L16.5 10h2zM10 2v2h6v2h-1.968a18.222 18.222 0 0 1-3.62 6.301a14.864 14.864 0 0 0 2.336 1.707l-.751 1.878A17.015 17.015 0 0 1 9 13.725a16.676 16.676 0 0 1-6.201 3.548l-.536-1.929a14.7 14.7 0 0 0 5.327-3.042A18.078 18.078 0 0 1 4.767 8h2.24A16.032 16.032 0 0 0 9 10.877a16.165 16.165 0 0 0 2.91-4.876L2 6V4h6V2h2zm7.5 10.885L16.253 16h2.492L17.5 12.885z"></path>
            </svg>
            <el-icon class="el-icon--right">
              <arrow-down/>
            </el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="zh-cn">中文</el-dropdown-item>
              <el-dropdown-item command="en">English</el-dropdown-item>
              <el-dropdown-item command="ja">日本語</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="flex flex-col items-start ml-2 mb-2 pr-2">
        <span class="my-2">{{ $t('hint.attachmentSelector') }}</span>
        <el-select v-model="currentFieldId" size="large" class="flex-1" @change="onFieldListChange">
          <el-option v-for="item in attachmentFieldMetaList" :key="item.id" :label="item.name" :value="item.id"/>
        </el-select>
      </div>
      <div class="flex flex-col items-start ml-2 mb-2 pr-2">
        <span class="my-2">{{ $t('hint.textSelector') }}</span>
        <el-select v-model="previewTextFieldList" multiple @change="onPreviewChange" class="flex-1">
          <el-option v-for="item in othersFieldMetaList" :key="item.id" :label="item.name" :value="item.id"/>
        </el-select>
      </div>
      <template v-if="previewTextFieldList.length">
        <div class="flex flex-row ml-2 mb-2 pr-2" v-for="item in descriptions">
          <span>{{ item.name ? item.name : '-' }}：</span>
          <span>{{ tableVal ? tableVal[item.id] : '-' }}</span>
        </div>
      </template>
      <div class="w-full" v-if="currentCellPicUrlList.length">
        <div class="flex flex-col w-full" v-loading.fullscreen.lock="isLoading">
          <img v-for="pic in currentCellPicUrlList" :src="pic" class="mb-2 w-full"/>
        </div>
      </div>
      <div v-else class="ml-2">{{ $t('hint.noPicture') }}</div>
      <div class="flex flex-row justify-center w-full bottom-12 fixed">
        <el-button @click="changePage(false)">{{ $t('hint.prev') }}</el-button>
        <el-button type="primary" @click="changePage(true)">{{ $t('hint.next') }}</el-button>
      </div>
    </div>
  </el-config-provider>
</template>
<script setup lang="ts">
import {computed, onMounted, onUnmounted, reactive, ref} from "vue";
import {bitable, IAttachmentField, IGridView} from "@lark-base-open/js-sdk";
import {ElConfigProvider} from 'element-plus';
import {useAppStore} from './store/modules/app'
import {ArrowDown, QuestionFilled} from '@element-plus/icons-vue'
import {useTheme} from './hooks/useTheme';

const appStore = useAppStore()
useTheme();
let onSelectionChangeHandler: any = null;
const currentCellPicUrlList = ref<Array<any>>([])
const tableFieldMetaList = ref<Array<any>>([])
const visibleRecordIdList = ref<Array<any>>([])
const currentFieldId = ref<string>("")
const currentRecordId = ref<string>("")
const currentViewId = ref<string>("")
const isLoading = ref(false)
const lastRecordId = ref("");
const carouselIndex = reactive({
  newVal: 0,
  oldVal: 0
})
const previewTextFieldList = ref<Array<any>>([])
const tableVal = ref<any>({})
const changePage = async (next: boolean) => {
  const currentRecordIndex = visibleRecordIdList.value.findIndex(id => id === currentRecordId.value);
  const table = await bitable.base.getActiveTable();
  const view = await table.getActiveView()
  const viewId = view.id;
  let toRecordId;
  if (next) {
    toRecordId = visibleRecordIdList.value[currentRecordIndex + 1];
  } else {
    toRecordId = visibleRecordIdList.value[currentRecordIndex - 1];
  }
  await onSelectionChange({data: {viewId, recordId: toRecordId, refresh: true}})
}
const onSelectionChange = async (event: any) => {
  const table = await bitable.base.getActiveTable();
  isLoading.value = true;
  try {
    const attachmentField = await table.getField<IAttachmentField>(currentFieldId.value);
    currentViewId.value = event?.data?.viewId ?? '';
    const view = await table.getViewById(currentViewId.value) as IGridView;
    visibleRecordIdList.value = await view.getVisibleRecordIdList();
    const recordId = event?.data?.recordId ?? '';
    currentRecordId.value = recordId;
    if (lastRecordId.value == recordId && !event?.data?.refresh) {
      return;
    } else if (recordId) {
      lastRecordId.value = recordId;
      currentCellPicUrlList.value = await attachmentField.getAttachmentUrls(recordId);
      let tableV: any = {}
      for (let k of previewTextFieldList.value) {
        await Object.defineProperty(tableV, k, {
          value: await table.getCellString(k, recordId),
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
      tableVal.value = tableV;
    } else {
      lastRecordId.value = recordId;
      currentCellPicUrlList.value = []
      tableVal.value = null;
    }
  } catch (e) {
    currentCellPicUrlList.value = []
    tableVal.value = null;
  } finally {
    isLoading.value = false;
    carouselIndex.newVal = 0;
    carouselIndex.oldVal = 0;
  }
}
onMounted(async () => {
  const table = await bitable.base.getActiveTable();
  onSelectionChangeHandler = bitable.base.onSelectionChange(onSelectionChange)
  // 获取列的列表
  tableFieldMetaList.value = await table.getFieldMetaList()
  const primary = tableFieldMetaList.value.filter(obj => obj.isPrimary)
  if (primary.length) {
    previewTextFieldList.value.push(primary[0].id)
  }
})
const attachmentFieldMetaList = computed(() => {
  const list = tableFieldMetaList.value.filter(obj => obj.type === 17);
  if (list.length) {
    currentFieldId.value = list[0].id;
  }
  return list;
})
const othersFieldMetaList = computed(() => {
  return tableFieldMetaList.value.filter(obj => obj.type !== 17);
})
const descriptions = computed(() => previewTextFieldList.value.map(k => othersFieldMetaList.value.find(obj => obj.id == k)))
const onFieldListChange = async (e: any) => {
  currentFieldId.value = e;
  // 刷新视图
  const table = await bitable.base.getActiveTable();
  const view = await table.getActiveView()
  const viewId = view.id;
  await onSelectionChange({data: {viewId, recordId: lastRecordId.value, refresh: true}})
}
const onPreviewChange = async () => {
  const table = await bitable.base.getActiveTable();
  const view = await table.getActiveView()
  const viewId = view.id;
  await onSelectionChange({data: {viewId, recordId: lastRecordId.value, refresh: true}})
}
onUnmounted(() => {
  if (onSelectionChangeHandler) {
    onSelectionChangeHandler = null;
  }
})
const switchLang = (command: string) => {
  appStore.changeLanguage(command)
}
</script>
<style scoped>
:deep(.is-active) {
  transition: none;
}

:deep(.is-animating) {
  transition: none;
}
</style>
