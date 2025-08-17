<template>
  <Home class="light" v-if="isTokenLoaded"></Home>
</template>

<script setup lang="ts">
  import {useGetTokenStore} from "./store/token.ts";
  import {onBeforeMount, watch, ref} from "vue";
  import {storeToRefs} from "pinia";
  import Home from "./components/Home.vue";
  import {useGetAudio} from "./store/audio.ts";
  
  const {isPlaying} = storeToRefs(useGetAudio());
  const isTokenLoaded = ref(false);
  
  // 通过code获得token
  onBeforeMount(async () => {
    
    const tokenStore = useGetTokenStore();
    
    let {refresh_token} = storeToRefs(tokenStore);
    if (!localStorage.getItem("token")) {
      localStorage.setItem("token", JSON.stringify({
        access_token: "null",
        refresh_token: "null"
      }));
    }
    // 检测是不是通过code获取了token，如果有就通过refresh_token每2小时获取一次token
    watch(refresh_token, (_, oldVal) => {
      if (oldVal === "null") {
        setInterval(tokenStore.useRefreshTokenGetToken, 6480000);
      }
    });
    // 检测是不是有token，如果有就通过refresh_token每2小时获取一次token
    if (localStorage.getItem("token") !== null
        && JSON.parse(<string>localStorage.getItem("token")).refresh_token !== "null") {
      await tokenStore.useRefreshTokenGetToken();
      isTokenLoaded.value = true;
      setInterval(tokenStore.useRefreshTokenGetToken, 6480000);
    }
    
    // 页面刷新 / 浏览器关闭时停止播放
    window.addEventListener("beforeunload", () => {
      isPlaying.value = false;
      
    });
    document.addEventListener('contextmenu', function (event) {
      event.preventDefault(); // 阻止右键菜单的弹出
    });
  });
  if (!localStorage.getItem("audio")) {
    localStorage.setItem("audio", JSON.stringify([]));
  }
</script>

<style scoped>

</style>