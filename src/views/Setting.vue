<template>
  <!--  <img src="./79561545_p0.jpg" alt="" class="aaa">-->
  <div class="setting">
    <div class="settingRouter">
      <div class="ThemeColor">
        <router-link :to="{
            name: 'ThemeColor',
          }">
          主题颜色
        </router-link>
      </div>
    </div>
    <div class="settingView">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">

</script>

<style scoped>
  .setting {
    display: flex;
    height: 90vh;
    width: 100vw;
  }
  
  div.settingRouter {
    width: 14%;
  }
  div.settingView {
    width: 86%;
  }
  
</style>