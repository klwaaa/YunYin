import {defineStore} from "pinia";
import { ref} from "vue";
import { invoke } from '@tauri-apps/api/core';


// token.ts中的数据和方法
export const useGetTokenStore = defineStore("token", () => {
    const access_token = ref("null");
    const refresh_token = ref("null");
    
    
    async function useCodeGetToken() {
      const code = localStorage.getItem("code");
      
      if (!code) return;
      
      try {
        const result = await invoke<string>("get_token_by_code", { code });
        const token = JSON.parse(result);
        access_token.value = token.access_token;
        refresh_token.value = token.refresh_token;
      } catch (err) {
        console.error("获取 token 失败", err);
      }
    }
    
    async function useRefreshTokenGetToken() {
      const tokenData = localStorage.getItem("token");
      
      if (!tokenData) return;
      
      try {
        const result = await invoke<string>("get_token_by_refresh", { refreshToken: refresh_token.value });
        const token = JSON.parse(result);
        access_token.value = token.access_token;
        refresh_token.value = token.refresh_token;
      } catch (err) {
        console.error("刷新 token 失败", err);
      }
    }
    
    return {
      access_token,
      refresh_token,
      useCodeGetToken,
      useRefreshTokenGetToken
    };
  },
  {
    persist: true
  }
);
