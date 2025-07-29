import axios from 'axios';

// 获取文件下载链接
export default async function (): Promise<any> {
  const playingAudio = JSON.parse(<string>localStorage.getItem('audio'));
  const body = JSON.stringify({
    "drive_id": localStorage.getItem("drive_id"),
    "file_path": `/1/${playingAudio.playingSong.substring(
      0,
      playingAudio.playingSong.lastIndexOf(".")
    )}.lrc`
  });
  
  const config = {
    method: 'post',
    url: '/aliyun-api/adrive/v1.0/openFile/get_by_path',
    headers: {
      'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
      'Content-Type': 'application/json',
      'Accept': '*/*'
    },
    data: body
  };
  
  try {
    const {data: {file_id}} = await axios(config);
    if (file_id === undefined) {
      console.log("未找到");
      return null;
    } else {
      console.log(file_id, "file_idlrc");
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
          'Accept': '*/*'
        },
        data: data
      };
      
      const {data: {url}} = await axios(config);
      return url;
    }
  } catch (error) {
    return null;
  }
  
}