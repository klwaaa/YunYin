<template>
  <div class="lyric"></div>
</template>

<script setup lang="ts">
  import {storeToRefs} from "pinia";
  import Lyric from "lrc-file-parser";
  import axios from "axios";
  import useGetLyric from "../hooks/useGetLrcUrl.ts";
  import {ref} from "vue";
  
  // 获取歌词 URL
  const url = await useGetLyric();
  // const or = ref("");
  // const tr = ref("");
  let i = 2;
  // 请求歌词内容
  const config: any = {
    method: "get",
    url,
    headers: {
      Accept: "*/*",
      Host: "cn-beijing-data.aliyundrive.net",
      Connection: "keep-alive"
    },
    responseType: "text"
  };
  
  axios(config)
    .then(function (response) {
      const rawLrc = response.data;
      const lyric = document.querySelector(".lyric") as HTMLElement;
      
      // 创建 Lyric 实例
      const lrc = new Lyric({
        onPlay: function (line: number) {
          const l = bilingualLines[line];
          if (l) {
            console.log(l, "bilingualLines[line]");
            const p = document.querySelector(`.lyric p:nth-child(${i - 1})`);
            const p1 = document.querySelector(`.lyric p:nth-child(${i})`);
            const p_1 = document.querySelector(`.lyric p:nth-child(${i - 4})`);
            const p_2 = document.querySelector(`.lyric p:nth-child(${i - 3})`);
            p_1?.classList.remove("active");
            p_2?.classList.remove("active");
            p?.classList.add("active");
            p1?.classList.add("active");
            console.log(p);
            console.log(p1);
            i += 2;
          }
        },
        offset: 150
      });
      
      // 设置歌词（此操作会解析 rawLrc）
      lrc.setLyric(rawLrc);
      
      // 获取解析结果
      const lines = lrc.lines; // [{ time, text }]
      
      // 合并双语行（时间相同的两句）
      const bilingualLines: { time: number; or: string; tr: string }[] = [];
      
      for (let i = 0; i < lines.length - 1; i++) {
        const curr = lines[i];
        const next = lines[i + 1];
        
        if (curr.time === next.time) {
          bilingualLines.push({
            time: curr.time,
            or: curr.text.trim(),
            tr: curr.extendedLyrics[0]
          });
          i++; // 跳过下一句
        } else {
          bilingualLines.push({
            time: curr.time,
            or: curr.text.trim(),
            tr: "curr.extendedLyrics[0]"
          });
        }
      }
      
      if (lines.length % 2 !== 0) {
        const last = lines[lines.length - 1];
        bilingualLines.push({
          time: last.time,
          or: last.text.trim(),
          tr: last.text.trim()
        });
      }
      
      // 重设歌词时间轴文本（只是用于触发 onPlay 回调）
      // const timeMapFormat = bilingualLines.map(item => ({
      //   time: item.time,
      //   or: `${item.or} / ${item.tr}`
      // }));
      // console.log(timeMapFormat);
      // console.log(timeMapFormat);
      // lrc.setLyric(response.data); // 会暂停歌词播放
      
      for (let i = 0; i < bilingualLines.length; i++) {
        const orHtml = document.createElement("p");
        const trHtml = document.createElement("p");
        if (bilingualLines[i].or !== undefined) {
          orHtml.innerHTML = bilingualLines[i].or;
        }
        if (bilingualLines[i].tr !== undefined) {
          trHtml.innerHTML = bilingualLines[i].tr;
        }
        lyric.appendChild(orHtml);
        lyric.appendChild(trHtml);
      }
      lrc.play(0); // 开始播放
    })
    .catch(function (error) {
      console.log(error);
    });
</script>

<style scoped>
  :deep(.active) {
    color: orange;
  }
</style>