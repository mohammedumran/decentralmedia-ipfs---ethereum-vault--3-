import React, { useState } from 'react';
import {
  X,
  Palette,
  Sparkles,
  Sliders,
  Type,
  Maximize2,
  Copy,
  Check,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  Layers,
  Eye,
  FileCode,
  Shield,
  Zap,
  Grid,
  Sun,
  Moon,
  Info
} from 'lucide-react';
import {
  useTheme,
  THEME_PRESETS,
  ThemePreset,
  ThemeFont,
  ThemeBorderRadius,
  BackgroundPattern,
  CustomThemeColors
} from '../context/ThemeContext';

interface ThemeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeStudioModal: React.FC<ThemeStudioModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
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
  } = useTheme();

  const [activeTab, setActiveTab] = useState<'presets' | 'colors' | 'typography' | 'export'>('presets');
  const [copiedJson, setCopiedJson] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    const json = exportThemeJson();
    navigator.clipboard.writeText(json);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleImport = () => {
    setImportError('');
    setImportSuccess(false);
    if (!importInput.trim()) {
      setImportError('Please paste a valid theme JSON payload.');
      return;
    }
    const success = importThemeJson(importInput.trim());
    if (success) {
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 2500);
    } else {
      setImportError('Invalid JSON format. Please verify the theme object structure.');
    }
  };

  // Swatches for quick color picking
  const accentSwatches = [
    { name: 'Cyan', color: '#06b6d4' },
    { name: 'Emerald', color: '#10b981' },
    { name: 'Violet', color: '#8b5cf6' },
    { name: 'Rose', color: '#ec4899' },
    { name: 'Amber', color: '#f59e0b' },
    { name: 'Blue', color: '#3b82f6' },
    { name: 'Lime', color: '#84cc16' },
    { name: 'Indigo', color: '#6366f1' },
    { name: 'Crimson', color: '#ef4444' },
    { name: 'Teal', color: '#14b8a6' },
  ];

  const backgroundSwatches = [
    { name: 'Deep Slate', color: '#020617' },
    { name: 'OLED Black', color: '#000000' },
    { name: 'Midnight', color: '#090814' },
    { name: 'Hacker Carbon', color: '#040d06' },
    { name: 'Tokyo Navy', color: '#0c1021' },
    { name: 'Daylight Crisp', color: '#f8fafc' },
    { name: 'Warm Sepia', color: '#fbf9f4' },
    { name: 'Charcoal', color: '#121212' },
  ];

  const surfaceSwatches = [
    { name: 'Dark Slate', color: '#0f172a' },
    { name: 'True Black Card', color: '#080808' },
    { name: 'Midnight Violet', color: '#120f26' },
    { name: 'Terminal Green', color: '#0a1a0d' },
    { name: 'Deep Sapphire', color: '#151b36' },
    { name: 'Crisp White', color: '#ffffff' },
    { name: 'Cream Card', color: '#f2eee3' },
  ];

  const borderSwatches = [
    { name: 'Slate Border', color: '#1e293b' },
    { name: 'Subtle Black', color: '#1a1a1a' },
    { name: 'Violet Glow', color: '#27214d' },
    { name: 'Matrix Border', color: '#143d1a' },
    { name: 'Light Gray', color: '#e2e8f0' },
    { name: 'Warm Border', color: '#dfd5bf' },
  ];

  const fonts: { id: ThemeFont; name: string; desc: string; sample: string }[] = [
    { id: 'plus-jakarta', name: 'Plus Jakarta Sans', desc: 'Modern geometric display and UI font', sample: 'saus Protocol 2026' },
    { id: 'jetbrains-mono', name: 'JetBrains Mono', desc: 'Precision monospace developer typography', sample: '0x71C...3A9F // SHA256' },
    { id: 'inter', name: 'Inter UI', desc: 'Clean, neutral readability standard', sample: 'Decentralized Vault v2' },
    { id: 'system', name: 'Native System UI', desc: 'Native OS font (San Francisco / Roboto)', sample: 'Native Hardware Key' },
    { id: 'serif', name: 'Editorial Serif', desc: 'Warm, classic literary elegance', sample: 'Immutable Media Archival' },
  ];

  const borderRadii: { id: ThemeBorderRadius; name: string; px: string; previewClass: string }[] = [
    { id: 'sharp', name: 'Sharp (Brutalist)', px: '0px', previewClass: 'rounded-none' },
    { id: 'minimal', name: 'Minimal', px: '6px', previewClass: 'rounded-md' },
    { id: 'standard', name: 'Standard (Default)', px: '12px', previewClass: 'rounded-xl' },
    { id: 'rounded', name: 'Smooth Rounded', px: '18px', previewClass: 'rounded-2xl' },
    { id: 'pill', name: 'Pill Curvature', px: '28px', previewClass: 'rounded-3xl' },
  ];

  const patterns: { id: BackgroundPattern; name: string; desc: string }[] = [
    { id: 'none', name: 'Clean Solid', desc: 'Minimal flat background without patterns' },
    { id: 'grid', name: 'Precision Technical Grid', desc: 'Subtle engineering grid aligned with accent hue' },
    { id: 'dots', name: 'Micro Dots Matrix', desc: 'Refined stippled dot field' },
    { id: 'glow', name: 'Ambient Radial Glow', desc: 'Top-down atmospheric radial illumination' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-0.5 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
                <Palette className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Theme Studio</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Customizer
                </span>
              </div>
              <p className="text-xs text-slate-400">Modify colors, fonts, geometry, and background to your exact preference</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetSettings}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 transition-colors"
              title="Reset to default theme"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Interactive Preview Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-300">Live Preview:</span>
              <span>Changes apply instantly to the entire application.</span>
            </div>

            {/* Interactive Miniature Preview Card */}
            <div
              className="flex items-center gap-3 px-3 py-1.5 border transition-all text-xs"
              style={{
                backgroundColor: settings.customColors.surface,
                borderColor: settings.customColors.border,
                borderRadius: 'var(--theme-radius, 12px)',
                fontFamily: 'var(--theme-font)',
              }}
            >
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: settings.customColors.accent }}
              />
              <span className="font-semibold" style={{ color: settings.customColors.text }}>
                Sample Preview Component
              </span>
              <button
                className="px-2 py-0.5 text-[10px] font-bold rounded shadow-sm text-slate-950"
                style={{ backgroundColor: settings.customColors.accent }}
              >
                Action
              </button>
            </div>
          </div>
        </div>

        {/* Studio Tabs Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'presets'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Curated Presets ({THEME_PRESETS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('colors')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'colors'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Custom Colors & Palette</span>
          </button>

          <button
            onClick={() => setActiveTab('typography')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'typography'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Fonts, Radius & Patterns</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'export'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Export / Import JSON</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: CURATED PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Handcrafted Theme Presets</h3>
                  <p className="text-xs text-slate-400">Click any preset to immediately transform the entire UI</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {THEME_PRESETS.map((preset) => {
                  const isCurrent =
                    settings.customColors.accent.toLowerCase() === preset.colors.accent.toLowerCase() &&
                    settings.customColors.background.toLowerCase() === preset.colors.background.toLowerCase();

                  return (
                    <div
                      key={preset.id}
                      onClick={() => applyPreset(preset.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between group ${
                        isCurrent
                          ? 'border-cyan-400 ring-2 ring-cyan-500/20 shadow-lg'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950'
                      }`}
                      style={{
                        backgroundColor: preset.colors.surface,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="font-bold text-sm tracking-tight"
                              style={{ color: preset.colors.text }}
                            >
                              {preset.name}
                            </span>
                            {isCurrent && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Active</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-1 leading-relaxed opacity-80" style={{ color: preset.colors.text }}>
                            {preset.description}
                          </p>
                        </div>
                      </div>

                      {/* Swatch palette preview */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/40">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-5 h-5 rounded-full border border-black/20 shadow-sm"
                            style={{ backgroundColor: preset.colors.accent }}
                            title="Accent"
                          />
                          <span
                            className="w-5 h-5 rounded-full border border-black/20 shadow-sm"
                            style={{ backgroundColor: preset.colors.background }}
                            title="Background"
                          />
                          <span
                            className="w-5 h-5 rounded-full border border-black/20 shadow-sm"
                            style={{ backgroundColor: preset.colors.surface }}
                            title="Surface"
                          />
                          <span
                            className="w-5 h-5 rounded-full border border-black/20 shadow-sm"
                            style={{ backgroundColor: preset.colors.border }}
                            title="Border"
                          />
                        </div>

                        <span className="text-[10px] font-mono opacity-70" style={{ color: preset.colors.text }}>
                          {preset.font} • {preset.radius}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM COLORS & PALETTE */}
          {activeTab === 'colors' && (
            <div className="space-y-6">
              
              {/* Field 1: Primary Accent Color */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-200 block">
                      Primary Accent Color
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Applied to primary action buttons, active navigation indicators, upload triggers, and interactive glows.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.customColors.accent}
                      onChange={(e) => setCustomColor('accent', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                      title="Pick custom hex color"
                    />
                    <span className="text-xs font-mono text-cyan-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      {settings.customColors.accent}
                    </span>
                  </div>
                </div>

                {/* Swatches */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {accentSwatches.map((swatch) => (
                    <button
                      key={swatch.color}
                      onClick={() => setCustomColor('accent', swatch.color)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        settings.customColors.accent.toLowerCase() === swatch.color.toLowerCase()
                          ? 'border-white text-white font-bold ring-2 ring-white/20'
                          : 'border-slate-800 text-slate-300 hover:border-slate-700 bg-slate-900'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: swatch.color }}
                      />
                      <span>{swatch.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Background Canvas Color */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-200 block">
                      Canvas Background Color
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Base canvas tone behind media vaults, headers, and views.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.customColors.background}
                      onChange={(e) => setCustomColor('background', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-xs font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      {settings.customColors.background}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {backgroundSwatches.map((swatch) => (
                    <button
                      key={swatch.color}
                      onClick={() => setCustomColor('background', swatch.color)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        settings.customColors.background.toLowerCase() === swatch.color.toLowerCase()
                          ? 'border-cyan-400 text-cyan-300 font-bold'
                          : 'border-slate-800 text-slate-300 hover:border-slate-700 bg-slate-900'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-slate-700"
                        style={{ backgroundColor: swatch.color }}
                      />
                      <span>{swatch.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 3: Surface / Card Color */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-200 block">
                      Card & Container Surface Color
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Cards, navigation bars, modals, tables, and dropdown panels.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.customColors.surface}
                      onChange={(e) => setCustomColor('surface', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-xs font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      {settings.customColors.surface}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {surfaceSwatches.map((swatch) => (
                    <button
                      key={swatch.color}
                      onClick={() => setCustomColor('surface', swatch.color)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        settings.customColors.surface.toLowerCase() === swatch.color.toLowerCase()
                          ? 'border-cyan-400 text-cyan-300 font-bold'
                          : 'border-slate-800 text-slate-300 hover:border-slate-700 bg-slate-900'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-slate-700"
                        style={{ backgroundColor: swatch.color }}
                      />
                      <span>{swatch.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 4: Border Color */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-200 block">
                      Dividers & Border Color
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Structural boundaries, input borders, and panel dividers.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.customColors.border}
                      onChange={(e) => setCustomColor('border', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-xs font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      {settings.customColors.border}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {borderSwatches.map((swatch) => (
                    <button
                      key={swatch.color}
                      onClick={() => setCustomColor('border', swatch.color)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        settings.customColors.border.toLowerCase() === swatch.color.toLowerCase()
                          ? 'border-cyan-400 text-cyan-300 font-bold'
                          : 'border-slate-800 text-slate-300 hover:border-slate-700 bg-slate-900'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-slate-700"
                        style={{ backgroundColor: swatch.color }}
                      />
                      <span>{swatch.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 5: Text Color */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-200 block">
                    Primary Typography Color
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Headings, labels, and primary body content.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.customColors.text}
                    onChange={(e) => setCustomColor('text', e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="text-xs font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    {settings.customColors.text}
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: TYPOGRAPHY, GEOMETRY & PATTERNS */}
          {activeTab === 'typography' && (
            <div className="space-y-6">
              
              {/* Typography Selection */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Font Family & Typography Pairings
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select a distinctive typographic voice for decentralized navigation and media cards.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fonts.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => setFontFamily(f.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        settings.fontFamily === f.id
                          ? 'border-cyan-400 bg-cyan-950/20 ring-1 ring-cyan-500/30'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-200">{f.name}</span>
                        {settings.fontFamily === f.id && (
                          <Check className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2">{f.desc}</p>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800/80 text-xs text-slate-300 font-medium">
                        {f.sample}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Border Radius Selection */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Interface Corner Geometry (Border Radius)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Control curvature from sharp architectural brutalism to ultra-smooth capsules.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {borderRadii.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setBorderRadius(r.id)}
                      className={`p-3 border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                        settings.borderRadius === r.id
                          ? 'border-cyan-400 bg-cyan-950/30 text-cyan-300 font-bold'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-950'
                      }`}
                      style={{ borderRadius: r.px }}
                    >
                      <div
                        className="w-7 h-7 border-2 border-dashed border-cyan-400/80 bg-slate-800"
                        style={{ borderRadius: r.px }}
                      />
                      <span className="text-[11px]">{r.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Pattern Selection */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Background Texture & Ambient Field
                  </h3>
                  <p className="text-xs text-slate-400">
                    Technical overlays rendered behind the decentralized workspace.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {patterns.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setBackgroundPattern(p.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        settings.backgroundPattern === p.id
                          ? 'border-cyan-400 bg-cyan-950/20 text-cyan-300'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">{p.name}</span>
                        {settings.backgroundPattern === p.id && (
                          <Check className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Glassmorphism Toggle */}
              <div className="pt-3 border-t border-slate-800">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:bg-slate-950 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Glassmorphism & Translucent Backdrop Blur</div>
                      <div className="text-[11px] text-slate-400">Enables dynamic frosted glass blur on headers, navigation, and floating modals</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.glassmorphism}
                    onChange={(e) => setGlassmorphism(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>

            </div>
          )}

          {/* TAB 4: EXPORT / IMPORT JSON */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              
              {/* Export Theme Section */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">Export Your Custom Theme</h3>
                    <p className="text-[11px] text-slate-400">Copy your theme configuration as clean JSON to backup or share.</p>
                  </div>
                  <button
                    onClick={handleCopyJson}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Copied JSON!' : 'Copy Theme JSON'}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300/90 overflow-x-auto max-h-40">
                  {exportThemeJson()}
                </pre>
              </div>

              {/* Import Theme Section */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Import Theme JSON</h3>
                  <p className="text-[11px] text-slate-400">Paste any valid saus theme JSON object below to apply instantly.</p>
                </div>

                <textarea
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  placeholder={`{\n  "themeMode": "custom",\n  "customColors": {\n    "accent": "#06b6d4",\n    "background": "#020617"\n  }\n}`}
                  rows={4}
                  className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />

                {importError && (
                  <p className="text-xs text-rose-400 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>{importError}</span>
                  </p>
                )}

                {importSuccess && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Custom theme successfully applied!</span>
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={handleImport}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Import & Apply Theme</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={resetSettings}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Deep Slate Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
          >
            Done & Apply
          </button>
        </div>

      </div>
    </div>
  );
};
