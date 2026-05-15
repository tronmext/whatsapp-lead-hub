import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type ThemeColor = {
  id: string;
  name: string;
  primary: string;
  primaryForeground: string;
  ring: string;
  accent: string;
  accentForeground: string;
  glow: string;
  glowColor: string;
  hex?: string;
};

const THEMES: Record<string, ThemeColor> = {
  orange: {
    id: "orange",
    name: "Laranja",
    primary: "oklch(0.72 0.18 52)",
    primaryForeground: "oklch(0.10 0 0)",
    ring: "oklch(0.72 0.18 52)",
    accent: "oklch(0.72 0.18 52)",
    accentForeground: "oklch(0.10 0 0)",
    glow: "rgba(255, 128, 31, 0.2)",
    glowColor: "rgba(255, 128, 31, 0.12)",
    hex: "#ff801f",
  },
  blue: {
    id: "blue",
    name: "Azul",
    primary: "oklch(0.70 0.16 245)",
    primaryForeground: "oklch(0.98 0 0)",
    ring: "oklch(0.70 0.16 245)",
    accent: "oklch(0.70 0.16 245)",
    accentForeground: "oklch(0.98 0 0)",
    glow: "rgba(59, 130, 246, 0.2)",
    glowColor: "rgba(59, 130, 246, 0.12)",
    hex: "#3b82f6",
  },
  green: {
    id: "green",
    name: "Verde",
    primary: "oklch(0.72 0.18 155)",
    primaryForeground: "oklch(0.10 0 0)",
    ring: "oklch(0.72 0.18 155)",
    accent: "oklch(0.72 0.18 155)",
    accentForeground: "oklch(0.10 0 0)",
    glow: "rgba(34, 197, 94, 0.2)",
    glowColor: "rgba(34, 197, 94, 0.12)",
    hex: "#22c55e",
  },
  purple: {
    id: "purple",
    name: "Roxo",
    primary: "oklch(0.68 0.20 310)",
    primaryForeground: "oklch(0.98 0 0)",
    ring: "oklch(0.68 0.20 310)",
    accent: "oklch(0.68 0.20 310)",
    accentForeground: "oklch(0.98 0 0)",
    glow: "rgba(168, 85, 247, 0.2)",
    glowColor: "rgba(168, 85, 247, 0.12)",
    hex: "#a855f7",
  },
  rose: {
    id: "rose",
    name: "Rosa",
    primary: "oklch(0.70 0.20 15)",
    primaryForeground: "oklch(0.98 0 0)",
    ring: "oklch(0.70 0.20 15)",
    accent: "oklch(0.70 0.20 15)",
    accentForeground: "oklch(0.98 0 0)",
    glow: "rgba(244, 63, 94, 0.2)",
    glowColor: "rgba(244, 63, 94, 0.12)",
    hex: "#f43f5e",
  },
  cyan: {
    id: "cyan",
    name: "Ciano",
    primary: "oklch(0.74 0.16 205)",
    primaryForeground: "oklch(0.10 0 0)",
    ring: "oklch(0.74 0.16 205)",
    accent: "oklch(0.74 0.16 205)",
    accentForeground: "oklch(0.10 0 0)",
    glow: "rgba(6, 182, 212, 0.2)",
    glowColor: "rgba(6, 182, 212, 0.12)",
    hex: "#06b6d4",
  },
  amber: {
    id: "amber",
    name: "Ambar",
    primary: "oklch(0.78 0.18 75)",
    primaryForeground: "oklch(0.10 0 0)",
    ring: "oklch(0.78 0.18 75)",
    accent: "oklch(0.78 0.18 75)",
    accentForeground: "oklch(0.10 0 0)",
    glow: "rgba(245, 158, 11, 0.2)",
    glowColor: "rgba(245, 158, 11, 0.12)",
    hex: "#f59e0b",
  },
  violet: {
    id: "violet",
    name: "Violeta",
    primary: "oklch(0.65 0.22 295)",
    primaryForeground: "oklch(0.98 0 0)",
    ring: "oklch(0.65 0.22 295)",
    accent: "oklch(0.65 0.22 295)",
    accentForeground: "oklch(0.98 0 0)",
    glow: "rgba(139, 92, 246, 0.2)",
    glowColor: "rgba(139, 92, 246, 0.12)",
    hex: "#8b5cf6",
  },
};

const THEME_STORAGE_KEY = "leadflow.theme";
const CUSTOM_COLOR_KEY = "leadflow.customColor";
const DEFAULT_THEME = "orange";

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

function rgbToOklch(r: number, g: number, b: number): [number, number, number] {
  const toLinear = (c: number) => (c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92);
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const lmsToLab = (l: number, m: number, s: number) => {
    const ll = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const aa = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    return [ll, aa, bb];
  };

  const [ll, aa, bb] = lmsToLab(
    Math.pow(l, 1 / 3),
    Math.pow(m, 1 / 3),
    Math.pow(s, 1 / 3)
  );

  const L = 1.16 * ll - 0.16;
  const C = Math.sqrt(aa * aa + bb * bb);
  const H = (Math.atan2(bb, aa) * 180) / Math.PI;

  return [Math.max(0, Math.min(1, L)), C, ((H % 360) + 360) % 360];
}

function hexToOklchString(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const [l, c, h] = rgbToOklch(r, g, b);
  return `oklch(${l.toFixed(2)} ${c.toFixed(2)} ${h.toFixed(0)})`;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createCustomTheme(hex: string): ThemeColor {
  const oklch = hexToOklchString(hex);
  const luminance = parseInt(hex.slice(1, 3), 16) * 0.299 + parseInt(hex.slice(3, 5), 16) * 0.587 + parseInt(hex.slice(5, 7), 16) * 0.114;
  const isDark = luminance < 128;
  const fg = isDark ? "oklch(0.98 0 0)" : "oklch(0.10 0 0)";

  return {
    id: "custom",
    name: "Personalizada",
    primary: oklch,
    primaryForeground: fg,
    ring: oklch,
    accent: oklch,
    accentForeground: fg,
    glow: hexToRgba(hex, 0.2),
    glowColor: hexToRgba(hex, 0.12),
    hex,
  };
}

type ThemeContextType = {
  currentTheme: ThemeColor;
  themes: Record<string, ThemeColor>;
  setTheme: (themeId: string) => void;
  setCustomColor: (hex: string) => void;
  customColor: string | null;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function applyTheme(theme: ThemeColor) {
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primary-foreground", theme.primaryForeground);
  root.style.setProperty("--ring", theme.ring);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-foreground", theme.accentForeground);
  root.style.setProperty("--sidebar-primary", theme.primary);
  root.style.setProperty("--sidebar-ring", theme.ring);
  root.style.setProperty("--primary-glow", theme.glow);
  root.style.setProperty("--primary-glow-color", theme.glowColor);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentThemeId, setCurrentThemeId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
    }
    return DEFAULT_THEME;
  });

  const [customColor, setCustomColorState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(CUSTOM_COLOR_KEY);
    }
    return null;
  });

  const currentTheme = customColor && currentThemeId === "custom"
    ? createCustomTheme(customColor)
    : THEMES[currentThemeId] || THEMES[DEFAULT_THEME];

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const setTheme = useCallback((themeId: string) => {
    setCurrentThemeId(themeId);
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  }, []);

  const setCustomColor = useCallback((hex: string) => {
    setCustomColorState(hex);
    setCurrentThemeId("custom");
    localStorage.setItem(THEME_STORAGE_KEY, "custom");
    localStorage.setItem(CUSTOM_COLOR_KEY, hex);
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme, themes: THEMES, setTheme, setCustomColor, customColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export { THEMES };
