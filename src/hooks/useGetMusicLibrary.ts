import axios from 'axios';

export default async function (arr: Array<any>, next_marker:string): Promise<any> {
  let parent_file_id = localStorage.getItem("parent_file_id")
  if (!parent_file_id) {
    const parent_file_id_data = JSON.stringify({
      "drive_id": localStorage.getItem("drive_id"),
      "file_path": "/普听音乐/音乐库"
    });
    
    const parent_file_id_config = {
      method: 'post',
      url: '/aliyun-api/adrive/v1.0/openFile/get_by_path',
      headers: {
        'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      data : parent_file_id_data
    };
    
    const {data} = await axios(parent_file_id_config);
    parent_file_id = data.file_id
    localStorage.setItem("parent_file_id",data.file_id)
  }
  
  const body = JSON.stringify({
    "drive_id": localStorage.getItem("drive_id"),
    "parent_file_id": parent_file_id,
    "limit": 3,
    "category": "audio",
    "type":"file",
    "marker":next_marker
  });
  
  const config = {
    method: 'post',
    url: '/aliyun-api/adrive/v1.0/openFile/list',
    headers: {
      'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
      'Content-Type': 'application/json',
      'Accept': '*/*',
    },
    data: body
  };
  
  const {data} = await axios(config);
  if (data === undefined) {
    console.log("错误");
  } else {
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
  }
}