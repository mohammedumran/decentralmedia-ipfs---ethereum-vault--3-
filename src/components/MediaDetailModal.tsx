import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Maximize,
  Volume2,
  VolumeX,
  Share2,
  ArrowRightLeft,
  Server,
  Sparkles,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Lock,
  Globe,
  Users,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Info,
  Layers,
  Clock,
  HardDrive,
  Bookmark,
  Trash2,
  KeyRound,
  FileText,
  Music
} from 'lucide-react';
import { MediaFile } from '../types';
import { useAuth } from '../context/AuthContext';
import { useDecentralMedia } from '../context/DecentralMediaContext';
import { formatAddress, formatBytes, formatCid, formatDuration } from '../lib/crypto';
import { SMART_CONTRACT_ADDRESS } from '../lib/contracts';

interface MediaDetailModalProps {
  file: MediaFile | null;
  onClose: () => void;
  onOpenShare: (file: MediaFile) => void;
  onOpenTransfer: (file: MediaFile) => void;
  onOpenAi: (file: MediaFile) => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  file: initialFile,
  onClose,
  onOpenShare,
  onOpenTransfer,
  onOpenAi,
}) => {
  const { currentUser } = useAuth();
  const {
    mediaFiles,
    toggleHostNodePin,
    hostNodes,
    toggleWatchlist,
    isWatchlisted,
    deleteFile,
    checkFileAccess,
    redeemAccessCode,
    updateAccessControl,
    unlockedFileIds
  } = useDecentralMedia();

  // Keep file synchronized with the latest version in context
  const file = useMemo(() => {
    if (!initialFile) return null;
    return mediaFiles.find(f => f.id === initialFile.id) || initialFile;
  }, [initialFile, mediaFiles]);

  const [activeTab, setActiveTab] = useState<'specs' | 'crypto' | 'access' | 'pinning' | 'history'>('specs');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isUpdatingMode, setIsUpdatingMode] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [unlockCode, setUnlockCode] = useState<string>('');
  const [unlockStatus, setUnlockStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    setImageError(false);
    setUnlockStatus(null);
    setUnlockCode('');
  }, [file?.id, file?.url]);

  if (!file) return null;

  const { hasAccess, isOwner, reason } = checkFileAccess(file);
  const isVideo = file.type === 'video' || (file.mimeType && file.mimeType.startsWith('video/'));
  const isAudio = file.type === ('audio' as any) || (file.mimeType && file.mimeType.startsWith('audio/'));
  const inWatchlist = isWatchlisted(file.id);

  const handleUnlockWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockCode.trim()) return;
    setIsUnlocking(true);
    setUnlockStatus(null);
    try {
      const res = await redeemAccessCode(unlockCode.trim());
      if (res.success) {
        setUnlockStatus({ type: 'success', message: res.message });
        setUnlockCode('');
        setImageError(false);
      } else {
        setUnlockStatus({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setUnlockStatus({ type: 'error', message: err.message || 'Failed to unlock' });
    } finally {
      setIsUnlocking(false);
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async () => {
    onClose();
    await deleteFile(file.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h2 className="text-base font-bold text-slate-100 truncate" title={file.name}>
                {file.name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span className="text-cyan-400">{formatCid(file.ipfsCid, 6)}</span>
                <span>•</span>
                <span>{formatBytes(file.sizeBytes)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Watchlist toggle */}
            <button
              id="btn-modal-watchlist"
              onClick={() => toggleWatchlist(file.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                inWatchlist
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
            >
              <Bookmark className={`w-3.5 h-3.5 ${inWatchlist ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span className="hidden sm:inline">{inWatchlist ? "Watchlisted" : "Watchlist"}</span>
            </button>

            <button
              onClick={() => onOpenAi(file)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-950/80 hover:bg-violet-900/80 text-violet-300 border border-violet-700/60 transition-colors shadow-sm"
              title="Inspect with Cipher AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Ask AI</span>
            </button>

            {/* Delete button: only for owner */}
            {isOwner && (
              <button
                id="btn-modal-delete"
                onClick={handleDelete}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition-colors"
                title="Remove from Vault"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split view (Left: Media Player/Viewer, Right: Metadata & Access) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0">
          
          {/* Left Column: Media Stage */}
          <div className="lg:col-span-7 bg-slate-950 p-4 sm:p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800 relative">
            {!hasAccess ? (
              <div className="w-full flex-1 min-h-[380px] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-xl shadow-amber-500/10">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-100">
                  Secret Code Required to Get or View this File
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
                  Enter the Secret Access Code provided by the uploader to unlock, view, and get this media asset.
                </p>

                <div className="mt-6 w-full max-w-sm bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                  <form onSubmit={handleUnlockWithCode} className="space-y-3">
                    <div className="text-left text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Enter Secret Access Code:</span>
                      </div>
                      {file.accessControl.uniqueAccessCode && (
                        <button
                          type="button"
                          onClick={() => setUnlockCode(file.accessControl.uniqueAccessCode)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-mono"
                        >
                          Auto-Fill Code
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={unlockCode}
                        onChange={(e) => setUnlockCode(e.target.value)}
                        placeholder="IPFS-SEC-XXXX-XXXX-XXXX"
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="submit"
                        disabled={isUnlocking}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
                      >
                        {isUnlocking ? 'Verifying...' : 'Unlock & View'}
                      </button>
                    </div>
                    {unlockStatus && (
                      <div className={`text-[11px] font-medium p-2 rounded-lg ${
                        unlockStatus.type === 'success'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                      }`}>
                        {unlockStatus.message}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                {/* Access Granted Status Banner */}
                <div className="w-full mb-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-700/60 flex items-center justify-between text-xs shadow-md">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold truncate">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">Access Granted • File Stored Inside Vault</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleDownload}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                      title="Download file stored on IPFS cluster"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </button>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium flex items-center gap-1 transition-colors"
                      title="Open full raw file in a new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Raw</span>
                    </a>
                  </div>
                </div>

                {isVideo ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
                      {file.url && file.url.trim() !== '' ? (
                        <video
                          id="modal-video-player"
                          src={file.url}
                          controls
                          autoPlay
                          className="w-full h-full object-contain"
                          playbackRate={playbackSpeed}
                        />
                      ) : (
                        <div className="text-slate-500 font-mono text-xs">Video media source unavailable</div>
                      )}
                    </div>
                    
                    {/* Video Info Bar */}
                    <div className="mt-3 w-full flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-cyan-400">
                          {file.metadata.resolution || "1080p FHD"}
                        </span>
                        {file.metadata.duration && (
                          <span className="font-mono text-slate-300">
                            {formatDuration(file.metadata.duration)} ({file.metadata.duration}s)
                          </span>
                        )}
                        {file.metadata.fps && (
                          <span className="text-slate-400">{file.metadata.fps} FPS</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 text-[11px]">Speed:</span>
                        {[0.75, 1, 1.5, 2].map(speed => (
                          <button
                            key={speed}
                            onClick={() => {
                              setPlaybackSpeed(speed);
                              const el = document.getElementById('modal-video-player') as HTMLVideoElement;
                              if (el) el.playbackRate = speed;
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                              playbackSpeed === speed ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : isAudio ? (
                  <div className="w-full flex flex-col items-center p-8 bg-slate-900/80 rounded-xl border border-slate-800 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Music className="w-8 h-8" />
                    </div>
                    <div className="text-sm font-bold text-slate-100">{file.name}</div>
                    <audio controls autoPlay src={file.url} className="w-full max-w-md" />
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center">
                    <div className="relative w-full max-h-[460px] aspect-video bg-slate-950/60 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-2xl">
                      {file.url && file.url.trim() !== '' && !imageError ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          referrerPolicy="no-referrer"
                          onError={() => setImageError(true)}
                          className="max-w-full max-h-[440px] object-contain transition-transform duration-200"
                          style={{ transform: `scale(${zoomLevel})` }}
                        />
                      ) : (
                        <div className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                            <FileText className="w-7 h-7" />
                          </div>
                          <div className="text-sm font-bold text-slate-100">{file.name}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            {formatBytes(file.sizeBytes)} • {file.metadata.resolution || file.mimeType || "IPFS Stored Asset"}
                          </div>
                          <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Decentralized Content Verified on Cluster</span>
                          </p>
                          <div className="flex items-center gap-2 pt-2">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Stored File</span>
                            </a>
                            <button
                              onClick={handleDownload}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Zoom Controls */}
                    {!imageError && file.url && file.url.trim() !== '' && (
                      <div className="mt-3 flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                        <button
                          onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-cyan-400 min-w-[45px] text-center text-xs">
                          {Math.round(zoomLevel * 100)}%
                        </span>
                        <button
                          onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setZoomLevel(1)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 ml-1"
                          title="Reset Zoom"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quick Action Footer inside Stage */}
            <div className="mt-5 w-full pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Direct Share Link button (available for any viewer if file is accessible) */}
                <button
                  onClick={() => {
                    const origin = typeof window !== 'undefined' ? window.location.origin : '';
                    const isRestricted = file.accessControl.mode === 'restricted';
                    const shareUrl = `${origin}/?file=${file.id}${isRestricted ? `&code=${file.accessControl.uniqueAccessCode}` : ''}`;
                    navigator.clipboard.writeText(shareUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 transition-colors"
                  title="Copy direct share link to send to another person"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Share Link Copied!' : 'Copy Share Link'}</span>
                </button>

                {isOwner && (
                  <>
                    <button
                      onClick={() => onOpenShare(file)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Access & Whitelist</span>
                    </button>

                    {file.accessControl.mode !== 'public' && (
                      <button
                        onClick={async () => {
                          setIsUpdatingMode(true);
                          try {
                            await updateAccessControl(file.id, { mode: 'public' });
                          } catch (err) {
                            console.error("Failed to make file public:", err);
                          } finally {
                            setIsUpdatingMode(false);
                          }
                        }}
                        disabled={isUpdatingMode}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors"
                        title="Make this file public so anyone can view it without a code"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>{isUpdatingMode ? 'Updating...' : 'Make Public'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onOpenTransfer(file)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-850 hover:bg-slate-800 text-amber-300 border border-amber-800/40 transition-colors"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Transfer Ownership</span>
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={handleDownload}
                disabled={!hasAccess || !file.accessControl.allowDownload}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  hasAccess && file.accessControl.allowDownload
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed'
                }`}
                title={!hasAccess ? "Access required to download" : "Download media asset"}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{hasAccess ? "Download" : "Download (Locked)"}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Deep Metadata & Inspection Tabs */}
          <div className="lg:col-span-5 p-4 sm:p-6 flex flex-col bg-slate-900/60 overflow-y-auto">
            
            {/* Metadata Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-800 pb-2 mb-4 overflow-x-auto">
              {[
                { id: 'specs', label: 'Specs' },
                { id: 'crypto', label: 'Crypto & CID' },
                { id: 'access', label: 'Access Code' },
                { id: 'pinning', label: 'Host Nodes' },
                { id: 'history', label: 'Ledger' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Specs & Description */}
            {activeTab === 'specs' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-500 font-medium uppercase text-[10px]">Description</label>
                  <p className="text-slate-200 mt-1 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                    {file.metadata.description || "No description provided."}
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <label className="text-slate-500 font-medium uppercase text-[10px]">Tags & Indexing</label>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {file.metadata.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300 border border-slate-700 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Technical Parameters Table */}
                <div>
                  <label className="text-slate-500 font-medium uppercase text-[10px]">Media Specifications</label>
                  <div className="mt-1.5 divide-y divide-slate-800 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="p-2.5 flex justify-between">
                      <span className="text-slate-400">Resolution</span>
                      <span className="font-mono text-slate-200 font-semibold">{file.metadata.resolution || "Unknown"}</span>
                    </div>
                    {file.metadata.width && file.metadata.height && (
                      <div className="p-2.5 flex justify-between">
                        <span className="text-slate-400">Dimensions</span>
                        <span className="font-mono text-slate-200">{file.metadata.width} × {file.metadata.height} px</span>
                      </div>
                    )}
                    <div className="p-2.5 flex justify-between">
                      <span className="text-slate-400">MIME Type</span>
                      <span className="font-mono text-slate-200">{file.mimeType}</span>
                    </div>
                    <div className="p-2.5 flex justify-between">
                      <span className="text-slate-400">Codec Profile</span>
                      <span className="font-mono text-slate-200">{file.metadata.codec || "Standard"}</span>
                    </div>
                    {file.metadata.exifCamera && (
                      <div className="p-2.5 flex justify-between">
                        <span className="text-slate-400">Camera / Instrument</span>
                        <span className="text-slate-200">{file.metadata.exifCamera}</span>
                      </div>
                    )}
                    <div className="p-2.5 flex justify-between">
                      <span className="text-slate-400">Chunk Size</span>
                      <span className="font-mono text-cyan-400">{file.metadata.unixFsChunkSize || "256 KB DAG-PB"}</span>
                    </div>
                  </div>
                </div>

                {/* Custom Key-Values if any */}
                {file.metadata.customFields && file.metadata.customFields.length > 0 && (
                  <div>
                    <label className="text-slate-500 font-medium uppercase text-[10px]">Custom Metadata Fields</label>
                    <div className="mt-1.5 divide-y divide-slate-800 bg-slate-950 rounded-lg border border-slate-800">
                      {file.metadata.customFields.map((field, idx) => (
                        <div key={idx} className="p-2.5 flex justify-between">
                          <span className="text-slate-400">{field.key}</span>
                          <span className="font-mono text-slate-200">{field.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Crypto & CID */}
            {activeTab === 'crypto' && (
              <div className="space-y-4 text-xs">
                {/* IPFS CID v1 */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-slate-500 font-medium uppercase text-[10px]">IPFS Content Identifier (CIDv1)</label>
                    <button
                      onClick={() => copyToClipboard(file.ipfsCid, 'cid')}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                    >
                      {copiedField === 'cid' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy CID</span>
                    </button>
                  </div>
                  <div className="mt-1.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-cyan-300 text-[11px] break-all select-all">
                    {file.ipfsCid}
                  </div>
                </div>

                {/* SHA-256 Hash */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-slate-500 font-medium uppercase text-[10px]">SHA-256 Content Hash</label>
                    <button
                      onClick={() => copyToClipboard(file.sha256Hash, 'sha256')}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                    >
                      {copiedField === 'sha256' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="mt-1.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-slate-300 text-[11px] break-all select-all">
                    {file.sha256Hash}
                  </div>
                </div>

                {/* Keccak-256 Contract Hash */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-slate-500 font-medium uppercase text-[10px]">Keccak-256 Smart Contract State Hash</label>
                    <button
                      onClick={() => copyToClipboard(file.keccak256Hash, 'keccak')}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                    >
                      {copiedField === 'keccak' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="mt-1.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-slate-300 text-[11px] break-all select-all">
                    {file.keccak256Hash}
                  </div>
                </div>

                {/* Ethereum Smart Contract Address */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-slate-500 font-medium uppercase text-[10px]">Deployed Smart Contract</label>
                    <span className="text-[10px] font-mono text-emerald-400">Verified Sepolia</span>
                  </div>
                  <div className="mt-1.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-violet-300 text-[11px] break-all">
                    {SMART_CONTRACT_ADDRESS}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Access Control & Unique Code */}
            {activeTab === 'access' && (
              <div className="space-y-4 text-xs">
                {/* Direct Shareable Link Box */}
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-950/60 to-slate-950 border border-cyan-700/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-cyan-200 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Direct Shareable Link (Auto-Unlocks for recipient)</span>
                    </span>
                    <button
                      onClick={() => {
                        const origin = typeof window !== 'undefined' ? window.location.origin : '';
                        const shareUrl = `${origin}/?file=${file.id}&code=${file.accessControl.uniqueAccessCode}`;
                        navigator.clipboard.writeText(shareUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2500);
                      }}
                      className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-colors"
                    >
                      {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink ? 'Copied Link!' : 'Copy Share Link'}</span>
                    </button>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 break-all select-all">
                    {`${typeof window !== 'undefined' ? window.location.origin : ''}/?file=${file.id}&code=${file.accessControl.uniqueAccessCode}`}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Send this link to anyone. Opening this URL will automatically unlock and stream the media file on their screen.
                  </p>
                </div>

                {/* Why another person cannot access advice */}
                {file.accessControl.mode === 'private' ? (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/70 text-rose-200 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-xs block text-rose-100">
                            Why can another person not access this file?
                          </span>
                          <p className="text-[11px] text-rose-300/90 mt-0.5 leading-normal">
                            This file is currently marked <strong className="text-white">"Private (Owner Only)"</strong>. In Private mode, only your connected wallet address can view it. Another person or device will see a locked screen.
                          </p>
                        </div>
                      </div>
                      {isOwner && (
                        <button
                          onClick={async () => {
                            setIsUpdatingMode(true);
                            try {
                              await updateAccessControl(file.id, { mode: 'public' });
                            } catch (err) {
                              console.error("Failed to make file public:", err);
                            } finally {
                              setIsUpdatingMode(false);
                            }
                          }}
                          disabled={isUpdatingMode}
                          className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex-shrink-0 transition-colors"
                        >
                          Make Public Now
                        </button>
                      )}
                    </div>
                  </div>
                ) : file.accessControl.mode === 'restricted' ? (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/70 text-amber-200 space-y-1">
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-xs block text-amber-100">
                          Restricted ACL Mode
                        </span>
                        <p className="text-[11px] text-amber-300/90 mt-0.5 leading-normal">
                          Another person can only view this file if you share your <strong className="text-white">Secret Access Code</strong>, send them the Direct Share Link, or whitelist their Ethereum address (0x...).
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-200">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-[11px] text-emerald-300">
                        <strong className="text-white">Public Mode:</strong> Anyone on the network or anyone with the link can view and download this file immediately.
                      </span>
                    </div>
                  </div>
                )}

                {/* Unique Access Code Box: Only visible to Owner */}
                {isOwner ? (
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/80 to-slate-950 border border-indigo-700/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-200 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Unique Secret Access Code</span>
                      </span>
                      <button
                        onClick={() => copyToClipboard(file.accessControl.uniqueAccessCode, 'accesscode')}
                        className="px-2 py-0.5 rounded bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 text-[11px] font-medium flex items-center gap-1"
                      >
                        {copiedField === 'accesscode' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Code</span>
                      </button>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-indigo-900/60 font-mono text-center text-sm font-bold tracking-wider text-indigo-300 select-all">
                      {file.accessControl.uniqueAccessCode}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-normal">
                      This unique secret code unlocks access for any guest or recipient on the <strong className="text-slate-300">"Redeem by Code"</strong> portal without requiring an Ethereum transaction.
                    </p>
                    
                    <div className="pt-1 flex items-center justify-between text-[11px] text-indigo-300/80">
                      <span>Total Redemptions:</span>
                      <span className="font-mono font-bold text-indigo-200">{file.accessControl.codeRedemptions} times</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
                    <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Protected Secret Access Code</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Only the smart contract owner ({formatAddress(file.ownerAddress, 4)}) can view and manage the Secret Access Code for this media asset.
                    </p>
                  </div>
                )}

                {/* Access Mode */}
                <div>
                  <label className="text-slate-500 font-medium uppercase text-[10px]">Access Permission Mode</label>
                  <div className="mt-1.5 p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="font-semibold text-slate-200 capitalize">{file.accessControl.mode} Mode</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-300">
                      {file.accessControl.mode === 'public' ? 'Open to World' : file.accessControl.mode === 'restricted' ? 'Whitelist + Secret Code' : 'Owner Locked'}
                    </span>
                  </div>
                </div>

                {/* Whitelisted Addresses */}
                <div>
                  <label className="text-slate-500 font-medium uppercase text-[10px]">
                    Whitelisted Addresses ({file.accessControl.allowedAddresses.length})
                  </label>
                  <div className="mt-1.5 bg-slate-950 rounded-lg border border-slate-800 divide-y divide-slate-800 max-h-32 overflow-y-auto">
                    {file.accessControl.allowedAddresses.length > 0 ? (
                      file.accessControl.allowedAddresses.map((addr, idx) => (
                        <div key={idx} className="p-2 font-mono text-[11px] text-slate-300 flex items-center justify-between">
                          <span>{addr}</span>
                          <span className="text-[10px] text-emerald-400 font-sans">Authorized</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-slate-500 text-center">No explicit addresses whitelisted.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Pinning & Host Nodes */}
            {activeTab === 'pinning' && (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[11px]">Replication Factor</span>
                    <div className="font-bold text-slate-100 text-sm mt-0.5">{file.pinningState?.replicationFactor ?? file.pinnedHostNodes?.length ?? 1} Active Host Nodes</div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 font-medium uppercase text-[10px]">Cluster Pinning Status</label>
                  <div className="mt-1.5 space-y-2">
                    {hostNodes.map(node => {
                      const isPinned = file.pinningState?.pinnedNodes?.includes(node.id) ?? (file.pinnedHostNodes || []).includes(node.id);
                      return (
                        <div
                          key={node.id}
                          className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                            isPinned ? 'bg-slate-950 border-cyan-500/30' : 'bg-slate-950/50 border-slate-800'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-slate-200 text-xs">{node.name}</div>
                            <div className="text-[10px] text-slate-400">{node.region} • {node.latencyMs}ms</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                              isPinned ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {isPinned ? 'PINNED' : 'UNPINNED'}
                            </span>
                            {isOwner && (
                              <button
                                onClick={() => toggleHostNodePin(file.id, node.id)}
                                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                              >
                                {isPinned ? 'Unpin' : 'Pin'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Ledger & Ownership History */}
            {activeTab === 'history' && (
              <div className="space-y-4 text-xs">
                {/* Current Owner */}
                <div>
                  <label className="text-slate-500 font-medium uppercase text-[10px]">Current Smart Contract Owner</label>
                  <div className="mt-1.5 p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-cyan-400 font-semibold">{file.ownerAddress}</span>
                      {isOwner && (
                        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Transfer History Timeline */}
                <div>
                  <label className="text-slate-500 font-medium uppercase text-[10px]">Ownership Transfer Log</label>
                  <div className="mt-1.5 space-y-2">
                    {file.transferHistory && file.transferHistory.length > 0 ? (
                      file.transferHistory.map((record, idx) => (
                        <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">{new Date(record.timestamp).toLocaleString()}</span>
                            <span className="font-mono text-violet-400">Block #{record.blockNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                            <span className="text-slate-400">{formatAddress(record.fromAddress, 2)}</span>
                            <ArrowRightLeft className="w-3 h-3 text-amber-400" />
                            <span className="text-cyan-300">{formatAddress(record.toAddress, 2)}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono break-all">
                            TX: {record.txHash}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-slate-500 text-center">
                        Original Genesis Mint. No transfers have been executed yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
