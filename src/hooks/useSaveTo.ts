import {ref} from "vue";
import {invoke} from "@tauri-apps/api/core";

export default function () {
  // 是否展示保存到那个歌单
  const saveToIsShow = ref(false);
  
  // 保存歌曲到选中的一个或多个歌单中
  async function enterSaveTo(selectedPlayList: any, playListData: any, song?: any, selectedAudios?: any) {
    // 判断传入的是单个歌曲，还是选中多个歌曲
    const songsToAdd = song ? [song] : selectedAudios;
    
    // 遍历用户选中的歌单索引列表
    for (const index of selectedPlayList) {
      
      // 防止索引越界
      if (index < 0 || index >= playListData.length) continue;
      
      // 获取当前歌单对象的 key（例如 "歌单1"）
      for (let i = 0; i < playListData.length; i++) {
        if (!playListData[i][index]) {
          continue;
        }
        
        // 获取对应的歌曲数组
        const songs = playListData[i][index];
        
        // 创建 Set 存储已有的 fileId，用于去重
        const existingIds = new Set(songs.map((s: any) => s.fileId));
        
        // 过滤掉已存在的歌曲，只保留新添加的
        const filtered = songsToAdd.filter((s: any) => !existingIds.has(s.fileId));
        
        // 如果有新歌曲需要添加
        if (filtered.length > 0) {
          // 将新歌曲添加到歌单中
          songs.push(...filtered);
          
          // 触发 Vue 的响应式更新（必须重新赋值）
          playListData[i][index] = [...songs];
        }
      }
      
    }
    
    // 保存更新后的 playListData 到后端（例如写入本地 JSON）
    await updateBackendPlaylist(playListData);
    
    // 关闭弹窗
    saveToIsShow.value = false;
  }
  
  // 更新后端歌单数据
  async function updateBackendPlaylist(playListData: any) {
    try {
      await invoke("update_playlist_data", {
        data: playListData
      });
      console.log("歌单数据已更新到后端");
    } catch (err) {
      console.error("更新后端失败:", err);
    }
  }
  
  return {
    saveToIsShow,
    enterSaveTo,
    updateBackendPlaylist
  };
}