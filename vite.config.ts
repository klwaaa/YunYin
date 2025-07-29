import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    })
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    proxy: {
      // 阿里云盘API代理
      '/aliyun-api': {
        target: 'https://openapi.alipan.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/aliyun-api/, '')
      },
      // 新增北京区域数据代理
      '/aliyun-audio': {
        target: 'https://cn-beijing-data.aliyundrive.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/aliyun-audio/, ''),
        headers: {
          'Referer': 'https://www.aliyundrive.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': 'https://www.aliyundrive.com'
        },
        // 处理特殊字符
        pathRewrite: {
          '%2F': '/',
          '%3D': '='
        }
      }
    }
  },
}));
