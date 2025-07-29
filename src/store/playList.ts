import {defineStore} from "pinia";
import {ref} from "vue";

export const useGetPlayList = defineStore("playList", () => {
  const playListData: any = ref([]);
  return {
    playListData
  };
});