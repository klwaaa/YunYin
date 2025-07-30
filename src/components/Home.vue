<template>
  <div class="app">
    <div class="app-header">
      <div class="logo">
        logo
      </div>
      <div class="nav-items">
        <div class="login">
          <a href="https://openapi.alipan.com/oauth/authorize?client_id=f3bc86ad8618424d99beb9da421d5526&redirect_uri=http://localhost:1420/PlayList/&scope=user:base,file:all:read,file:all:write">
            登陆
          </a>
        </div>
        <div class="PlayList">
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
    <!--      <Suspense>-->
    <!--        <template v-slot:default>-->
    <!--          <div>-->
    <!--            <AudioView :key="controlAudioKey"></AudioView>-->
    <!--          </div>-->
    <!--        </template>-->
    <!--        <template v-slot:fallback>-->
    <!--          寻找中-->
    <!--        </template>-->
    <!--      </Suspense>-->
    <!--  <Suspense>-->
    <!--    <template v-slot:default>-->
    <!--      <div>-->
    <!--        222222222222222-->
    <!--        <AudioControl :key="controlAudioKey"></AudioControl>-->
    <!--      </div>-->
    <!--    </template>-->
    <!--    <template v-slot:fallback>-->
    <!--      11111111111111111111-->
    <!--    </template>-->
    <!--  </Suspense>-->
    <suspense>
      <template v-slot:default>
        <router-view v-if="route.name === 'PlayList'" v-model:count="count"/>
        <router-view v-else/>
      </template>
    </suspense>
    
    <div class="audioControl">
      <Suspense>
        <template v-slot:default>
          <AudioControl :key="controlAudioKey-count" v-if="isShow"></AudioControl>
          <p v-else>加载中</p>
        </template>
<!--        <template v-slot:fallback>-->
<!--          11111111111111111111-->
<!--        </template>-->
      </Suspense>
    </div>
  
  </div>
</template>

<script setup lang="ts">
  import AudioControl from "./AudioControl.vue";
  import {useRoute} from 'vue-router';
  import AudioView from "../views/AudioView.vue";
  import PlayList from "../views/PlayList.vue";
  import {useGetTokenStore} from "../store/token.ts";
  import useGetDriveID from "../hooks/useGetDriveID.ts";
  import {useGetAudio} from "../store/audio.ts";
  import Test from "../views/Test.vue";
  import MusicLibraryTest from "../views/MusicLibraryTest.vue";
  import {storeToRefs} from "pinia";
  import AudioViewTest from "../views/AudioViewTest.vue";
  import AudioControlTest from "./AudioControlTest.vue";
  import {RouterView, RouterLink} from "vue-router";
  import {ref} from "vue";
  
  const count = ref(0);
  const route = useRoute();
  const isShow = ref(false);
  setTimeout(()=>isShow.value = true,300)
  
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
</script>

<style scoped>

  .app-header {
    display: flex;
    justify-content: space-between
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
    background-color: #80FDE0;
    border-radius: 15px;
    text-align: center;
  }

  a {
    line-height: 30px;
  }

  .audioControl {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    background-color: #457B9D;
  }

  .nav-items div {
    margin: 0 10px;
  }
</style>