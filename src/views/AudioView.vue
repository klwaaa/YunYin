<template>
  <div class="audioView_view">
    <router-link :to="{
            path: '/PlayList',
          }" class="goPlaylist">
      <
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
    <button v-show="isUserScrolling" @click="track">aaaaaaa</button>
  </div>
</template>

<script setup lang="ts">
  import {ref, watch, nextTick} from "vue";
  import axios from "axios";
  import Lyric from "lrc-file-parser";
  import useGetLyric from "../hooks/useGetLrcUrl.ts";
  import {useGetAudio} from "../store/audio.ts";
  import {storeToRefs} from "pinia";
  
  let zoomIn: any, zoomOut: any;
  
  
  const {currentAudioTime, isPlaying, globalAudioBufferDuration, lrcSize} = storeToRefs(useGetAudio());
  
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
  }
  else {
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
      
      watch(currentAudioTime, (newValue) => {
        if (isPlaying.value && newValue < globalAudioBufferDuration.value) {
          lrc.play(newValue * 1000);
        } else {
          lrc.pause();
        }
      });
      
      watch(isPlaying, (newValue) => {
        console.log(newValue, "isPlayingnewValue");
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
  
  function handleLyricClick(time: number, index:any) {
    currentAudioTime.value = time / 1000;
    currentIndex.value = index;
    isUserScrolling.value = false;
  }
</script>

<style scoped>
  .lyric {
    max-height: 400px;
    overflow-y: auto;
    position: relative;
    scroll-behavior: smooth;
    padding: 16px 24px;
    line-height: 1.6;
    font-size: 16px;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    user-select: none;
  }

  /* 当前行高亮 */
  .active {
    color: orange;
    font-weight: 700;
    text-shadow: 0 0 3px rgba(255, 165, 0, 0.7);
  }

  /* 原文样式 */
  .original {
    font-size: 16px;
    display: inline-block;
    font-weight: 600;
  }

  /* 译文样式，颜色更淡 */
  .translation {
    font-size: 16px;
    display: inline-block;
    margin-top: 2px;
    color: #999;
    font-style: italic;
  }
  .goPlaylist{
    font-size: 16px;
  }
</style>
