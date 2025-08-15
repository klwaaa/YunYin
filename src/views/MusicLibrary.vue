<template>
  <div class="musicLibrary_view">
    <div ref="selectedRef" class="selected">
      <button class="btn-primary" @click="saveToIsShow = true">保存音频</button>
      <button class="btn-secondary" @click="clickAll">全选</button>
      <p class="prompt">一次最大显示100个请下滑加载更多</p>
      <ul>
        <li v-for="(item) in displayedList" :key="item.fileId">
          <label>
            <input
                type="checkbox"
                :value="item"
                v-model="selectedAudios"
            />
            {{ item.name }}
          </label>
        </li>
        <li ref="loadMoreRef" class="loading-trigger"></li>
      </ul>
    </div>
    
    <!--  保存到那个歌单-->
    <el-dialog
        v-model="saveToIsShow"
        title="保存到歌单"
        width="30%"
        :close-on-click-modal="false"
    >
      <el-checkbox-group v-model="selectedPlayList">
        <el-checkbox
            v-for="(playlist, index) in playListData"
            :key="index"
            :value="Object.keys(playlist)[0]"
        >
          {{ Object.keys(playlist)[0] }}
        </el-checkbox>
      </el-checkbox-group>
      
      <template #footer>
    <span class="dialog-footer">
      <el-button @click="saveToIsShow = false">取消</el-button>
      <el-button type="primary"
                 @click="enterSaveTo(selectedPlayList, playListData, undefined, selectedAudios);selectedPlayList=[]">确定</el-button>
    </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import useGetAudioFiles from "../hooks/useGetMusicLibrary.ts";
  import {useGetPlayList} from "../store/playList.ts";
  import {ref, onMounted, onUnmounted} from "vue";
  import {storeToRefs} from "pinia";
  import useSaveTo from "../hooks/useSaveTo.ts";
  
  
  // 引入saveTo
  const {
    saveToIsShow,
    enterSaveTo
  } = useSaveTo();
  
  // 歌单数据
  const {playListData} = storeToRefs(useGetPlayList());
  
  //用户当前勾选的歌单
  const selectedPlayList = ref<any[]>([]);
  
  // 选择区域
  const selectedRef = ref<HTMLElement | null>(null);
  // 所有展示的音频
  const displayedList = ref<any[]>([]);
  
  // 用户当前勾选的
  const selectedAudios = ref<any[]>([]);
  
  // 分页控制
  let oldArr: Array<any> = [];
  let oldNext_marker: string = "";
  
  // 加载更多触发元素
  const loadMoreRef = ref<HTMLElement | null>(null);
  let observer: IntersectionObserver;
  
  // 获取新数据并追加展示
  async function getNewAudios() {
    const {arr, next_marker} = await useGetAudioFiles(oldArr, oldNext_marker);
    oldArr = arr;
    oldNext_marker = next_marker;
    
    // fileId 去重，只添加新数据
    const existingIds = new Set(displayedList.value.map(item => item.fileId));
    const filteredNewItems = arr.filter((item: any) => !existingIds.has(item.fileId));
    displayedList.value.push(...filteredNewItems);
    
    if (!next_marker) observer.disconnect();
  }
  
  // 全选所有
  function clickAll() {
    selectedAudios.value = [...displayedList.value];
  }
  
  
  // 初始化监听器
  onMounted(() => {
    observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        getNewAudios();
      }
    }, {
      root: null,
      threshold: 0.1
    });
    
    if (loadMoreRef.value) {
      observer.observe(loadMoreRef.value);
    }
  });
  
  onUnmounted(() => {
    observer.disconnect();
  });
</script>

<style scoped>
  .musicLibrary_view {
    height: calc(100vh - 150px);
    overflow: hidden;
  }
  .prompt {
    color: var(--md-sys-color-error);
    font-size: 20px;
    margin-left: 10px;
  }
  button {
    margin: 10px;
    padding: 12px 24px;
    border-radius: 24px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
  }
  
  .btn-primary {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  
  .btn-secondary {
    background-color: var(--md-sys-color-surface-container);
    color: var(--md-sys-color-on-surface);
    border: 1px solid var(--md-sys-color-outline-variant);
  }
  
  .controls button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  .btn-primary:hover {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }
  
  .btn-secondary:hover {
    border-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-primary);
  }
  
  
  .selected {
    overflow-y: auto;
    max-height: 100%;
    background-color: var(--md-sys-color-surface-container-low);
    border-radius: 16px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  }
  
  .selected ul {
    list-style: none;
    padding-right: 10px;
    margin-top: 20px;
  }
  
  .selected::-webkit-scrollbar {
    width: 8px;
  }
  
  .selected::-webkit-scrollbar-track {
    background: var(--md-sys-color-surface-container);
    border-radius: 4px;
  }
  
  .selected::-webkit-scrollbar-thumb {
    background: var(--md-sys-color-outline-variant);
    border-radius: 4px;
  }
  
  .selected li {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-radius: 12px;
    margin-bottom: 8px;
    margin-left: 5px;
    transition: all 0.2s ease;
    background-color: var(--md-sys-color-surface-container);
    user-select: none;
  }
  
  .selected li label {
    width: 100%;
    cursor: pointer;
  }
  
  .selected li:hover {
    background-color: var(--md-sys-color-surface-container-high);
    cursor: pointer;
  }
  
  .selected li:last-child {
    background-color: var(--md-sys-color-outline-variant);
    padding: 0;
    margin-bottom: 0;
  }
  
  .selected input[type="checkbox"] {
    margin-right: 16px;
    width: 20px;
    height: 20px;
    accent-color: var(--md-sys-color-primary);
  }
  
  .selected li:hover input[type="checkbox"] {
    border-color: var(--md-sys-color-primary);
    transform: scale(1.1);
  }
  
  .selected span {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  
  :deep(.el-dialog) {
    background-color: var(--md-sys-color-surface) !important;
    color: var(--md-sys-color-on-surface) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2) !important;
    overflow: hidden;
  }
  
  :deep(.el-dialog__title) {
    color: var(--md-sys-color-primary) !important;
    font-weight: 500;
    font-size: 18px;
  }
  
  :deep(.el-dialog__body) {
    padding: 24px !important;
    color: var(--md-sys-color-on-surface) !important;
  }
  
  /* 复选框样式 */
  :deep(.el-checkbox-group) {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  /* 复选框内部悬停效果 */
  :deep(.el-checkbox:hover .el-checkbox__inner) {
    border-color: var(--md-sys-color-primary);
    transform: scale(1.1);
  }
  
  :deep(.el-checkbox) {
    margin-right: 0;
  }
  
  :deep(.el-checkbox__label) {
    color: var(--md-sys-color-on-surface) !important;
  }
  
  :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    background-color: var(--md-sys-color-primary) !important;
    border-color: var(--md-sys-color-primary) !important;
  }
  
  /* 按钮样式 */
  :deep(.el-button) {
    border-radius: 8px !important;
    padding: 10px 20px !important;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  :deep(.el-button--primary) {
    background-color: var(--md-sys-color-primary) !important;
    border-color: var(--md-sys-color-primary) !important;
    
  }
  
  :deep(.el-button--primary span) {
    color: var(--md-sys-color-on-primary) !important;
  }
  
  :deep(.el-button--primary:hover) {
    background-color: var(--md-sys-color-primary-container) !important;
    border-color: var(--md-sys-color-primary-container) !important;
  }
  
  :deep(.el-button--primary:hover span) {
    color: var(--md-sys-color-on-primary-container) !important;
  }
  
  :deep(.el-button:not(.el-button--primary)) {
    background-color: var(--md-sys-color-surface-container-high) !important;
    border-color: var(--md-sys-color-outline) !important;
  }
  
  :deep(.el-button:not(.el-button--primary) span) {
    color: var(--md-sys-color-on-surface) !important;
  }
  
  :deep(.el-button:not(.el-button--primary):hover) {
    background-color: var(--md-sys-color-surface-container) !important;
    
  }
  
  :deep(.el-button:not(.el-button--primary):hover span) {
    color: var(--md-sys-color-on-primary-container) !important;
  }
</style>
