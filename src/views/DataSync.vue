<template>
  <div class="dataSync_view">
    <button @click="uploadData">上传数据</button>
    <button @click="pullData">拉取数据</button>
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
      .then(function ({data: { part_info_list: [ { upload_url } ] ,drive_id,file_id,upload_id}}) {
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
            console.log("上传失败",err);
          });
      });
  }
</script>

<style scoped>
  button {
    display: block;
  }
</style>