export interface HSL {
  h: number;
  s: number;
  l: number;
}

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

export function hexToHsl(hex: string): HSL {
  let r = 0, g = 0, b = 0;
  let raw = hex.replace("#", "");
  if (raw.length === 8) {
    raw = raw.substring(0, 6);
  }
  if (raw.length === 3) {
    r = parseInt(raw[0] + raw[0], 16) / 255;
    g = parseInt(raw[1] + raw[1], 16) / 255;
    b = parseInt(raw[2] + raw[2], 16) / 255;
  } else if (raw.length === 6) {
    r = parseInt(raw.substring(0, 2), 16) / 255;
    g = parseInt(raw.substring(2, 4), 16) / 255;
    b = parseInt(raw.substring(4, 6), 16) / 255;
  } else {
    return { h: 220, s: 80, l: 50 };
  }

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

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const S = s / 100;
  const L = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = S * Math.min(L, 1 - L);
  const f = (n: number) => {
    let color = L - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1);
    color = Math.max(0, Math.min(1, color));
    const code = Math.round(255 * color).toString(16);
    return code.length === 1 ? '0' + code : code;
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generateShades(baseHex: string): Record<number, string> {
  const { h, s, l } = hexToHsl(baseHex);
  const keys = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const shades: Record<number, string> = {};
  
  keys.forEach((key) => {
    let targetL = 50;
    if (key === 50) targetL = 98;
    else if (key === 100) targetL = 95;
    else if (key === 200) targetL = 88;
    else if (key === 300) targetL = 77;
    else if (key === 400) targetL = 64;
    else if (key === 500) targetL = l;
    else if (key === 600) targetL = Math.max(8, l - (100 - l) * 0.2);
    else if (key === 700) targetL = Math.max(6, l * 0.7);
    else if (key === 800) targetL = Math.max(5, l * 0.5);
    else if (key === 900) targetL = Math.max(4, l * 0.3);
    else if (key === 950) targetL = Math.max(3, l * 0.15);
    
    if (key < 500) {
      const t = key / 500;
      targetL = Math.round(98 - (98 - l) * t);
    } else if (key > 500) {
      const t = (key - 500) / (950 - 500);
      targetL = Math.round(l - (l - 8) * t);
    }
    
    let targetS = s;
    if (key === 50) targetS = Math.min(s, 25);
    else if (key === 100) targetS = Math.min(s, 40);
    else if (key === 950) targetS = Math.min(s, 30);
    
    shades[key] = hslToHex(h, targetS, targetL);
  });
  
  return shades;
}
