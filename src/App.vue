<template>
  <div class="flex flex-col">
    <div class="flex flex-row items-center ml-2 mb-2 pr-2">
      <span>请选择待预览的图片列：</span>
      <el-select v-model="currentFieldId" placeholder="请选择列" size="large" style="flex: 1;"
                 @change="onFieldListChange">
        <el-option v-for="item in attachmentFieldMetaList" :key="item.id" :label="item.name" :value="item.id"/>
      </el-select>
    </div>
    <div class="flex flex-row items-center ml-2 mb-2 pr-2">
      <span>请选择待预览的内容列：</span>
      <el-select v-model="previewTextFieldList" multiple placeholder="请选择列" style="flex: 1;"
                 @change="onPreviewChange">
        <el-option v-for="item in othersFieldMetaList" :key="item.id" :label="item.name" :value="item.id"/>
      </el-select>
    </div>
    <template v-if="previewTextFieldList.length">
      <div class="flex flex-row ml-2 mb-2 pr-2" v-for="item in descriptions">
        <span>{{ item.name ? item.name : '-' }}：</span>
        <span>{{ tableVal ? tableVal[item.id] : '-' }}</span>
      </div>
    </template>
    <div class="flex flex-row items-center ml-2 mb-2">
      <span>← 先点击左侧的行预览，再点击一次本插件窗口后按键盘的方向键翻页</span>
    </div>
    <div style="width: 100%;" v-if="currentCellPicUrlList.length">
      <el-carousel height="70vh" :autoplay="false" v-loading.fullscreen.lock="isLoading" :loop="false"
                   ref="carousel"
                   @change="onCarouselChange"
                   direction="vertical">
        <el-carousel-item v-for="src in currentCellPicUrlList" :src="src">
          <img :src="src" style="width: 100%;height: auto;"/>
        </el-carousel-item>
      </el-carousel>
    </div>
    <div v-else class="ml-2">暂无图片</div>
  </div>
</template>
<script setup lang="ts">
import {computed, onMounted, onUnmounted, reactive, ref} from "vue";
import {bitable, IAttachmentField, IGridView} from "@lark-base-open/js-sdk";

let onSelectionChangeHandler: any = null;
const currentCellPicUrlList = ref<Array<any>>([])
const tableFieldMetaList = ref<Array<any>>([])
const visibleRecordIdList = ref<Array<any>>([])
const currentFieldId = ref<string>("")
const currentRecordId = ref<string>("")
const currentViewId = ref<string>("")
const isLoading = ref(false)
const lastRecordId = ref("");
const carousel = ref<any>(null);
const carouselIndex = reactive({
  newVal: 0,
  oldVal: 0
})
const previewTextFieldList = ref<Array<any>>([])
const onCarouselChange = (newVal: any, oldVal: any) => {
  carouselIndex.newVal = newVal;
  carouselIndex.oldVal = oldVal;
}
const tableVal = ref<any>({})
const handleKeyDown = async (event: any) => {
  if (event.keyCode === 37 || event.keyCode === 38) {
    if (carouselIndex.newVal === 0) {  // 假设 carouselIndex.newVal 表示当前轮播项索引
      const currentRecordIndex = visibleRecordIdList.value.findIndex(id => id === currentRecordId.value);
      if (currentRecordIndex > 0) {
        const prevRecordId = visibleRecordIdList.value[currentRecordIndex - 1];
        const table = await bitable.base.getActiveTable();
        const view = await table.getActiveView()
        const viewId = view.id;
        await onSelectionChange({data: {viewId, recordId: prevRecordId, refresh: true}})
        carousel.value.setActiveItem(currentCellPicUrlList.value.length - 1)  // 假设跳到前一记录的最后一张图片
      } else {
        carousel.value.prev();
      }
    } else {
      carousel.value.prev();
    }
  } else if (event.keyCode === 39 || event.keyCode === 40) {
    if (currentCellPicUrlList.value.length === 1 || currentCellPicUrlList.value.length <= carouselIndex.newVal + 1) {
      const currentRecordIndex = visibleRecordIdList.value.findIndex(id => id === currentRecordId.value);
      if (currentRecordIndex !== -1 && currentRecordIndex + 1 < visibleRecordIdList.value.length) {
        const nextRecordId = visibleRecordIdList.value[currentRecordIndex + 1];
        const table = await bitable.base.getActiveTable();
        const view = await table.getActiveView()
        const viewId = view.id;
        await onSelectionChange({data: {viewId, recordId: nextRecordId, refresh: true}})
        carousel.value.setActiveItem(0)
      } else carousel.value.next();
    } else carousel.value.next();
  }
};
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
  document.addEventListener('keydown', handleKeyDown);
  const table = await bitable.base.getActiveTable();
  onSelectionChangeHandler = bitable.base.onSelectionChange(onSelectionChange)
  // 获取列的列表
  tableFieldMetaList.value = await table.getFieldMetaList()
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
  document.removeEventListener('keydown', handleKeyDown);
})
</script>
<style scoped>
:deep(.is-active) {
  transition: none;
}

:deep(.is-animating) {
  transition: none;
}
</style>
