import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DecentralMediaProvider, useDecentralMedia } from './context/DecentralMediaContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { HostNodesView } from './components/HostNodesView';
import { TransactionsView } from './components/TransactionsView';
import { AssistantView } from './components/AssistantView';
import { AuthGatewayView } from './components/AuthGatewayView';
import { UploadModal } from './components/UploadModal';
import { RedeemCodeModal } from './components/RedeemCodeModal';
import { MediaDetailModal } from './components/MediaDetailModal';
import { ShareAndAccessModal } from './components/ShareAndAccessModal';
import { TransferOwnershipModal } from './components/TransferOwnershipModal';
import { UserWalletModal } from './components/UserWalletModal';
import { WelcomeRegisterModal } from './components/WelcomeRegisterModal';
import { SettingsModal } from './components/SettingsModal';
import { AndroidAppModal } from './components/AndroidAppModal';
import { AndroidBottomNav } from './components/AndroidBottomNav';
import { ThemeStudioModal } from './components/ThemeStudioModal';
import { useAndroidPwa } from './lib/useAndroidPwa';
import { MediaFile } from './types';
import { SMART_CONTRACT_ADDRESS } from './lib/contracts';
import { Database, Server, Blocks, Sparkles, ShieldCheck, HardDrive, LogIn, ArrowRight, Smartphone, Download, X } from 'lucide-react';

const STORAGE_SEEN_WELCOME = 'saus_seen_welcome_v1';

const MainApp: React.FC = () => {
  const { currentUser } = useAuth();
  const { activeTab, setActiveTab, mediaFiles, redeemAccessCode } = useDecentralMedia();
  const { isSettingsOpen, setIsSettingsOpen, isThemeStudioOpen, setIsThemeStudioOpen } = useTheme();
  const { isInstallable, isInstalled, installApp } = useAndroidPwa();

  // Guest Explorer Mode: true by default so another person can view public files without forced login gate
  const [isGuestExploring, setIsGuestExploring] = useState(true);
  const [focusCreateVault, setFocusCreateVault] = useState(false);

  // Emerge experience for new visitors (shows proper website landing and sign in/up interface)
  const [showLandingPage, setShowLandingPage] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      // Direct deep link to file or action bypasses landing
      if (params.get('file') || params.get('code') || params.get('cid') || params.get('action')) {
        return false;
      }
      const hasEntered = localStorage.getItem('saus_has_entered_v2');
      return !hasEntered;
    } catch {
      return false;
    }
  });

  // Modal states
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [showAndroidBanner, setShowAndroidBanner] = useState(true);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [sharingFile, setSharingFile] = useState<MediaFile | null>(null);
  const [transferringFile, setTransferringFile] = useState<MediaFile | null>(null);
  const [aiFileContext, setAiFileContext] = useState<MediaFile | null>(null);

  // Parse incoming direct share links (?file=med-... & ?code=IPFS-SEC-... & ?action=...)
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      if (action === 'upload') {
        setIsUploadOpen(true);
      } else if (action === 'redeem') {
        setIsRedeemOpen(true);
      }

      const fileId = params.get('file');
      const code = params.get('code');
      const cid = params.get('cid');

      if (!fileId && !code && !cid) return;

      const handleShareLink = async () => {
        // If secret access code is present, redeem it first to unlock permissions
        if (code) {
          try {
            const res = await redeemAccessCode(code);
            if (res.success && res.file) {
              setSelectedFile(res.file);
              return;
            }
          } catch (e) {
            console.warn("Redeem from URL param error:", e);
          }
        }

        // If fileId is present, locate file from memory or fetch from server
        if (fileId) {
          const found = mediaFiles.find((f) => f.id === fileId);
          if (found) {
            setSelectedFile(found);
            return;
          }

          try {
            const r = await fetch(`/api/media/${fileId}`);
            if (r.ok) {
              const data = await r.json();
              if (data.mediaFile) {
                setSelectedFile(data.mediaFile);
                return;
              }
            }
            const rAll = await fetch('/api/media');
            const dataAll = await rAll.json();
            if (Array.isArray(dataAll.mediaFiles)) {
              const sFound = dataAll.mediaFiles.find((f: any) => f.id === fileId);
              if (sFound) {
                setSelectedFile(sFound);
                return;
              }
            }
          } catch (e) {
            console.warn("Fetch /api/media for fileId error:", e);
          }
        }

        // Match by CID
        if (cid) {
          const cFound = mediaFiles.find((f) => f.ipfsCid.toLowerCase() === cid.toLowerCase());
          if (cFound) {
            setSelectedFile(cFound);
          }
        }
      };

      handleShareLink();
    } catch (e) {
      console.warn("Error parsing URL parameters:", e);
    }
  }, [mediaFiles, redeemAccessCode]);

  // Keep selectedFile synchronized with updated mediaFiles from context
  React.useEffect(() => {
    if (selectedFile) {
      const updated = mediaFiles.find(f => f.id === selectedFile.id);
      if (updated && updated !== selectedFile) {
        setSelectedFile(updated);
      }
    }
  }, [mediaFiles]);

  const handleOpenAiForFile = (file: MediaFile) => {
    setAiFileContext(file);
    setActiveTab('assistant');
  };

  React.useEffect(() => {
    if (focusCreateVault && showLandingPage && activeTab === 'vault') {
      document.getElementById('auth-interactive-card')?.scrollIntoView({ behavior: 'smooth' });
      setFocusCreateVault(false);
    }
  }, [activeTab, focusCreateVault, showLandingPage]);

  const handleDismissWelcome = () => {
    try {
      localStorage.setItem(STORAGE_SEEN_WELCOME, 'true');
    } catch {}
    setIsWelcomeOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Application Bar */}
      <Navbar
        onOpenWelcome={() => setIsWelcomeOpen(true)}
        onOpenCreateVault={() => {
          setActiveTab('vault');
          setShowLandingPage(true);
          setFocusCreateVault(true);
        }}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenUpload={() => {
          setShowLandingPage(false);
          setIsUploadOpen(true);
        }}
        onOpenRedeem={() => {
          setShowLandingPage(false);
          setIsRedeemOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        onOpenThemeStudio={() => setIsThemeStudioOpen(true)}
        onOpenLanding={() => setShowLandingPage(prev => !prev)}
        onOpenAssistant={() => {
          setShowLandingPage(false);
          setActiveTab('assistant');
        }}
        isLandingOpen={showLandingPage}
      />

      {/* Android Mobile Install Banner (if installable and not installed) */}
      {isInstallable && !isInstalled && showAndroidBanner && (
        <aside aria-label="Android App Installation" className="bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border-b border-emerald-800/40 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <Smartphone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Install <strong>saus</strong> as a native Android app for faster access and offline media.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAndroidModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
              <button
                onClick={() => setShowAndroidBanner(false)}
                className="p-1 text-slate-400 hover:text-slate-200"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Guest Explorer Banner (if logged out and browsing vault) */}
      {!currentUser && isGuestExploring && !showLandingPage && (
        <div className="bg-gradient-to-r from-cyan-950/80 via-blue-950/80 to-slate-950 border-b border-cyan-800/40 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-cyan-200">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>You are viewing the <strong>Public IPFS Network</strong> in guest mode.</span>
            </div>
            <button
              onClick={() => setIsGuestExploring(false)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In / Create Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-6">
        {activeTab === 'vault' && (
          showLandingPage || (!currentUser && !isGuestExploring) ? (
            /* Emerge Welcome Experience & Proper Website Landing Gateway */
            <AuthGatewayView
              onOpenUpload={() => {
                try { localStorage.setItem('saus_has_entered_v2', 'true'); } catch {}
                setShowLandingPage(false);
                setIsUploadOpen(true);
              }}
              onOpenRedeem={() => {
                try { localStorage.setItem('saus_has_entered_v2', 'true'); } catch {}
                setShowLandingPage(false);
                setIsRedeemOpen(true);
              }}
              onExplorePublic={() => {
                try { localStorage.setItem('saus_has_entered_v2', 'true'); } catch {}
                setShowLandingPage(false);
                setIsGuestExploring(true);
              }}
              onSelectFile={(file) => {
                try { localStorage.setItem('saus_has_entered_v2', 'true'); } catch {}
                setShowLandingPage(false);
                setSelectedFile(file);
              }}
            />
          ) : (
            /* Logged In or Guest Exploring Vault Dashboard */
            <DashboardView
              onOpenUpload={() => setIsUploadOpen(true)}
              onOpenRedeem={() => setIsRedeemOpen(true)}
              onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
              onSelectFile={(file) => setSelectedFile(file)}
              onShareFile={(file) => setSharingFile(file)}
              onTransferFile={(file) => setTransferringFile(file)}
              onAnalyzeAiFile={handleOpenAiForFile}
              onTogglePinFile={(file) => {}}
            />
          )
        )}

        {/* Global IPFS Swarm Hosts View */}
        {activeTab === 'hosts' && (
          <HostNodesView />
        )}

        {/* Global EVM Ledger & Transactions View */}
        {activeTab === 'ledger' && (
          <TransactionsView />
        )}

        {/* AI Assistant Context View */}
        {activeTab === 'assistant' && (
          <AssistantView
            initialFileContext={aiFileContext}
            onClearFileContext={() => setAiFileContext(null)}
          />
        )}
      </main>

      {/* Bottom Decentralized Network Bar */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-4 px-4 sm:px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>saus IPFS Protocol v2.4</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
              <span>IPFS CIDv1 UnixFS</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-violet-400">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
              <span>EVM Sepolia Verified</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="font-mono text-slate-400">
              Contract: <span className="text-slate-300">{SMART_CONTRACT_ADDRESS.slice(0, 8)}...{SMART_CONTRACT_ADDRESS.slice(-4)}</span>
            </span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>4 IPFS Nodes Synced</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenAndroidApp={() => setIsAndroidModalOpen(true)}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      <RedeemCodeModal
        isOpen={isRedeemOpen}
        onClose={() => setIsRedeemOpen(false)}
        onSelectFile={(file) => setSelectedFile(file)}
      />

      <MediaDetailModal
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
        onOpenShare={(file) => {
          setSelectedFile(null);
          setSharingFile(file);
        }}
        onOpenTransfer={(file) => {
          setSelectedFile(null);
          setTransferringFile(file);
        }}
        onOpenAi={(file) => {
          setSelectedFile(null);
          handleOpenAiForFile(file);
        }}
      />

      <ShareAndAccessModal
        file={sharingFile}
        isOpen={!!sharingFile}
        onClose={() => setSharingFile(null)}
      />

      <TransferOwnershipModal
        file={transferringFile}
        isOpen={!!transferringFile}
        onClose={() => setTransferringFile(null)}
      />

      <UserWalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
      />

      <WelcomeRegisterModal
        isOpen={isWelcomeOpen}
        onClose={handleDismissWelcome}
        onComplete={handleDismissWelcome}
      />

      {/* Android Mobile Bottom Navigation Bar (Visible on mobile/Android) */}
      <AndroidBottomNav
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenRedeem={() => setIsRedeemOpen(true)}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Android App Installation & TWA Packaging Modal */}
      <AndroidAppModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />

      {/* Theme Studio & Customizer Modal */}
      <ThemeStudioModal
        isOpen={isThemeStudioOpen}
        onClose={() => setIsThemeStudioOpen(false)}
      />

    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DecentralMediaProvider>
          <MainApp />
        </DecentralMediaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
