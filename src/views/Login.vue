<template>
  <div class="logo">logo</div>
  
</template>

<script setup lang="ts">
  
  import {useGetTokenStore} from "../store/token.ts";
  // 初始化token
  const token = useGetTokenStore();
  token.refresh_token = "null"
  token.access_token = "null"
</script>

<style scoped>
  .logo {
    width: 50px;
    height: 50px;
    background-color: pink;
    margin: 30px auto;

  }

  .login {
    width: 100px;
    height: 30px;
    background-color: #80FDE0;
    border-radius: 15px;
    text-align: center;
    margin: 30px auto;
    
  }

  a {
    line-height: 30px;
  }
  hr{
    height: 3px;
    width: 1000px;
    color: #000;
    border: solid 1px #000;
  }
</style>