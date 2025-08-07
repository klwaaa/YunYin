// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]



use reqwest::Client;
use serde_json::json;
use tauri::command;

use std::fs;
use std::fs::File;
use std::io::{Read, Write};

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

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
        let result = res.text().await.map_err(|e| e.to_string())?;
        Ok(result)
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
        let result = res.text().await.map_err(|e| e.to_string())?;
        Ok(result)
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

    println!("✅ 播放列表已写入 D:/Programming Exercises/app/data.json");
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
    let response = client
        .put(&upload_url)
        .body(buffer)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if response.status().is_success() {
        let etag = response
            .headers()
            .get("ETag")
            .and_then(|v| v.to_str().ok())
            .map(|s| s.trim_matches('"').to_string())
            .unwrap_or_else(|| "unknown".to_string());

        Ok(format!("✅ 分片上传成功! ETag: {}", etag))
    } else {
        let status = response.status();
        let text = response
            .text()
            .await
            .unwrap_or_else(|_| "无响应内容".to_string());
        Err(format!("❌ 上传失败 ({}): {}", status, text))
    }
}

/// ✅ Tauri 主函数入口
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_localhost::Builder::new(1420).build()) // ✅ 注册 Localhost 插件
        .invoke_handler(tauri::generate_handler![
            get_token_by_code,
            get_token_by_refresh,
            get_all_audio_data,
            update_playlist_data,
            upload_data_json,
        ])
        .run(tauri::generate_context!())
        .expect("运行 Tauri 应用失败");
}