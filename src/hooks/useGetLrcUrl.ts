// import axios from 'axios';
import {invoke} from "@tauri-apps/api/core";

// 获取文件下载链接
export default async function (): Promise<any> {
  const playingAudio = JSON.parse(<string>localStorage.getItem('audio'));
  const driveId: any = localStorage.getItem("drive_id");
  const token = JSON.parse(<string>localStorage.getItem("token")).access_token;
 try {
   const data: string = await invoke('using_path_get_data', {
     driveId,
     token,
     filePath: `/普听音乐/音乐库/${playingAudio.playingSong.substring(
       0,
       playingAudio.playingSong.lastIndexOf(".")
     )}.lrc`
   });
   try {
     const url: string = await invoke('get_data_url', {
       driveId,
       fileId: JSON.parse(data).file_id,
       token
     });
     return JSON.parse(url).url;
   }catch {
     return null
   }
 }catch {
   return null;
 }
  // const body = JSON.stringify({
  //   "drive_id": localStorage.getItem("drive_id"),
  //   "file_path": `/1/${playingAudio.playingSong.substring(
  //     0,
  //     playingAudio.playingSong.lastIndexOf(".")
  //   )}.lrc`
  // });
  //
  // const config = {
  //   method: 'post',
  //   url: '/aliyun-api/adrive/v1.0/openFile/get_by_path',
  //   headers: {
  //     'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
  //     'Content-Type': 'application/json',
  //     'Accept': '*/*'
  //   },
  //   data: body
  // };
  // const {data: {file_id}} = await axios(config);
  // try {
  //   if (file_id === undefined) {
  //     console.log("未找到");
  //     return null;
  //   } else {
  //     console.log(file_id, "file_idlrc");
  //     const data = JSON.stringify({
  //       "drive_id": localStorage.getItem("drive_id"),
  //       "file_id": file_id
  //     });
  //
  //     const config = {
  //       method: 'post',
  //       url: '/aliyun-api/adrive/v1.0/openFile/get',
  //       headers: {
  //         'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
  //         'Content-Type': 'application/json',
  //         'Accept': '*/*'
  //       },
  //       data: data
  //     };
  //
  //     const {data: {url}} = await axios(config);
  //     return url;
  //   }
  // } catch (error) {
  //   return null;
  // }
}