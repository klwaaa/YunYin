<template>
  <div class="dataSync_view">
    <button class="sync-btn upload-btn" @click="uploadData">上传数据</button>
    <p>此操作会把本地的歌单数据上传到云盘</p>
    <button class="sync-btn download-btn" @click="pullData">拉取数据</button>
    <p>此操作会把云盘的歌单数据拉取到本地</p>
    <transition name="fade">
      <div class="custom-message-center" v-show="isShow">
        <p class="success" ref="success"></p>
        <p class="error" ref="error"></p>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
  import axios from 'axios';
  import {invoke} from "@tauri-apps/api/core";
  import {ref, watch} from "vue";
  
  const success: any = ref();
  const error: any = ref();
  const isShow = ref(false);
  
  const token = JSON.parse(<string>localStorage.getItem("token")).access_token;
  const driveId = localStorage.getItem("drive_id");
  
  // 拉取数据
  async function pullData() {
    try {
      const fileId: string = await invoke('using_path_get_data', {
        driveId,
        token,
        filePath: "/普听音乐/音乐库/数据同步/data.json"
      });
      try {
        const url: string = await invoke('get_data_url', {
          driveId,
          fileId: JSON.parse(fileId).file_id,
          token
        });
        // 你可以在这里处理返回的文件数据
        const config = {
          method: 'get',
          url: JSON.parse(url).url,
          headers: {
            'Accept': '*/*',
          }
        };
        
        axios(config)
            .then(({data}) => {
              invoke("update_playlist_data", {
                data: data
              }).then(() => {
                isShow.value = true;
                success.value.innerHTML = "拉取成功";
              }).catch(() => {
                isShow.value = true;
                error.value.innerHTML = "拉取失败";
              });
            });
      } catch {
        // 处理错误
        isShow.value = true;
        error.value.innerHTML = "拉取失败";
      }
    } catch {
      isShow.value = true;
      error.value.inn;
    }
  }
  
  // 上传数据
  async function uploadData() {
    let uploadData_parent_file_id: string = localStorage.getItem("uploadData_parent_file_id") as string;
    if (!uploadData_parent_file_id) {
      try {
        const data: string = await invoke('using_path_get_data', {
          driveId,
          token,
          filePath: "/普听音乐/音乐库/数据同步"
        });
        
        uploadData_parent_file_id = JSON.parse(data).file_id;
        localStorage.setItem("uploadData_parent_file_id", uploadData_parent_file_id);
      } catch {
        isShow.value = true;
        error.value.innerHTML = "上传失败";
      }
    }
    
    try {
      const fileId: string = await invoke('using_path_get_data', {
        driveId,
        token,
        filePath: "/普听音乐/音乐库/数据同步/data.json"
      });
      await invoke('put_in_recycle_bin', {
        driveId,
        token,
        fileId: JSON.parse(fileId).file_id
      });
      await upload(uploadData_parent_file_id);
    } catch {
      await upload(uploadData_parent_file_id);
    }
  }
  
  // 上传函数
  async function upload(uploadData_parent_file_id: string) {
    try {
      let data: any = await invoke('create_file', {
        driveId,
        parentFileId: uploadData_parent_file_id,
        token
      });
      data = JSON.parse(data);
      try {
        await invoke("upload_data_json", {uploadUrl: data.part_info_list[0].upload_url});
        await invoke('complete_upload', {
          driveId,
          fileId: data.file_id,
          uploadId: data.upload_id,
          token
        });
        isShow.value = true;
        success.value.innerHTML = "上传成功";
      } catch {
        isShow.value = true;
        error.value.innerHTML = "上传失败";
      }
    } catch {
      isShow.value = true;
      error.value.innerHTML = "上传失败";
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
  .sync-btn {
    padding: 14px 28px;
    border-radius: 24px;
    border: none;
    font-weight: 500;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
  }
  
  .upload-btn {
    background-color: var(--md-sys-color-tertiary);
    color: var(--md-sys-color-on-tertiary);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  
  .download-btn {
    background-color: var(--md-sys-color-secondary);
    color: var(--md-sys-color-on-secondary);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  
  .sync-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .upload-btn:hover {
    background-color: var(--md-sys-color-tertiary-container);
    color: var(--md-sys-color-on-tertiary-container);
  }
  
  .download-btn:hover {
    background-color: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
  }
  
  p {
    color: var(--md-sys-color-on-surface-variant);
    margin: 15px;
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