<template>
  <div ref="selectedRef" class="selected">
    <button @click="saveTo">saveAudio</button>
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
  <div ref="saveToRef" class="saveTo" v-show="saveToIsShow">
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
      <button @click="enterSaveTo">
        确定
      </button>
      <button @click="cancelSaveTo">
        取消
      </button>
    </div>
  </div>
  <div ref="loadMoreRef" class="loading-trigger"></div>
</template>

<script setup lang="ts">
  import useGetAudioFiles from "../hooks/useGetMusicLibrary.ts";
  import {useGetPlayList} from "../store/playList.ts";
  import {ref, onMounted, onUnmounted} from "vue";
  import {invoke} from "@tauri-apps/api/core";
  import {storeToRefs} from "pinia";
  
  // 歌单数据
  const {playListData} = storeToRefs(useGetPlayList());
  
  //用户当前勾选的歌单
  const selectedPlayList = ref<any[]>([]);
  
  // 确定函数
  async function enterSaveTo() {
    for (let i = 0; i < selectedPlayList.value.length; i++) {
      let arr: any;
      
      for (let j = 0; j < playListData.value.length; j++) {
        if (Object.keys(playListData.value[j])[0] === selectedPlayList.value[i]) {
          arr = playListData.value[j][selectedPlayList.value[i]];
          break;
        }
      }
      
      const existingIds = new Set(arr.map((item: any) => item.fileId));
      const filteredNewItems = selectedAudios.value.filter((item: any) => !existingIds.has(item.fileId));
      if (filteredNewItems.length === 0) continue;
      
      // 增量拼接
      arr.push(...filteredNewItems);
    }
    
    await invoke("update_playlist_data", {
      data: playListData.value
    }).then(() => {
      console.log("播放列表已传给 Rust 后端");
    }).catch(err => {
      console.error("传给 Rust 后端失败:", err);
    });
    
    saveToIsShow.value = false;
    selectedPlayList.value = []; // 清空选择
  }
  
  // 取消函数
  function cancelSaveTo() {
    if (saveToRef.value) {
      saveToIsShow.value = false;
    }
  }
  
  // 保存到
  const saveToRef = ref<HTMLElement | null>(null);
  // 是否展示保存到那个歌单
  const saveToIsShow = ref(false);
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
  
  function saveTo() {
    
    if (saveToRef.value) {
      saveToIsShow.value = true;
    }
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
