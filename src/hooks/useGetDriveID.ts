import axios from 'axios';

export default async function () {
  const config = {
    method: 'post',
    url: '/aliyun-api/adrive/v1.0/user/getDriveInfo',
    headers: {
      'Authorization': JSON.parse(<string>localStorage.getItem("token")).access_token,
      'Accept': '*/*',
    }
  };
  
  axios(config)
    .then(function (response) {
      localStorage.setItem("drive_id", response.data.backup_drive_id);
    })
}
