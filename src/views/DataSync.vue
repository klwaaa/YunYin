<template>
  <div class="dataSync_view">
    <button class="sync-btn upload-btn" @click="uploadData">上传数据</button>
    <p>此操作会把本地的歌单数据上传到云盘</p>
    <button class="sync-btn download-btn" @click="pullData">拉取数据</button>
    <p>此操作会把云盘的歌单数据拉取到本地</p>
  </div>
</template>

<script setup lang="ts">
  import axios from 'axios';
  import {invoke} from "@tauri-apps/api/core";
  
  // 拉取数据
  async function pullData() {
    const data = JSON.stringify({
      "drive_id": localStorage.getItem("drive_id"),
      "file_path": "/普听音乐/音乐库/数据同步/data.json"
    });
    
    const config = {
      method: 'post',
      url: '/aliyun-api/adrive/v1.0/openFile/get_by_path',
      headers: {
        'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      data: data
    };
    
    await axios(config)
        .then(({data: {file_id}}) => {
          const data = JSON.stringify({
            "drive_id": localStorage.getItem("drive_id"),
            "file_id": file_id
          });
          
          const config = {
            method: 'post',
            url: '/aliyun-api/adrive/v1.0/openFile/get',
            headers: {
              'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
              'Content-Type': 'application/json',
              'Accept': '*/*',
            },
            data: data
          };
          
          axios(config)
              .then(({data: {url}}) => {
                const config = {
                  method: 'get',
                  url: url,
                  headers: {
                    'Accept': '*/*',
                  }
                };
                
                axios(config)
                    .then(({data}) => {
                      invoke("update_playlist_data", {
                        data: data
                      }).then(() => {
                        console.log("播放列表已传给 Rust 后端");
                      }).catch(err => {
                        console.error("传给 Rust 后端失败:", err);
                      });
                    });
              });
        })
        .catch(function (error) {
          console.log(error);
        });
  }
  
  // 上传数据
  async function uploadData() {
    let uploadData_parent_file_id: string = localStorage.getItem("uploadData_parent_file_id") as string;
    if (!uploadData_parent_file_id) {
      const uploadData_parent_file_id_data = JSON.stringify({
        "drive_id": localStorage.getItem("drive_id"),
        "file_path": "/普听音乐/音乐库/数据同步"
      });
      let uploadData_parent_file_id = {
        method: 'post',
        url: '/aliyun-api/adrive/v1.0/openFile/get_by_path',
        headers: {
          'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
          'Content-Type': 'application/json',
          'Accept': '*/*',
        },
        data: uploadData_parent_file_id_data
      };
      
      const {data} = await axios(uploadData_parent_file_id);
      uploadData_parent_file_id = data.file_id;
      localStorage.setItem("uploadData_parent_file_id", data.file_id);
    }
    
    const data = JSON.stringify({
      "drive_id": localStorage.getItem("drive_id"),
      "file_path": "/普听音乐/音乐库/数据同步/data.json"
    });
    
    const config = {
      method: 'post',
      url: '/aliyun-api/adrive/v1.0/openFile/get_by_path',
      headers: {
        'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      data: data
    };
    await axios(config)
        .then(({data: {file_id}}) => {
          // 把已有的data.json放入回收站
          const data = JSON.stringify({
            "drive_id": localStorage.getItem("drive_id"),
            "file_id": file_id
          });
          
          const config = {
            method: 'post',
            url: '/aliyun-api/adrive/v1.0/openFile/recyclebin/trash',
            headers: {
              'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
              'Content-Type': 'application/json',
              'Accept': '*/*',
            },
            data: data
          };
          
          axios(config)
              .then(function () {
                // 开始上传
                upload(uploadData_parent_file_id);
              });
        })
        .catch(() => {
          upload(uploadData_parent_file_id);
        });
  }
  
  // 上传函数
  async function upload(uploadData_parent_file_id: string) {
    const data = JSON.stringify({
      "drive_id": localStorage.getItem("drive_id"),
      "parent_file_id": uploadData_parent_file_id,
      "name": "data.json",
      "type": "file",
      "check_name_mode": "refuse"
    });
    
    const config = {
      method: 'post',
      url: '/aliyun-api/adrive/v1.0/openFile/create',
      headers: {
        'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      data: data
    };
    
    await axios(config)
        .then(function ({data: {part_info_list: [{upload_url}], drive_id, file_id, upload_id}}) {
          console.log(data);
          invoke<string>("upload_data_json", {uploadUrl: upload_url})
              .then(() => {
                const data = JSON.stringify({
                  "drive_id": drive_id,
                  "file_id": file_id,
                  "upload_id": upload_id
                });
                
                const config = {
                  method: 'post',
                  url: '/aliyun-api/adrive/v1.0/openFile/complete',
                  headers: {
                    'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
                    'Content-Type': 'application/json',
                    'Accept': '*/*',
                  },
                  data: data
                };
                
                axios(config)
                    .then(function () {
                      console.log("上传成功");
                    })
                    .catch(function (error) {
                      console.log(error);
                    });
              })
              .catch((err) => {
                console.log("上传失败", err);
              });
        });
  }
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
</style>