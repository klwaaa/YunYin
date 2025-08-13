// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use serde_json::json;
use tauri::command;

use reqwest::Client;

use std::fs;
use std::fs::File;
use std::io::{Read, Write};

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

use std::path::Path;

/// 阿里云 token 接口地址
const TOKEN_URL: &str = "https://openapi.alipan.com/oauth/access_token";

/// ✅ 音频项结构
#[derive(Debug, Serialize, Deserialize)]
struct AudioFile {
    name: String,
    #[serde(rename = "fileId")]
    file_id: String,
    duration: String,
}

/// ✅ 每个歌单项是一个 map：如 { "a": [AudioFile, ...] }
type PlaylistItem = IndexMap<String, Vec<AudioFile>>;

/// ✅ 整体播放列表是多个歌单项组成的数组
type PlayListData = Vec<PlaylistItem>;

/// ✅ 使用授权码换取 token
#[command]
async fn get_token_by_code(code: String) -> Result<String, String> {
    let client_id = "f3bc86ad8618424d99beb9da421d5526";
    let client_secret = "2def6c4b6b034206811689b6115b5bc2";

    let client = Client::new();
    let res = client
        .post(TOKEN_URL)
        .json(&json!({
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "authorization_code",
            "code": code,
        }))
        .send()
        .await
        .map_err(|e| format!("请求失败：{}", e))?;

    if res.status().is_success() {
        let response_text = res.text().await.map_err(|e| e.to_string())?;
        Ok(response_text)
    } else {
        Err(format!("请求失败，状态码: {}", res.status()))
    }
}

/// ✅ 使用 refresh_token 刷新 token
#[command]
async fn get_token_by_refresh(refresh_token: String) -> Result<String, String> {
    let client_id = "f3bc86ad8618424d99beb9da421d5526";
    let client_secret = "2def6c4b6b034206811689b6115b5bc2";

    let client = Client::new();
    let res = client
        .post(TOKEN_URL)
        .json(&json!({
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        }))
        .send()
        .await
        .map_err(|e| format!("请求失败：{}", e))?;

    if res.status().is_success() {
        let response_text = res.text().await.map_err(|e| e.to_string())?;
        Ok(response_text)
    } else {
        Err(format!("请求失败，状态码: {}", res.status()))
    }
}

/// ✅ 读取本地 data.json 数据
#[command]
fn get_all_audio_data() -> Result<PlayListData, String> {
    let path = "./data.json";
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let parsed: PlayListData = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(parsed)
}

/// ✅ 更新并写入 data.json
#[command]
fn update_playlist_data(data: PlayListData) -> Result<(), String> {
    let path = "./data.json";
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;

    let mut file = File::create(path).map_err(|e| format!("创建文件失败: {}", e))?;
    file.write_all(json.as_bytes())
        .map_err(|e| format!("写入文件失败: {}", e))?;

    println!("播放列表已写入 D:/Programming Exercises/app/data.json");
    Ok(())
}

/// ✅ 上传 data.json 到指定 URL（用于阿里云分片）
#[command]
async fn upload_data_json(upload_url: String) -> Result<String, String> {
    let file_path = "./data.json";

    let mut file = File::open(file_path).map_err(|e| format!("打开文件失败: {}", e))?;

    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)
        .map_err(|e| format!("读取文件失败: {}", e))?;

    let client = reqwest::Client::new();
    let res = client
        .put(&upload_url)
        .body(buffer)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if res.status().is_success() {
        let etag = res
            .headers()
            .get("ETag")
            .and_then(|v| v.to_str().ok())
            .map(|s| s.trim_matches('"').to_string())
            .unwrap_or_else(|| "unknown".to_string());

        Ok(format!("✅ 分片上传成功! ETag: {}", etag))
    } else {
        let status = res.status();
        let text = res
            .text()
            .await
            .unwrap_or_else(|_| "无响应内容".to_string());
        Err(format!("上传失败 ({}): {}", status, text))
    }
}

// 通过get_by_path得到数据
#[command]
async fn using_path_get_data(
    drive_id: String,
    token: String,
    file_path: String,
) -> Result<String, String> {
    let client = Client::new();
    let url = "https://openapi.alipan.com/adrive/v1.0/openFile/get_by_path";

    let body = json!({
        "drive_id": drive_id,
        "file_path": file_path
    });

    let res = client
        .post(url)
        .header("Authorization", format!("Bearer {}", token))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("请求失败：{}", e))?;

    if res.status().is_success() {
        // 无论是拉取数据还是获取文件信息，都返回响应文本
        let response_text = res.text().await.map_err(|e| e.to_string())?;
        Ok(response_text)
    } else {
        Err(format!("请求失败，状态码: {}", res.status()))
    }
}

/// 得到音乐库数据
#[command]
async fn get_file_list(drive_id: String, parent_file_id: String, next_marker: String, token: String) -> Result<String, String> {
    let client = Client::new();

    let body = json!({
        "drive_id": drive_id,
        "parent_file_id": parent_file_id,
        "limit": 100,
        "category": "audio",
        "type": "file",
        "marker": next_marker
    });

    let res = client
        .post("https://openapi.alipan.com/adrive/v1.0/openFile/list")
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("请求失败：{}", e))?;

    if res.status().is_success() {
        let response_text = res.text().await.map_err(|e| format!("解析失败: {}", e))?;
        Ok(response_text)
    } else {
        Err(format!("请求失败，状态码: {}", res.status()))
    }
}

// 得到歌曲下载连接与大小
#[command]
async fn get_audio_url(
    drive_id: String,
    file_id: String,
    token: String,
) -> Result<String, String> {

    // 创建 HTTP 客户端
    let client = Client::new();

    // 构造请求体
    let body = serde_json::json!({
        "drive_id": drive_id,
        "file_id": file_id
    });

    // 发送请求并直接返回文本
    let resp = client
        .post("https://openapi.alipan.com/adrive/v1.0/openFile/getDownloadUrl")
        .header("Authorization", token)
        .header("Content-Type", "application/json")
        .json(&body)
        .send() // ✅ 先发出去
        .await
        .map_err(|e| format!("请求失败: {}", e))?
        .text() // ✅ 直接取文本
        .await
        .map_err(|e| format!("读取响应失败: {}", e))?;

    Ok(resp)
}

// 得到拉取数据的网址
#[command]
async fn get_data_url(drive_id: String, file_id: String, token: String) -> Result<String, String> {
    let client = Client::new();
    let url = "https://openapi.alipan.com/adrive/v1.0/openFile/get"; // 根据你实际的 URL 来调整

    let data = json!({
        "drive_id":drive_id,
        "file_id":file_id,
    });

    let response = client
        .post(url)
        .header("Authorization", format!("Bearer {}", token))
        .json(&data)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
        let response_text = response.text().await.map_err(|e| e.to_string())?;
        Ok(response_text)
    } else {
        Err("Failed to fetch file data".to_string())
    }
}

// 时把文件放入回收站
#[command]
async fn put_in_recycle_bin(token: String,drive_id: String, file_id: String) -> Result<String, String> {

    let client = reqwest::Client::new();
    let url = "https://openapi.alipan.com/adrive/v1.0/openFile/recyclebin/trash";

    let data = json!({
         "drive_id":drive_id,
         "file_id":file_id,
    });

    // 发送请求
    let response = client
        .post(url)
        .header("Authorization", format!("Bearer {}", token))
        .json(&data)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
       let response_text = response.text().await.map_err(|e| e.to_string())?;
       Ok(response_text)
    } else {
        Err(format!("Failed with status: {}", response.status()))
    }
}

// 文件创建
#[command]
async fn create_file(drive_id: String, parent_file_id: String, token: String) -> Result<String, String> {
    let client = Client::new();

    // 构造请求体
    let data = json!({
        "drive_id": drive_id,
        "parent_file_id": parent_file_id,
        "name": "data.json",
        "type": "file",
        "check_name_mode": "refuse"
    });

    // 发送 POST 请求
    let url = "https://openapi.alipan.com/adrive/v1.0/openFile/create";  // 使用实际的 URL
    let response = client.post(url)
        .header("Authorization", format!("Bearer {}", token))
        .json(&data)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    // 返回响应文本
    let response_text = response.text().await.map_err(|e| e.to_string())?;
    Ok(response_text)
}

// 标记上传完毕
#[command]
async fn complete_upload(drive_id: String, file_id: String, upload_id: String, token: String) -> Result<String, String> {
    let client = Client::new();

    let url = "https://openapi.alipan.com/adrive/v1.0/openFile/complete";

    let data = json!({
        "drive_id": drive_id,
        "file_id": file_id,
        "upload_id": upload_id,
    });

    let response = client.post(url)
        .header("Authorization", format!("Bearer {}", token))
        .json(&data)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
        let response_text = response.text().await.map_err(|e| e.to_string())?;
        Ok(response_text)
    } else {
        Err(format!("Error: {}", response.status()))
    }
}

/// ✅ Tauri 主函数入口
fn main() {

    // 首次启动创建data文件
    let file_path = "./data.json";

    if !Path::new(file_path).exists() {
        // 文件不存在，创建文件
        fs::File::create(file_path).expect("Failed to create file");
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_localhost::Builder::new(1420).build()) // ✅ 注册 Localhost 插件
        .invoke_handler(tauri::generate_handler![
            get_token_by_code,
            get_token_by_refresh,
            get_all_audio_data,
            update_playlist_data,
            upload_data_json,
            using_path_get_data,
            get_file_list,
            get_audio_url,
            get_data_url,
            put_in_recycle_bin,
            create_file,
            complete_upload
        ])
        .run(tauri::generate_context!())
        .expect("运行 Tauri 应用失败");
}