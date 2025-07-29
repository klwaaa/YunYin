<template>
  <div class="audioControl">
    <p class="SongTitle">歌名</p>
    <el-slider
            v-model="currentAudioTime"
            :max="audioDuration"
            :format-tooltip="formatTime"
            show-tooltip
            @change="handleChange"
    />
  </div>
  <div class="volumeControl-el-slider">
    <el-slider
            v-model="volume"
            :min="0"
            :max="100"
            :step="1"
            @input="updateVolume"
            show-tooltip
            vertical
            height="200px"
    />
  </div>
  <div class="volumeControl-div" @click="showVolumeControl">
    音量
  </div>
  <button @click="changePlaybackMode" class="playbackMode"></button>
  <button @click="previousSong">previousSong</button>
  <button @click="control">control</button>
  <button @click="nextSong">nextSong</button>
</template>

<script setup lang="ts">
  import useGetAudiosUrl from "../hooks/useGetAudiosUrl.ts";
  import axios from "axios";
  import {onMounted, onUnmounted, reactive, ref, watch} from "vue";
  import {useGetAudio} from "../store/audio.ts";
  import {storeToRefs} from "pinia";
  import usePlaybackMode from "../hooks/usePlaybackMode.ts";
  
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
    };
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
  
  globalAudioBufferDuration.value = 0;
  // 得到文件下载链接
  const {audioUrl, audioSize} = await useGetAudiosUrl(playingSongKey.value);
  const playList = JSON.parse(localStorage.getItem(`${playingPlayList.value}`)as string) ;
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
  
  // 获取音频时常
  for (let i = 0; i < playList.length; i++) {
    if (playList[i].name.substring(0, playList[i].name.lastIndexOf(".")) === playingSong.value) {
      audioDuration.value = Number(playList[i].duration);
      console.log(audioDuration);
      break;
    }
  }
  
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
        oldSource?.stop();
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
          newSource?.start(0, currentAudioTime.value+0.295);
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
      newSource.start(audioCtx.currentTime, currentAudioTime.value+0.295);
    }
  };
  
  function debounce(fun:any, time:any) {
    let timer:any
    return function () {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(fun, time);
    }
  }
  watch(currentAudioTime, debounce(handleChange,600))
  // 初始化音量滑块
  gainNode.gain.value = volume.value / 100;
  console.log(gainNode.gain.value, "gainNode.gain.value");
  
  // 调整音量
  function updateVolume(val: number) {
    if (gainNode) {
      gainNode.gain.value = val / 100;
    }
  }
  
  function showVolumeControl() {
    const volumeControlSlider: any = document.querySelector(".volumeControl-el-slider");
    if (getComputedStyle(volumeControlSlider).display === 'none') {
      volumeControlSlider.style.display = "block";
    } else {
      volumeControlSlider.style.display = "none";
    }
  }
  
  const switchSongs = () => {
    playingSongKey.value = playList[controlAudioKey.value].fileId;
    playingSong.value = (playList[controlAudioKey.value].name).substring(0, playList[controlAudioKey.value].name.lastIndexOf("."));
    currentAudioTime.value = playList[controlAudioKey.value].duration;
  };
  
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
    if (playbackModeIndex.value === 2) {
      shuffledIndex.value--;
      if (shuffledIndex.value < 0) {
        shuffledIndex.value = playList.length - 1;
      }
    } else {
      controlAudioKey.value--;
      if (controlAudioKey.value < 0) {
        controlAudioKey.value = playList.length - 1;
      }
    }
    switchSongs();
    for (const source of sourceNodes) {
      try {
        source.stop(); // 会立即停止播放或取消排程
      } catch (e) {
        console.warn('Failed to stop source:', e);
      }
    }
    isPlaying.value = true;
    audioCtx.close();
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
      } else {
        if (oldSource !== undefined) {
          console.log("oldSource");
          oldSource = audioCtx.createBufferSource();
          oldSource.buffer = globalAudioBuffer.value;
          oldSource.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oldSource.start(audioCtx.currentTime, currentAudioTime.value+0.295);
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
              newSource.start(0, currentAudioTime.value+0.295);
            }
          });
          
          newSource = audioCtx.createBufferSource();
          newSource.buffer = globalAudioBuffer.value;
          newSource.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          newSource?.start(audioCtx.currentTime, currentAudioTime.value+0.295);
        }
      }
      isPlaying.value = true;
      if (currentAudioTime.value < globalAudioBufferDuration.value) {
        interval = setInterval(() => {
          currentAudioTime.value += 0.5;
        }, 500);
      }
    }
  }
  
  // 下一首
  function nextSong() {
    cancelAllRequests();
    if (playbackModeIndex.value === 2) {
      shuffledIndex.value++;
      if (shuffledIndex.value >= playList.length) {
        shuffledIndex.value = 0;
      }
    } else {
      controlAudioKey.value++;
      if (controlAudioKey.value >= playList.length) {
        controlAudioKey.value = 0;
      }
    }
    switchSongs();
    for (const source of sourceNodes) {
      try {
        source.stop(); // 会立即停止播放或取消排程
      } catch (e) {
        console.warn('Failed to stop source:', e);
      }
    }
    isPlaying.value = true;
    audioCtx.close();
  }
  
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
                  source.start(audioCtx.currentTime, currentAudioTime.value + 0.295);
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
        }
        return audio.arrayBuffer();
      }
    );
  }
  
  
  let interval: ReturnType<typeof setInterval>;
  let fistInterval: any;
  
  let timeout: any;
  console.log(isPlaying.value);
  if (isPlaying.value) {
    // 发送请求播放音频
    timeout = setTimeout(() => {
      getAudioUrl().then((audioData: any) => {
        // audioCtx = new AudioContext();
        source = audioCtx.createBufferSource();
        console.log(audioData, "audioData");
        audioCtx.decodeAudioData(audioData, function (audioBuffer) {
          globalAudioBuffer.value = audioBuffer;
          source.buffer = audioBuffer;
          console.log(source.buffer, "nofun");
          console.log(audioBuffer, "audioBuffer");
          source.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          console.log(audioTime, "before audioTime");
          if (currentAudioTime.value===0){
            source.start();
          }
          console.log(source, "nofunsource");
          audioTime = audioBuffer.duration;
        });
        fistInterval = setInterval(() => {
          currentAudioTime.value += 0.5;
        }, 500);
        console.log(fistInterval, "fistInterval,isplaying");
      });
    }, 6000);
  }
  else {
    // 发送请求不播放
    timeout = setTimeout(() => {
      getAudioUrl().then((audioData: any) => {
        source = audioCtx.createBufferSource();
        console.log(audioData, "audioData");
        audioCtx.decodeAudioData(audioData, function (audioBuffer) {
          globalAudioBuffer.value = audioBuffer;
          source.buffer = audioBuffer;
          console.log(source.buffer, "nofun");
          console.log(audioBuffer, "audioBuffer");
          source.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          console.log(audioTime, "before audioTime");
          console.log(source, "nofunsource");
          audioTime = audioBuffer.duration;
        });
      });
    }, 6000);
  }
  
  usePlaybackMode(handleChange);
  
  
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
              currentAudioTime.value += 0.5;
            }, 500);
          }
        }
      }
      if (newTime>=audioDuration.value){
        if (playbackModeIndex.value!==1){
          nextSong()
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
    audioCtx.close();
    clearTimeout(timeout);
    console.log('unmounted');
  });
</script>

<style scoped>
  .audioControl {
    background-color: paleturquoise;
    width: 500px;
  }

  button {
    margin: 10px;
  }

  .volumeControl-el-slider {
    bottom: 30%;
    display: none;
    position: fixed; /* 固定在页面中，不随滚动 */
    z-index: 9999;
  }
</style>