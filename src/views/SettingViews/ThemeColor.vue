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
    <div class="button-group">
      <button class="select-button" @click="selectImage">选择图片</button>
      <button class="createTeme" @click="onImageLoad">生成主题</button>
    </div>
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
  .themeColor {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2vh 3vw;
    height: 100%;
    gap: 2vh;
  }
  
  .upload-area {
    width: 85%;
    min-height: 45vh;
    max-height: 60vh;
    border: 0.2rem dashed var(--md-sys-color-outline-variant);
    border-radius: 1.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    background-color: var(--md-sys-color-surface-container-lowest);
    overflow: hidden;
  }
  
  .upload-area:hover {
    border-color: var(--md-sys-color-primary);
    background-color: var(--md-sys-color-surface-container);
    transform: scale(1.01);
  }
  
  .upload-hint {
    margin: auto;
    text-align: center;
    width: 90%;
    height: 90%;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--md-sys-color-on-surface-variant);
    font-size: clamp(0.9rem, 1.5vw, 1.2rem);
    padding: 2vh;
    word-break: break-word;
  }
  
  .button-group {
    display: flex;
    gap: 1.5vw;
    width: 85%;
    justify-content: center;
    margin-top: 1vh;
  }
  
  .select-button, .createTeme {
    padding: 1.2vh 2.5vw;
    border: none;
    border-radius: 1rem;
    font-size: clamp(0.9rem, 1.3vw, 1.1rem);
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
    min-width: 12vw;
    max-width: 20vw;
  }
  
  .select-button {
    background-color: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
  }
  
  .select-button:hover {
    background-color: var(--md-sys-color-secondary-fixed-dim);
    transform: translateY(-0.2vh);
  }
  
  .createTeme {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }
  
  .createTeme:hover {
    background-color: var(--md-sys-color-primary-fixed-dim);
    transform: translateY(-0.2vh);
  }
  
  .createTeme:disabled {
    background-color: var(--md-sys-color-outline-variant);
    color: var(--md-sys-color-on-surface-variant);
    cursor: not-allowed;
    transform: none;
  }
  
  .img-input {
    display: none;
  }
  
  /* 顶部居中样式 */
  .custom-message-center {
    width: auto;
    min-width: 30vw;
    max-width: 70vw;
    height: auto;
    position: fixed;
    top: 12vh;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    text-align: center;
    background-color: var(--md-sys-color-surface-container-high);
    border-radius: 1.5rem;
    padding: 1.5vh 3vw;
    box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.15);
    z-index: 1000;
  }
  
  .custom-message-center .success {
    color: var(--md-sys-color-on-tertiary-container);
    font-size: clamp(0.9rem, 1.2vw, 1.1rem);
    margin: 0;
  }
  
  .custom-message-center .error {
    color: var(--md-sys-color-error);
    font-size: clamp(0.9rem, 1.2vw, 1.1rem);
    margin: 0;
  }
  
  /* 动画效果 */
  .fade-enter-active,
  .fade-leave-active {
    transition: all 0.4s ease;
  }
  
  .fade-enter-from {
    opacity: 0;
    transform: translateX(-50%) translateY(-1rem);
  }
  
  .fade-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-1rem);
  }
  
  /* 响应式设计 */
  @media (max-width: 768px) {
    .themeColor {
      padding: 1.5vh 4vw;
      gap: 1.5vh;
    }
    
    .upload-area {
      width: 95%;
      min-height: 40vh;
      max-height: 50vh;
    }
    
    .button-group {
      width: 95%;
      flex-direction: column;
      align-items: center;
      gap: 1vh;
    }
    
    .select-button, .createTeme {
      width: 60%;
      min-width: 45vw;
      max-width: 70vw;
      padding: 1.5vh 4vw;
    }
    
    .custom-message-center {
      min-width: 50vw;
      max-width: 85vw;
      top: 10vh;
      padding: 1.2vh 4vw;
    }
  }
  
  @media (max-width: 480px) {
    .upload-area {
      min-height: 35vh;
      border-width: 0.15rem;
    }
    
    .upload-hint {
      font-size: clamp(0.8rem, 4vw, 1rem);
      padding: 1vh;
    }
    
    .select-button, .createTeme {
      width: 80%;
      min-width: 55vw;
      padding: 1.8vh 5vw;
    }
  }
</style>