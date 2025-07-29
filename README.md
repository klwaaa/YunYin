# Tauri + Vue + TypeScript

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Type Support For `.vue` Imports in TS

Since TypeScript cannot handle type information for `.vue` imports, they are shimmed to be a generic Vue component type by default. In most cases this is fine if you don't really care about component prop types outside of templates. However, if you wish to get actual prop types in `.vue` imports (for example to get props validation when using manual `h(...)` calls), you can enable Volar's Take Over mode by following these steps:

1. Run `Extensions: Show Built-in Extensions` from VS Code's command palette, look for `TypeScript and JavaScript Language Features`, then right click and select `Disable (Workspace)`. By default, Take Over mode will enable itself if the default TypeScript extension is disabled.
2. Reload the VS Code window by running `Developer: Reload Window` from the command palette.

You can learn more about Take Over mode [here](https://github.com/johnsoncodehk/volar/discussions/471).
 

不用复制"\" \
这个项目是一个基于阿里云盘的音乐播放器\
其中accessToken有效时长只有2小时\
获取token相关接口：\
https://www.yuque.com/aliyundrive/zpfszx/efabcs \
获取获取文件详情相关接口：\
https://www.yuque.com/aliyundrive/zpfszx/gogo34oi2gy98w5d \
本地存储中要放入这些东西：\
key:\
token\
value:\
{"access_token": "eyJraWQiOiJLcU8iLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJlZGY3M2RkMGU2N2U0OGRiYjk5OTc2YmUzZDcyYzRmMyIsImF1ZCI6ImYzYmM4NmFkODYxODQyNGQ5OWJlYjlkYTQyMWQ1NTI2IiwicyI6ImNkYSIsImQiOiIzNzU0MDA1NzEsNDQwNzAwODYzIiwiaXNzIjoiYWxpcGFuIiwiZXhwIjoxNzQ3MTE2MDgzLCJpYXQiOjE3NDcxMDg4ODAsImp0aSI6IjExNDViZjU0NDI0YjRiOTdiZjQ3MDE1NDJmMzBlNjJhIn0.uOjiss7draJnrBsryyUrsGq8IkqgLRwT6bieeJ6GXxI"\
"refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJlZGY3M2RkMGU2N2U0OGRiYjk5OTc2YmUzZDcyYzRmMyIsImF1ZCI6ImYzYmM4NmFkODYxODQyNGQ5OWJlYjlkYTQyMWQ1NTI2IiwiZXhwIjoxNzU0ODg0ODgwLCJpYXQiOjE3NDcxMDg4ODAsImp0aSI6IjcwM2EyMjE3OTQ3ZjQ4NzU4ZDk2YjFhYjBmNWU0ZDNlIn0.a9uD5wAJUVAbd7m0sCSYj9wt5PRK8mpfHHD4aRo4qmU9Oax10Di9YJSVIUFMw9aUejHT3uhMNrqCdFsVwoBLkg"}