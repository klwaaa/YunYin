import {invoke} from "@tauri-apps/api/core";
import {applyTheme, themeFromSourceColor} from "@material/material-color-utilities";

export default async function () {
  const themeColor: string = await invoke("get_theme_color");
  const themeColorJson = JSON.parse(themeColor);
  const theme = themeFromSourceColor(themeColorJson.source);
  applyTheme(theme);
}