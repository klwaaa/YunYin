import {invoke} from "@tauri-apps/api/core";

export default async function (arr: Array<any>, next_marker: string): Promise<any> {
  let parent_file_id: any = localStorage.getItem("parent_file_id");
  if (!parent_file_id) {
    const parentFileId: any = await invoke('using_path_get_data', {
      driveId: localStorage.getItem("drive_id"),
      token: JSON.parse(<string>localStorage.getItem("token")).access_token,
      filePath: "/普听音乐/音乐库"
    });
    parent_file_id = JSON.parse(parentFileId).file_id;
    localStorage.setItem("parent_file_id", parent_file_id);
  }
  
  try {
    let data: any = await invoke('get_file_list', {
      driveId: localStorage.getItem("drive_id"),
      parentFileId: parent_file_id,
      nextMarker: next_marker,
      token: JSON.parse(<string>localStorage.getItem("token")).access_token
    });
    
    data = JSON.parse(data);
    for (let i = 0; i < data.items.length; i++) {
      const audioJson = {
        name: data.items[i].name,
        fileId: data.items[i].file_id,
        duration: data.items[i].video_preview_metadata.duration
      };
      arr.push(audioJson);
    }
    
    return {
      arr,
      next_marker: data.next_marker
    };
  } catch (err) {
    return {
      arr: "err",
      next_marker: "err"
    };
  }
}