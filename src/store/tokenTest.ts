import {defineStore} from "pinia";
import {Ref, ref, UnwrapRef} from "vue";
import axios from 'axios';

// 提取的请求
const getToken = async (body: string, access_token: Ref<UnwrapRef<string>, UnwrapRef<string> | string>, refresh_token: Ref<UnwrapRef<string>, UnwrapRef<string> | string>) => {
  const config = {
    method: 'post',
    url: '/aliyun-api/oauth/access_token',
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*',
    },
    data: body
  };
  // 如果获取token不成功回到登陆页面
  try {
    let {data} = await axios(config);
    if (data !== undefined) {
      access_token.value = data.access_token;
      refresh_token.value = data.refresh_token;
    }
  } catch (e: any) {
    console.log("Error while fetching token", e);
    // if (e.response.data.code === "InvalidCode") {
    //   await router.push({
    //     name: 'login'
    //   });
    // }
  }
};

// token.ts中的数据和方法
export const useGetTokenStoreTest = defineStore("tokenTest", () => {
    const access_token = ref("null");
    const refresh_token = ref("null");
    
    
    async function useCodeGetToken() {
      const body = JSON.stringify({
        "client_id": "f3bc86ad8618424d99beb9da421d5526",
        "client_secret": "2def6c4b6b034206811689b6115b5bc2",
        "grant_type": "authorization_code",
        "code": localStorage.getItem("code")
      });
      
      await getToken(body, access_token, refresh_token);
    }
    
    async function useRefreshTokenGetToken() {
      const body = JSON.stringify({
        "client_id": "f3bc86ad8618424d99beb9da421d5526",
        "client_secret": "2def6c4b6b034206811689b6115b5bc2",
        "grant_type": "refresh_token",
        "refresh_token": JSON.parse(<string>localStorage.getItem("token")).refresh_token
      });
      
      await getToken(body, access_token, refresh_token);
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
