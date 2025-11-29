<template>
  <div class="app">
    <div class="app-header">
      <div class="logo">
        <img src="../assets/logo.png" alt="">
      </div>
      <div class="nav-items">
        <div class="login">
          <a v-if="!isLoggedIn" ref="loginRef" :href="loginUrl">请先登录</a>
          <span v-else @click="logOut">退出登录</span>
        </div>
        <div class="playListButton">
          <router-link :to="{
            path: '/PlayList',
          }">
            歌单
          </router-link>
        </div>
        <div class="musicLibraryButton">
          <router-link :to="{
            path: '/MusicLibrary',
          }">
            曲库
          </router-link>
        </div>
        <div class="synchronousButton">
          <router-link :to="{
            path: '/DataSync',
          }">
            同步数据
          </router-link>
        </div>
        <div class="settingButton">
          <router-link :to="{
            path: '/Setting',
          }">
            设置
          </router-link>
        </div>
      </div>
    </div>
    <suspense>
      <template v-slot:default>
        <router-view class="router-view" v-if="route.name === 'PlayList'" v-model:count="count"/>
        <router-view class="router-view" v-else-if="route.name === 'AudioView'" :key="controlAudioKey+count"/>
        <router-view class="router-view" v-else/>
      </template>
    </suspense>
    
<!--    <div class="audioControl">-->
<!--      <Suspense>-->
<!--        <template v-slot:default>-->
<!--          <AudioControl :key="controlAudioKey+count"></AudioControl>-->
<!--        </template>-->
<!--        <template v-slot:fallback>-->
<!--          加载中-->
<!--        </template>-->
<!--      </Suspense>-->
<!--    </div>-->
  </div>
</template>

<script setup lang="ts">
  import AudioControl from "./AudioControl.vue";
  import {useRoute} from 'vue-router';
  import {useGetTokenStore} from "../store/token.ts";
  import {useGetAudio} from "../store/audio.ts";
  import {storeToRefs} from "pinia";
  import {RouterView, RouterLink} from "vue-router";
  import {ref, watch} from "vue";
  import {invoke} from "@tauri-apps/api/core";
  
  const count = ref(0);
  const route = useRoute();
  const loginRef: any = ref();
  // 获取得到的code
  const tokenStore = useGetTokenStore();
  const getCode = location.search;
  const code = getCode.split("?code=")[1];
  localStorage.setItem("code", code);
  // 通过code获取token
  if (getCode.length > 1 && tokenStore.access_token === "null") {
    tokenStore.useCodeGetToken().then(async () => {
      const responseText: string = await invoke('get_drive_id', {
        token: JSON.parse(<string>localStorage.getItem("token")).access_token
      });
      localStorage.setItem("drive_id", JSON.parse(responseText).backup_drive_id);
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
      isLoggedIn.value = parsed.access_token !== "null";
    }, 300);
  }, {immediate: true, deep: true});
</script>

<style scoped>
  
  /* 全局样式 */
  body {
    margin: 0;
    font-family: 'Roboto', system-ui, sans-serif;
  }
  
  /* 活动路由链接样式 */
  .router-link-active {
    color: var(--md-sys-color-primary) !important;
    font-weight: bold;
    position: relative;
  }
  
  .router-link-active::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    right: 0;
    height: 3px;
    background-color: var(--md-sys-color-primary);
    border-radius: 2px;
  }
  
  /* 按钮悬停效果 */
  a, span[role="button"] {
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  a:hover, span[role="button"]:hover {
    opacity: 0.8;
  }
  
  
  /* 全局使用 MD3 变量 */
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: var(--md-sys-color-background);
    color: var(--md-sys-color-on-background);
    transition: background-color 0.3s, color 0.3s;
  }
  
  /* 顶部导航栏样式 */
  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
    height: 10vh;
    max-height: 80px;
    background-color: var(--md-sys-color-surface-container-high);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
  
  .logo img {
    margin-top: 8px;
    width: 60px;
    height: 40px;
  }
  
  .nav-items {
    display: flex;
    gap: 24px;
    align-items: center;
  }
  
  /* 导航项通用样式 */
  .nav-items > div {
    padding: 8px 16px;
    border-radius: 20px;
    transition: all 0.2s ease;
  }
  
  /* 导航链接样式 */
  .nav-items a, .nav-items span {
    text-decoration: none;
    font-weight: 500;
    color: var(--md-sys-color-on-surface);
    transition: color 0.2s;
  }
  
  /* 登录/退出样式 */
  .login {
    background-color: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
  }
  
  .login a, .login span {
    color: var(--md-sys-color-on-secondary-container);
    cursor: pointer;
  }
  
  /* 导航项悬停效果 */
  .playListButton:hover,
  .musicLibraryButton:hover,
  .synchronousButton:hover,
  .settingButton:hover {
    background-color: var(--md-sys-color-surface-container);
  }
  
  .playListButton:hover a,
  .musicLibraryButton:hover a,
  .synchronousButton:hover a,
  .settingButton:hover a {
    color: var(--md-sys-color-primary);
  }
  
  /* 路由视图区域 */
  .router-view {
    padding: 24px;
    background-color: var(--md-sys-color-surface);
  }
  
  /* 音频控制栏 */
  .audioControl {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
  }
</style>