import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light' | 'midnight' | 'oled' | 'matrix' | 'custom';
export type AccentColor = 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose' | 'blue' | 'custom';
export type UiDensity = 'comfortable' | 'compact';
export type GasUnit = 'ETH' | 'Gwei' | 'USD';
export type IpfsGateway = 'cloudflare' | 'ipfs.io' | 'pinata' | 'dweb.link' | 'custom';
export type ThemeFont = 'plus-jakarta' | 'jetbrains-mono' | 'inter' | 'system' | 'serif';
export type ThemeBorderRadius = 'sharp' | 'minimal' | 'standard' | 'rounded' | 'pill';
export type BackgroundPattern = 'none' | 'grid' | 'dots' | 'glow';
export type RoboPersonality = 'friendly' | 'crypto' | 'concise';

export interface CustomThemeColors {
  accent: string;
  accentGlow: string;
  background: string;
  surface: string;
  border: string;
  text: string;
}

export interface ThemeSettings {
  themeMode: ThemeMode;
  accentColor: AccentColor;
  uiDensity: UiDensity;
  reducedMotion: boolean;
  autoVerifyHashes: boolean;
  gasUnit: GasUnit;
  ipfsGateway: IpfsGateway;
  replicationFactor: number;
  customGatewayUrl: string;
  storageQuotaGb: number;
  autoCheckHealth: boolean;
  popRoboEnabled: boolean;
  popRoboPersonality: RoboPersonality;
  popRoboSound: boolean;
  // User customizable theme fields
  customColors: CustomThemeColors;
  fontFamily: ThemeFont;
  borderRadius: ThemeBorderRadius;
  backgroundPattern: BackgroundPattern;
  glassmorphism: boolean;
  customThemeActive: boolean;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  mode: ThemeMode;
  accent: AccentColor;
  colors: CustomThemeColors;
  font: ThemeFont;
  radius: ThemeBorderRadius;
  pattern: BackgroundPattern;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default-dark',
    name: 'Deep Slate (Default)',
    description: 'Sophisticated cryptographic dark mode with electric cyan accents',
    mode: 'dark',
    accent: 'cyan',
    colors: {
      accent: '#06b6d4',
      accentGlow: '#22d3ee',
      background: '#020617',
      surface: '#0f172a',
      border: '#1e293b',
      text: '#f8fafc',
    },
    font: 'plus-jakarta',
    radius: 'standard',
    pattern: 'grid',
  },
  {
    id: 'daylight-clean',
    name: 'Daylight Crisp (Light)',
    description: 'Ultra high-contrast daylight theme with royal azure accents',
    mode: 'light',
    accent: 'blue',
    colors: {
      accent: '#2563eb',
      accentGlow: '#3b82f6',
      background: '#f8fafc',
      surface: '#ffffff',
      border: '#e2e8f0',
      text: '#0f172a',
    },
    font: 'plus-jakarta',
    radius: 'standard',
    pattern: 'none',
  },
  {
    id: 'oled-black',
    name: 'OLED Pure Black',
    description: 'True #000000 black canvas for battery efficiency and maximum OLED contrast',
    mode: 'oled',
    accent: 'cyan',
    colors: {
      accent: '#00f2fe',
      accentGlow: '#4facfe',
      background: '#000000',
      surface: '#080808',
      border: '#1c1c1c',
      text: '#ffffff',
    },
    font: 'jetbrains-mono',
    radius: 'minimal',
    pattern: 'none',
  },
  {
    id: 'cyberpunk-midnight',
    name: 'Midnight Indigo',
    description: 'Deep ultraviolet and indigo canvas with vivid violet highlights',
    mode: 'midnight',
    accent: 'violet',
    colors: {
      accent: '#a855f7',
      accentGlow: '#c084fc',
      background: '#090814',
      surface: '#120f26',
      border: '#27214d',
      text: '#f5f3ff',
    },
    font: 'plus-jakarta',
    radius: 'rounded',
    pattern: 'glow',
  },
  {
    id: 'matrix-terminal',
    name: 'Matrix Phosphor',
    description: 'Classic hacker terminal with emerald green glow on dark carbon',
    mode: 'matrix',
    accent: 'emerald',
    colors: {
      accent: '#22c55e',
      accentGlow: '#4ade80',
      background: '#040d06',
      surface: '#0a1a0d',
      border: '#143d1a',
      text: '#dcfce7',
    },
    font: 'jetbrains-mono',
    radius: 'sharp',
    pattern: 'grid',
  },
  {
    id: 'synthwave-neon',
    name: 'Synthwave Glow',
    description: 'Warm rose pink and neon dusk aesthetic',
    mode: 'custom',
    accent: 'rose',
    colors: {
      accent: '#ec4899',
      accentGlow: '#f472b6',
      background: '#0d0614',
      surface: '#1a0d26',
      border: '#35154d',
      text: '#fdf2f8',
    },
    font: 'plus-jakarta',
    radius: 'pill',
    pattern: 'grid',
  },
  {
    id: 'solarized-amber',
    name: 'Solarized Amber',
    description: 'Warm golden amber hues designed for long nighttime cryptographic sessions',
    mode: 'custom',
    accent: 'amber',
    colors: {
      accent: '#f59e0b',
      accentGlow: '#fbbf24',
      background: '#0f1115',
      surface: '#181b22',
      border: '#2c3240',
      text: '#fef3c7',
    },
    font: 'inter',
    radius: 'standard',
    pattern: 'dots',
  },
  {
    id: 'tokyo-nightfall',
    name: 'Tokyo Nightfall',
    description: 'Deep navy night with sky blue neon and sapphire glow',
    mode: 'custom',
    accent: 'blue',
    colors: {
      accent: '#38bdf8',
      accentGlow: '#60a5fa',
      background: '#0c1021',
      surface: '#151b36',
      border: '#232d59',
      text: '#e0f2fe',
    },
    font: 'plus-jakarta',
    radius: 'standard',
    pattern: 'glow',
  },
  {
    id: 'emerald-vault',
    name: 'Emerald Swarm Vault',
    description: 'Mint IPFS node luster on deep jade green foundations',
    mode: 'custom',
    accent: 'emerald',
    colors: {
      accent: '#10b981',
      accentGlow: '#34d399',
      background: '#03130d',
      surface: '#082117',
      border: '#123d2b',
      text: '#ecfdf5',
    },
    font: 'inter',
    radius: 'rounded',
    pattern: 'dots',
  },
  {
    id: 'warm-paper',
    name: 'Cozy Warm Sepia',
    description: 'Gentle warm paper canvas with rich amber and serif editorial typography',
    mode: 'light',
    accent: 'amber',
    colors: {
      accent: '#d97706',
      accentGlow: '#f59e0b',
      background: '#fbf9f4',
      surface: '#f2eee3',
      border: '#dfd5bf',
      text: '#292524',
    },
    font: 'serif',
    radius: 'standard',
    pattern: 'none',
  }
];

export const ACCENT_COLOR_MAP: Record<AccentColor, { accent: string; accentGlow: string }> = {
  cyan: { accent: '#06b6d4', accentGlow: '#22d3ee' },
  emerald: { accent: '#10b981', accentGlow: '#34d399' },
  violet: { accent: '#8b5cf6', accentGlow: '#a78bfa' },
  amber: { accent: '#f59e0b', accentGlow: '#fbbf24' },
  rose: { accent: '#f43f5e', accentGlow: '#fb7185' },
  blue: { accent: '#3b82f6', accentGlow: '#60a5fa' },
  custom: { accent: '#06b6d4', accentGlow: '#22d3ee' },
};

export const THEME_MODE_MAP: Record<ThemeMode, { background: string; surface: string; border: string; text: string }> = {
  dark: { background: '#020617', surface: '#0f172a', border: '#1e293b', text: '#f8fafc' },
  light: { background: '#f8fafc', surface: '#ffffff', border: '#e2e8f0', text: '#0f172a' },
  midnight: { background: '#090814', surface: '#120f26', border: '#27214d', text: '#f5f3ff' },
  matrix: { background: '#040d06', surface: '#0a1a0d', border: '#143d1a', text: '#dcfce7' },
  oled: { background: '#000000', surface: '#080808', border: '#1c1c1c', text: '#ffffff' },
  custom: { background: '#020617', surface: '#0f172a', border: '#1e293b', text: '#f8fafc' },
};

export const DEFAULT_THEME_COLORS: CustomThemeColors = {
  accent: '#06b6d4',
  accentGlow: '#22d3ee',
  background: '#020617',
  surface: '#0f172a',
  border: '#1e293b',
  text: '#f8fafc',
};

const DEFAULT_SETTINGS: ThemeSettings = {
  themeMode: 'dark',
  accentColor: 'cyan',
  uiDensity: 'comfortable',
  reducedMotion: false,
  autoVerifyHashes: true,
  gasUnit: 'ETH',
  ipfsGateway: 'cloudflare',
  replicationFactor: 3,
  customGatewayUrl: '',
  storageQuotaGb: 5,
  autoCheckHealth: true,
  popRoboEnabled: true,
  popRoboPersonality: 'friendly',
  popRoboSound: true,
  customColors: DEFAULT_THEME_COLORS,
  fontFamily: 'plus-jakarta',
  borderRadius: 'standard',
  backgroundPattern: 'grid',
  glassmorphism: true,
  customThemeActive: false,
};

const STORAGE_THEME_KEY = 'saus_theme_settings_v2';

interface ThemeContextType {
  settings: ThemeSettings;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setUiDensity: (density: UiDensity) => void;
  setReducedMotion: (reduced: boolean) => void;
  setAutoVerifyHashes: (verify: boolean) => void;
  setGasUnit: (unit: GasUnit) => void;
  setIpfsGateway: (gateway: IpfsGateway) => void;
  setReplicationFactor: (factor: number) => void;
  setCustomGatewayUrl: (url: string) => void;
  setStorageQuotaGb: (quota: number) => void;
  setAutoCheckHealth: (check: boolean) => void;
  setPopRoboEnabled: (enabled: boolean) => void;
  setPopRoboPersonality: (personality: RoboPersonality) => void;
  setPopRoboSound: (sound: boolean) => void;
  // Custom theme modifiers
  setCustomColor: (field: keyof CustomThemeColors, value: string) => void;
  setCustomColors: (colors: CustomThemeColors) => void;
  setFontFamily: (font: ThemeFont) => void;
  setBorderRadius: (radius: ThemeBorderRadius) => void;
  setBackgroundPattern: (pattern: BackgroundPattern) => void;
  setGlassmorphism: (glass: boolean) => void;
  applyPreset: (presetId: string) => void;
  exportThemeJson: () => string;
  importThemeJson: (jsonStr: string) => boolean;
  resetSettings: () => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isThemeStudioOpen: boolean;
  setIsThemeStudioOpen: (open: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function hexToRgb(hex: string): string {
  if (!hex) return '6, 182, 212';
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return '6, 182, 212';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

const RADIUS_MAP: Record<ThemeBorderRadius, string> = {
  sharp: '0px',
  minimal: '6px',
  standard: '12px',
  rounded: '18px',
  pill: '28px',
};

const FONT_MAP: Record<ThemeFont, string> = {
  'plus-jakarta': "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  'jetbrains-mono': "'JetBrains Mono', monospace",
  'inter': "'Inter', system-ui, -apple-system, sans-serif",
  'system': "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  'serif': "'Georgia', 'Cambria', 'Times New Roman', serif",
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THEME_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          customColors: { ...DEFAULT_THEME_COLORS, ...(parsed.customColors || {}) },
        };
      }
    } catch (e) {
      console.warn('Failed to parse theme settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_THEME_KEY, JSON.stringify(settings));
    } catch (e) {}

    const root = document.documentElement;

    // Remove previous classes
    root.classList.remove('dark', 'light', 'theme-midnight', 'theme-oled', 'theme-matrix', 'theme-custom');
    root.classList.remove('accent-cyan', 'accent-emerald', 'accent-violet', 'accent-amber', 'accent-rose', 'accent-blue', 'accent-custom');

    // Determine effective theme mode
    if (settings.themeMode === 'light') {
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else if (settings.themeMode === 'custom') {
      root.classList.add('dark');
      root.classList.add('theme-custom');
      root.setAttribute('data-theme', 'custom');
    } else {
      root.classList.add('dark');
      root.classList.add(`theme-${settings.themeMode}`);
      root.setAttribute('data-theme', settings.themeMode);
    }

    // Set accent class and attribute
    root.classList.add(`accent-${settings.accentColor}`);
    root.setAttribute('data-accent', settings.accentColor);

    // Set density
    root.setAttribute('data-density', settings.uiDensity);

    // Dynamic CSS Custom Properties for user custom theme
    const activeColors = settings.customColors || DEFAULT_THEME_COLORS;
    root.style.setProperty('--theme-accent', activeColors.accent);
    root.style.setProperty('--theme-accent-rgb', hexToRgb(activeColors.accent));
    root.style.setProperty('--theme-accent-glow', activeColors.accentGlow);
    root.style.setProperty('--theme-bg', activeColors.background);
    root.style.setProperty('--theme-surface', activeColors.surface);
    root.style.setProperty('--theme-border', activeColors.border);
    root.style.setProperty('--theme-text', activeColors.text);

    // Typography & Geometry
    root.style.setProperty('--theme-radius', RADIUS_MAP[settings.borderRadius] || '12px');
    root.style.setProperty('--theme-font', FONT_MAP[settings.fontFamily] || FONT_MAP['plus-jakarta']);
    root.setAttribute('data-pattern', settings.backgroundPattern);
    root.setAttribute('data-glass', settings.glassmorphism ? 'true' : 'false');

  }, [settings]);

  const setThemeMode = (themeMode: ThemeMode) => {
    const modePreset = THEME_MODE_MAP[themeMode] || THEME_MODE_MAP.dark;
    setSettings(prev => ({
      ...prev,
      themeMode,
      customColors: {
        ...prev.customColors,
        background: modePreset.background,
        surface: modePreset.surface,
        border: modePreset.border,
        text: modePreset.text,
      },
    }));
  };

  const setAccentColor = (accentColor: AccentColor) => {
    const preset = ACCENT_COLOR_MAP[accentColor] || ACCENT_COLOR_MAP.cyan;
    setSettings(prev => ({
      ...prev,
      accentColor,
      customColors: {
        ...prev.customColors,
        accent: preset.accent,
        accentGlow: preset.accentGlow,
      },
    }));
  };

  const setUiDensity = (uiDensity: UiDensity) => {
    setSettings(prev => ({ ...prev, uiDensity }));
  };

  const setReducedMotion = (reducedMotion: boolean) => {
    setSettings(prev => ({ ...prev, reducedMotion }));
  };

  const setAutoVerifyHashes = (autoVerifyHashes: boolean) => {
    setSettings(prev => ({ ...prev, autoVerifyHashes }));
  };

  const setGasUnit = (gasUnit: GasUnit) => {
    setSettings(prev => ({ ...prev, gasUnit }));
  };

  const setIpfsGateway = (ipfsGateway: IpfsGateway) => {
    setSettings(prev => ({ ...prev, ipfsGateway }));
  };

  const setReplicationFactor = (replicationFactor: number) => {
    setSettings(prev => ({ ...prev, replicationFactor }));
  };

  const setCustomGatewayUrl = (customGatewayUrl: string) => {
    setSettings(prev => ({ ...prev, customGatewayUrl }));
  };

  const setStorageQuotaGb = (storageQuotaGb: number) => {
    setSettings(prev => ({ ...prev, storageQuotaGb }));
  };

  const setAutoCheckHealth = (autoCheckHealth: boolean) => {
    setSettings(prev => ({ ...prev, autoCheckHealth }));
  };

  const setPopRoboEnabled = (popRoboEnabled: boolean) => {
    setSettings(prev => ({ ...prev, popRoboEnabled }));
  };

  const setPopRoboPersonality = (popRoboPersonality: RoboPersonality) => {
    setSettings(prev => ({ ...prev, popRoboPersonality }));
  };

  const setPopRoboSound = (popRoboSound: boolean) => {
    setSettings(prev => ({ ...prev, popRoboSound }));
  };

  // Custom Theme Modifiers
  const setCustomColor = (field: keyof CustomThemeColors, value: string) => {
    setSettings(prev => ({
      ...prev,
      themeMode: 'custom',
      accentColor: 'custom',
      customThemeActive: true,
      customColors: {
        ...prev.customColors,
        [field]: value,
      },
    }));
  };

  const setCustomColors = (colors: CustomThemeColors) => {
    setSettings(prev => ({
      ...prev,
      themeMode: 'custom',
      accentColor: 'custom',
      customThemeActive: true,
      customColors: colors,
    }));
  };

  const setFontFamily = (fontFamily: ThemeFont) => {
    setSettings(prev => ({ ...prev, fontFamily }));
  };

  const setBorderRadius = (borderRadius: ThemeBorderRadius) => {
    setSettings(prev => ({ ...prev, borderRadius }));
  };

  const setBackgroundPattern = (backgroundPattern: BackgroundPattern) => {
    setSettings(prev => ({ ...prev, backgroundPattern }));
  };

  const setGlassmorphism = (glassmorphism: boolean) => {
    setSettings(prev => ({ ...prev, glassmorphism }));
  };

  const applyPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setSettings(prev => ({
      ...prev,
      themeMode: preset.mode,
      accentColor: preset.accent,
      customColors: { ...preset.colors },
      fontFamily: preset.font,
      borderRadius: preset.radius,
      backgroundPattern: preset.pattern,
      customThemeActive: preset.mode === 'custom',
    }));
  };

  const exportThemeJson = (): string => {
    const exportData = {
      themeMode: settings.themeMode,
      accentColor: settings.accentColor,
      customColors: settings.customColors,
      fontFamily: settings.fontFamily,
      borderRadius: settings.borderRadius,
      backgroundPattern: settings.backgroundPattern,
      glassmorphism: settings.glassmorphism,
    };
    return JSON.stringify(exportData, null, 2);
  };

  const importThemeJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object') {
        setSettings(prev => ({
          ...prev,
          themeMode: parsed.themeMode || 'custom',
          accentColor: parsed.accentColor || 'custom',
          customColors: { ...prev.customColors, ...(parsed.customColors || {}) },
          fontFamily: parsed.fontFamily || prev.fontFamily,
          borderRadius: parsed.borderRadius || prev.borderRadius,
          backgroundPattern: parsed.backgroundPattern || prev.backgroundPattern,
          glassmorphism: parsed.glassmorphism ?? prev.glassmorphism,
          customThemeActive: true,
        }));
        return true;
      }
    } catch (e) {
      console.error('Failed to import theme:', e);
    }
    return false;
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <ThemeContext.Provider
      value={{
        settings,
        setThemeMode,
        setAccentColor,
        setUiDensity,
        setReducedMotion,
        setAutoVerifyHashes,
        setGasUnit,
        setIpfsGateway,
        setReplicationFactor,
        setCustomGatewayUrl,
        setStorageQuotaGb,
        setAutoCheckHealth,
        setPopRoboEnabled,
        setPopRoboPersonality,
        setPopRoboSound,
        setCustomColor,
        setCustomColors,
        setFontFamily,
        setBorderRadius,
        setBackgroundPattern,
        setGlassmorphism,
        applyPreset,
        exportThemeJson,
        importThemeJson,
        resetSettings,
        isSettingsOpen,
        setIsSettingsOpen,
        isThemeStudioOpen,
        setIsThemeStudioOpen,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
