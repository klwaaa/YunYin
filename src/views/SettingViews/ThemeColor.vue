<template>
  <p>ThemeColor</p>
  <input ref="inputImg" @change="handleFileSelect" type="file" accept="image/*"  alt="">
</template>

<script setup lang="ts">
  import {themeFromImage} from "@material/material-color-utilities";
  import {ref} from "vue";
  
  const inputImg = ref(null);
  const imageSrc = ref();
  
  function handleFileSelect(img: any) {
    const file = img.target.files[0];
    if (!file) return;

    // 创建 Blob URL
    imageSrc.value = URL.createObjectURL(file);
    console.log(imageSrc.value);
    // console.log(img);
  }
  
  // let img: any;
  // img = new Image();
  // img.src = "D:\\ProgrammingExercises\\web\\yunyin\\src\\views\\79561545_p0.jpg"; // 设置图片路径
  //
  // const checkIfLoaded = setInterval(async () => {
  //   if (img.complete) {
  //     console.log('图片已加载完成');
  //     clearInterval(checkIfLoaded);
  //     const theme = await themeFromImage(img);
  //     console.log(theme);
  //   }
  // }, 500);
</script>

<style scoped>
  input {
    width: 90%;
    height: calc(100vh - 50vh);;
    margin: 5vh auto;
    border: 1px solid #000;
    //background: url("../79561545_p0.jpg") no-repeat;


    background-size: contain; /* 包含:图片成比例放大,可能不会填满盒子。可用于适配  */
    background-position: center;
  }
</style>