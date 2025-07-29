<template>
  <audio :src="audioUrl" controls></audio>
</template>

<script setup lang="ts">
  import {useGetAudio} from "../store/audio.ts";
  import {storeToRefs} from "pinia";
  import Lyric from 'lrc-file-parser';
  import axios from 'axios';
  import useGetAudiosUrl from "../hooks/useGetAudiosUrl.ts";
  let lyricStr:any
  
  const config:any = {
    method: 'get',
    url: "https://cn-beijing-data.aliyundrive.net/wp1rzXXt%2F375400571%2F680e1813eece7d404ad044349d46345edc1a58d7%2F680e1813c656ea769f524ba1830dbb8efbaf4b3c?di=bj29&dr=375400571&f=6811eee31a9facb601f341af8a4af11607ffc184&security-token=CAISvgJ1q6Ft5B2yfSjIr5vjKNPZu6lD3PObb0D9gHASVtdZv7yZrDz2IHhMf3NpBOkZvvQ1lGlU6%2Fcalq5rR4QAXlDfNVS7cSrIq1HPWZHInuDox55m4cTXNAr%2BIhr%2F29CoEIedZdjBe%2FCrRknZnytou9XTfimjWFrXWv%2Fgy%2BQQDLItUxK%2FcCBNCfpPOwJms7V6D3bKMuu3OROY6Qi5TmgQ41Uh1jgjtPzkkpfFtkGF1GeXkLFF%2B97DRbG%2FdNRpMZtFVNO44fd7bKKp0lQLs0ARrv4r1fMUqW2X543AUgFLhy2KKMPY99xpFgh9a7j0iCbSGyUu%2FhcRm5sw9%2Byfo34lVYnew5KIXQ6%2Fi4IClLcc%2BmqdsRIvJzWstJ7Gf9LWqChvSgk4TxhhcNFKSTQrInFCB0%2BcRObJl16iOp3RnfXtuMkagAEcegrre1k07Z8sCCkKkbup3LW45OB0xeKIZ7WZ83dZ4q9goIYUzwIW1C6YswnS3cTIGtcyZxgNnTC1fJstbbuM%2BdOhTlAY6g903wlAZMkAZiIxyoHjmpauIRCKmaWeLYErEyMa3zi87Zl1E4SxK2hWk3ph3vW35Ax37J2V47ozbyAA&u=edf73dd0e67e48dbb99976be3d72c4f3&x-oss-access-key-id=STS.NXVcimVvbk1pmfLdpGZXuPy2N&x-oss-expires=1749995527&x-oss-signature=nxhPHAvCkkoLSHLWbZV7ADMsXwx4jwiLGp7BGYdS0CQ%3D&x-oss-signature-version=OSS2",
    headers: {
      // 'User-Agent': 'Apifox/1.0.0 (https://apifox.com)',
      'Accept': '*/*',
      'Host': 'cn-beijing-data.aliyundrive.net',
      'Connection': 'keep-alive'
    },
    responseType: 'text'
  };
  
  axios(config)
    .then(function (response) {
      const lrc = new Lyric({
        onPlay: function (line, text) { // 歌词播放时的回调
          console.log(line, text); // line 是当前播放行
          // text 是当前播放的歌词
        },
        onSetLyric: function (lines) { // 监听歌词设置事件。当设置歌词时，歌词解析完毕会触发此回调。
          console.log(lines); // lines 是一个数组[{time,text}]，里面包含播放时间及对应的歌词文本。
        },
        offset: 150 // 歌词偏移时间单位毫秒, 默认 150 ms
      });
      
      lrc.setLyric(response.data);// 注意：设置歌词将自动暂停歌词播放
      lrc.play(0); // 播放歌词，传入开始播放时间，30000是播放时间，单位：ms
    })
    .catch(function (error) {
      console.log(error);
    });
  
  const {currentAudioTime} = storeToRefs(useGetAudio());
  
  // lrc.pause(); // 暂停播放歌词
  const {audioUrl, audioSize} = await useGetAudiosUrl();
</script>

<style scoped>

</style>
