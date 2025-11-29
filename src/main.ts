import {createApp} from "vue";
import App from "./App.vue";
import {createPinia} from "pinia";
import router from "./router";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import applyThemeFromRustScheme from "./hooks/useSetThemeColor.ts";
import {invoke} from "@tauri-apps/api/core";

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);
app.use(router);
const theme: any = await invoke("get_theme_color_from_local");
applyThemeFromRustScheme(theme.schemes.light);
app.mount("#app");

