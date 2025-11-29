<template>
  <div class="setting">
    <div class="settingRouter">
      <div class="ThemeColor">
        <router-link
            :to="{
              name: 'ThemeColor',
            }"
            class="ThemeColor"
        >
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
    height: 85vh;
    max-height: calc(100vh - 140px);
    width: 100vw;
    margin-top: -5px;
    gap: 1vw;
    
    padding: 1.5vh 1vw;
    box-sizing: border-box;
    
    background: var(--md-sys-color-background);
    color: var(--md-sys-color-on-background);
  }
  
  .settingRouter {
    width: 14%;
    min-width: 12vw;
    max-width: 18vw;
    
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1vh;
    
    padding: 1.5vh 0.6vw;
    box-sizing: border-box;
    
    background: var(--md-sys-color-surface-container);
    border-radius: 2.5vh;
    
  }
  .ThemeColor {
    width: 100%;
    height: 6vh;
    
    display: flex;
    align-items: center;
    position: relative;
    
    border-radius: 2vh;
    
    font-size: clamp(1.3vh, 1.2vw, 1.8vh);
    font-weight: 500;
    
    cursor: pointer;
    
    color: var(--md-sys-color-on-surface-variant);
    background: transparent;
    
    transition: background 0.25s ease, color 0.25s ease;
  }
  
  .ThemeColor:hover {
    background: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface);
  }
  .ThemeColor a {
    width: 100%;
    height: 100%;
    
    display: flex;
    align-items: center;
    
    color: inherit;
    text-decoration: none;
  }
  .ThemeColor .router-link-active {
    background: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
    
    border-radius: 2vh;
    padding-left: 1.5vw;
  }
  .ThemeColor .router-link-active::before {
    content: "";
    position: absolute;
    left: 0.4vw;
    top: 15%;
    bottom: 15%;
    
    width: 0.4vw;
    border-radius: 1vw;
    
    background: var(--md-sys-color-primary);
  }
  .settingView {
    flex: 1;
    height: 100%;
    
    padding: 2vh 2vw;
    box-sizing: border-box;
    
    overflow: auto;
    
    background: var(--md-sys-color-surface);
    border-radius: 2.5vh;
    
  }
  @media (max-aspect-ratio: 4 / 5) {
    .settingRouter {
      width: 20vw;
    }
    
    .ThemeColor {
      font-size: clamp(1.4vh, 1.8vw, 2vh);
    }
  }

</style>