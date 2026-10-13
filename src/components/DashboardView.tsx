import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Grid,
  List,
  Upload,
  KeyRound,
  Database,
  Image as ImageIcon,
  Video as VideoIcon,
  Server,
  Blocks,
  ArrowRightLeft,
  Sparkles,
  HardDrive,
  Bookmark,
  Globe,
  ShieldCheck,
  Coins,
  LogOut,
  FolderUp,
  Bot,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  PieChart,
  X,
  Share2,
  Lock,
  Info,
  RefreshCw,
  Eye,
  EyeOff,
  FolderLock
} from 'lucide-react';
import { useDecentralMedia } from '../context/DecentralMediaContext';
import { useAuth } from '../context/AuthContext';
import { MediaCard } from './MediaCard';
import { MediaListItem } from './MediaListItem';
import { StorageStats } from './StorageStats';
import { MediaFile } from '../types';
import { formatAddress, formatBytes } from '../lib/crypto';
import { useTheme } from '../context/ThemeContext';

interface DashboardViewProps {
  onOpenUpload: () => void;
  onOpenRedeem: () => void;
  onOpenAndroidModal?: () => void;
  onSelectFile: (file: MediaFile) => void;
  onShareFile: (file: MediaFile) => void;
  onTransferFile: (file: MediaFile) => void;
  onAnalyzeAiFile: (file: MediaFile) => void;
  onTogglePinFile: (file: MediaFile) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenUpload,
  onOpenRedeem,
  onOpenAndroidModal,
  onSelectFile,
  onShareFile,
  onTransferFile,
  onAnalyzeAiFile,
  onTogglePinFile,
}) => {
  const {
    mediaFiles,
    hostNodes,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    watchlist,
    redeemAccessCode,
    refreshVault,
  } = useDecentralMedia();
  const { currentUser, logoutAccount } = useAuth();
  const { settings } = useTheme();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showChartDetails, setShowChartDetails] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [confirmHeaderLogout, setConfirmHeaderLogout] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inlineCode, setInlineCode] = useState('');
  const [inlineRedeemMsg, setInlineRedeemMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAccessGuide, setShowAccessGuide] = useState(false);
  const [showMyKeys, setShowMyKeys] = useState(true);
  const [revealPasscode, setRevealPasscode] = useState(false);
  const [revealMnemonic, setRevealMnemonic] = useState(false);
  const [copiedKeyLabel, setCopiedKeyLabel] = useState<string | null>(null);

  const handleCopyKey = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyLabel(label);
    setTimeout(() => setCopiedKeyLabel(null), 2000);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshVault();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Default to Public Network so community uploads are immediately accessible
  const userAddrLower = currentUser?.address?.toLowerCase() || '';

  // All files in the decentralized vault are shown on the dashboard (with secret code required to view/get)
  const accessibleFiles = useMemo(() => {
    return mediaFiles;
  }, [mediaFiles]);

  // Aggregate stats
  const totalFiles = accessibleFiles.length;
  const imageFiles = useMemo(() => accessibleFiles.filter((f) => f.type === 'image'), [accessibleFiles]);
  const videoFiles = useMemo(() => accessibleFiles.filter((f) => f.type === 'video'), [accessibleFiles]);
  const imageCount = imageFiles.length;
  const videoCount = videoFiles.length;
  const totalSizeBytes = accessibleFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
  const imageBytes = useMemo(() => imageFiles.reduce((acc, f) => acc + f.sizeBytes, 0), [imageFiles]);
  const videoBytes = useMemo(() => videoFiles.reduce((acc, f) => acc + f.sizeBytes, 0), [videoFiles]);

  const quotaBytes = (settings.storageQuotaGb || 5) * 1024 * 1024 * 1024;
  const usedPercent = Math.min(100, Math.max(1, Math.round((totalSizeBytes / quotaBytes) * 100)));

  const myFiles = useMemo(() => {
    return mediaFiles.filter((f) => f.ownerAddress.toLowerCase() === userAddrLower);
  }, [mediaFiles, userAddrLower]);

  const sharedWithMeFiles = useMemo(() => {
    return mediaFiles.filter((file) => {
      const isWhitelisted =
        file.accessControl.allowedAddresses.some((a) => a.toLowerCase() === userAddrLower);
      const isNotOwner = file.ownerAddress.toLowerCase() !== userAddrLower;
      return isWhitelisted && isNotOwner;
    });
  }, [mediaFiles, userAddrLower]);

  const watchlistCount = accessibleFiles.filter((f) => watchlist.includes(f.id)).length;

  // Filtered files
  const filteredFiles = useMemo(() => {
    return mediaFiles
      .filter((file) => {
        const isOwner = userAddrLower && file.ownerAddress.toLowerCase() === userAddrLower;
        const isWhitelisted =
          userAddrLower && file.accessControl.allowedAddresses.some((a) => a.toLowerCase() === userAddrLower);

        if (file.accessControl.mode === 'private' && !isOwner) {
          return false;
        }

        if (activeFilter === 'watchlist' && !watchlist.includes(file.id)) return false;
        if (activeFilter === 'image' && file.type !== 'image') return false;
        if (activeFilter === 'video' && file.type !== 'video') return false;
        if (activeFilter === 'my-uploads' && !isOwner) return false;
        if (activeFilter === 'shared-with-me') {
          if (!isWhitelisted || isOwner) return false;
        }
        if (activeFilter === 'transferred') {
          const hasTransferRecord = file.transferHistory && file.transferHistory.length > 0;
          if (!hasTransferRecord) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = file.name.toLowerCase().includes(q);
          const matchesCid = file.ipfsCid.toLowerCase().includes(q);
          const matchesCode = isOwner && file.accessControl.uniqueAccessCode.toLowerCase().includes(q);
          const matchesTags = file.metadata.tags.some((t) => t.toLowerCase().includes(q));
          const matchesOwner = file.ownerAddress.toLowerCase().includes(q);
          if (!matchesName && !matchesCid && !matchesCode && !matchesTags && !matchesOwner) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'newest') return b.uploadTimestamp - a.uploadTimestamp;
        if (sortOption === 'oldest') return a.uploadTimestamp - b.uploadTimestamp;
        if (sortOption === 'size-desc') return b.sizeBytes - a.sizeBytes;
        if (sortOption === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [mediaFiles, activeFilter, searchQuery, sortOption, userAddrLower, watchlist]);

  const handleInlineRedeem = async (codeToRedeem?: string) => {
    const targetCode = (codeToRedeem || inlineCode).trim();
    if (!targetCode) return;
    const res = await redeemAccessCode(targetCode);
    if (res.success && res.file) {
      setInlineRedeemMsg({ type: 'success', text: `Unlocked: "${res.file.name}"` });
      onSelectFile(res.file);
      setInlineCode('');
      setTimeout(() => setInlineRedeemMsg(null), 3500);
    } else {
      setInlineRedeemMsg({ type: 'error', text: res.message });
      setTimeout(() => setInlineRedeemMsg(null), 3500);
    }
  };

  const copyAddress = () => {
    if (!currentUser?.address) return;
    navigator.clipboard.writeText(currentUser.address);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const filterTabs = [
    { id: 'all', label: 'Public Network', count: totalFiles, icon: Globe },
    { id: 'my-uploads', label: 'My Vault', count: myFiles.length, icon: Database },
    { id: 'shared-with-me', label: 'Shared with Me', count: sharedWithMeFiles.length, icon: ArrowRightLeft },
    { id: 'image', label: 'Images', count: imageCount, icon: ImageIcon },
    { id: 'video', label: 'Videos', count: videoCount, icon: VideoIcon },
    { id: 'watchlist', label: 'Watchlist', count: watchlistCount, icon: Bookmark },
    { id: 'transferred', label: 'Transfers', icon: ArrowRightLeft },
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. CLEAN HERO & QUICK ACTION HEADER */}
      <section aria-label="Dashboard Overview" className="rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        
        {/* Subtle Decorative Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Left: Clean Identity & Network Status */}
          <div className="space-y-2">
            
            {/* Unboxed Metadata Line (Zero-Pill Compliance) */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{hostNodes.length} Swarm Nodes Online</span>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Blocks className="w-3.5 h-3.5 text-violet-400" />
                <span>Sepolia Verified</span>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono text-cyan-400 text-[11px]">{formatBytes(totalSizeBytes)} Pinned</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                Media Vault Dashboard
              </h1>
              {currentUser && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-slate-500">as</span>
                  <span className="font-semibold text-slate-200">{currentUser.name}</span>
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-1 font-mono text-[11px] text-cyan-300 hover:text-cyan-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer"
                    title="Copy Ethereum Address"
                  >
                    <span>{formatAddress(currentUser.address, 4)}</span>
                    {copiedAddr ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  </button>
                  <span className="text-emerald-400 font-mono text-[11px]">({currentUser.balanceEth} ETH)</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Decentralized IPFS storage for images and videos with cryptographic access codes and Ethereum ownership controls.
            </p>
          </div>

          {/* Right: Quick Action Launchers */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="dash-upload-primary-btn"
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-950" />
              <span>Upload & Pin</span>
            </button>

            <button
              id="dash-redeem-secondary-btn"
              onClick={onOpenRedeem}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>Redeem Code</span>
            </button>

            <button
              id="dash-sync-btn"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="Force sync files across devices from IPFS server vault"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Vault'}</span>
            </button>

            {currentUser && (
              <button
                id="dash-keys-toggle-btn"
                onClick={() => setShowMyKeys(!showMyKeys)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  showMyKeys
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                    : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800 hover:border-slate-700'
                }`}
                title="View your cryptographic wallet keys, PIN, and file access codes"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>{showMyKeys ? 'Hide Keys' : 'My Keys'}</span>
              </button>
            )}

            {onOpenAndroidModal && (
              <button
                id="dash-android-btn"
                onClick={onOpenAndroidModal}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-xs font-semibold transition-all cursor-pointer"
                title="Install Android App"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Android App</span>
              </button>
            )}

            {currentUser && (
              confirmHeaderLogout ? (
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs">
                  <span className="text-slate-300 text-[11px]">Log out?</span>
                  <button
                    onClick={() => {
                      logoutAccount();
                      setConfirmHeaderLogout(false);
                    }}
                    className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmHeaderLogout(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-200 px-1"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmHeaderLogout(true)}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 transition-colors"
                  title="Log Out Account"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )
            )}
          </div>

        </div>

        {/* 2. COMPACT STORAGE ALLOCATION BAR & D3 TOGGLE */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <div className="space-x-2">
                <span className="font-semibold text-slate-200">
                  {formatBytes(totalSizeBytes)} of {formatBytes(quotaBytes)} Used
                </span>
                <span className="text-slate-500">({usedPercent}%)</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{imageCount} Images ({formatBytes(imageBytes)})</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{videoCount} Videos ({formatBytes(videoBytes)})</span>
              </div>
            </div>

            <button
              onClick={() => setShowChartDetails(!showChartDetails)}
              className="text-cyan-400 hover:text-cyan-300 font-medium text-xs flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>{showChartDetails ? 'Hide Storage Chart' : 'Storage Chart (D3)'}</span>
              {showChartDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Simple Clean Progress Meter */}
          <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 mt-2.5 overflow-hidden flex">
            <div
              className="h-full bg-cyan-400 transition-all duration-500"
              style={{ width: `${Math.max(1, (imageBytes / (quotaBytes || 1)) * 100)}%` }}
              title={`Images: ${formatBytes(imageBytes)}`}
            />
            <div
              className="h-full bg-violet-500 transition-all duration-500"
              style={{ width: `${Math.max(0, (videoBytes / (quotaBytes || 1)) * 100)}%` }}
              title={`Videos: ${formatBytes(videoBytes)}`}
            />
          </div>

          {/* Collapsible Interactive D3 Visualizer */}
          {showChartDetails && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 animate-in fade-in duration-200">
              <StorageStats
                mediaFiles={mediaFiles}
                currentUser={currentUser}
                activeFilter={activeFilter}
                onSelectFilter={(f) => setActiveFilter(f)}
                quotaBytes={quotaBytes}
              />
            </div>
          )}
        </div>

      </section>

      {/* 3. FAST ACCESS CODE REDEEMER ROW */}
      <section aria-label="Access Code Redeemer" className="rounded-xl bg-slate-900/70 border border-slate-800 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 w-full sm:w-auto">
            <KeyRound className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>Fast Access Code Unlock:</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleInlineRedeem();
            }}
            className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-xl"
          >
            <div className="relative flex-1">
              <input
                id="dash-quick-redeem-input"
                type="text"
                value={inlineCode}
                onChange={(e) => setInlineCode(e.target.value)}
                placeholder="Enter 16-character code (e.g. IPFS-SEC-4A7B-9E3C-8D1F)..."
                className="w-full pl-3 pr-8 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-400 focus:outline-none text-xs text-slate-100 placeholder-slate-500 font-mono transition-colors"
              />
              {inlineCode && (
                <button
                  type="button"
                  onClick={() => setInlineCode('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              id="dash-quick-redeem-submit-btn"
              type="submit"
              disabled={!inlineCode.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 shadow-sm"
            >
              <span>Unlock</span>
            </button>
          </form>
        </div>

        {inlineRedeemMsg && (
          <div className={`mt-2.5 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 ${
            inlineRedeemMsg.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
              : 'bg-rose-950/80 text-rose-300 border border-rose-700/50'
          }`}>
            {inlineRedeemMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{inlineRedeemMsg.text}</span>
          </div>
        )}
      </section>

      {/* MULTI-USER FILE ACCESS & SHARING GUIDE */}
      {showAccessGuide && (
        <section aria-label="Sharing and Access Guide" className="rounded-xl bg-gradient-to-r from-slate-900/95 via-cyan-950/20 to-slate-900/95 border border-slate-800 p-4 relative text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>How Anyone Can Access Uploaded Files on the Server:</span>
            </div>
            <button
              onClick={() => setShowAccessGuide(false)}
              className="text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1 transition-colors"
              title="Dismiss Guide"
            >
              <span>Dismiss</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1: Public Vault */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-300 text-xs">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>1. Public by Default</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Files uploaded as <strong>Public IPFS</strong> are immediately visible to any person on any device. They can browse, play, and download with zero login required.
              </p>
            </div>

            {/* Step 2: One-Click Share Links */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-cyan-300 text-xs">
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>2. Direct Share Links</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Click <strong>"Share Link"</strong> on any card to copy a direct URL (<code className="text-cyan-300 font-mono text-[10px]">?file=med-...</code>). Anyone who opens that link sees the file instantly.
              </p>
            </div>

            {/* Step 3: Secret Codes & Private */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300 text-xs">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>3. Secret Code & Permissions</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                For restricted files, send your Secret Access Code. If you uploaded a file as Private, click <strong>"Make Public"</strong> on the card so another person can view it.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 4. INTUITIVE CONTROLS: FILTERS, SEARCH, SORT & VIEW TOGGLE */}
      <section aria-label="Media Filters and Search" className="space-y-3">
        
        {/* Row 1: Search & Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="media-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, tag, CID, or owner..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs text-slate-100 placeholder-slate-500 transition-colors shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Sort & Grid/List */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            
            <select
              id="sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none cursor-pointer shadow-sm"
            >
              <option value="newest">Newest Uploads</option>
              <option value="oldest">Oldest Uploads</option>
              <option value="size-desc">Largest File Size</option>
              <option value="name">Alphabetical</option>
            </select>

            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-sm">
              <button
                id="view-mode-grid"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-slate-800 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid View"
                aria-label="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                id="view-mode-list"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-slate-800 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="List View"
                aria-label="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Row 2: Category Filter Segmented Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                id={`filter-tab-${tab.id}`}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </section>

      {/* 5. MEDIA GRID OR LIST */}
      {filteredFiles.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFiles.map((file) => (
              <MediaCard
                key={file.id}
                file={file}
                onSelect={onSelectFile}
                onShare={onShareFile}
                onTransfer={onTransferFile}
                onAnalyzeAi={onAnalyzeAiFile}
                onTogglePin={onTogglePinFile}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredFiles.map((file) => (
              <MediaListItem
                key={file.id}
                file={file}
                onSelect={onSelectFile}
                onShare={onShareFile}
                onTransfer={onTransferFile}
                onAnalyzeAi={onAnalyzeAiFile}
                onTogglePin={onTogglePinFile}
              />
            ))}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="py-16 px-4 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-cyan-400 mb-3.5 shadow-inner">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">
            {activeFilter === 'my-uploads'
              ? `${currentUser?.name || 'Account'}'s Vault is Empty`
              : activeFilter === 'shared-with-me'
              ? 'No Media Shared With You Yet'
              : activeFilter === 'watchlist'
              ? 'Your Watchlist is Empty'
              : 'No Media Files Found'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? `No items match "${searchQuery}". Clear your search or explore other filters.`
              : activeFilter === 'my-uploads'
              ? 'Upload your first image or video to permanently pin it to the IPFS swarm.'
              : 'Redeem a secret 16-character access code or browse the public network.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-2.5 flex-wrap">
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-md cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Media</span>
            </button>
            <button
              onClick={onOpenRedeem}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>Redeem Code</span>
            </button>
            {activeFilter !== 'all' && totalFiles > 0 && (
              <button
                onClick={() => setActiveFilter('all')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Explore Public ({totalFiles})</span>
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
