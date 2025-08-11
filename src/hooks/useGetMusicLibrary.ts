import {invoke} from "@tauri-apps/api/core";

export default async function (arr: Array<any>, next_marker: string): Promise<any> {
  let parent_file_id: any = localStorage.getItem("parent_file_id");
  if (!parent_file_id) {
    console.log(1111111111111111);
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
    console.log(err);
    return {
      arr: "err",
      next_marker: "err"
    };
  }

// const body = JSON.stringify({
//   "drive_id": localStorage.getItem("drive_id"),
//   "parent_file_id": parent_file_id,
//   "limit": 3,
//   "category": "audio",
//   "type":"file",
//   "marker":next_marker
// });
//
// const config = {
//   method: 'post',
//   url: '/aliyun-api/adrive/v1.0/openFile/list',
//   headers: {
//     'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
//     'Content-Type': 'application/json',
//     'Accept': '*/*',
//   },
//   data: body
// };
// console.log(config.url,"config.url");
// const {data} = await axios(config);
// console.log(data,"111111111");
}