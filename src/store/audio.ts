import {defineStore} from "pinia";
import {ref} from "vue";

export const useGetAudio = defineStore("audio", () => {
    const playingPlayList = ref("");
    const selectedPlaylist = ref("");
    const playingSongKey = ref("");
    const currentAudioTime = ref(0);
    const displayTime = ref((0))
    const playingSong = ref("");
    const controlAudioKey = ref(0);
    const isPlaying = ref(false);
    const playbackModeIndex = ref(0);
    const audioDuration:any = ref(0);
    const shuffledIndex = ref(0);
    const volume = ref(50);
    const globalAudioBufferDuration = ref(0);
    const lrcSize = ref(16);
    return {
      playingPlayList,
      selectedPlaylist,
      playingSong,
      currentAudioTime,
      displayTime,
      globalAudioBufferDuration,
      playingSongKey,
      controlAudioKey,
      isPlaying,
      playbackModeIndex,
      audioDuration,
      shuffledIndex,
      volume,
      lrcSize
    };
  },
  {
    persist: true
  }
);