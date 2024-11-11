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
            <!--            <el-button class="m-2" @click="resetCache" ref="reset">-->
            <!--              <el-icon class="mr-1">-->
            <!--                <Refresh/>-->
            <!--              </el-icon>-->
            <!--              {{ $t('hint.reset') }}-->
            <!--            </el-button>-->
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
        <el-collapse-item :title="$t('hint.previewFieldContent')" name="2">
          <div class="mt-2 text-sm">
            <div class="flex flex-row ml-2 mb-2 pr-2">
              <span>行号：</span>
              <span>{{ getCurrentRecordIndexFormat }}</span>
            </div>
            <div class="flex flex-row ml-2 mb-2 pr-2" v-for="item in descriptions" v-if="previewTextFieldList.length">
              <template v-if="item.type!=17">
                <span>{{ item.name ? item.name : '-' }}：</span>
                <!--                <span>{{ tableVal ? tableVal[item.id] || '-' : '-' }}</span>-->
                <template v-if="tableVal">
                  <template v-if="item.type==1 || item.type==2">
                    <div v-if="tableVal[item.id]" class="flex flex-col">
                      <span v-for="sel in tableVal[item.id]" style="min-height: 1em;"
                            v-html="textSpliter(sel.text)"></span>
                    </div>
                    <span v-else>-</span>
                  </template>
                  <template v-if="item.type==3">
                    <el-tag v-if="tableVal[item.id]" disable-transitions round>
                      {{ tableVal[item.id].text }}
                    </el-tag>
                    <span v-else>-</span>
                  </template>
                  <template v-if="item.type==4">
                    <div v-if="tableVal[item.id]" class="flex flex-row">
                      <el-tag class="mr-2" v-for="sel in tableVal[item.id]" disable-transitions round>
                        {{ sel.text }}
                      </el-tag>
                    </div>
                    <span v-else>-</span>
                  </template>
                </template>
                <span v-else>-</span>
              </template>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
      <div class="flex flex-row w-full overflow-y-scroll overflow-x-hidden video-container mt-2"
           v-loading.fullscreen.lock="isLoading" v-if="currentCellVideoUrlList.length">
        <template v-for="item in descriptions" v-if="!isLoading">
          <div class="flex flex-col w-full mb-2 flex-1" v-if="item.type==17">
            <span class="text-center mb-2">{{ item.name ? item.name : '-' }}：</span>
            <img :src="tableVal[item.id]"/>
          </div>
        </template>
        <div v-for="(video, i) in currentCellVideoUrlList" v-if="!isLoading"
             class="flex flex-col w-full mb-2 flex-1"
             :style="{ width: `calc((100% - 20px * (${currentCellVideoUrlList.length} - 1)) / ${currentCellVideoUrlList.length})` }"
        >
          <span class="text-center mb-2">{{ currentFieldIdsName[i] }}</span>
          <video :ref="setVideoRef" :src="video" autoplay controls class="cursor-pointer" v-if="video"
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
            <el-input v-if="item.type===1 && tableValEdit[item.id]" v-model="tableValEdit[item.id]['val']"
                      @input="(e)=>onInputChange(e, item)"/>
            <el-input v-if="item.type===2 && tableValEdit[item.id]" v-model.number="tableValEdit[item.id]['val']"
                      @input="(e)=>onInputChange(e, item)" type="number"/>
            <el-select v-else-if="item.type===3 && tableValEdit[item.id]" v-model="tableValEdit[item.id]['val']"
                       @change="(e)=>onSelectChange(e, item)">
              <el-option v-for="item in tableValEdit[item.id]['field']['property']['options']" :key="item.id"
                         :label="item.name"
                         :value="item.id"/>
            </el-select>
            <el-select v-else-if="item.type===4 && tableValEdit[item.id]" multiple
                       v-model="tableValEdit[item.id]['val']"
                       clearable
                       @clear="(e)=>onSelectChange(e, item, true)"
                       @change="(e)=>onSelectChange(e, item, true)">
              <el-option v-for="item in tableValEdit[item.id]['field']['property']['options']" :key="item.id"
                         :label="item.name"
                         :value="item.id"/>
            </el-select>
          </div>
        </div>
        <div class="flex flex-row justify-center">
          <el-button type="primary" @click="replayAllVideos">重播</el-button>
        </div>
      </div>
      <div class="flex flex-row justify-center w-full bottom-8 fixed">
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
import {
  bitable,
  FieldType,
  IAttachmentField,
  IGridView,
  IMultiSelectFieldMeta,
  IOpenMultiSelect,
  IOpenSingleSelect,
  ISingleSelectFieldMeta
} from "@lark-base-open/js-sdk";
import {base, PermissionEntity, OperationType} from '@lark-base-open/js-sdk';
import {ElConfigProvider, ElMessage, ElMessageBox} from 'element-plus';
import {useAppStore} from './store/modules/app'
import {QuestionFilled, ArrowLeftBold, ArrowRightBold, WarningFilled} from '@element-plus/icons-vue'
import {useTheme} from './hooks/useTheme';
import pinyin from 'pinyin';

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
const currentRecordIndex = ref<any>(-1);
const changePage = async (next: boolean) => {
  const currentRecordIndexT = visibleRecordIdList.value.findIndex(id => id === currentRecordId.value);
  const table = await bitable.base.getActiveTable();
  const view = await table.getActiveView()
  const viewId = view.id;
  let toRecordId;
  if (next) {
    toRecordId = visibleRecordIdList.value[currentRecordIndexT + 1];
  } else {
    toRecordId = visibleRecordIdList.value[currentRecordIndexT - 1];
  }
  await onSelectionChange({data: {viewId, recordId: toRecordId, refresh: true}})
}
const onSelectionChange = async (event: any) => {
  let currentRecordIndexT;
  if (event?.data?.resetNo ?? 0) {
    currentRecordIndexT = event.data.resetNo
  } else currentRecordIndexT = visibleRecordIdList.value.findIndex(id => id === event.data.recordId);
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
      if (currentRecordIndexT === -1) {
        pageToken.value = 0
      } else if (currentRecordIndexT <= visibleRecordIdList.value.length) {
        pageToken.value = currentRecordIndexT
      } else {
        pageToken.value = currentRecordIndexT
        // ElMessage.warning("请重置行号")
      }
      let queryOptions: any = {
        pageSize: 200,
        pageToken: Number(pageToken.value)
      }
      const recordIdListInfo = await view.getVisibleRecordIdListByPage(queryOptions)
      const arrSet = new Set([...visibleRecordIdList.value, ...recordIdListInfo.recordIds])
      visibleRecordIdList.value = Array.from(arrSet);
      const recordId = event?.data?.recordId ?? '';
      currentRecordId.value = recordId;
      if (event?.data?.resetNo ?? 0) {
        currentRecordIndex.value = Number(event.data.resetNo)
        currentRecordId.value = recordIdListInfo.recordIds[0]
      } else {
        currentRecordIndex.value = visibleRecordIdList.value.findIndex(id => id === currentRecordId.value);
      }
      if (lastRecordId.value == currentRecordId.value && !event?.data?.refresh) {
        return;
      } else if (currentRecordId.value) {
        lastRecordId.value = currentRecordId.value;
        let tableV: any = {}
        for (let k of previewTextFieldList.value) {
          const metaInfo: any = await table.getFieldMetaById(k);
          let v;
          if (metaInfo.type === 17) {
            const attachmentField = await table.getField<any>(k);
            const url = await table.getCellString(k, currentRecordId.value)
            if (url) {
              try {
                v = await attachmentField.getAttachmentUrls(currentRecordId.value);
              } catch (e) {
                v = ''
              }
            }
          } else {
            v = await table.getCellValue(k, currentRecordId.value);
            console.log(v)
          }
          await Object.defineProperty(tableV, k, {
            value: v,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
        tableVal.value = tableV;
        let tableVEdit: any = {}
        for (let k of editTextFieldList.value) {
          const originVal = await table.getCellValue(k, currentRecordId.value);
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
              recordId: currentRecordId.value,
              val,
              field
            },
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
        tableValEdit.value = tableVEdit;
        let videoUrlLists: Array<any> = [];
        for (let i = 0; i < attachmentFields.length; i++) {
          const origin = await attachmentFields[i].getValue(recordId);
          if (origin) {
            const url = await attachmentFields[i].getAttachmentUrls(recordId);
            videoUrlLists.push(url)
          } else {
            videoUrlLists.push('')
          }
        }
        currentCellVideoUrlList.value = videoUrlLists;
        isLoading.value = false;
      } else {
        lastRecordId.value = recordId;
        currentCellVideoUrlList.value = []
        videoRefs.value = [];
        tableVal.value = null;
        isLoading.value = false;
      }
    } catch (e) {
      currentCellVideoUrlList.value = []
      videoRefs.value = [];
      tableVal.value = null;
      isLoading.value = false;
    } finally {
      carouselIndex.newVal = 0;
      carouselIndex.oldVal = 0;
    }
  } else {
    ElMessage.error('你没有权限访问此附件！')
    currentCellVideoUrlList.value = []
    videoRefs.value = [];
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
  // previewTextFieldList.value = defaultTextFieldSet.value
  // editTextFieldList.value = defaultEditTextFieldSet.value
  // await onPreviewChange(defaultTextFieldSet.value)
  // await onEditChange(defaultEditTextFieldSet.value)
  // tableVal.value = {}
  // currentCellVideoUrlList.value = []
  const table = await bitable.base.getActiveTable();
  const view = await table.getActiveView()
  const viewId = view.id;
  ElMessageBox.prompt('请输入当前行号', '定位', {
    inputPattern: /^\d+$/,
    inputErrorMessage: '请输入正整数',
  }).then(({value}) => {
    onSelectionChange({data: {viewId, refresh: true, resetNo: Number(value)}})
  })
}
// const attachmentFieldsMetaList = computed(() => {
//   const list = tableFieldMetaList.value.filter(obj => obj.type === 17);
//   if (list.length) {
//     currentFieldIds.value = [list[0].id];
//   }
//   return list;
// })
// 定义排序函数
function compare(a, b) {
  // 获取 name 属性值
  const nameA = a.name;
  const nameB = b.name;

  // 检查是否为数字
  if (!isNaN(nameA) && !isNaN(nameB)) {
    return nameA - nameB; // 数字直接比较大小
  }

  // 如果一个是数字另一个不是，数字排在前面
  if (!isNaN(nameA)) return -1;
  if (!isNaN(nameB)) return 1;

  // 检查是否为英文
  if (/^[a-zA-Z]/.test(nameA) && /^[a-zA-Z]/.test(nameB)) {
    return nameA.localeCompare(nameB); // 英文使用 localeCompare 比较
  }

  // 如果一个是英文另一个不是，英文排在前面
  if (/^[a-zA-Z]/.test(nameA)) return -1;
  if (/^[a-zA-Z]/.test(nameB)) return 1;

  // 处理汉字
  const pinyinA = pinyin(nameA.charAt(0), { style: pinyin.STYLE_FIRST_LETTER }).join('').toUpperCase();
  const pinyinB = pinyin(nameB.charAt(0), { style: pinyin.STYLE_FIRST_LETTER }).join('').toUpperCase();
  //
  return pinyinA.localeCompare(pinyinB); // 按拼音首字母排序
}
const attachmentFieldsMetaList = computed(() => {
  const list = tableFieldMetaList.value.filter(obj => obj.type === 17);
  // 使用 sort 函数排序列表
  list.sort(compare);
  // 更新当前字段 ID
  if (list.length) {
    currentFieldIds.value = [list[0].id];
  }
  return list;
});
const othersFieldMetaList = computed(() => {
  // return tableFieldMetaList.value.filter(obj => obj.type !== 17);
  console.log(tableFieldMetaList.value)
  tableFieldMetaList.value.sort(compare);
  return tableFieldMetaList.value;
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
  const selectField = await table.getField(item.id);
  const recordDetail = tableValEdit.value[item.id];
  const selectFieldMeta: IMultiSelectFieldMeta | ISingleSelectFieldMeta = await selectField.getMeta() as any;
  /** 所选字段的选项 */
  const exitOptions = selectFieldMeta.property.options

  const type = selectFieldMeta.type;
  if (type === FieldType.SingleSelect) {
    // 处理单选
    if ((e && typeof e === 'object' && e.id) || typeof e === 'string') {
      const valueInFind = exitOptions.find(({id}) => id === e.id || e === id);
      const newValue: IOpenSingleSelect | null = valueInFind ? {id: valueInFind.id, text: valueInFind.name} : null;
      if (newValue) {
        // 找到了才设置进去
        await selectField.setValue(recordDetail.recordId, newValue)
      } else {
        alert('单选-Toast警告：选项不存在，不创建选项，跳过');
        console.log('单选-Toast警告：选项不存在，不创建选项，跳过', e)
      }
    } else {
      alert('单选-Toast警告：将要设置空值')
    }
    return;
  } else if (type === FieldType.MultiSelect) {
    // 处理多选
    if (Array.isArray(e) && e.length) {
      /** e中，在已存在选项中存在的值 */
      const newValue: IOpenMultiSelect = [];
      /** 是否要创建新的选项 */
      const shouldCreate: any[] = []
      e.forEach((v) => {
        const exit = exitOptions.find(({id}) => id === v.id || v === id);
        if (exit) {
          newValue.push({
            id: exit.id,
            text: exit.name,
          });
        } else {
          shouldCreate.push(v);
        }
      });
      await selectField.setValue(recordDetail.recordId, newValue);
      if (shouldCreate.length) {
        alert('多选-Toast警告：存在选项之外的值，不知道要不要创建选项');
        console.log({
          exitOptions,
          shouldCreate,
          e,
        })
      }
    } else {
      alert('多选-Toast警告：将设置空值')
    }

    return;
  }

  alert('toast警告:预期之外，不是单选也不是多选字段，还需要再额外开发')


  // if (!e && multiple) {
  //   await selectField.setValue(recordDetail.recordId, [])
  // } else {
  //   await selectField.setValue(recordDetail.recordId, e)
  // }
}

const getCurrentRecordIndexFormat = computed(() => currentRecordIndex.value + 1)

const videoRefs = ref([]); // 用于存储所有的 video 元素引用
const setVideoRef = (el) => {
  if (el) {
    videoRefs.value.push(el);
  }
};
const replayAllVideos = () => {
  videoRefs.value.forEach(video => {
    if (!video.paused) {
      video.pause();
    }
    video.currentTime = 0;
    video.play();
  });
};
const textSpliter = (text: string) => {
  return text.replace(/\n/g, '<br>');
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
