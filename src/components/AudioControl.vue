<template>
  <div class="audio-control">
    <p class="SongTitle" :title="playingSong">
      {{ playingSong }}
    </p>
    <div class="control_AudioDuration">
      <div class="audioDuration">
        <p class="currentAudioTime">{{ formatTime(currentAudioTime) }}</p>
        <el-slider
                
                v-model="currentAudioTime"
                :max="Number(audioDuration)"
                :format-tooltip="formatTime"
                show-tooltip
                @change="handleChange"
                style="width: 100%"
        />
        <p class="audioDurationMax">{{ formatTime(audioDuration) }}</p>
      </div>
      <div class="control">
        <button @click="changePlaybackMode" class="playbackMode" ref="playbackModeRef"></button>
        <button @click="previousSong();debounceChooseSong();">previousSong</button>
        <button @click="control">control</button>
        <button @click="nextSong();debounceChooseSong();">nextSong</button>
      </div>
    </div>
    <div class="volumeControl" ref="volumeControl">
      <transition name="fade">
        <el-slider
                v-show="showVolume"
                v-model="volume"
                :min="0"
                :max="100"
                :step="1"
                @input="updateVolume"
                show-tooltip
                vertical
                height="150px"
                class="volume-slider"
        />
      </transition>
      <button class="volumeControl-div" @click="showVolumeControl">
        音量
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import useGetAudiosUrl from "../hooks/useGetAudiosUrl.ts";
  import axios from "axios";
  import {onMounted, onUnmounted, reactive, ref, watch} from "vue";
  import {useGetAudio} from "../store/audio.ts";
  import {storeToRefs} from "pinia";
  import usePlaybackMode from "../hooks/usePlaybackMode.ts";
  import {useGetPlayList} from "../store/playList.ts";

  
  let change: any = null;
  let controlPlay: any = null;
  onMounted(() => {
    console.log("mounted");
    const playbackModeHtml: any = document.querySelector(".playbackMode");
    playbackModeHtml.innerHTML = PlaybackMode[playbackModeIndex.value];
    changePlaybackMode = () => {
      playbackModeIndex.value++;
      if (playbackModeIndex.value > 2) {
        playbackModeIndex.value = 0;
      }
      playbackModeHtml.innerHTML = PlaybackMode[playbackModeIndex.value];
      // usePlaybackMode();
    };
    document.addEventListener('click', handleClickOutside);
  });
  
  const PlaybackMode = [
    "列表循环",
    "单曲循环",
    "随机循环"
  ];
  let changePlaybackMode: any;
  const {
    isPlaying,
    playingSongKey,
    playingSong,
    playbackModeIndex,
    shuffledIndex,
    volume,
    globalAudioBufferDuration,
    currentAudioTime,
    controlAudioKey,
    audioDuration,
    playingPlayList
  } = storeToRefs(useGetAudio());
  
  
  watch(playbackModeIndex, (newIndex) => {
    playbackModeIndex.value = newIndex;
    
    if (playbackModeIndex.value === 2) {
      randomPlaylist = JSON.parse(localStorage.getItem("randomPlaylist") as string);
      console.log(randomPlaylist, "randomPlaylist watch");
      for (let i = 0; i < randomPlaylist.length; i++) {
        console.log(playingSong.value, "playingSong.value");
        console.log(randomPlaylist[i].name.substring(0, randomPlaylist[i].name.lastIndexOf(".")));
        if (randomPlaylist[i].name === playingSong.value) {
          console.log(i, "i");
          shuffledIndex.value = i;
          break;
        }
      }
      controlAudioKeyCount = shuffledIndex.value;
    } else {
      controlAudioKeyCount = controlAudioKey.value;
      // playingAudio.value = playList[controlAudioKeyCount].name;
    }
  });
  
  
  const playListData = useGetPlayList();
  
  let playList: any;
  
  
  watch(playListData, () => {
    for (let i = 0; i < playListData.playListData.length; i++) {
      if (Object.keys(playListData.playListData[i])[0] === playingPlayList.value) {
        playList = playListData.playListData[i][Object.keys(playListData.playListData[i])[0]];
        console.log(playList);
        break;
      }
    }
    setTimeout(() => {
      playingSongKey.value = playList[controlAudioKey.value].fileId;
      playingSong.value = playList[controlAudioKey.value].name;
    }, 100);
  }, {deep: true});
  
  
  let randomPlaylist = JSON.parse(localStorage.getItem("randomPlaylist") as string);
  console.log(randomPlaylist, "randomPlaylist");
  let controlAudioKeyCount: number = 0;

  
  if (!playList) {
    setTimeout(() => {
      for (let i = 0; i < playListData.playListData.length; i++) {
        if (Object.keys(playListData.playListData[i])[0] === playingPlayList.value) {
          playList = playListData.playListData[i][Object.keys(playListData.playListData[i])[0]];
          console.log(playList);
          break;
        }
      }
      console.log(playListData.playListData);
      if (playbackModeIndex.value === 2) {
        controlAudioKeyCount = shuffledIndex.value;
        // playingAudio.value = randomPlaylist[controlAudioKeyCount].name;
      } else {
        controlAudioKeyCount = controlAudioKey.value;
        // playingAudio.value = playList[controlAudioKeyCount].name;
      }
      // playingAudio.value = playList[controlAudioKey.value].name;
      for (let i = 0; i < playList.length; i++) {
        if (playList[i].name.substring(0, playList[i].name.lastIndexOf(".")) === playingSong.value) {
          audioDuration.value = Number(playList[i].duration);
          console.log("audioDuration", audioDuration.value);
          break;
        }
      }
    }, 500);
  } else {
    if (playbackModeIndex.value === 2) {
      controlAudioKeyCount = shuffledIndex.value;
      // playingAudio.value = randomPlaylist[controlAudioKeyCount].name;
    } else {
      controlAudioKeyCount = controlAudioKey.value;
      // playingAudio.value = playList[controlAudioKeyCount].name;
    }
    // playingAudio.value = playList[controlAudioKey.value].name;
    for (let i = 0; i < playList.length; i++) {
      if (playList[i].name.substring(0, playList[i].name.lastIndexOf(".")) === playingSong.value) {
        audioDuration.value = Number(playList[i].duration);
        console.log("audioDuration", audioDuration.value);
        break;
      }
    }
  }
  
  
  globalAudioBufferDuration.value = 0;
  // 得到文件下载链接
  let audioUrl: any, audioSize: any;
  await useGetAudiosUrl(playingSongKey.value).then((data) => {
    audioUrl = data.audioUrl;
    audioSize = data.audioSize;
  }).catch((err) => {
    console.log(err);
  })
  ;
  console.log(playList);
  const originalAudioSize = audioSize;
  let audioTime: number = 0;
  console.log(audioSize);
  // 确定分片大小和数据请求位置
  let dataPosition: number = 0;
  let dataSize: number = 800000;
  // 确定分成几片
  const iterations: number = Math.floor(audioSize / dataSize);
  console.log(iterations);
  const iterationsGroup: number = Math.floor(audioSize / (dataSize * 6));
  console.log(iterationsGroup);
  
  let iterationsCount: number = 0;
  let iterationsGroupCount: number = 0;
  
  const BlobAudioData: Blob[] = reactive([]);
  let audioCtx: AudioContext = new AudioContext();
  let source: AudioBufferSourceNode;
  const sourceNodes: AudioBufferSourceNode[] = [];
  let oldSource: any;
    let globalAudioBuffer: any = ref();
  const gainNode = audioCtx.createGain();
  
  
  //初始化音频时间滑块
  currentAudioTime.value = 0;
  let newSource: AudioBufferSourceNode;
  let isFirst: boolean = true;
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };
  
  
  //控制音频时间
  const handleChange = () => {
    console.log('绑定变量值为:', currentAudioTime.value); // 也可以直接从 ref 中拿
    if (isPlaying.value) {
      console.log(isPlaying.value, "isPlaying.value");
      if (oldSource !== undefined) {
        source?.stop();
        oldSource = undefined;
      }
      if (isFirst) {
        isFirst = false;
        source?.stop();
        console.log(isFirst, "isFirst");
        change = watch(globalAudioBuffer, () => {
          if (controlPlay !== null) {
            controlPlay();
          }
          console.log(BlobAudioData, "isPlaying.value");
          newSource?.stop(audioCtx.currentTime);
          newSource = audioCtx.createBufferSource();
          newSource.buffer = globalAudioBuffer.value;
          newSource.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          newSource?.start(0, currentAudioTime.value + 0.299);
        });
      } else {
        newSource?.stop();
      }
      newSource = audioCtx.createBufferSource();
      newSource.buffer = globalAudioBuffer.value;
      console.log(newSource.buffer, "handleChange");
      for (const source of sourceNodes) {
        try {
          source.stop(); // 会立即停止播放或取消排程
        } catch (e) {
          console.warn('Failed to stop source:', e);
          sourceNodes.length = 0;
        }
      }
      newSource.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      newSource.start(audioCtx.currentTime, currentAudioTime.value + 0.299);
    }
  };
  
  function debounce(fun: any, time: any) {
    let timer: any;
    return function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(fun, time);
    };
  }
  
  watch(currentAudioTime, debounce(handleChange, 600));
  // 初始化音量滑块
  gainNode.gain.value = volume.value / 100;
  const showVolume = ref(false);
  const volumeControl = ref<HTMLElement | null>(null);
  
  // 点击页面其他地方时自动隐藏音量滑块
  // 监听点击是否在外部
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Node;
    if (volumeControl.value && !volumeControl.value.contains(target)) {
      showVolume.value = false;
    }
  }
  
  
  // 调整音量
  
  function updateVolume(val: number) {
    if (gainNode) {
      gainNode.gain.value = val / 100;
    }
  }
  
  function showVolumeControl() {
    showVolume.value = !showVolume.value;
  }
  
  
  // 终止请求
  function cancelAllRequests() {
    for (const controller of controllers) {
      controller.abort();
    }
    controllers.length = 0;
    iterationsGroupCount = iterationsGroup + 1;
  }
  
  
  // 上一首
  function previousSong() {
    cancelAllRequests();
    controlAudioKeyCount--;
    if (controlAudioKeyCount < 0) {
      controlAudioKeyCount = playList.length - 1;
    }
    for (const source of sourceNodes) {
      try {
        source.stop(); // 会立即停止播放或取消排程
      } catch (e) {
        console.warn('Failed to stop source:', e);
      }
    }
    if (playbackModeIndex.value === 2) {
      playingSong.value = randomPlaylist[controlAudioKeyCount].name;
      audioDuration.value = randomPlaylist[controlAudioKeyCount].duration;
    } else {
      playingSong.value = playList[controlAudioKeyCount].name;
      audioDuration.value = playList[controlAudioKeyCount].duration;
    }
  }
  
  // 暂停
  const pause = () => {
    console.log(11111111111111);
    if (oldSource !== undefined) {
      console.log(oldSource);
      oldSource?.stop();
    } else {
      if (isFirst) {
        source?.stop();
        isFirst = false;
        console.log(isFirst, "isFirstture");
      } else {
        console.log(isFirst, "isFirst");
        newSource?.stop();
      }
    }
    console.log(interval, "interval");
    clearInterval(interval);
    console.log(fistInterval, "fistInterval");
    clearInterval(fistInterval);
  };
  
  // 控制播放
  function control() {
    if (isPlaying.value) {
      pause();
      isPlaying.value = false;
    } else {
      if (isFirst) {
        console.log("source");
        source?.start();
        isFirst = false;
      } else {
        if (oldSource !== undefined) {
          console.log("oldSource");
          oldSource = audioCtx.createBufferSource();
          oldSource.buffer = globalAudioBuffer.value;
          oldSource.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oldSource.start(audioCtx.currentTime, currentAudioTime.value + 0.299);
        } else {
          console.log("newSource");
          if (controlPlay !== null) {
            controlPlay();
          }
          controlPlay = watch(globalAudioBuffer, () => {
            if (change !== null) {
              change();
            }
            console.log(isPlaying.value, "isPlaying.value");
            if (isPlaying.value) {
              console.log(BlobAudioData, "isPlaying.value");
              newSource?.stop(audioCtx.currentTime);
              newSource = audioCtx.createBufferSource();
              newSource.buffer = globalAudioBuffer.value;
              newSource.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              newSource.start(0, currentAudioTime.value + 0.299);
            }
          });
          
          newSource = audioCtx.createBufferSource();
          newSource.buffer = globalAudioBuffer.value;
          newSource.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          newSource?.start(audioCtx.currentTime, currentAudioTime.value + 0.299);
        }
      }
      isPlaying.value = true;
      if (currentAudioTime.value < globalAudioBufferDuration.value) {
        interval = setInterval(() => {
          currentAudioTime.value += 1;
        }, 1000);
      }
    }
  }
  
  // 下一首
  function nextSong() {
    console.log("nextSong");
    cancelAllRequests();
    controlAudioKeyCount++;
    if (controlAudioKeyCount >= playList.length) {
      controlAudioKeyCount = 0;
    }
    for (const source of sourceNodes) {
      try {
        source.stop(); // 会立即停止播放或取消排程
      } catch (e) {
        console.warn('Failed to stop source:', e);
      }
    }
    if (playbackModeIndex.value === 2) {
      playingSong.value = randomPlaylist[controlAudioKeyCount].name;
      audioDuration.value = randomPlaylist[controlAudioKeyCount].duration;
    } else {
      playingSong.value = playList[controlAudioKeyCount].name;
      audioDuration.value = playList[controlAudioKeyCount].duration;
    }
  }
  
  
  function changeSong() {
    if (playbackModeIndex.value === 2) {
      shuffledIndex.value = controlAudioKeyCount;
      console.log(controlAudioKeyCount, "playbackModeIndex.value === 2");
      for (let i = 0; i < playList.length; i++) {
        if (playList[i].name.substring(0, playList[i].name.lastIndexOf(".")) ===
          randomPlaylist[shuffledIndex.value].name.substring(0, randomPlaylist[shuffledIndex.value].name.lastIndexOf("."))) {
          controlAudioKey.value = i;
          break;
        }
      }
    } else {
      controlAudioKey.value = controlAudioKeyCount;
      // for (let i = 0; i < randomPlaylist.length; i++) {
      //   if (randomPlaylist[i].name.substring(0, randomPlaylist[i].name.lastIndexOf(".")) ===
      //     playList[controlAudioKey.value].name.substring(0, playList[controlAudioKey.value].name.lastIndexOf("."))) {
      //     shuffledIndex.value = i;
      //     break;
      //   }
      // }
    }
    playingSongKey.value = playList[controlAudioKey.value].fileId;
    console.log(playList[controlAudioKey.value]);
    playingSong.value = playList[controlAudioKey.value].name;
    console.log(playingSong.value, "playingSong.value changeSong");
    currentAudioTime.value = playList[controlAudioKey.value].duration;
    currentAudioTime.value = 0;
    
    audioCtx?.close();
    isPlaying.value = true;
  }
  
  // 选歌防抖
  // function debounceChoose() {
  //   let timer: any;
  //   return function () {
  //     clearTimeout(timer);
  //     timer = setTimeout(changeSong, 2000);
  //   };
  // }
  function debounceChoose(fn: any, t: any) {
    let timer: any;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, t);
    };
  }
  
  const debounceChooseSong = debounceChoose(changeSong, 500);
  
  const controllers: AbortController[] = [];
  
  // 分段请求
  async function getSegmentData() {
    const controller = new AbortController();
    controllers.push(controller);
    
    let rangeHeader: string;
    
    if (iterationsCount === iterations) {
      dataPosition += dataSize;
      iterationsCount++;
      rangeHeader = `bytes=${dataPosition - dataSize}-${originalAudioSize - 1}`;
    } else if (iterationsCount < iterations) {
      dataPosition += dataSize;
      iterationsCount++;
      rangeHeader = `bytes=${dataPosition - dataSize}-${dataPosition - 1}`;
    } else {
      return null; // 超出则不再请求
    }
    
    const config = {
      method: 'get',
      url: audioUrl,
      headers: {
        'Range': rangeHeader
      },
      responseType: 'blob',
      signal: controller.signal
    };
    
    try {
      const {data} = await axios(<any>config);
      return data;
    } catch (err: any) {
      if (err.name === 'CanceledError') {
        console.warn('请求已取消:', rangeHeader);
      } else {
        console.error('请求出错:', err);
      }
      return null;
    }
  }
  
  
  // 分段获取音频文件
  async function getAudioUrl() {
    return Promise.all([
      getSegmentData(),
      getSegmentData(),
      getSegmentData(),
      getSegmentData(),
      getSegmentData(),
      getSegmentData()
    ]).then(
      (audioBlob) => {
        // 把得到的所有数据合为一个blob
        for (let i = 0; i < audioBlob.length; i++) {
          BlobAudioData.push(audioBlob[i]);
        }
        const audio = new Blob(BlobAudioData);
        // 音频链接播放
        if (iterationsGroup >= iterationsGroupCount) {
          iterationsGroupCount++;
          console.log(iterationsGroupCount);
          setTimeout(() => {
            getAudioUrl().then((audioData: any) => {
              audioCtx.decodeAudioData(audioData, function (audioBuffer) {
                globalAudioBuffer.value = audioBuffer;
                if (isFirst) {
                  oldSource = source;
                  source = audioCtx.createBufferSource();
                  source.buffer = audioBuffer;
                  console.log(source.buffer, "fun");
                  source.connect(gainNode);
                  gainNode.connect(audioCtx.destination);
                  console.log(audioTime, "before audioTime");
                  if (isPlaying.value) {
                    console.log(currentAudioTime.value, "currentAudioTime.value");
                    oldSource.stop(audioCtx.currentTime);
                    source.start(audioCtx.currentTime, currentAudioTime.value + 0.299);
                    console.log(audioTime, "isPlaying.value");
                    oldSource.onended = () => {
                      oldSource = undefined;
                    };
                  }
                  console.log(source, "new");
                  audioTime = audioBuffer.duration;
                  sourceNodes.push(source);
                }
              });
            });
          }, 500);
        }
        return audio.arrayBuffer();
      }
    );
  }
  
  
  let interval: any = null;
  let fistInterval: any = null;
  
  let timeout: any;
  console.log(isPlaying.value);
  // if (isPlaying.value) {
  //   // 发送请求播放音频
  //   timeout = setTimeout(() => {
  //     getAudioUrl().then((audioData: any) => {
  //       // audioCtx = new AudioContext();
  //       source = audioCtx.createBufferSource();
  //       console.log(audioData, "audioData");
  //       audioCtx.decodeAudioData(audioData, function (audioBuffer) {
  //         globalAudioBuffer.value = audioBuffer;
  //         source.buffer = audioBuffer;
  //         console.log(source.buffer, "nofun");
  //         console.log(audioBuffer, "audioBuffer");
  //         source.connect(gainNode);
  //         gainNode.connect(audioCtx.destination);
  //         console.log(audioTime, "before audioTime");
  //         source.start();
  //         console.log(source, "nofunsource");
  //         audioTime = audioBuffer.duration;
  //       });
  //       fistInterval = setInterval(() => {
  //         currentAudioTime.value += 1;
  //       }, 1000);
  //       console.log(fistInterval, "fistInterval,isplaying");
  //     });
  //   }, 6000);
  //
  // } else {
  //   // 发送请求不播放
  //   timeout = setTimeout(() => {
  //     getAudioUrl().then((audioData: any) => {
  //       source = audioCtx.createBufferSource();
  //       console.log(audioData, "audioData");
  //       audioCtx.decodeAudioData(audioData, function (audioBuffer) {
  //         globalAudioBuffer.value = audioBuffer;
  //         source.buffer = audioBuffer;
  //         console.log(source.buffer, "nofun");
  //         console.log(audioBuffer, "audioBuffer");
  //         source.connect(gainNode);
  //         gainNode.connect(audioCtx.destination);
  //         console.log(audioTime, "before audioTime");
  //         console.log(source, "nofunsource");
  //         audioTime = audioBuffer.duration;
  //       });
  //     });
  //   }, 6000);
  // }
  //
  usePlaybackMode();
  
  
  watch(
    [currentAudioTime, globalAudioBuffer],
    ([newTime, newGlobalAudioBuffer], [oldTime]) => {
      globalAudioBufferDuration.value = newGlobalAudioBuffer?.duration;
      if (isPlaying.value) {
        if (oldTime >= <any>newGlobalAudioBuffer?.duration) {
          console.log("pause");
          clearInterval(interval);
          clearInterval(fistInterval);
          fistInterval = null;
        } else {
          if (fistInterval === null) {
            console.log("start");
            fistInterval = setInterval(() => {
              currentAudioTime.value += 1;
            }, 1000);
          }
        }
      }
      if (newTime >= audioDuration.value && iterationsGroupCount !== 0) {
        if (playbackModeIndex.value !== 1) {
          nextSong();
          debounceChooseSong();
        } else {
          currentAudioTime.value = 0;
          handleChange();
          setTimeout(() => {
            fistInterval = setInterval(() => {
              currentAudioTime.value += 1;
            }, 1000);
          }, 50);
        }
      }
    }, {deep: true}
  );
  
  onUnmounted(() => {
    cancelAllRequests();
    console.log(fistInterval, "beforclear");
    clearInterval(fistInterval);
    console.log(interval, "beforeclear");
    clearInterval(interval);
    clearTimeout(timeout);
    console.log('unmounted');
    audioCtx.close();
  });
</script>

<style scoped>
  .audio-control {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 5px;
    background-color: var(--md-sys-color-surface-container);
    border-top: 1px solid var(--md-sys-color-outline-variant);
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
    position: relative;
    height: 80px;
  }
  
  
  
  .SongTitle {
    height: 100%;
    width: 25%;
    text-align: center;
    position: relative;
    margin: 1px 0 12px 0;
    color: var(--md-sys-color-on-surface);
    font-weight: 500;
    font-size: 1.1rem;
    overflow: hidden;
    padding: 0 20px;
  }

  /* 渐隐遮罩效果 */
  .SongTitle::after {
    content: "";
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    width: 20px; /* 模糊的宽度，可调 */
    pointer-events: none;
    background: linear-gradient(to right, transparent, var(--md-sys-color-surface-container)); /* white 改为背景色 */
  }


  .control_AudioDuration {
    margin-bottom: -5px;
    display: flex;
    width: 65%;
    flex-wrap: wrap;
  }
  
  .audioDuration {
    margin-bottom: -15px;
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
  }
  
  .currentAudioTime, .audioDurationMax {
    min-width: 40px;
    text-align: center;
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.9rem;
  }
  
  .control {
    display: flex;
    width: 100%;
    justify-content: space-evenly;
  }
  
  .control button {
    margin: 10px;
    color: var(--md-sys-color-on-surface);
    border-radius: 50%;
  }
  
  .control button:hover {
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-primary);
  }
  
  .control button:nth-child(3) { /* 播放/暂停按钮 */
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    width: 48px;
    height: 48px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  
  .control button:nth-child(3):hover {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    transform: scale(1.05);
  }
  
  
  
  .volumeControl {
    width: 10%;
    position: relative; /* 新增：作为子元素定位上下文 */
  }
  
  .volume-slider {
    position: absolute;
    left: 50%;
    transform: translateX(-50%); /* 让其中心对齐到父元素中心 */
    bottom: 120px;
    z-index: 10; /* 新增：确保浮在上方，不被其他元素遮住 */
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .volumeControl-div {
    display: block;
    margin:  7px auto;
  }
  
  /* 进度条样式覆盖 */
  :deep(.el-slider__runway) {
    background-color: var(--md-sys-color-outline-variant) !important;
  }
  
  :deep(.el-slider__bar) {
    background-color: var(--md-sys-color-primary) !important;
  }
  
  :deep(.el-slider__button) {
    width: 14px !important;
    height: 14px ;
    border: 2px solid var(--md-sys-color-primary) !important;
    background-color: var(--md-sys-color-surface-container) !important;
  }
  
  /* 音量条样式覆盖 */
  :deep(.el-slider.vertical .el-slider__runway) {
    background-color: var(--md-sys-color-outline-variant) !important;
    width: 4px !important;
  }
  
  :deep(.el-slider.vertical .el-slider__bar) {
    background-color: var(--md-sys-color-primary) !important;
    width: 4px !important;
  }
  
  :deep(.el-slider.vertical .el-slider__button) {
    width: 14px !important;
    height: 14px ;
    border: 2px solid var(--md-sys-color-primary) !important;
    background-color: var(--md-sys-color-surface-container) !important;
  }
</style>