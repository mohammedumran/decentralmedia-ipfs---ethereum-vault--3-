import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  HardDrive,
  ShieldCheck,
  Camera,
  Wifi,
  WifiOff,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  X,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAndroidPwa } from '../lib/useAndroidPwa';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, isOnline, installApp } = useAndroidPwa();
  const [installStatus, setInstallStatus] = useState<string>('');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setInstallStatus('prompting');
    const outcome = await installApp();
    if (outcome === 'accepted') {
      setInstallStatus('installed');
    } else if (outcome === 'dismissed') {
      setInstallStatus('dismissed');
    } else {
      setInstallStatus('manual');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://saus.app';
  const bubblewrapCommand = `npx @bubblewrap/cli init --manifest=${currentOrigin}/manifest.webmanifest`;
  const bubblewrapBuild = `npx @bubblewrap/cli build`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header with Android branding */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">saus Android Application</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PWA / WebAPK
                </span>
              </div>
              <p className="text-xs text-slate-400">Install directly on Android smartphones & tablets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Main Action Banner */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-inner">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-100">
                    {isInstalled ? 'saus is Installed on This Device' : 'Install saus on Android'}
                  </span>
                  {isInstalled && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Standalone Active</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                  Experience true full-screen decentralized media browsing with zero browser bars, instant offline cache, and direct camera upload.
                </p>
              </div>

              {!isInstalled ? (
                <button
                  id="install-android-pwa-button"
                  onClick={handleInstallClick}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
                >
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>{isInstallable ? 'Install Android App' : 'Add to Home Screen'}</span>
                </button>
              ) : (
                <div className="px-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Ready in App Drawer</span>
                </div>
              )}
            </div>

            {installStatus === 'dismissed' && (
              <p className="mt-3 text-[11px] text-amber-300">
                Installation prompt was dismissed. You can install anytime from the Chrome menu: tap <strong>⋮</strong> and select <strong>"Install app"</strong>.
              </p>
            )}
          </div>

          {/* Android Native Features Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Android Integrated Features</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Standalone WebAPK</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Runs in an edge-to-edge window with system status bar and nav bar styling.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Offline IPFS Cache</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Built-in Service Worker caches application assets and pinned metadata when disconnected.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Camera & Gallery Upload</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Direct integration with Android camera to record videos and snap photos straight to IPFS.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Hardware Keystore Ready</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Cryptographic EVM private keys and seed phrases stored securely on your Android device.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Installation on Android */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              <span>How to Install on Chrome, Edge, or Samsung Internet</span>
            </h3>

            <ol className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-cyan-400 font-bold">1.</span>
                <span>Open this link in Chrome or any Chromium browser on your Android phone.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-cyan-400 font-bold">2.</span>
                <span>Tap the three dots <strong>⋮</strong> in the top-right browser bar.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-cyan-400 font-bold">3.</span>
                <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-cyan-400 font-bold">4.</span>
                <span>Confirm prompt. The <strong>saus</strong> icon will now appear in your app drawer alongside native Android apps!</span>
              </li>
            </ol>
          </div>

          {/* Native APK / Play Store Build Guide */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Build Signed Android APK / AAB for Google Play Store</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Trusted Web Activity (TWA)</span>
            </div>

            <p className="text-[11px] text-slate-400 mb-3">
              To package this PWA into an official <strong>.apk</strong> or <strong>.aab</strong> bundle ready for the Google Play Store, run Google's official Bubblewrap CLI or use PWABuilder:
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-200">
                <span className="truncate pr-2">{bubblewrapCommand}</span>
                <button
                  onClick={() => copyToClipboard(bubblewrapCommand, 'init')}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 flex-shrink-0"
                  title="Copy command"
                >
                  {copiedCmd === 'init' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-200">
                <span className="truncate pr-2">{bubblewrapBuild}</span>
                <button
                  onClick={() => copyToClipboard(bubblewrapBuild, 'build')}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 flex-shrink-0"
                  title="Copy command"
                >
                  {copiedCmd === 'build' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Manifest: /manifest.webmanifest</span>
              <a
                href="https://www.pwabuilder.com"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
              >
                <span>Generate APK on PWABuilder.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span>{isOnline ? 'Network Online' : 'Offline Mode (Service Worker)'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
