import {createApp} from "vue";
import App from "./App.vue";
import {createPinia} from "pinia";
import router from "./router";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import useSetThemeColor from "./hooks/useSetThemeColor.ts";
// import './assets/themes/css/light.css'

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);
app.use(router);
// await useSetThemeColor();
app.mount("#app");

