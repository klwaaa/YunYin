import {createRouter, createWebHistory} from "vue-router";
import Home from "../components/Home.vue";
import MusicLibrary from "../views/MusicLibrary.vue";
import PlayList from "../views/PlayList.vue";
import AudioView from "../views/AudioView.vue";
import DataSync from "../views/DataSync.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      name:"Home",
      path: "/Home",
      component: Home
    },
    {
      name:"MusicLibrary",
      path:"/MusicLibrary",
      component: MusicLibrary
    },
    {
      name:"PlayList",
      path:"/PlayList",
      component: PlayList
    },
    {
      name:"AudioView",
      path:"/AudioView",
      component: AudioView
    },
    {
      name:"DataSync",
      path:"/DataSync",
      component: DataSync
    },
    {
      path:"/",
      redirect: "/PlayList"
    }
  ]
});

export default router;