<template>
  <div class="app">
    <div class="app-header">
      <div class="logo">
        logo
      </div>
      <div class="nav-items">
        <div class="login">
          <a v-if="!isLoggedIn" ref="loginRef" :href="loginUrl">请先登录</a>
          <span v-else @click="logOut">退出登录</span>
        </div>
        <div class="playList">
          <router-link :to="{
            path: '/PlayList',
          }">
            歌单
          </router-link>
        </div>
        <div class="musicLibrary">
          <router-link :to="{
            path: '/MusicLibrary',
          }">
            曲库
          </router-link>
        </div>
        <div class="synchronous">
          <router-link :to="{
            path: '/DataSync',
          }">
            同步数据
          </router-link>
        </div>
      </div>
    </div>
    <suspense>
      <template v-slot:default>
        <router-view class="router-view" v-if="route.name === 'PlayList'" v-model:count="count"/>
        <router-view class="router-view" v-else/>
      </template>
    </suspense>
    
    <div class="audioControl">
      <Suspense>
        <template v-slot:default>
          <AudioControl :key="controlAudioKey-count"></AudioControl>
        </template>
        <template v-slot:fallback>
          加载中
        </template>
      </Suspense>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AudioControl from "./AudioControl.vue";
  import {useRoute} from 'vue-router';
  import {useGetTokenStore} from "../store/token.ts";
  import useGetDriveID from "../hooks/useGetDriveID.ts";
  import {useGetAudio} from "../store/audio.ts";
  import {storeToRefs} from "pinia";
  import {RouterView, RouterLink} from "vue-router";
  import {ref, watch} from "vue";
  
  const count = ref(0);
  const route = useRoute();
  const loginRef: any = ref();
  
  // 获取得到的code
  const tokenStore = useGetTokenStore();
  const getCode = location.search;
  const code = getCode.split("?code=")[1];
  localStorage.setItem("code", code);
  // 通过code获取token
  if (getCode.length > 1 && tokenStore.refresh_token === "null") {
    tokenStore.useCodeGetToken().then(() => {
      useGetDriveID();
    });
  }
  // 刷新AudioControl
  const {controlAudioKey} = storeToRefs(useGetAudio());
  
  const loginUrl = "https://openapi.alipan.com/oauth/authorize?client_id=f3bc86ad8618424d99beb9da421d5526&redirect_uri=http://localhost:1420/PlayList/&scope=user:base,file:all:read,file:all:write";
  const isLoggedIn = ref(false);
  const token = ref(JSON.parse(localStorage.getItem("token") as string));
  
  function logOut() {
    token.value.access_token = null;
    localStorage.setItem("token", JSON.stringify({access_token: "null"}));
  }
  
  watch(token, () => {
    setTimeout(() => {
      const token: any = localStorage.getItem("token");
      const parsed = JSON.parse(token);
      console.log(parsed.access_token, "{access_token:null}");
      isLoggedIn.value = parsed.access_token !== "null";
    }, 300);
  }, {immediate: true, deep: true});
</script>

<style scoped>
  .app{
    background-color: var(--md-sys-color-background);
  }
  
  
  .app-header {
    background-color: var(--md-sys-color-surface-variant);
    display: flex;
    justify-content: space-between;
    padding: 10px 20px;
  }
  
  .playList,.login,.synchronous,.musicLibrary{
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }
  
  .nav-items {
    display: flex;
  }
  
  .logo {
    margin-left: 10px;
  }
  
  .login {
    width: 100px;
    height: 30px;
    border-radius: 15px;
    text-align: center;
  }
  
  a,span{
    line-height: 30px;
  }
  
  .audioControl {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
  }
  
  .nav-items div {
    margin: 0 10px;
  }
  
  .router-view {
    width: 90%;
    margin: auto;
  }
</style>