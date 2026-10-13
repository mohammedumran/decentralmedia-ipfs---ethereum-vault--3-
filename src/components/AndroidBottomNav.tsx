import React from 'react';
import {
  Database,
  Upload,
  KeyRound,
  Settings,
  Bot,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { useDecentralMedia } from '../context/DecentralMediaContext';
import { useAndroidPwa } from '../lib/useAndroidPwa';
import { ViewTab } from '../types';

interface AndroidBottomNavProps {
  onOpenUpload: () => void;
  onOpenRedeem: () => void;
  onOpenAndroidModal: () => void;
  onOpenSettings: () => void;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  onOpenUpload,
  onOpenRedeem,
  onOpenAndroidModal,
  onOpenSettings,
}) => {
  const { activeTab, setActiveTab } = useDecentralMedia();
  const { isInstallable, isInstalled } = useAndroidPwa();

  return (
    <nav
      id="android-bottom-nav"
      aria-label="Android Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl transition-all"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Tab 1: Vault */}
        <button
          type="button"
          id="android-nav-vault"
          onClick={() => setActiveTab('vault')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 ${
            activeTab === 'vault'
              ? 'text-cyan-400 font-semibold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'vault' ? 'bg-cyan-500/15' : 'bg-transparent'}`}>
            <Database className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none">Vault</span>
        </button>

        {/* Tab 2: Upload (Prominent Center-Left Action) */}
        <button
          type="button"
          id="android-nav-upload"
          onClick={onOpenUpload}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 text-slate-300 hover:text-cyan-300 active:scale-95 group"
        >
          <div className="p-1.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30 group-hover:scale-110 transition-transform">
            <Upload className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none font-semibold text-cyan-300">Upload</span>
        </button>

        {/* Tab 3: Redeem Code */}
        <button
          type="button"
          id="android-nav-redeem"
          onClick={onOpenRedeem}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 text-slate-400 hover:text-indigo-300 active:scale-95"
        >
          <div className="p-1 rounded-lg hover:bg-indigo-500/15">
            <KeyRound className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none">Redeem</span>
        </button>

        {/* Tab 4: Settings (Theme, Nodes & EVM Protocol) */}
        <button
          type="button"
          id="android-nav-settings"
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 text-slate-400 hover:text-cyan-300 active:scale-95"
          title="Theme, Hosts & Protocol Settings"
        >
          <div className="p-1 rounded-lg hover:bg-slate-800">
            <Settings className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none">Settings</span>
        </button>

        {/* Tab 5: Cipher AI */}
        <button
          type="button"
          id="android-nav-assistant"
          onClick={() => setActiveTab('assistant')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 ${
            activeTab === 'assistant'
              ? 'text-cyan-400 font-semibold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'assistant' ? 'bg-cyan-500/15' : 'bg-transparent'}`}>
            <Bot className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none">Cipher AI</span>
        </button>

        {/* Tab 6: Android App Button */}
        <button
          type="button"
          id="android-nav-pwa-modal"
          onClick={onOpenAndroidModal}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 text-emerald-400 hover:text-emerald-300 relative"
          title="Android App Options"
        >
          <div className="p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <Smartphone className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-[9px] mt-0.5 leading-none font-semibold">
            {isInstalled ? 'Android' : 'Install'}
          </span>
          {isInstallable && !isInstalled && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>

      </div>
    </nav>
  );
};
