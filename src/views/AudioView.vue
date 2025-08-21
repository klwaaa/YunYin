<template>
  <div class="audioView_view">
    <router-link :to="{
            path: '/PlayList',
          }">
      <span class="iconfont icon-fanhui"></span>
    </router-link>
    <div class="lyric" ref="lyricContainer">
      <p
          v-for="(line, index) in bilingualLines"
          :key="index + '-or'"
          :ref="setLyricRefs"
          :class="{ active: currentIndex === index }"
          @click="handleLyricClick(line.time,index)"
      >
        <span class="original">{{ line.or }}</span><br/>
        <span class="translation" v-if="line.tr">{{ line.tr }}</span>
      </p>
    </div>
    <div class="lyric-controls">
      <button @click="zoomIn">A+</button>
      <p>{{ lrcSize }}</p>
      <button @click="zoomOut">A-</button>
    </div>
    <button v-show="isUserScrolling" @click="track" class="followTime">
      跟随时间
    </button>
  </div>
</template>

<script setup lang="ts">
  import {ref, watch, nextTick} from "vue";
  import axios from "axios";
  import Lyric from "lrc-file-parser";
  import useGetLyric from "../hooks/useGetLrcUrl.ts";
  import {useGetAudio} from "../store/audio.ts";
  import {storeToRefs} from "pinia";
  import emitter from "../utils/emitter.ts";
  
  let zoomIn: any, zoomOut: any;
  
  
  const {displayTime, isPlaying, globalAudioBufferDuration, lrcSize} = storeToRefs(useGetAudio());
  
  const lyricRefs = ref<HTMLElement[]>([]);
  const setLyricRefs: any = (el: HTMLElement | null) => {
    if (el) lyricRefs.value.push(el);
  };
  
  const lyricContainer = ref<HTMLElement | null>(null);
  const currentIndex = ref(-1);
  
  const bilingualLines = ref<{ time: number; or: string; tr: string }[]>([]);
  
  watch(bilingualLines, async () => {
    lyricRefs.value = [];
    await nextTick();
  });
  
  const isUserScrolling = ref(false);
  
  function track() {
    isUserScrolling.value = false;
  }
  
  const url = await useGetLyric();
  
  if (url === null) {
    bilingualLines.value = [{
      time: 0,
      or: "未找到",
      tr: ""
    }];
  } else {
    const config: any = {
      method: "get",
      url,
      headers: {
        Accept: "*/*",
      },
      responseType: "text"
    };
    
    axios(config).then((response) => {
      lyricContainer.value?.addEventListener("wheel", () => {
        isUserScrolling.value = true;
      });
      const rawLrc = response.data;
      
      const lrc = new Lyric({
        onPlay: (line: number) => {
          currentIndex.value = line;
          
          const container = lyricContainer.value;
          const p = lyricRefs.value[line];
          
          if (!isUserScrolling.value && container && p) {
            const containerHeight = container.clientHeight;
            const targetTop = p.offsetTop;
            const targetHeight = p.offsetHeight;
            
            container.scrollTo({
              top: targetTop - containerHeight / 2 + targetHeight / 2,
              behavior: "smooth"
            });
          }
        }
      });
      
      lrc.setLyric(rawLrc);
      const lines = lrc.lines;
      
      const parsed: { time: number; or: string; tr: string }[] = [];
      
      for (let i = 0; i < lines.length - 1; i++) {
        const curr = lines[i];
        const next = lines[i + 1];
        
        
        if (curr.time === next.time) {
          parsed.push({
            time: curr.time,
            or: curr.text.trim(),
            tr: curr.extendedLyrics[0]
          });
          i++;
        } else {
          parsed.push({
            time: curr.time,
            or: curr.text.trim(),
            tr: curr.extendedLyrics[0]
          });
        }
      }
      
      if (lines.length % 2 !== 0) {
        const last = lines[lines.length - 1];
        parsed.push({
          time: last.time,
          or: last.text.trim(),
          tr: ""
        });
      }
      
      bilingualLines.value = parsed;
      
      watch(displayTime, (newValue) => {
        if (isPlaying.value && newValue < globalAudioBufferDuration.value) {
          lrc.play(newValue * 1000);
        } else {
          lrc.pause();
        }
      });
      
      watch(isPlaying, (newValue) => {
        if (!newValue) {
          lrc.pause();
        }
      });
      setTimeout(() => {
        const span: any = document.querySelectorAll(".lyric p span");
        span.forEach((span: any) => {
          span.style.fontSize = `${lrcSize.value}px`;
        });
        // 歌词大小
        zoomIn = () => {
          lrcSize.value++;
          span.forEach((span: any) => {
            span.style.fontSize = `${lrcSize.value}px`;
          });
        };
        
        zoomOut = () => {
          lrcSize.value--;
          span.forEach((span: any) => {
            span.style.fontSize = `${lrcSize.value}px`;
          });
        };
      });
    });
  }
  
  function handleLyricClick(time: number, index: any) {
    displayTime.value = time / 1000;
    currentIndex.value = index;
    emitter.emit("handleChange");
    isUserScrolling.value = false;
  }
</script>

<style scoped>
  .audioView_view {
    height: calc(100vh - 260px);
    position: relative;
    max-width: 100vw;
  }
  
  .icon-fanhui {
    font-size: 30px;
    color: var(--md-sys-color-primary);
  }
  
  .lyric {
    height: 100%;
    overflow-y: auto;
    position: relative;
    scroll-behavior: smooth;
    padding: 16px 24px 24px 100px;
    line-height: 1.6;
    font-size: 16px;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    user-select: none;
    text-align: center;
    overflow-x: hidden;
  }
  
  .lyric::-webkit-scrollbar, .songList::-webkit-scrollbar {
    width: 8px;
  }
  
  .lyric::-webkit-scrollbar-track, .songList::-webkit-scrollbar-track {
    background: var(--md-sys-color-surface-container);
    border-radius: 4px;
  }
  
  .lyric::-webkit-scrollbar-thumb, .songList::-webkit-scrollbar-thumb {
    background: var(--md-sys-color-outline-variant);
    border-radius: 4px;
  }
  
  .lyric p {
    margin: 10px;
  }
  
  /* 当前行高亮 */
  p.active {
    margin: 15px;
    transform: scale(1.1);
  }
  
  span {
    transition: box-shadow 0.25s linear, font-weight 0.25s linear, color 0.25s linear;
  }
  
  .active span {
    color: var(--md-sys-color-primary);
    font-weight: 700;
    box-shadow: 0 1px 2px 1px rgba(var(--md-sys-color-on-secondary-container),0.4);
  }
  
  /* 原文样式 */
  .original {
    font-size: 16px;
    display: inline-block;
    font-weight: 600;
    color: var(--md-sys-color-primary);
  }
  
  /* 译文样式，颜色更淡 */
  .translation {
    font-size: 16px;
    display: inline-block;
    margin-top: 2px;
    color: var(--md-sys-color-outline);
    font-style: italic;
  }
  
  .lyric-controls {
    position: absolute;
    display: flex;
    align-items: center;
    left: 5%;
    top: 100%;
    gap: 12px;
    background-color: var(--md-sys-color-surface-container);
    border-radius: 24px;
    padding: 8px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .lyric-controls button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface);
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .lyric-controls button:hover {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    transform: scale(1.1);
  }
  
  .lyric-controls p {
    color: var(--md-sys-color-on-surface);
    min-width: 40px;
    text-align: center;
    font-weight: 500;
  }
  
  .followTime {
    position: absolute;
    right: 5%;
    top: calc(100% + 20px);
    border-radius: 24px;
    border: none;
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-primary);
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    padding: 8px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .followTime:hover {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }
</style>
