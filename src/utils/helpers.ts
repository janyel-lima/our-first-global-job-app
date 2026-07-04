export const formatCertifiedDate = (dateVal: any): string => {
  if (!dateVal) return "Recentemente";
  if (typeof dateVal === "string") {
    if (dateVal.includes("/") && dateVal.split("/").length === 3) {
      return dateVal;
    }
    const parsed = Date.parse(dateVal);
    if (!isNaN(parsed)) {
      return new Date(parsed).toLocaleDateString("pt-BR");
    }
    return dateVal;
  }
  if (dateVal && typeof dateVal === "object" && "seconds" in dateVal) {
    return new Date(dateVal.seconds * 1000).toLocaleDateString("pt-BR");
  }
  const parsedDate = new Date(dateVal);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleDateString("pt-BR");
  }
  return "Recentemente";
};

export const getCachedVal = <T>(key: string, backup: T): T => {
  if (typeof window === "undefined") return backup;
  try {
    const item = localStorage.getItem(key);
    if (!item) return backup;
    const parsed = JSON.parse(item);
    if (Array.isArray(backup)) {
      if (Array.isArray(parsed)) {
        return parsed as unknown as T;
      } else if (parsed && typeof parsed === "object") {
        return Object.values(parsed) as unknown as T;
      }
      return backup;
    }
    return parsed as unknown as T;
  } catch {
    return backup;
  }
};
export function getAlmostWhiteVariant(hex: string, isDark: boolean = false): string {
  let r = 0, g = 0, b = 0;
  let raw = hex.replace('#', '');
  if (raw.length === 8) {
    raw = raw.substring(0, 6);
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    r = parseInt(raw.substring(0, 2), 16);
    g = parseInt(raw.substring(2, 4), 16);
    b = parseInt(raw.substring(4, 6), 16);
  } else if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    r = parseInt(raw.charAt(0) + raw.charAt(0), 16);
    g = parseInt(raw.charAt(1) + raw.charAt(1), 16);
    b = parseInt(raw.charAt(2) + raw.charAt(2), 16);
  } else {
    return isDark ? "#0f172a" : "#f8fafc";
  }

  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  const targetL = isDark ? 0.08 : 0.98;
  const targetS = Math.min(s + 0.1, 0.4);

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let q = targetL < 0.5 ? targetL * (1 + targetS) : targetL + targetS - targetL * targetS;
  let p = 2 * targetL - q;
  
  let finalR = Math.max(0, Math.min(255, Math.round(hue2rgb(p, q, h + 1/3) * 255)));
  let finalG = Math.max(0, Math.min(255, Math.round(hue2rgb(p, q, h) * 255)));
  let finalB = Math.max(0, Math.min(255, Math.round(hue2rgb(p, q, h - 1/3) * 255)));

  const toHex = (num: number) => {
    const str = num.toString(16);
    return str.length === 1 ? '0' + str : str;
  };

  return `#${toHex(finalR)}${toHex(finalG)}${toHex(finalB)}`;
}
