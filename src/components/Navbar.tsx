import React, { useState } from 'react';
import {
  Database,
  Upload,
  KeyRound,
  Server,
  Blocks,
  Bot,
  User,
  Copy,
  Check,
  Coins,
  ChevronDown,
  Sparkles,
  Layers,
  ArrowRightLeft,
  Settings,
  Sun,
  Moon,
  Smartphone,
  Palette
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDecentralMedia } from '../context/DecentralMediaContext';
import { useTheme } from '../context/ThemeContext';
import { ViewTab } from '../types';
import { formatAddress } from '../lib/crypto';

interface NavbarProps {
  onOpenWallet: () => void;
  onOpenCreateVault: () => void;
  onOpenUpload: () => void;
  onOpenRedeem: () => void;
  onOpenWelcome: () => void;
  onOpenSettings?: () => void;
  onOpenAndroidModal?: () => void;
  onOpenThemeStudio?: () => void;
  onOpenLanding?: () => void;
  onOpenAssistant?: () => void;
  isLandingOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenWallet,
  onOpenCreateVault,
  onOpenUpload,
  onOpenRedeem,
  onOpenWelcome,
  onOpenSettings,
  onOpenAndroidModal,
  onOpenThemeStudio,
  onOpenLanding,
  onOpenAssistant,
  isLandingOpen,
}) => {
  const { currentUser, switchAccount, allAccounts } = useAuth();
  const { activeTab, setActiveTab } = useDecentralMedia();
  const { settings, setThemeMode, setIsSettingsOpen, setIsThemeStudioOpen } = useTheme();
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [isSwitchOpen, setIsSwitchOpen] = useState(false);

  const toggleThemeMode = () => {
    if (settings.themeMode === 'light') {
      setThemeMode('dark');
    } else {
      setThemeMode('light');
    }
  };

  const handleOpenSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      setIsSettingsOpen(true);
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUser?.address) {
      navigator.clipboard.writeText(currentUser.address);
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    }
  };

  const navItems: { id: ViewTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'vault', label: 'Media Vault', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Side: Settings Icon + Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Left Side Settings & Mode Toggle Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                id="navbar-left-settings-btn"
                onClick={handleOpenSettings}
                title="Theme, Hosts, Ledger & Protocol Settings"
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 transition-all shadow-sm group flex items-center gap-1.5 cursor-pointer"
              >
                <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300 text-cyan-400" />
                <span className="hidden lg:inline text-xs font-medium text-slate-300 group-hover:text-cyan-300">Settings</span>
              </button>

              {/* Quick Dark/White Mode Toggle Pill */}
              <button
                id="quick-theme-toggle-btn"
                onClick={toggleThemeMode}
                title={settings.themeMode === 'light' ? 'Switch to Dark Mode' : 'Switch to White / Light Mode'}
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/60 text-slate-300 hover:text-amber-300 transition-all shadow-sm cursor-pointer"
              >
                {settings.themeMode === 'light' ? (
                  <Moon className="w-4 h-4 text-indigo-500" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </button>
            </div>

            <div className="h-6 w-[1px] bg-slate-800 mx-0.5 hidden xs:block" />

            <button
              id="brand-home-button"
              onClick={() => setActiveTab('vault')}
              className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-violet-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-all">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center relative overflow-hidden group-hover:bg-slate-900 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Layers className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors relative z-10" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-blue-200 to-indigo-300 bg-clip-text text-transparent flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-sm bg-cyan-400 rotate-45 mr-0.5 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                      saus
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium hidden sm:inline ml-1 pl-2 border-l border-slate-800">
                      Decentralized Vault
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Right Area: Welcome / Register & Account Pill */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="navbar-create-vault-btn"
              type="button"
              onClick={onOpenCreateVault}
              aria-label="Create a free private vault"
              title="Create a free private vault"
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/60 transition-all cursor-pointer"
            >
              <Database className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Create Vault</span>
            </button>
            <button
              id="navbar-redeem-code-btn"
              type="button"
              onClick={onOpenRedeem}
              aria-label="Redeem a secret access code"
              title="Redeem a secret access code"
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/60 transition-all cursor-pointer"
            >
              <KeyRound className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Redeem</span>
            </button>
            {onOpenAssistant && (
              <button
                id="navbar-open-assistant-btn"
                onClick={onOpenAssistant}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-950/70 hover:bg-violet-900/80 text-violet-200 border border-violet-800/70 hover:border-violet-600 transition-all cursor-pointer"
                title="Ask Cipher AI for help using the vault"
              >
                <Bot className="w-3.5 h-3.5 text-violet-300" />
                <span>AI Help</span>
              </button>
            )}
            
            {/* If on main landing page: Show clean "Launch Vault" CTA */}
            {isLandingOpen ? (
              <button
                id="navbar-toggle-landing-btn"
                onClick={onOpenLanding}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                title="Launch Vault Dashboard"
              >
                <Database className="w-3.5 h-3.5 text-slate-950" />
                <span>Launch Vault</span>
              </button>
            ) : (
              /* When inside the Vault Dashboard: show full tools */
              <>
                {/* Landing Guide Toggle Button */}
                {onOpenLanding && (
                  <button
                    id="navbar-toggle-landing-btn"
                    onClick={onOpenLanding}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                    title="View Website Overview"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">About</span>
                  </button>
                )}

                {/* Quick Upload Button (only inside vault) */}
                <button
                  id="quick-upload-btn"
                  onClick={onOpenUpload}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-950" />
                  <span>Upload</span>
                </button>
              </>
            )}

            {/* User Account / Wallet Pill or Connect Button */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="user-wallet-pill"
                  onClick={onOpenWallet}
                  className="flex items-center gap-2 pl-2.5 pr-2 py-1 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-colors text-left cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                    {currentUser.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden lg:block text-left pr-1">
                    <div className="text-xs font-medium text-slate-200 leading-none truncate max-w-[130px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400/90 flex items-center gap-1">
                      <span>{formatAddress(currentUser.address, 3)}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-emerald-400">{currentUser.balanceEth} ETH</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            ) : (
              <button
                id="navbar-connect-btn"
                onClick={onOpenWelcome}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/60 transition-all shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Log In / Sign Up</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
