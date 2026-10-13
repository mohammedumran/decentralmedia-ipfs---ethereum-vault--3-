import React, { useState, useMemo } from 'react';
import {
  X,
  Settings,
  Sun,
  Moon,
  Sparkles,
  Palette,
  HardDrive,
  Cpu,
  ShieldCheck,
  Check,
  RotateCcw,
  Sliders,
  Terminal,
  Activity,
  Globe,
  Zap,
  Smartphone,
  Download,
  Blocks,
  ExternalLink,
  Copy,
  Bot,
  Volume2,
  VolumeX,
  Trash2,
  Search,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import {
  useTheme,
  ThemeMode,
  AccentColor,
  UiDensity,
  GasUnit,
  IpfsGateway,
  RoboPersonality
} from '../context/ThemeContext';
import { useDecentralMedia } from '../context/DecentralMediaContext';
import { useAndroidPwa } from '../lib/useAndroidPwa';
import { SMART_CONTRACT_ADDRESS } from '../lib/contracts';
import { formatAddress, formatBytes } from '../lib/crypto';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAndroidApp?: () => void;
}

type SettingsSection = 'appearance' | 'robo' | 'gateways' | 'security' | 'storage';

// Clean custom toggle switch (replaces clunky raw checkboxes)
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}> = ({ checked, onChange, disabled, id }) => (
  <button
    type="button"
    role="switch"
    id={id}
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
      checked ? 'bg-cyan-500' : 'bg-slate-800'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenAndroidApp,
}) => {
  const { isInstalled } = useAndroidPwa();
  const { hostNodes, transactions, mediaFiles } = useDecentralMedia();
  const {
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
    setPopRoboEnabled,
    setPopRoboPersonality,
    setPopRoboSound,
    resetSettings,
    setIsThemeStudioOpen,
  } = useTheme();

  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [customGwInput, setCustomGwInput] = useState(settings.customGatewayUrl || '');
  const [customGwSaved, setCustomGwSaved] = useState(false);

  if (!isOpen) return null;

  const copyContractAddress = () => {
    navigator.clipboard.writeText(SMART_CONTRACT_ADDRESS);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleSaveCustomGateway = () => {
    const trimmed = customGwInput.trim();
    setCustomGatewayUrl(trimmed);
    if (trimmed) setIpfsGateway('custom');
    setCustomGwSaved(true);
    setTimeout(() => setCustomGwSaved(false), 2000);
  };

  const handleClearLocalCache = () => {
    try {
      if (typeof window !== 'undefined') {
        const keysToKeep = [
          'decentralmedia_users_v2',
          'decentralmedia_active_addr_v2',
          'saus_theme_settings_v2',
        ];
        const allKeys = Object.keys(localStorage);
        allKeys.forEach((k) => {
          if (!keysToKeep.includes(k) && k.startsWith('decentralmedia_cache_')) {
            localStorage.removeItem(k);
          }
        });
      }
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2500);
    } catch {}
  };

  const themeModes: { id: ThemeMode; label: string; desc: string; icon: any }[] = [
    { id: 'dark', label: 'Deep Slate Dark', desc: 'Default dark mode with cyan accents', icon: Moon },
    { id: 'light', label: 'Daylight Clean', desc: 'High contrast crisp light canvas', icon: Sun },
    { id: 'midnight', label: 'Midnight Indigo', desc: 'Deep violet and rich indigo slate tones', icon: Sparkles },
    { id: 'matrix', label: 'Matrix Terminal', desc: 'Phosphor green terminal theme', icon: Terminal },
    { id: 'oled', label: 'OLED Pure Black', desc: 'Zero black with high battery efficiency', icon: Zap },
  ];

  const accentColors: { id: AccentColor; name: string; bgClass: string; hex: string }[] = [
    { id: 'cyan', name: 'Cyan', bgClass: 'bg-cyan-500', hex: '#06b6d4' },
    { id: 'emerald', name: 'Emerald', bgClass: 'bg-emerald-500', hex: '#10b981' },
    { id: 'violet', name: 'Violet', bgClass: 'bg-violet-500', hex: '#8b5cf6' },
    { id: 'amber', name: 'Amber', bgClass: 'bg-amber-500', hex: '#f59e0b' },
    { id: 'rose', name: 'Rose', bgClass: 'bg-rose-500', hex: '#f43f5e' },
    { id: 'blue', name: 'Blue', bgClass: 'bg-blue-500', hex: '#3b82f6' },
  ];

  const gateways: { id: IpfsGateway; name: string; speed: string; domain: string }[] = [
    { id: 'cloudflare', name: 'Cloudflare IPFS', speed: 'Global Anycast Edge', domain: 'cloudflare-ipfs.com' },
    { id: 'ipfs.io', name: 'Protocol Labs Gateway', speed: 'Official Reference', domain: 'ipfs.io' },
    { id: 'pinata', name: 'Pinata Dedicated Cluster', speed: 'High Speed Media', domain: 'gateway.pinata.cloud' },
    { id: 'dweb.link', name: 'dweb.link Gateway', speed: 'Direct Swarm Peering', domain: 'dweb.link' },
  ];

  const navSections: { id: SettingsSection; label: string; desc: string; icon: any }[] = [
    { id: 'appearance', label: 'Appearance', desc: 'Themes, accents & layout', icon: Palette },
    { id: 'robo', label: 'Pop Robo AI', desc: 'Companion on display', icon: Bot },
    { id: 'gateways', label: 'IPFS & Swarm', desc: 'Gateways & replication', icon: Globe },
    { id: 'security', label: 'Smart Contract', desc: 'Ethereum & verification', icon: ShieldCheck },
    { id: 'storage', label: 'Storage & System', desc: 'Quotas, cache & app', icon: HardDrive },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[640px] max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Preferences & Settings</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetSettings}
              className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/80 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset all settings to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
            <button
              id="close-settings-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Navigation Sidebar */}
          <aside className="w-full md:w-60 bg-slate-950/70 border-b md:border-b-0 md:border-r border-slate-800 p-3 sm:p-4 flex flex-col justify-between flex-shrink-0 overflow-y-auto">
            <div className="space-y-1">
              <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Categories
              </div>

              {navSections.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    id={`settings-nav-${sec.id}`}
                    onClick={() => setActiveSection(sec.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs truncate">{sec.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{sec.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Sidebar Action: Full Visual Theme Studio */}
            <div className="pt-3 border-t border-slate-800/80 mt-3 md:mt-0">
              <button
                onClick={() => {
                  onClose();
                  setIsThemeStudioOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-cyan-300 border border-slate-700/80 text-xs font-semibold transition-all hover:border-cyan-500/50 cursor-pointer shadow-sm"
              >
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open Theme Studio</span>
              </button>
            </div>
          </aside>

          {/* Right Content Panel */}
          <main className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-900/60 space-y-6">
            
            {/* 1. APPEARANCE SETTINGS */}
            {activeSection === 'appearance' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Appearance & Styling</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Customize interface color schemes, accents, and visual comfort</p>
                </div>

                {/* Theme Mode Grid */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">Color Theme</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {themeModes.map((tm) => {
                      const Icon = tm.icon;
                      const isSelected = settings.themeMode === tm.id;
                      return (
                        <button
                          key={tm.id}
                          onClick={() => setThemeMode(tm.id)}
                          className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                            isSelected
                              ? 'border-cyan-500 bg-slate-950 ring-1 ring-cyan-500'
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                          }`}
                        >
                          <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-200">{tm.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                            </div>
                            <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{tm.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accent Colors */}
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <div className="text-xs font-semibold text-slate-300">Accent Highlight</div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {accentColors.map((color) => {
                      const isSelected = settings.accentColor === color.id;
                      return (
                        <button
                          key={color.id}
                          id={`accent-btn-${color.id}`}
                          onClick={() => setAccentColor(color.id)}
                          style={{
                            borderColor: isSelected ? color.hex : undefined,
                            boxShadow: isSelected ? `0 0 0 1px ${color.hex}` : undefined,
                          }}
                          className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-slate-950 shadow-sm'
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full ${color.bgClass} flex items-center justify-center shadow-sm`}>
                            {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </div>
                          <span
                            className="text-[11px] font-medium text-slate-300"
                            style={{ color: isSelected ? color.hex : undefined }}
                          >
                            {color.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Density & Motion Options */}
                <div className="space-y-3 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-800/50">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-200">Interface Density</div>
                      <div className="text-[11px] text-slate-400">Select comfortable spacing or high-density information compact view</div>
                    </div>
                    <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                      {(['comfortable', 'compact'] as UiDensity[]).map((d) => (
                        <button
                          key={d}
                          onClick={() => setUiDensity(d)}
                          className={`px-3 py-1 rounded text-xs capitalize transition-colors cursor-pointer ${
                            settings.uiDensity === d
                              ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-2">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-200">Reduced Motion</div>
                      <div className="text-[11px] text-slate-400">Minimizes pulsing lights and animated background transitions</div>
                    </div>
                    <ToggleSwitch
                      checked={settings.reducedMotion}
                      onChange={setReducedMotion}
                      id="setting-reduced-motion"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. AI POP ROBO SETTINGS */}
            {activeSection === 'robo' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Pop Robo AI Companion</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Configure your on-screen decentralized swarm robot assistant</p>
                </div>

                <div className="rounded-xl bg-slate-950/80 border border-slate-800 divide-y divide-slate-800/70 p-1">
                  
                  {/* Master Toggle */}
                  <div className="flex items-center justify-between gap-4 p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-slate-200">Show Pop Robo on Display</div>
                        <div className="text-[11px] text-slate-400">Displays the animated robot avatar with live speech bubble hints in the bottom corner</div>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={settings.popRoboEnabled}
                      onChange={setPopRoboEnabled}
                      id="setting-pop-robo-enabled"
                    />
                  </div>

                  {/* Audio Chirps */}
                  <div className="flex items-center justify-between gap-4 p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 mt-0.5">
                        {settings.popRoboSound ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-slate-200">Futuristic Robotic Audio Chirps</div>
                        <div className="text-[11px] text-slate-400">Synthesizes soft 8-bit audio feedback using the Web Audio API on clicks & responses</div>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={settings.popRoboSound}
                      onChange={setPopRoboSound}
                      disabled={!settings.popRoboEnabled}
                      id="setting-pop-robo-sound"
                    />
                  </div>

                </div>

                {/* Personality Modes */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">Robo Personality & Response Style</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: 'friendly',
                        name: 'Friendly Companion',
                        desc: 'Warm and encouraging with cheerful beeps and beginner-friendly clarity.',
                      },
                      {
                        id: 'crypto',
                        name: 'Cypherpunk Expert',
                        desc: 'Deep dives into IPFS DAGs, smart contract ABIs, Keccak-256 and cryptography.',
                      },
                      {
                        id: 'concise',
                        name: 'Concise Terminal',
                        desc: 'Ultra-fast bullet points, direct command prompts, and zero conversational fluff.',
                      },
                    ].map((p) => {
                      const isSelected = settings.popRoboPersonality === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setPopRoboPersonality(p.id as RoboPersonality)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-cyan-500 bg-slate-950 ring-1 ring-cyan-500'
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-xs text-slate-200">{p.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">{p.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* 3. IPFS & SWARM GATEWAYS */}
            {activeSection === 'gateways' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">IPFS Swarm & Gateways</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage decentralized gateway routing and node replication factors</p>
                </div>

                {/* Gateway Cards */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">Public IPFS Gateway Resolver</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {gateways.map((gw) => {
                      const isSelected = settings.ipfsGateway === gw.id;
                      return (
                        <button
                          key={gw.id}
                          onClick={() => setIpfsGateway(gw.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-cyan-500 bg-slate-950 ring-1 ring-cyan-500'
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-xs text-slate-200">{gw.name}</div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                          </div>
                          <div className="text-[11px] font-mono text-cyan-400/90 mt-0.5">{gw.domain}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{gw.speed}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Gateway Input */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">Custom Gateway Endpoint</span>
                    <span className="text-[11px] text-slate-400">e.g. self-hosted node</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customGwInput}
                      onChange={(e) => setCustomGwInput(e.target.value)}
                      placeholder="https://ipfs.my-company.io/ipfs/"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <button
                      onClick={handleSaveCustomGateway}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                    >
                      {customGwSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                      <span>{customGwSaved ? 'Saved' : 'Save Endpoint'}</span>
                    </button>
                  </div>
                </div>

                {/* Replication Factor Slider */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Swarm Pinning Redundancy</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Number of validator nodes that maintain persistent pinned copies</div>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      {settings.replicationFactor} Nodes
                    </span>
                  </div>

                  <input
                    type="range"
                    min={1}
                    max={6}
                    step={1}
                    value={settings.replicationFactor}
                    onChange={(e) => setReplicationFactor(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>1 Node (Fastest)</span>
                    <span>3 Nodes (Balanced)</span>
                    <span>6 Nodes (Max Resiliency)</span>
                  </div>
                </div>

              </div>
            )}

            {/* 4. SMART CONTRACT & SECURITY */}
            {activeSection === 'security' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Ethereum Smart Contract</h3>
                  <p className="text-xs text-slate-400 mt-0.5">On-chain media registry, cryptographic checksums and gas options</p>
                </div>

                {/* Contract Overview Box */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                    <div>
                      <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Blocks className="w-3.5 h-3.5 text-violet-400" />
                        <span>DecentralMedia Sepolia Contract</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-slate-300">
                          {formatAddress(SMART_CONTRACT_ADDRESS, 8)}
                        </span>
                        <button
                          onClick={copyContractAddress}
                          className="text-slate-400 hover:text-cyan-300 p-0.5 rounded transition-colors"
                          title="Copy Contract Address"
                        >
                          {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <a
                      href={`https://sepolia.etherscan.io/address/${SMART_CONTRACT_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors self-start sm:self-auto"
                    >
                      <span>Etherscan Explorer</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Verified On-Chain Events</span>
                      <span className="font-bold text-cyan-400 font-mono mt-0.5">{transactions.length} Transactions</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Integrity Hash Engine</span>
                      <span className="font-bold text-emerald-400 font-mono mt-0.5">Keccak-256 + SHA-256</span>
                    </div>
                  </div>
                </div>

                {/* Gas Currency Unit */}
                <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-800/60">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-200">Gas Display Currency</div>
                    <div className="text-[11px] text-slate-400">Choose between native ETH, Gwei, or USD estimates</div>
                  </div>
                  <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                    {(['ETH', 'Gwei', 'USD'] as GasUnit[]).map((unit) => (
                      <button
                        key={unit}
                        onClick={() => setGasUnit(unit)}
                        className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                          settings.gasUnit === unit
                            ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hash Verification Toggle */}
                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-200">Automatic Cryptographic Checksum</div>
                    <div className="text-[11px] text-slate-400">Validates SHA-256 and Keccak-256 digests against on-chain records before rendering media</div>
                  </div>
                  <ToggleSwitch
                    checked={settings.autoVerifyHashes}
                    onChange={setAutoVerifyHashes}
                    id="setting-auto-verify-hashes"
                  />
                </div>

              </div>
            )}

            {/* 5. STORAGE & SYSTEM */}
            {activeSection === 'storage' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Storage, Cache & System</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage local memory allocation, cached blobs, and Android application</p>
                </div>

                {/* Storage Quota */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Storage Soft Allocation</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Virtual storage capacity for meter warnings and D3 visualization</div>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      {settings.storageQuotaGb || 5} GB
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[2, 5, 10, 25].map((gb) => (
                      <button
                        key={gb}
                        onClick={() => setStorageQuotaGb(gb)}
                        className={`py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                          (settings.storageQuotaGb || 5) === gb
                            ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {gb} GB
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cache Purge */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 mt-0.5">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-200">Purge Cached Media Blobs</div>
                      <div className="text-[11px] text-slate-400">Frees browser memory by discarding cached offline blob URLs while preserving CIDs</div>
                    </div>
                  </div>

                  <button
                    onClick={handleClearLocalCache}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-semibold transition-all cursor-pointer flex-shrink-0"
                  >
                    {cacheCleared ? 'Cleared!' : 'Clear Cache'}
                  </button>
                </div>

                {/* Android App Status */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-200">
                        {isInstalled ? 'Running as Native Android App' : 'Android App & PWA'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        WebAPK standalone package with full-screen hardware acceleration
                      </div>
                    </div>
                  </div>

                  {onOpenAndroidApp && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAndroidApp();
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer flex-shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isInstalled ? 'Android Info' : 'Install App'}</span>
                    </button>
                  )}
                </div>

              </div>
            )}

          </main>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-5 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/90 flex-shrink-0">
          <button
            id="save-and-close-settings-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
