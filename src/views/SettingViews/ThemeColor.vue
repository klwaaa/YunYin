<template>
  <div class="themeColor">
    <transition name="fade">
      <div class="custom-message-center" v-show="isShow">
        <p class="success" ref="success"></p>
        <p class="error" ref="error"></p>
      </div>
    </transition>
    <input
        type="file"
        accept="image/*"
        ref="fileInput"
        @change="handleFileSelect"
        class="img-input"
    >
    <div class="upload-area" @click="selectImage">
      <div class="upload-hint" ref="uploadHint">支持 JPG、PNG、GIF 等格式</div>
    </div>
    <button class="select-button" @click="selectImage">选择图片</button>
    <button class="createTeme" @click="onImageLoad">生成主题</button>
  </div>
</template>

<script setup lang="ts">
  import {ref, watch} from 'vue';
  import {sourceColorFromImage} from '@material/material-color-utilities';
  import {invoke} from "@tauri-apps/api/core";
  import applyThemeFromRustScheme from "../../hooks/useSetThemeColor.ts";
  
  const success: any = ref();
  const error: any = ref();
  const isShow = ref(false);
  // 响应式数据
  const fileInput = ref<HTMLInputElement | null>(null);
  const imageSrc = ref<string | null>(null);
  const fileName = ref<string>('');
  const uploadHint = ref<any>(null);
  
  
  // 方法
  const selectImage = () => {
    if (fileInput.value) {
      fileInput.value.click();
    }
  };
  
  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    
    fileName.value = file.name;
    uploadHint.value.innerHTML = null;
    
    // 创建 Blob URL
    imageSrc.value = URL.createObjectURL(file);
    uploadHint.value.style.backgroundImage = `url(${imageSrc.value})`;
  };
  
  
  async function onImageLoad() {
    success.value.innerHTML = null;
    error.value.innerHTML = null;
    const img: any = new Image();
    img.src = imageSrc.value;
    
    await sourceColorFromImage(img)
        .then(async (colorSource) => {
          await invoke("update_theme_color", {colorSource: `{"source":${colorSource}}`});
          const theme: any = await invoke("material_colors", {source: colorSource});
          applyThemeFromRustScheme(theme.schemes.light);
          isShow.value = true;
          success.value.innerHTML = "提取主题色成功";
        })
        .catch((_) => {
          isShow.value = true;
          error.value.innerHTML = "提取主题色失败";
        });
    if (imageSrc.value) {
      URL.revokeObjectURL(imageSrc.value);
    }
  }
  
  function debounce(fn: any, t: any) {
    let timer: any;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, t);
    };
  }
  
  watch(isShow, () => {
    debounce(() => {
      isShow.value = false;
    }, 3000)();
  });

</script>

<style scoped>
  .img-input {
    display: none;
  }
  
  
  .upload-hint {
    margin: auto;
    text-align: center;
    line-height: 50vh;
    width: 80%;
    height: 50vh;
    background-size: contain; /* 包含:图片成比例放大,可能不会填满盒子。可用于适配  */
    background-position: center;
    background-repeat: no-repeat;
  }
  
  
  /* 顶部居中样式 */
  .custom-message-center {
    height: auto;
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    text-align: center;
    background-color: var(--md-sys-color-surface-container-high);
    border-radius: 24px;
    padding: 0 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }
  
  /* 成功绿色文字 */
  .custom-message-center .success {
    color: var(--md-sys-color-on-tertiary-fixed-variant);
  }
  
  /* 失败红色文字 */
  .custom-message-center .error {
    color: var(--md-sys-color-error);
  }
  
  /* ✅ 添加动画效果 */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.6s ease;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>