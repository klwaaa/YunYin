import axios from 'axios';

let controller: AbortController | null = null;


export default async function getAudioUrl(file_id: any): Promise<any> {
  // 如果上一个请求存在，取消它
  if (controller) {
    controller.abort();
  }
  
  // 创建新的 controller
  controller = new AbortController();
  
  const body = JSON.stringify({
    drive_id: localStorage.getItem("drive_id"),
    file_id: file_id
  });
  
  const config = {
    method: 'post',
    url: '/aliyun-api/adrive/v1.0/openFile/getDownloadUrl',
    headers: {
      'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
      'Content-Type': 'application/json',
      'Accept': '*/*',
    },
    data: body,
    signal: controller.signal, // 绑定信号
  };
  
  try {
    const { data } = await axios(config);
    if (!data) {
      console.log('错误');
      return;
    }
    return {
      audioUrl: data.url,
      audioSize: data.size
    };
  } catch (error: any) {
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      console.log('请求被取消');
    } else {
      console.error('请求失败:', error);
    }
  }
}