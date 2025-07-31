<template>
  <div class="musicLibrary_view">
    <div ref="selectedRef" class="selected">
      <button @click="saveToIsShow = true">saveAudio</button>
      <button @click="clickAll">clickAll</button>
      
      <ul>
        <li v-for="(item) in displayedList" :key="item.fileId">
          <input
                  type="checkbox"
                  :value="item"
                  v-model="selectedAudios"
          />
          {{ item.name }}
        </li>
      </ul>
    </div>
    <!--  保存到那个歌单-->
    <div class="saveTo" v-show="saveToIsShow">
      <div class="content">
        <ul>
          <li v-for="(playlist, index) in playListData"
              :key="index">
            <input
                    type="checkbox"
                    :value="Object.keys(playlist)[0]"
                    v-model="selectedPlayList"
            />
            {{ Object.keys(playlist)[0] }}
          </li>
        </ul>
        <button @click="enterSaveTo(selectedPlayList, playListData,undefined, selectedAudios);selectedPlayList = [];">
          确定
        </button>
        <button @click="saveToIsShow = false">
          取消
        </button>
      </div>
    </div>
    <div ref="loadMoreRef" class="loading-trigger"></div>
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
  
  // ✅ 模拟 localStorage 的已保存音频记录
  // const savedAudios: any = [];
  
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
    
    // ✅ fileId 去重，只添加新数据
    const existingIds = new Set(displayedList.value.map(item => item.fileId));
    const filteredNewItems = arr.filter((item: any) => !existingIds.has(item.fileId));
    displayedList.value.push(...filteredNewItems);
    
    if (!next_marker) observer.disconnect();
  }
  
  // ✅ 全选所有
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
  button {
    margin: 10px;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    margin: 6px 0;
  }

  input[type="checkbox"] {
    margin-right: 8px;
  }

  .saveTo {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.3);
  }

  .content {
    width: 40%;

    background: #fff;
    margin: 25% auto;
  }
</style>
