import {createRouter, createWebHistory} from "vue-router";
import MusicLibrary from "../views/MusicLibrary.vue";
import PlayList from "../views/PlayList.vue";
import AudioView from "../views/AudioView.vue";
import DataSync from "../views/DataSync.vue";
import Setting from "../views/Setting.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      name: "MusicLibrary",
      path: "/MusicLibrary",
      component: MusicLibrary
    },
    {
      name: "PlayList",
      path: "/PlayList",
      component: PlayList
    },
    {
      name: "AudioView",
      path: "/AudioView",
      component: AudioView
    },
    {
      name: "DataSync",
      path: "/DataSync",
      component: DataSync
    },
    {
      name: "Setting",
      path: "/Setting",
      component: Setting
    },
    {
      path: "/",
      redirect: "/PlayList"
    }
  ]
});

export default router;