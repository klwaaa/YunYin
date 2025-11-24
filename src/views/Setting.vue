<template>
  <img src="./1" alt="">
</template>

<script setup lang="ts">
  import {argbFromHex, themeFromImage, themeFromSourceColor} from "@material/material-color-utilities";
  import {onMounted} from "vue";
  
  // onMounted(async () => {
  //
  //   const img = document.querySelector("img");
  //   async function extractMonetFromImgElement(img: HTMLImageElement) {
  //     await img.decode(); // 确保图片完全加载
  //     const theme = await themeFromImage(img);
  //     return theme;
  //   }
  //
  //   if (img) {
  //     const a = await extractMonetFromImgElement(img);
  //     console.log(a);
  //   }
  // });
  //
  
    const img = new Image();
    img.src = "./1.jpg";
    
    await img.decode();
    
    const theme = await themeFromImage(img);
    
    console.log(theme);
  

  // const theme = themeFromSourceColor(argbFromHex('#FEC114'));
  // // Print out the theme as JSON
  // console.log(JSON.stringify(theme, null, 2));

</script>

<style scoped>
</style>