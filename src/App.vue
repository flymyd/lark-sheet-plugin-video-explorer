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
            <el-select multiple v-model="currentFieldIds" size="large" class="flex-1" @change="onFieldListChange"
                       ref="attachmentSelector">
              <el-option v-for="item in attachmentFieldsMetaList" :key="item.id" :label="item.name" :value="item.id"/>
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
          <div class="flex flex-col items-start ml-2 mb-2 pr-2">
            <span class="my-2">{{ $t('hint.editSelector') }}</span>
            <el-select v-model="editTextFieldList"
                       multiple @change="onEditChange"
                       collapse-tags
                       collapse-tags-tooltip
                       :max-collapse-tags="3"
                       :multiple-limit="4"
                       class="flex-1" ref="editSelector">
              <el-option v-for="item in othersFieldMetaList" :key="item.id" :label="item.name" :value="item.id"/>
            </el-select>
          </div>
        </el-collapse-item>
        <el-collapse-item :title="$t('hint.previewFieldContent')" name="2" v-if="previewTextFieldList.length">
          <div class="mt-2 text-sm">
            <div class="flex flex-row ml-2 mb-2 pr-2" v-if="currentRecordIndex!==-1">
              <span>行号：</span>
              <span>{{ currentRecordIndex + 1 }}</span>
            </div>
            <div class="flex flex-row ml-2 mb-2 pr-2" v-for="item in descriptions">
              <span>{{ item.name ? item.name : '-' }}：</span>
              <span>{{ tableVal ? tableVal[item.id] || '-' : '-' }}</span>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
      <div class="flex flex-row w-full overflow-y-scroll overflow-x-hidden video-container mt-2"
           v-loading.fullscreen.lock="isLoading" v-if="currentCellVideoUrlList.length">
        <div v-for="(video, i) in currentCellVideoUrlList" v-if="!isLoading"
             class="flex flex-col w-full mb-2 flex-1"
             :style="{ width: `calc((100% - 20px * (${currentCellVideoUrlList.length} - 1)) / ${currentCellVideoUrlList.length})` }"
        >
          <span class="text-center mb-2">{{ currentFieldIdsName[i] }}</span>
          <video :src="video" autoplay controls class="cursor-pointer"
                 :style="{height: '50vh', objectFit: 'contain', background: '#000'}"/>
        </div>
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
        {{ $t('hint.noVideo') }}
      </div>
      <div v-if="currentRecordIndex!==-1" class="mb-24">
        <div class="mt-2 text-sm">
          <div class="flex flex-row ml-2 mb-2 pr-2 items-center" v-for="item in descriptionsEdit">
            <span>{{ item.name ? item.name : '-' }}：</span>
            <el-input v-if="item.type===1" v-model="tableValEdit[item.id]['val']"
                      @input="(e)=>onInputChange(e, item)"/>
            <el-select v-else-if="item.type===3" v-model="tableValEdit[item.id]['val']"
                       @change="(e)=>onSelectChange(e, item)">
              <el-option v-for="item in tableValEdit[item.id]['field']['property']['options']" :key="item.id"
                         :label="item.name"
                         :value="item.id"/>
            </el-select>
            <el-select v-else-if="item.type===4" multiple v-model="tableValEdit[item.id]['val']"
                       clearable
                       @clear="(e)=>onSelectChange(e, item, true)"
                       @change="(e)=>onSelectChange(e, item, true)">
              <el-option v-for="item in tableValEdit[item.id]['field']['property']['options']" :key="item.id"
                         :label="item.name"
                         :value="item.id"/>
            </el-select>
            <span v-else>{{tableValEdit[item.id]['val']}}</span>
          </div>
        </div>
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
import {bitable, IAttachmentField, IGridView, ITextField, IMultiSelectField} from "@lark-base-open/js-sdk";
import {base, PermissionEntity, OperationType} from '@lark-base-open/js-sdk';
import {ElConfigProvider, ElMessage} from 'element-plus';
import {useAppStore} from './store/modules/app'
import {QuestionFilled, Refresh, ArrowLeftBold, ArrowRightBold, WarningFilled} from '@element-plus/icons-vue'
import {useTheme} from './hooks/useTheme';

const modelCache = ref<any>({})
const prevAndNext = ref<any>(null);
const attachmentSelector = ref<any>(null);
const textSelector = ref<any>(null);
const editSelector = ref<any>(null);
const activeNames = ref(['1', '2'])

const appStore = useAppStore()
const {theme: currentTheme} = useTheme();
let onSelectionChangeHandler: any = null;
const currentCellVideoUrlList = ref<Array<any>>([])
const tableFieldMetaList = ref<Array<any>>([])
const visibleRecordIdList = ref<Array<any>>([])
const currentFieldIds = ref<string[]>([])
const currentRecordId = ref<string>("")
const currentViewId = ref<string>("")
const isLoading = ref(false)
const lastRecordId = ref("");
const carouselIndex = reactive({
  newVal: 0,
  oldVal: 0
})
const previewTextFieldList = ref<Array<any>>([])
const editTextFieldList = ref<Array<any>>([])
const tableVal = ref<any>({})
const tableValEdit = ref<any>({})
const pageToken = ref(0);
const currentRecordIndex = ref(-1);
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
      const attachmentFields: Array<any> = new Array(currentFieldIds.value.length);
      for (let i = 0; i < currentFieldIds.value.length; i++) {
        attachmentFields[i] = await table.getField<IAttachmentField>(currentFieldIds.value[i])
      }
      currentViewId.value = event?.data?.viewId ?? '';
      const view = await table.getViewById(currentViewId.value) as IGridView;
      let queryOptions: any = {
        pageSize: 200
      }
      if (pageToken.value !== 0) {
        queryOptions['pageToken'] = pageToken.value;
      }
      const recordIdListInfo = await view.getVisibleRecordIdListByPage(queryOptions)
      pageToken.value = recordIdListInfo.pageToken;
      visibleRecordIdList.value = recordIdListInfo.recordIds;
      const recordId = event?.data?.recordId ?? '';
      currentRecordId.value = recordId;
      currentRecordIndex.value = visibleRecordIdList.value.findIndex(id => id === currentRecordId.value)
      if (lastRecordId.value == recordId && !event?.data?.refresh) {
        return;
      } else if (recordId) {
        lastRecordId.value = recordId;
        let videoUrlLists: Array<any> = [];
        for (let i = 0; i < attachmentFields.length; i++) {
          videoUrlLists.push(await attachmentFields[i].getAttachmentUrls(recordId))
        }
        currentCellVideoUrlList.value = videoUrlLists;
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
        let tableVEdit: any = {}
        for (let k of editTextFieldList.value) {
          const originVal = await table.getCellValue(k, recordId);
          const field = await table.getFieldMetaById(k);
          let val: any;
          if (field.type === 1) {
            if (originVal) {
              val = originVal.map(o => o.text).join("")
            } else val = ''
          } else if (field.type === 3) {
            if (originVal) {
              val = originVal.id
            } else val = ''
          } else if (field.type === 4) {
            if (originVal) {
              val = originVal.map(o => o.id)
            } else val = []
          }
          await Object.defineProperty(tableVEdit, k, {
            value: {
              recordId,
              val,
              field
            },
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
        tableValEdit.value = tableVEdit;
        isLoading.value = false;
      } else {
        lastRecordId.value = recordId;
        currentCellVideoUrlList.value = []
        tableVal.value = null;
        isLoading.value = false;
      }
    } catch (e) {
      currentCellVideoUrlList.value = []
      tableVal.value = null;
      isLoading.value = false;
    } finally {
      carouselIndex.newVal = 0;
      carouselIndex.oldVal = 0;
    }
  } else {
    ElMessage.error('你没有权限访问此附件！')
    currentCellVideoUrlList.value = []
    tableVal.value = null;
    isLoading.value = false;
    carouselIndex.newVal = 0;
    carouselIndex.oldVal = 0;
  }
}
const defaultTextFieldSet = ref<Array<any>>([])
const defaultEditTextFieldSet = ref<Array<any>>([])
onMounted(async () => {
  await bitable.bridge.getLanguage().then((lang) => {
    switchLang(lang)
  })
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
  editTextFieldList.value = tableFieldMetaList
      .value.map(obj => obj.id)
      .filter((value: any) => appStore.editTextFields.includes(value));
  if (primary.length) {
    defaultEditTextFieldSet.value = [primary[0].id];
  }
  if (primary.length && !appStore.editTextFields.length) {
    await onEditChange([primary[0].id])
  }
})
const resetCache = async () => {
  previewTextFieldList.value = defaultTextFieldSet.value
  editTextFieldList.value = defaultEditTextFieldSet.value
  await onPreviewChange(defaultTextFieldSet.value)
  await onEditChange(defaultEditTextFieldSet.value)
  tableVal.value = {}
  currentCellVideoUrlList.value = []
}
const attachmentFieldsMetaList = computed(() => {
  const list = tableFieldMetaList.value.filter(obj => obj.type === 17);
  if (list.length) {
    currentFieldIds.value = [list[0].id];
  }
  return list;
})
const othersFieldMetaList = computed(() => {
  return tableFieldMetaList.value.filter(obj => obj.type !== 17);
})
const descriptions = computed(() => previewTextFieldList.value.map(k => othersFieldMetaList.value.find(obj => obj.id == k)))
const descriptionsEdit = computed(() => editTextFieldList.value.map(k => othersFieldMetaList.value.find(obj => obj.id == k)))
const currentFieldIdsName = ref<any>([]);
const onFieldListChange = async (e: any) => {
  currentFieldIds.value = e;
  currentFieldIdsName.value = currentFieldIds.value.map((k: any) => {
    const res = attachmentFieldsMetaList.value.filter(o => o.id == k);
    return res[0].name
  })
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
const onEditChange = async (e: any) => {
  appStore.changeEditTextFields(e);
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
const onInputChange = async (e: any, item: any) => {
  const table = await bitable.base.getActiveTable();
  const recordDetail = tableValEdit.value[item.id];
  await table.setCellValue(item.id, recordDetail.recordId, e)
}
const onSelectChange = async (e: any, item: any, multiple: boolean = false) => {
  const table = await bitable.base.getActiveTable();
  const selectField = await table.getField<any>(item.id);
  const recordDetail = tableValEdit.value[item.id];
  if (!e && multiple) {
    await selectField.setValue(recordDetail.recordId, [])
  } else {
    await selectField.setValue(recordDetail.recordId, e)
  }
}

</script>
<style scoped>
:deep(.is-active) {
  transition: none;
}

:deep(.is-animating) {
  transition: none;
}

.video-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 20px;
}

.video-container::-webkit-scrollbar {
  width: 8px;
}

.video-container::-webkit-scrollbar-track {
  background: #f8f8f8;
}

.video-container::-webkit-scrollbar-thumb {
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
