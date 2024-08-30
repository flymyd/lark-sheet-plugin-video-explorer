<template>
  <el-config-provider :locale="appStore.locale">
    <div class="flex flex-col overflow-x-hidden h-lvh">
      <el-collapse v-model="activeNames" class="w-full">
        <el-collapse-item :title="$t('hint.previewFieldConfig')" name="1">
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
            <el-select v-model="currentFieldId" size="large" class="flex-1" @change="onFieldListChange"
                       ref="attachmentSelector">
              <el-option v-for="item in attachmentFieldMetaList" :key="item.id" :label="item.name" :value="item.id"/>
            </el-select>
          </div>
          <div class="flex flex-col items-start ml-2 mb-2 pr-2">
            <span class="my-2">{{ $t('hint.textSelector') }}</span>
            <el-select v-model="previewTextFieldList"
                       multiple @change="onPreviewChange"
                       collapse-tags
                       collapse-tags-tooltip
                       :max-collapse-tags="3"
                       :multiple-limit="4"
                       class="flex-1" ref="textSelector">
              <el-option v-for="item in othersFieldMetaList" :key="item.id" :label="item.name" :value="item.id"/>
            </el-select>
          </div>
        </el-collapse-item>
        <el-collapse-item :title="$t('hint.previewFieldContent')" name="2" v-if="previewTextFieldList.length">
          <div class="mt-2 text-sm">
            <div class="flex flex-row ml-2 mb-2 pr-2" v-for="item in descriptions">
              <span>{{ item.name ? item.name : '-' }}：</span>
              <span>{{ tableVal ? tableVal[item.id] || '-' : '-' }}</span>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
      <el-image-viewer
          v-if="imageViewer"
          :initial-index="previewIndex"
          @close="()=>{imageViewer=false}"
          :url-list="currentCellPicUrlList"/>
      <div class="flex flex-col w-full overflow-y-scroll overflow-x-hidden pic-container mt-2"
           v-loading.fullscreen.lock="isLoading" v-if="currentCellPicUrlList.length">
        <template v-for="(pic, index) in currentCellPicUrlList" v-if="!isLoading">
          <img :src="pic" :class="['mb-2 w-full cursor-pointer',index===currentCellPicUrlList.length-1?'pb-20':'']"
               @click="showPic(index)"/>
        </template>
      </div>
      <div v-else
           class="m-2 min-h-56 flex flex-row justify-center items-center text-[#8d8d8d] text-lg select-none"
           :style="{
              background: currentTheme=='DARK'?'#707070':'#f5f5f5',
              color: currentTheme=='DARK'?'#bebebe':'#8d8d8d'
            }"
      >
        <el-icon class="mr-1">
          <WarningFilled/>
        </el-icon>
        {{ $t('hint.noPicture') }}
      </div>
      <div class="flex flex-row justify-center w-full bottom-12 fixed">
        <el-button-group ref="prevAndNext">
          <el-button type="warning" @click="changePage(false)">
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
  </el-config-provider>
</template>
<script setup lang="ts">
import {computed, onMounted, onUnmounted, reactive, ref} from "vue";
import {bitable, IAttachmentField, IGridView} from "@lark-base-open/js-sdk";
import {base, PermissionEntity, OperationType} from '@lark-base-open/js-sdk';
import {ElConfigProvider, ElMessage} from 'element-plus';
import {useAppStore} from './store/modules/app'
import {QuestionFilled, Refresh, ArrowLeftBold, ArrowRightBold, WarningFilled} from '@element-plus/icons-vue'
import {useTheme} from './hooks/useTheme';

const prevAndNext = ref<any>(null);
const attachmentSelector = ref<any>(null);
const textSelector = ref<any>(null);
const activeNames = ref(['1', '2'])

const appStore = useAppStore()
const {theme: currentTheme} = useTheme();
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
const pageToken = ref(0);
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
  const hasPermission = await base.getPermission({
    entity: PermissionEntity.Base,
    type: OperationType.Printable
  })
  if (hasPermission) {
    try {
      const attachmentField = await table.getField<IAttachmentField>(currentFieldId.value);
      currentViewId.value = event?.data?.viewId ?? '';
      const view = await table.getViewById(currentViewId.value) as IGridView;
      let queryOptions: any = {
        pageSize: 200
      }
      if (pageToken.value !== 0) {
        queryOptions['pageToken'] = pageToken.value;
      }
      const recordIdListInfo = await view.getVisibleRecordIdListByPage(queryOptions)
      console.log(recordIdListInfo)
      pageToken.value = recordIdListInfo.pageToken;
      visibleRecordIdList.value = recordIdListInfo.recordIds;
      const recordId = event?.data?.recordId ?? '';
      currentRecordId.value = recordId;
      if (lastRecordId.value == recordId && !event?.data?.refresh) {
        return;
      } else if (recordId) {
        lastRecordId.value = recordId;
        currentCellPicUrlList.value = await attachmentField.getAttachmentUrls(recordId);
        console.log(currentCellPicUrlList.value)
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
  } else {
    ElMessage.error('你没有权限访问此附件！')
    currentCellPicUrlList.value = []
    tableVal.value = null;
    isLoading.value = false;
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
const resetCache = async () => {
  previewTextFieldList.value = defaultTextFieldSet.value
  await onPreviewChange(defaultTextFieldSet.value)
  tableVal.value = {}
  currentCellPicUrlList.value = []
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
const imageViewer = ref(false)
const previewIndex = ref(0)
const showPic = (index: number) => {
  previewIndex.value = index;
  imageViewer.value = true
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

:deep(.el-collapse-item__header) {
  padding-left: 0.5rem;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 0.5rem;
}
</style>
