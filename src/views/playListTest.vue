<template>
  <div class="search">
  
  </div>
  <div>
    <!-- 左侧歌单列表 -->
    <ul class="playlist">
      <li class="title">歌单</li>
      <!-- 遍历歌单数据 -->
      <li
              v-for="(playlist, index) in playListData"
              :key="index"
              @click="selectPlaylist(index)"
              @contextmenu="handlePlaylistContextMenu(index, $event)"
      >
        <!-- 显示歌单名称 -->
        {{ Object.keys(playlist)[0] }}
      </li>
      <li>
        <button @click="addPlayList">添加歌单</button>
      </li>
    </ul>
    
    <!-- 右键菜单：歌单操作 -->
    <ul
            v-if="showPlaylistMenu"
            class="context-menu"
            :style="{ top: `${playlistMenuPosition.y}px`, left: `${playlistMenuPosition.x}px` }"
            @click.stop
    >
      <li @click="renamePlaylist">重命名歌单</li>
      <li @click="deletePlaylist">删除歌单</li>
    </ul>
    
    <!-- 右侧歌曲列表 -->
    <ul class="songList">
      <li class="title">
        <p class="number">序号</p>
        <p class="name">歌曲名称</p>
        <p class="type">文件类型</p>
        <p class="duration">时长</p>
      </li>
      <!-- 遍历当前歌单中的歌曲 -->
      <li
              v-for="(song, index) in currentPlayListSongs"
              :key="song.fileId"
              @click="selectSong(song, index)"
              @dblclick="router.push('/AudioView')"
              @contextmenu="handleContextMenu(song, $event)"
      >
        <p class="number">{{ index + 1 }}</p>
        <p class="name">{{ getFileName(song.name) }}</p>
        <p class="type">{{ getFileType(song.name) }}</p>
        <p class="duration">{{ formatDuration(song.duration) }}</p>
      </li>
    </ul>
    
    <!-- 自定义右键菜单 -->
    <ul
            v-if="showContextMenu"
            class="context-menu"
            :style="{ top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }"
            @click.stop
    >
      <li @click="handleDeleteLocal(selectedSong)">删除本地歌曲</li>
      <li @click="handleDeleteCloudDrive(selectedSong)">删除云盘歌曲和歌词</li>
      <li @click="handleSave(selectedSong)">添加到</li>
    </ul>
  </div>
  
  <!-- 保存到歌单弹窗 -->
  <div class="saveTo" v-show="saveToIsShow">
    <div class="content">
      <ul>
        <!-- 遍历所有歌单 -->
        <li v-for="(playlist, index) in playListData" :key="index">
          <input
                  type="checkbox"
                  :value="Object.keys(playlist)[0]"
                  v-model="selectedPlayList"
          />
          {{ Object.keys(playlist)[0] }}
        </li>
      </ul>
      <button @click="enterSaveTo(selectedPlayList, playListData,songPar);selectedPlayList = [];">
        确定
      </button>
      <button @click=" saveToIsShow = false; selectedPlayList = [];">
        取消
      </button>
    </div>
  </div>
  
  <!-- 新增歌单弹窗 -->
  <div ref="addPlayListRef" class="addPlayList" v-show="addPlayListIsShow">
    <input
            type="text"
            class="playListName"
            placeholder="输入歌单名称(不能重复或为空,最好不要用纯数字,如果必须请以0开头)"
            v-model="newPlaylistName"
    >
    <button @click="enterAddPlayList">
      确定
    </button>
    <button @click="cancelAddPlayList">
      取消
    </button>
  </div>
</template>

<script setup lang="ts">
  import {ref, reactive, onMounted, onBeforeUnmount, computed} from 'vue';
  import {useGetAudio} from "../store/audio.ts";
  import {useGetPlayList} from "../store/playList.ts";
  import {storeToRefs} from "pinia";
  import router from "../router";
  import {invoke} from "@tauri-apps/api/core";
  import axios from "axios";
  import useSaveTo from "../hooks/useSaveTo.ts";
  
  // 引入 Pinia 中的状态
  const {playListData} = storeToRefs(useGetPlayList());
  const {
    playingPlayList,
    selectedPlaylist,
    playingSong,
    playingSongKey,
    controlAudioKey,
    shuffledIndex,
    isPlaying,
    audioDuration
  } = storeToRefs(useGetAudio());
  
  
  // 引入saveTo
  const {
    saveToIsShow,
    enterSaveTo,
    updateBackendPlaylist
  } = useSaveTo();
  
  // 当前选中的歌单索引
  const currentPlayListIndex = ref(-1);
  
  // 计算属性：当前歌单的名称
  const currentPlayListName = computed(() => {
    if (currentPlayListIndex.value >= 0 && currentPlayListIndex.value < playListData.value.length) {
      return Object.keys(playListData.value[currentPlayListIndex.value])[0];
    }
    return "";
  });
  
  // 计算属性：当前歌单中的歌曲
  const currentPlayListSongs = computed(() => {
    if (currentPlayListIndex.value >= 0 && currentPlayListIndex.value < playListData.value.length) {
      const playlist = playListData.value[currentPlayListIndex.value];
      return playlist[Object.keys(playlist)[0]];
    }
    return [];
  });
  
  // 获取本地播放状态初始化
  onMounted(async () => {
    await invoke("get_all_audio_data").then((result: any) => {
      console.log("从后端获取的原始数据:", result);
      
      // 将后端数据转换为新的数组格式
      const transformedData = transformData(result);
      console.log("转换后的数据:", transformedData);
      
      playListData.value = transformedData;
      
      const saved = JSON.parse(localStorage.getItem("audio") as string);
      const savedIndex = playListData.value.findIndex((playlist: any) =>
        Object.keys(playlist)[0] === saved?.selectedPlaylist
      );
      
      currentPlayListIndex.value = savedIndex >= 0 ? savedIndex : 0;
      selectedPlaylist.value = currentPlayListName.value;
    });
  });
  
  // 转换数据格式的函数
  function transformData(data: any): any[] {
    // 如果数据已经是数组格式，直接返回
    if (Array.isArray(data)) return data;
    
    // 如果是旧的对象格式，转换为新格式
    if (typeof data === 'object' && !Array.isArray(data)) {
      return Object.keys(data).map(key => ({[key]: data[key]}));
    }
    
    // 其他情况返回空数组
    return [];
  }
  
  // 选择歌单
  function selectPlaylist(index: number) {
    currentPlayListIndex.value = index;
    selectedPlaylist.value = currentPlayListName.value;
  }
  
  // 点击歌曲
  function selectSong(song: any, index: number) {
    console.log("selectSong");
    playingSong.value = getFileName(song.name);
    isPlaying.value = true;
    playingSongKey.value = song.fileId;
    
    audioDuration.value = song.duration;
    playingPlayList.value = selectedPlaylist.value;
    
    controlAudioKey.value = index;
    
    const randomPlaylist = JSON.parse(localStorage.getItem("randomPlaylist") as string);
    for (let i = 0; i < randomPlaylist.length; i++) {
      console.log(playingSong.value, "playingSong.value");
      console.log(randomPlaylist[i].name.substring(0, randomPlaylist[i].name.lastIndexOf(".")));
      if (randomPlaylist[i].name.substring(0, randomPlaylist[i].name.lastIndexOf(".")) ===
        playingSong.value) {
        console.log(i, "i");
        shuffledIndex.value = i;
        break;
      }
    }
  }
  
  // 获取文件名（不含后缀）
  function getFileName(name: string): string {
    return name.substring(0, name.lastIndexOf("."));
  }
  
  // 获取文件后缀名
  function getFileType(name: string): string {
    return name.substring(name.lastIndexOf(".") + 1);
  }
  
  // 格式化时长
  function formatDuration(duration: number): string {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }
  
  // 右键菜单控制
  const showContextMenu = ref(false);
  const menuPosition = reactive({x: 0, y: 0});
  const selectedSong = ref<any>(null);
  
  function handleContextMenu(song: any, event: MouseEvent) {
    event.preventDefault();
    selectedSong.value = song;
    menuPosition.x = event.clientX;
    menuPosition.y = event.clientY;
    showContextMenu.value = true;
  }
  
  // 关闭菜单
  function hideContextMenu() {
    showContextMenu.value = false;
  }
  
  onMounted(() => {
    window.addEventListener('scroll', hideContextMenu);
    window.addEventListener("click", () => {
      showContextMenu.value = false;
      showPlaylistMenu.value = false;
    });
  });
  
  onBeforeUnmount(() => {
    window.removeEventListener('click', hideContextMenu);
    window.removeEventListener('scroll', hideContextMenu);
  });
  
  // 删除本地歌曲
  async function handleDeleteLocal(song: any) {
    if (currentPlayListIndex.value === -1) return;
    
    const playlistKey = Object.keys(playListData.value[currentPlayListIndex.value])[0];
    const songs = playListData.value[currentPlayListIndex.value][playlistKey];
    
    // 找到并删除歌曲
    const index = songs.findIndex((s: any) => s.fileId === song.fileId);
    if (index !== -1) {
      songs.splice(index, 1);
      
      // 更新歌单数据
      playListData.value[currentPlayListIndex.value][playlistKey] = [...songs];
      
      // 保存到后端
      await updateBackendPlaylist(playListData.value);
    }
    
    hideContextMenu();
  }
  
  // 删除云盘歌曲
  async function handleDeleteCloudDrive(song: any) {
    // 删除云盘操作
    const data = JSON.stringify({
      "drive_id": localStorage.getItem("drive_id"),
      "file_id": song.fileId
    });
    
    const config = {
      method: 'post',
      url: '/aliyun-api/adrive/v1.0/openFile/recyclebin/trash',
      headers: {
        'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      data: data
    };
    
    axios(config).then(() => {
      const body = JSON.stringify({
        "drive_id": localStorage.getItem("drive_id"),
        "file_path": `/1/${song.name.substring(0, song.name.lastIndexOf("."))}.lrc`
      });
      
      const config = {
        method: 'post',
        url: '/aliyun-api/adrive/v1.0/openFile/get_by_path',
        headers: {
          'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        data: body
      };
      axios(config).then(({data: {file_id}}) => {
        const data = JSON.stringify({
          "drive_id": localStorage.getItem("drive_id"),
          "file_id": file_id
        });
        
        const config = {
          method: 'post',
          url: '/aliyun-api/adrive/v1.0/openFile/recyclebin/trash',
          headers: {
            'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
            'Content-Type': 'application/json',
            'Accept': '*/*',
          },
          data: data
        };
        axios(config);
      });
      
    });
    
    // 从所有歌单中删除歌曲
    for (let i = 0; i < playListData.value.length; i++) {
      const playlistKey = Object.keys(playListData.value[i])[0];
      const songs = playListData.value[i][playlistKey];
      
      playListData.value[i][playlistKey] = songs.filter((s: any) => s.fileId !== song.fileId);
    }
    
    // 保存到后端
    await updateBackendPlaylist(playListData.value);
    
    hideContextMenu();
  }
  
  let songPar: any;
  
  function handleSave(song: any) {
    // 显示添加到歌单弹窗
    saveToIsShow.value = true;
    
    songPar = song;
    hideContextMenu();
  }
  
  // 用户当前勾选的歌单索引
  const selectedPlayList = ref<number[]>([]);
  
  
  // 新增歌单弹窗相关
  const addPlayListIsShow = ref(false);
  const addPlayListRef = ref<HTMLElement | null>(null);
  const newPlaylistName = ref("");
  
  // 显示新增歌单弹窗
  function addPlayList() {
    newPlaylistName.value = "";
    addPlayListIsShow.value = true;
  }
  
  // 确认新增歌单
  async function enterAddPlayList() {
    const name = newPlaylistName.value.trim();
    
    if (!name) {
      alert("歌单名称不能为空");
      return;
    }
    
    // 检查歌单名称是否重复
    const exists = playListData.value.some((playlist: any) =>
      Object.keys(playlist)[0] === name
    );
    
    if (exists) {
      alert("歌单名称已存在");
      return;
    }
    
    // 添加新歌单
    playListData.value.push({[name]: []});
    
    // 保存到后端
    await updateBackendPlaylist(playListData.value);
    
    addPlayListIsShow.value = false;
  }
  
  // 取消新增歌单
  function cancelAddPlayList() {
    addPlayListIsShow.value = false;
  }
  
  // 歌单右键菜单相关
  const showPlaylistMenu = ref(false);
  const playlistMenuPosition = reactive({x: 0, y: 0});
  const selectedPlaylistIndex = ref(-1); // 被右键的歌单索引
  
  function handlePlaylistContextMenu(index: number, event: MouseEvent) {
    event.preventDefault();
    selectedPlaylistIndex.value = index;
    playlistMenuPosition.x = event.clientX;
    playlistMenuPosition.y = event.clientY;
    showPlaylistMenu.value = true;
  }
  
  // 删除歌单
  async function deletePlaylist() {
    if (selectedPlaylistIndex.value === -1) return;
    
    if (confirm(`确定要删除歌单「${Object.keys(playListData.value[selectedPlaylistIndex.value])[0]}」吗？`)) {
      // 删除歌单
      playListData.value.splice(selectedPlaylistIndex.value, 1);
      
      // 如果删除的是当前选中的歌单，切换到第一个歌单
      if (currentPlayListIndex.value === selectedPlaylistIndex.value) {
        currentPlayListIndex.value = playListData.value.length > 0 ? 0 : -1;
        selectedPlaylist.value = Object.keys(playListData.value[currentPlayListIndex.value])[0];
      }
      
      // 保存到后端
      await updateBackendPlaylist(playListData.value);
    }
    
    showPlaylistMenu.value = false;
  }
  
  // 重命名歌单
  async function renamePlaylist() {
    if (selectedPlaylistIndex.value === -1) return;
    
    const oldName = Object.keys(playListData.value[selectedPlaylistIndex.value])[0];
    const newName = prompt("请输入新的歌单名称", oldName);
    
    if (!newName || newName.trim() === "") {
      alert("歌单名称不能为空");
      return;
    }
    
    // 检查新名称是否已存在
    const exists = playListData.value.some((playlist: any, index: any) =>
      index !== selectedPlaylistIndex.value &&
      Object.keys(playlist)[0] === newName
    );
    
    if (exists) {
      alert("歌单名称已存在");
      return;
    }
    
    // 更新歌单名称
    const songs = playListData.value[selectedPlaylistIndex.value][oldName];
    playListData.value[selectedPlaylistIndex.value] = {[newName]: songs};
    
    // 如果重命名的是当前选中的歌单，更新当前歌单索引
    if (currentPlayListIndex.value === selectedPlaylistIndex.value) {
      selectedPlaylist.value = newName;
    }
    
    // 保存到后端
    await updateBackendPlaylist(playListData.value);
    
    showPlaylistMenu.value = false;
  }

</script>

<style scoped>
  /* 样式保持不变 */
  div {
    width: 100%;
    display: flex;
  }

  .playlist {
    width: 10%;
  }

  .playlist li:first-child, .songList li:first-child {
    border-top: black solid 1px;
  }

  :deep(.songList li) {
    display: flex;
    border-bottom: black solid 1px;
    border-left: black solid 1px;
    border-right: black solid 1px;
  }

  .playlist li {
    border-bottom: black solid 1px;
    border-left: black solid 1px;
  }

  .songList {
    width: 90%;
  }

  :deep(.number) {
    width: 10%;
  }

  :deep(.name) {
    width: 50%;
  }

  :deep(.type) {
    width: 20%;
  }

  :deep(.duration) {
    width: 20%;
  }


  .context-menu {
    position: fixed;
    z-index: 1000;
    background-color: #ffffff;
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 4px 0;
    width: 150px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  }

  .context-menu li {
    padding: 8px 16px;
    cursor: pointer;
  }

  .context-menu li:hover {
    background-color: #f5f5f5;
  }


  button {
    margin: 10px;
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

  .addPlayList {
    width: 400px;
    height: 200px;
    background-color: pink;
  }

  .playListName {
    margin: 20px;
    width: 200px;
    height: 50px;
  }
</style>