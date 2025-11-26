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
  // import {
  //   argbFromHex,
  //   themeFromImage,
  //   themeFromSourceColor,
  //   sourceColorFromImage
  // } from "@material/material-color-utilities";
  // import {onMounted} from "vue";
  //
  // let img: any;
  // onMounted(() => {
  //   img = document.querySelector(".aaa");
  // });
  //
  //
  // async function extractMonetFromImgElement(img: HTMLImageElement) {
  //   // 确保图片完全加载
  //   const theme = await themeFromImage(img);
  //   return theme;
  // }
  //
  // //
  // const checkIfLoaded = setInterval(() => {
  //   if (img.complete) {
  //     console.log('图片已加载完成');
  //     clearInterval(checkIfLoaded);
  //     const a = extractMonetFromImgElement(img);
  //     a.then((v) => {
  //       console.log(v);
  //     });
  //   }
  // }, 500);
  // await img.decode();
  // console.log(img);
  // const a = await extractMonetFromImgElement(img);
  // console.log(a);
  
  
  // const img = new Image();
  // img.src = "./1.jpg";
  //
  // await img.decode();
  //
  // const theme = await themeFromImage(img);
  //
  // console.log(theme);
  
  
  // const theme = themeFromSourceColor(argbFromHex('#FEC114'));
  // // Print out the theme as JSON
  // console.log(JSON.stringify(theme, null, 2));

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