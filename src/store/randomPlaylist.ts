import {defineStore} from "pinia";

export const useGetRandomPlaylist = defineStore("randomPlaylist", () => {
  if (!localStorage.getItem("randomPlaylist")){
    localStorage.setItem("randomPlaylist", JSON.stringify([]));
  }
});