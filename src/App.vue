<template>
  <el-config-provider :locale="appStore.locale">
    <div class="flex flex-col overflow-x-hidden h-lvh">
      <div class="flex flex-wrap items-center justify-between w-full pr-2">
        <el-popover placement="top-start" :width="300" trigger="hover" :content="$t('hint.useHint')">
          <template #reference>
            <el-button class="m-2">
              <el-icon class="mr-1">
                <QuestionFilled/>
              </el-icon>
              {{ $t('hint.help') }}
            </el-button>
          </template>
        </el-popover>
        <el-button class="m-2" @click="resetCache" ref="reset">
          <el-icon class="mr-1">
            <Refresh/>
          </el-icon>
          {{ $t('hint.reset') }}
        </el-button>
      </div>
      <div class="flex flex-col items-start ml-2 mb-2 pr-2">
        <span class="my-2">{{ $t('hint.attachmentSelector') }}</span>
        <el-select v-model="currentFieldId" size="large" class="flex-1" @change="onFieldListChange" ref="attachmentSelector">
          <el-option v-for="item in attachmentFieldMetaList" :key="item.id" :label="item.name" :value="item.id"/>
        </el-select>
      </div>
      <div class="flex flex-col items-start ml-2 mb-2 pr-2">
        <span class="my-2">{{ $t('hint.textSelector') }}</span>
        <el-select v-model="previewTextFieldList" multiple @change="onPreviewChange" class="flex-1" :multiple-limit="4" ref="textSelector">
          <el-option v-for="item in othersFieldMetaList" :key="item.id" :label="item.name" :value="item.id"/>
        </el-select>
      </div>
      <el-divider ref="scrollToBrowse">{{ $t('hint.scrollToBrowse') }}</el-divider>
      <template v-if="previewTextFieldList.length">
        <div class="flex flex-row ml-2 mb-2 pr-2" v-for="item in descriptions">
          <span>{{ item.name ? item.name : '-' }}：</span>
          <span>{{ tableVal ? tableVal[item.id] : '-' }}</span>
        </div>
      </template>
      <div class="flex flex-col w-full overflow-y-scroll overflow-x-hidden pic-container"
           v-loading.fullscreen.lock="isLoading" v-if="currentCellPicUrlList.length">
        <template v-for="(pic, index) in currentCellPicUrlList" v-if="!isLoading">
          <img :src="pic" :class="['mb-2 w-full',index===currentCellPicUrlList.length-1?'pb-20':'']"/>
        </template>
      </div>
      <div v-else
           class="ml-2 min-h-56 flex flex-row justify-center items-center bg-[#f5f5f5] text-[#8d8d8d] text-lg select-none">
        <el-icon class="mr-1">
          <WarningFilled/>
        </el-icon>
        {{ $t('hint.noPicture') }}
      </div>
      <div class="flex flex-row justify-center w-full bottom-12 fixed">
        <el-button-group ref="prevAndNext">
          <el-button @click="changePage(false)">
            <el-icon>
              <ArrowLeftBold/>
            </el-icon>
            {{ $t('hint.prev') }}
          </el-button>
          <el-button type="primary" @click="changePage(true)">
            {{ $t('hint.next') }}
            <el-icon>
              <ArrowRightBold/>
            </el-icon>
          </el-button>
        </el-button-group>
      </div>
    </div>
<!--    <el-tour v-model="openTour">-->
<!--      <el-tour-step title="介绍" description="欢迎使用图库浏览器，接下来是简单的使用说明。"/>-->
<!--      <el-tour-step-->
<!--          title="图片列"-->
<!--          description="请在此处选择待预览的图片列，默认会选中表格的第一个附件列。"-->
<!--          placement="bottom"-->
<!--          :target="attachmentSelector?.$el"-->
<!--      />-->
<!--      <el-tour-step-->
<!--          title="内容列"-->
<!--          description="请在此处选择待预览的内容列（支持多选），默认会选中表格的索引列。"-->
<!--          placement="bottom"-->
<!--          :target="textSelector?.$el"-->
<!--      />-->
<!--      <el-tour-step-->
<!--          title="图片浏览"-->
<!--          description="先点击左侧表格的任意单元格进行定位，再点击一次本插件窗口后使用滚轮进行滚动浏览。"-->
<!--          placement="bottom"-->
<!--          :target="scrollToBrowse?.$el"-->
<!--      />-->
<!--      <el-tour-step-->
<!--          title="快速翻页"-->
<!--          description="使用导航按钮以换行。"-->
<!--          placement="bottom"-->
<!--          :target="prevAndNext?.$el"-->
<!--      />-->
<!--    </el-tour>-->
  </el-config-provider>
</template>
<script setup lang="ts">
import {computed, onMounted, onUnmounted, reactive, ref} from "vue";
import {bitable, IAttachmentField, IGridView} from "@lark-base-open/js-sdk";
import {ElConfigProvider} from 'element-plus';
import {useAppStore} from './store/modules/app'
import {QuestionFilled, Refresh, ArrowLeftBold, ArrowRightBold, WarningFilled} from '@element-plus/icons-vue'
import {useTheme} from './hooks/useTheme';
import {useDark} from '@vueuse/core'

const prevAndNext = ref<any>(null);
const attachmentSelector = ref<any>(null);
const textSelector = ref<any>(null);
const scrollToBrowse = ref<any>(null);

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
      isLoading.value = false;
    } else {
      lastRecordId.value = recordId;
      currentCellPicUrlList.value = []
      tableVal.value = null;
      isLoading.value = false;
    }
  } catch (e) {
    currentCellPicUrlList.value = []
    tableVal.value = null;
    isLoading.value = false;
  } finally {
    carouselIndex.newVal = 0;
    carouselIndex.oldVal = 0;
  }
}
const defaultTextFieldSet = ref<Array<any>>([])
const openTour = ref(false)
onMounted(async () => {
  await bitable.bridge.getLanguage().then((lang) => {
    switchLang(lang)
  })
  useDark()
  openTour.value = true;
  const table = await bitable.base.getActiveTable();
  onSelectionChangeHandler = bitable.base.onSelectionChange(onSelectionChange)
  // 获取列的列表
  tableFieldMetaList.value = await table.getFieldMetaList()
  const primary = tableFieldMetaList.value.filter(obj => obj.isPrimary)
  previewTextFieldList.value = tableFieldMetaList
      .value.map(obj => obj.id)
      .filter((value: any) => appStore.previewTextFields.includes(value));
  if (primary.length) {
    defaultTextFieldSet.value = [primary[0].id];
  }
  if (primary.length && !appStore.previewTextFields.length) {
    await onPreviewChange([primary[0].id])
  }
})
const resetCache = () => {
  previewTextFieldList.value = defaultTextFieldSet.value
  onPreviewChange(defaultTextFieldSet.value)
}
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
const onPreviewChange = async (e: any) => {
  appStore.changePreviewTextFields(e);
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

.pic-container::-webkit-scrollbar {
  width: 8px;
}

.pic-container::-webkit-scrollbar-track {
  background: #f8f8f8;
}

.pic-container::-webkit-scrollbar-thumb {
  background: #b0b0b0;
  border-radius: 12px;
}
</style>
