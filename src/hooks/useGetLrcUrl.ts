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
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}