function argbObjToHex(c: {
  alpha: number;
  red: number;
  green: number;
  blue: number;
}) {
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(c.red)}${toHex(c.green)}${toHex(c.blue)}`;
}

function schemeKeyToCssVar(key: string) {
  return `--md-sys-color-${key.replace(/_/g, "-")}`;
}

function applyThemeFromRustScheme(scheme: Record<string, any>) {
  const root = document.documentElement;
  
  for (const [key, value] of Object.entries(scheme)) {
    if (!value || typeof value !== "object") continue;
    if (!("red" in value)) continue; // 只处理 Argb 对象
    const hex = argbObjToHex(value);
    const cssVar = schemeKeyToCssVar(key);
    
    root.style.setProperty(cssVar, hex);
  }
}

export default applyThemeFromRustScheme;

