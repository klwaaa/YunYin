import {useGetRandomPlaylist} from "../store/randomPlaylist.ts";
import {storeToRefs} from "pinia";
import {watch, onUnmounted, ref} from "vue";
import {useGetAudio} from "../store/audio.ts";
import {useGetPlayList} from "../store/playList.ts";

export default function usePlaybackMode() {
  const {
    controlAudioKey,
    shuffledIndex,
    playingSongKey,
    playingSong,
    playbackModeIndex,
    currentAudioTime,
    playingPlayList,
  } = storeToRefs(useGetAudio());
  
  const playList = ref<any[]>([]);
  
  let intervalId: ReturnType<typeof setInterval> | null = null;
  useGetRandomPlaylist();
  
  const count = ref(0);
  let randomPlaylist = JSON.parse(<string>localStorage.getItem("randomPlaylist"));
  
  
  // 初始化播放列表
  const playListData = useGetPlayList();
  
  
  watch([playListData, playingPlayList], () => {
    for (let i = 0; i < playListData.playListData.length; i++) {
      if (Object.keys(playListData.playListData[i])[0] === playingPlayList.value) {
        playList.value = playListData.playListData[i][Object.keys(playListData.playListData[i])[0]];
        break;
      }
    }
  }, {deep: true, immediate: true});
  
  function shuffled() {
    const shuffled = [...playList.value];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    randomPlaylist = shuffled;
    localStorage.setItem("randomPlaylist", JSON.stringify(shuffled));
    playList.value = randomPlaylist;
  }
  
  // 清理定时器
  const clearPlaybackInterval = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
  
  // 处理歌曲结束逻辑
  const handleTrackEnd = () => {
    
    switch (playbackModeIndex.value) {
      
      case 2: // 随机播放
        if (count.value > 1) {
          shuffled();
        }
        
        // 监听是否切换歌单
        watch([playingPlayList, playListData], () => {
          shuffled();
        });
    }
  };
  
  // 监听播放模式变化
  watch(playbackModeIndex, () => {
    clearPlaybackInterval();
    count.value++;
    handleTrackEnd();
  }, {immediate: true});
  
  
  // 单独监听随机播放下标
  watch(controlAudioKey, () => {
    if (playbackModeIndex.value !== 2) {
      playingSongKey.value = playList.value[controlAudioKey.value].fileId;
      playingSong.value = playList.value[controlAudioKey.value].name;
      for (let i = 0; i < randomPlaylist.length; i++) {
        if (randomPlaylist[i].fileId === playList.value[controlAudioKey.value].fileId) {
          shuffledIndex.value = i;
          break;
        }
      }
    }
  });
  
  // 组件卸载时清理
  onUnmounted(() => {
    clearPlaybackInterval();
    currentAudioTime.value = 0;
  });
}