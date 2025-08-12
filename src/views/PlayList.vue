<template>
  <div class="playList_view">
    <div class="search">
      <!-- 搜索框 -->
      <input
          type="text"
          v-model="searchQuery"
          placeholder="搜索歌单或歌曲"
          class="search-box"
      />
    </div>
    <div class="playlistAndSong">
      <!-- 左侧歌单列表 -->
      <ul class="playlist">
        <li class="title">歌单</li>
        <!-- 遍历歌单数据，并过滤搜索匹配项 -->
        <li
            v-for="(playlist, index) in filteredPlaylists"
            :class="{ active: Object.keys(playlist)[0] === selectedPlaylist }"
            :key="index"
            @click="selectPlaylist(playlist,index)"
            @contextmenu="handlePlaylistContextMenu(index, $event)"
            :title="Object.keys(playlist)[0]"
        >
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
        <li @click="openRenameDialog">重命名歌单</li>
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
        <!-- 遍历当前歌单中的歌曲，并过滤搜索匹配项 -->
        <li
            v-for="(song, index) in filteredSongs"
            :key="song.fileId"
            @click="selectSong(song, index)"
            @dblclick="router.push('/AudioView')"
            @contextmenu="handleContextMenu(song, $event)"
            :class="{ active: song.fileId === playingSongKey&&playingPlayList===selectedPlaylist }"
            :title="getFileName(song.name)"
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
    <el-dialog
        class="el-dialog"
        v-model="saveToIsShow"
        title="保存到歌单"
        width="400px"
        center
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
        <el-button @click=" saveToIsShow = false; selectedPlayList = [];">取消</el-button>
        <el-button type="primary" @click="enterSaveTo(selectedPlayList, playListData,songPar);selectedPlayList = [];">
          确定
        </el-button>
      </template>
    </el-dialog>
    
    
    <!-- 新增歌单弹窗 -->
    <el-dialog
        class="el-dialog"
        v-model="addPlayListIsShow"
        title="新增歌单"
        width="400px"
        center
        :close-on-click-modal="false"
    >
      <div>
        <el-input
            v-model="newPlaylistName"
            placeholder="输入歌单名称（不能重复或为空）"
            @keyup.enter="enterAddPlayList"
        />
        <div v-if="addPlayListError" class="error-message">{{ addPlayListError }}</div>
      </div>
      <template #footer>
        <el-button @click="cancelAddPlayList">取消</el-button>
        <el-button type="primary" @click="enterAddPlayList">确定</el-button>
      </template>
    </el-dialog>
    <!--  renamePlaylist-->
    <el-dialog
        class="el-dialog"
        v-model="renameDialogVisible"
        title="重命名歌单"
        width="400px"
        center
    >
      <div>
        <el-input
            v-model="renameInput"
            placeholder="请输入新的歌单名称"
            @keyup.enter="confirmRename"
        />
        <div v-if="renameError" class="error-message">{{ renameError }}</div>
      </div>
      <template #footer>
        <el-button @click="renameDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRename">确定</el-button>
      </template>
    </el-dialog>
    
    <!--  右键确定删除-->
    <el-dialog
        class="el-dialog"
        v-model="confirmDialogVisible"
        :title="confirmDialogTitle"
        width="400px"
        center
        :close-on-click-modal="false"
        :close-on-press-escape="false"
    >
      <div>{{ confirmDialogMessage }}</div>
      <template #footer>
        <el-button @click="cancelConfirm">取消</el-button>
        <el-button type="primary" @click="confirmConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import {ref, reactive, onMounted, onBeforeUnmount, computed} from 'vue';
  import {useGetAudio} from "../store/audio.ts";
  import {useGetPlayList} from "../store/playList.ts";
  import {storeToRefs} from "pinia";
  import router from "../router";
  import {invoke} from "@tauri-apps/api/core";
  // import axios from "axios";
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
  
  // 搜索框输入的内容
  const searchQuery = ref('');
  
  // 计算属性：过滤后的歌单
  const filteredPlaylists = computed(() => {
    return playListData.value.filter((playlist: any) => {
      const playlistName = Object.keys(playlist)[0];
      return playlistName.toLowerCase().includes(searchQuery.value.toLowerCase());
    });
  });
  
  // 计算属性：过滤后的歌曲列表
  const filteredSongs = computed(() => {
    if (currentPlayListIndex.value >= 0 && currentPlayListIndex.value < playListData.value.length) {
      const playlist = playListData.value[currentPlayListIndex.value];
      const songs = playlist[Object.keys(playlist)[0]];
      return songs.filter((song: any) => {
        return song.name.toLowerCase().includes(searchQuery.value.toLowerCase());
      });
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
  function selectPlaylist(playlist:any, index: number) {
    if (!(searchQuery.value === "")) {
      let i: number = 0;
      for (const playlists of playListData.value) {
        if (Object.keys(playlists)[0]===Object.keys(playlist)[0]){
          currentPlayListIndex.value = i;
          selectedPlaylist.value = Object.keys(playlist)[0];
          return;
        }
        i++;
      }
    }

    currentPlayListIndex.value = index;
    selectedPlaylist.value = currentPlayListName.value;
  }
  // 点击歌曲
  function selectSong(song: any, index: number) {
    playingSong.value = song.name;
    isPlaying.value = true;
    playingSongKey.value = song.fileId;
    
    audioDuration.value = song.duration;
    playingPlayList.value = selectedPlaylist.value;
    
    const playlist = playListData.value[currentPlayListIndex.value];
    const songs = playlist[Object.keys(playlist)[0]];
    
    const randomPlaylist = JSON.parse(localStorage.getItem("randomPlaylist") as string);
    for (let i = 0; i < randomPlaylist.length; i++) {
      if (randomPlaylist[i].name ===
          playingSong.value) {
        shuffledIndex.value = i;
        break;
      }
    }
    if (!(searchQuery.value === "")) {
      let i: number = 0;
      for (const song of songs) {
        if (song.fileId === playingSongKey.value) {
          controlAudioKey.value = i;
          return;
        }
        i++;
      }
    }
    controlAudioKey.value = index;
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
    showPlaylistMenu.value = false;
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
  
  const confirmDialogVisible = ref(false);
  const confirmDialogTitle = ref("确认");
  const confirmDialogMessage = ref("");
  let confirmResolve: (value: boolean) => void;
  
  function useConfirm(message: string, title = "确认"): Promise<boolean> {
    return new Promise((resolve) => {
      confirmDialogTitle.value = title;
      confirmDialogMessage.value = message;
      confirmDialogVisible.value = true;
      confirmResolve = resolve;
    });
  }
  
  function confirmConfirm() {
    confirmDialogVisible.value = false;
    confirmResolve(true);
  }
  
  function cancelConfirm() {
    confirmDialogVisible.value = false;
    confirmResolve(false);
  }
  
  
  // 删除本地歌曲
  async function handleDeleteLocal(song: any) {
    // 确定删除
    const confirmDelete = await useConfirm(`确定要删除此歌单的「${getFileName(song.name)}」吗？（操作不会删除云盘中的歌曲）`);
    if (!confirmDelete) {
      hideContextMenu();
      return;
    }
    
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
    
    selectIsPlaying();
    
    hideContextMenu();
  }
  
  // 删除云盘歌曲
  async function handleDeleteCloudDrive(song: any) {
    // 确定删除
    const confirmDelete = await useConfirm(`确定要删除云盘中的「${getFileName(song.name)}」及其歌词吗？（操作会删除其他歌单的此歌曲）`);
    if (!confirmDelete) {
      hideContextMenu();
      return;
    }
    
    // 删除云盘操作
    await invoke("put_in_recycle_bin",{
      token:JSON.parse(<string>localStorage.getItem("token")).access_token,
      driveId: localStorage.getItem("drive_id"),
      fileId: song.fileId
    })
    try {
      const fileId: string = await invoke('using_path_get_data', {
        driveId: localStorage.getItem("drive_id"),
        token: JSON.parse(<string>localStorage.getItem("token")).access_token,
        filePath: `/1/${song.name.substring(0, song.name.lastIndexOf("."))}.lrc`
      });
      
      // 确保 fileId 成功返回并且不是空值
      if (fileId) {
        await invoke("put_in_recycle_bin", {
          token: JSON.parse(<string>localStorage.getItem("token")).access_token,
          driveId: localStorage.getItem("drive_id"),
          fileId: JSON.parse(fileId).fileId
        });
      } else {
        console.error("fileId 为空，无法执行回收站操作");
      }
    } catch (error) {
      console.error("执行操作时出错:", error);
    }
    
    // const data = JSON.stringify({
    //   "drive_id": localStorage.getItem("drive_id"),
    //   "file_id": song.fileId
    // });
    //
    // const config = {
    //   method: 'post',
    //   url: '/aliyun-api/adrive/v1.0/openFile/recyclebin/trash',
    //   headers: {
    //     'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
    //     'Content-Type': 'application/json',
    //     'Accept': '*/*',
    //   },
    //   data: data
    // };
    //
    // axios(config).then(() => {
    //   const body = JSON.stringify({
    //     "drive_id": localStorage.getItem("drive_id"),
    //     "file_path": `/1/${song.name.substring(0, song.name.lastIndexOf("."))}.lrc`
    //   });
    //
    //   const config = {
    //     method: 'post',
    //     url: '/aliyun-api/adrive/v1.0/openFile/get_by_path',
    //     headers: {
    //       'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
    //       'Content-Type': 'application/json',
    //       'Accept': '*/*'
    //     },
    //     data: body
    //   };
    //   axios(config).then(({data: {file_id}}) => {
    //     const data = JSON.stringify({
    //       "drive_id": localStorage.getItem("drive_id"),
    //       "file_id": file_id
    //     });
    //
    //     const config = {
    //       method: 'post',
    //       url: '/aliyun-api/adrive/v1.0/openFile/recyclebin/trash',
    //       headers: {
    //         'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
    //         'Content-Type': 'application/json',
    //         'Accept': '*/*',
    //       },
    //       data: data
    //     };
    //     axios(config);
    //   });
    //
    // });
    
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
  const newPlaylistName = ref('');
  const addPlayListError = ref('');
  
  // 显示新增歌单弹窗
  function addPlayList() {
    newPlaylistName.value = '';
    addPlayListError.value = '';
    addPlayListIsShow.value = true;
  }
  
  // 确认新增歌单
  async function enterAddPlayList() {
    const name = newPlaylistName.value.trim();
    
    if (!name) {
      addPlayListError.value = '歌单名称不能为空';
      return;
    }
    
    const exists = playListData.value.some((playlist: any) =>
        Object.keys(playlist)[0] === name
    );
    
    if (exists) {
      addPlayListError.value = '歌单名称已存在';
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
    showContextMenu.value = false;
  }
  
  // 删除歌单
  async function deletePlaylist() {
    if (selectedPlaylistIndex.value === -1) return;
    
    if (await useConfirm(`确定要删除歌单「${Object.keys(playListData.value[selectedPlaylistIndex.value])[0]}」吗？`)) {
      // 删除歌单
      playListData.value.splice(selectedPlaylistIndex.value, 1);
      
      // 如果删除的是当前选中的歌单，切换到第一个歌单
      if (currentPlayListIndex.value === selectedPlaylistIndex.value) {
        currentPlayListIndex.value = playListData.value.length > 0 ? 0 : -1;
        selectedPlaylist.value = Object.keys(playListData.value[currentPlayListIndex.value])[0];
        playingPlayList.value = selectedPlaylist.value;
      }
      
      // 保存到后端
      await updateBackendPlaylist(playListData.value);
    }
    
    showPlaylistMenu.value = false;
  }
  
  // 重命名歌单
  // state
  const renameDialogVisible = ref(false);
  const renameInput = ref('');
  const renameError = ref('');
  const oldPlaylistName = ref('');
  
  // 触发弹窗
  function openRenameDialog() {
    if (selectedPlaylistIndex.value === -1) return;
    
    oldPlaylistName.value = Object.keys(playListData.value[selectedPlaylistIndex.value])[0];
    renameInput.value = oldPlaylistName.value;
    renameError.value = '';
    renameDialogVisible.value = true;
  }
  
  // 确认重命名
  async function confirmRename() {
    const newName = renameInput.value.trim();
    
    if (!newName) {
      renameError.value = '歌单名称不能为空';
      return;
    }
    
    const exists = playListData.value.some((playlist: any, index: any) =>
        index !== selectedPlaylistIndex.value &&
        Object.keys(playlist)[0] === newName
    );
    
    if (exists) {
      renameError.value = '歌单名称已存在';
      return;
    }
    
    const songs = playListData.value[selectedPlaylistIndex.value][oldPlaylistName.value];
    playListData.value[selectedPlaylistIndex.value] = {[newName]: songs};
    
    if (currentPlayListIndex.value === selectedPlaylistIndex.value) {
      selectedPlaylist.value = newName;
      playingPlayList.value = newName;
    }
    
    await updateBackendPlaylist(playListData.value);
    renameDialogVisible.value = false;
    showPlaylistMenu.value = false;
  }
  
  const props = defineProps<{ count: number }>();
  const emit = defineEmits<{ (e: 'update:count', value: number): void }>();
  
  function selectIsPlaying() {
    let playList;
    if (selectedSong.value.fileId === playingSongKey.value) {
      console.log("selectIsPlaying");
      for (let i = 0; i < playListData.value.length; i++) {
        if (Object.keys(playListData.value[i])[0] === playingPlayList.value) {
          playList = (playListData.value[i][Object.keys(playListData.value[i])[0]]).length;
          break;
        }
      }
      console.log(playListData.value);
      if (controlAudioKey.value >= playList) {
        controlAudioKey.value = 0;
        return;
      }
      setTimeout(() => {
        emit('update:count', props.count + 1);
      }, 150);
    }
  }


</script>

<style scoped>
  /* ========== 全局布局 ========== */
  .playList_view {
    background-color: var(--md-sys-color-background);
    color: var(--md-sys-color-on-background);
  }
  
  
  /* 搜索框样式 */
  .search {
    margin: 10px 0;
    padding-bottom: 24px;
  }
  
  .search-box {
    width: 100%;
    padding: 12px 16px;
    border-radius: 24px;
    border: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface);
    color: var(--md-sys-color-on-surface);
    font-size: 1rem;
    transition: all 0.3s ease;
  }
  
  .search-box:focus {
    outline: none;
    border-color: var(--md-sys-color-primary);
    box-shadow: 0 0 0 2px rgba(var(--md-sys-color-primary), 0.2);
  }
  
  li:hover {
    cursor: pointer;
  }
  
  .title:hover {
    cursor: default;
  }
  
  /* 主体区域：左右分栏 */
  .playlistAndSong {
    margin-top: -15px;
    user-select: none;
    display: flex;
    justify-content: space-evenly;
    align-items: flex-start;
    height: calc(100vh - 260px);
    overflow: hidden; /* 关键点 */
  }
  
  .playlist::-webkit-scrollbar, .songList::-webkit-scrollbar {
    width: 8px;
  }
  
  .playlist::-webkit-scrollbar-track, .songList::-webkit-scrollbar-track {
    background: var(--md-sys-color-surface-container);
    border-radius: 4px;
  }
  
  .playlist::-webkit-scrollbar-thumb, .songList::-webkit-scrollbar-thumb {
    background: var(--md-sys-color-outline-variant);
    border-radius: 4px;
  }
  
  .playlist, .songList {
    overflow-y: auto; /* ✅ 出现滚动条 */
    max-height: 100%; /* ✅ 不允许超出红框 */
  }
  
  /* ========== 左侧歌单列表 ========== */
  .playlist {
    width: 13%;
    background-color: var(--md-sys-color-surface-container-low);
    border-radius: 16px;
    overflow-y: auto;
  }
  
  .playlist .title {
    grid-template-columns: 60px 3fr 1fr 1fr;
    padding: 10px;
    background-color: var(--md-sys-color-surface-container);
    position: sticky;
    top: 0;
    z-index: 10;
    font-weight: 600;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 0;
    font-size: 1.2rem;
    color: var(--md-sys-color-primary);
    display: flex;
    justify-content: center;
  }
  
  .playlist li {
    padding: 7px;
    cursor: pointer;
    transition: all 0.2s ease;
    align-items: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .playlist li:last-child {
    display: flex;
  }
  
  /* 歌单项悬停效果 */
  .playlist li:hover {
    background-color: var(--md-sys-color-surface-container);
  }
  
  /* 歌单项选中效果 */
  .playlist li.active {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    font-weight: 500;
  }
  
  /* 添加歌单按钮 */
  .playlist li button {
    width: 100%;
    padding: 7px 16px;
    border-radius: 12px;
    border: 1px dashed var(--md-sys-color-outline);
    background: transparent;
    color: var(--md-sys-color-on-surface);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 1rem;
    white-space: wrap;
  }
  
  .playlist li button:hover {
    background-color: var(--md-sys-color-surface-container);
    border-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-primary);
  }
  
  
  /* ========== 右侧歌曲列表 ========== */
  .songList {
    width: 83%;
    background-color: var(--md-sys-color-surface-container-low);
    border-radius: 16px;
    overflow-y: auto;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  
  .songList .title {
    display: grid;
    grid-template-columns: 60px 3fr 1fr 1fr;
    padding: 12px 24px;
    background-color: var(--md-sys-color-surface-container);
    position: sticky;
    top: 0;
    z-index: 10;
    font-weight: 600;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
  
  .songList .title p {
    color: var(--md-sys-color-primary);
    font-size: 1.2rem;
  }
  
  .songList li {
    display: grid;
    grid-template-columns: 60px 3fr 1fr 1fr;
    padding: 12px 24px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  /* 歌曲项悬停效果 */
  .songList li:hover {
    background-color: var(--md-sys-color-surface-container);
  }
  
  /* 歌曲项选中效果 */
  .songList li.active {
    background-color: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
  }
  
  /* 歌曲列表项内文本样式 */
  .songList p {
    padding: 0 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  
  .context-menu:last-child {
    min-width: 200px; /* 稍宽的最小宽度 */
  }
  
  /* 右键菜单样式 - Material Design 3规范 */
  .context-menu {
    position: fixed;
    background-color: var(--md-sys-color-surface-container); /* 使用表面容器颜色 */
    border-radius: 12px; /* 更大的圆角 */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), /* 增强阴影效果 */ 0 2px 6px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--md-sys-color-outline-variant); /* 轮廓变体颜色边框 */
    padding: 8px; /* 增加垂直内边距 */
    z-index: 1000;
    font-size: 0.95rem; /* 合适的字体大小 */
  }
  
  .context-menu li {
    border-radius: 6px; /* 更大的圆角 */
    padding: 12px 20px; /* 增加内边距 */
    color: var(--md-sys-color-on-surface); /* 表面上的文字颜色 */
    transition: background-color 0.2s ease,
    color 0.2s ease; /* 平滑过渡效果 */
    position: relative; /* 为图标定位 */
    display: flex; /* 使用flex布局 */
    align-items: center; /* 垂直居中 */
    gap: 12px; /* 图标和文字间距 */
  }
  
  .context-menu li:hover {
    background-color: var(--md-sys-color-surface-container-high); /* 悬停背景色 */
    color: var(--md-sys-color-primary); /* 悬停文字颜色 */
  }
  
  /* 覆盖 Element Plus 弹窗样式 */
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
  
  /* 输入框样式 */
  :deep(.el-input) {
    --el-input-bg-color: var(--md-sys-color-surface-container-low) !important;
    --el-input-text-color: var(--md-sys-color-on-surface) !important;
    --el-input-border-color: var(--md-sys-color-outline) !important;
    --el-input-hover-border-color: var(--md-sys-color-primary) !important;
    --el-input-focus-border-color: var(--md-sys-color-primary) !important;
  }
  
  :deep(.el-input__inner) {
    border-radius: 8px !important;
    padding: 10px 16px !important;
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
    border-color: var(--md-sys-color-surface-container) !important;
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
  
  /* 错误消息样式 */
  :deep(.error-message) {
    color: var(--md-sys-color-error) !important;
    margin-top: 8px;
    font-size: 15px;
    padding-top: 6px;
  }


</style>