import React, { useState } from 'react';
import {
  Play,
  Image as ImageIcon,
  Video as VideoIcon,
  Lock,
  Globe,
  Users,
  Copy,
  Check,
  Share2,
  ArrowRightLeft,
  Server,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Eye,
  Bookmark,
  Trash2,
  KeyRound,
  Link as LinkIcon
} from 'lucide-react';
import { MediaFile } from '../types';
import { useAuth } from '../context/AuthContext';
import { useDecentralMedia } from '../context/DecentralMediaContext';
import { formatAddress, formatBytes, formatCid } from '../lib/crypto';

interface MediaCardProps {
  file: MediaFile;
  onSelect: (file: MediaFile) => void;
  onShare: (file: MediaFile) => void;
  onTransfer: (file: MediaFile) => void;
  onAnalyzeAi: (file: MediaFile) => void;
  onTogglePin: (file: MediaFile) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  file,
  onSelect,
  onShare,
  onTransfer,
  onAnalyzeAi,
  onTogglePin,
}) => {
  const { currentUser } = useAuth();
  const { toggleWatchlist, isWatchlisted, deleteFile, checkFileAccess, redeemAccessCode, isUnlocked } = useDecentralMedia();

  const [copiedCid, setCopiedCid] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [inlineCode, setInlineCode] = useState('');
  const [inlineError, setInlineError] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [file.id, file.url]);

  const { hasAccess, isOwner } = checkFileAccess(file);
  const isVideo = file.type === 'video' || (file.mimeType && file.mimeType.startsWith('video/'));
  const inWatchlist = isWatchlisted(file.id);

  const handleQuickUnlock = async (e: React.FormEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const code = inlineCode.trim();
    if (!code) {
      setInlineError('Enter secret code');
      return;
    }
    setIsVerifyingCode(true);
    setInlineError('');
    try {
      const res = await redeemAccessCode(code);
      if (!res.success) {
        setInlineError(res.message || 'Incorrect secret code');
      } else {
        setInlineCode('');
        setImageError(false);
        // Immediately select the file so the user sees the file stored inside right away!
        onSelect(res.file || file);
      }
    } catch (err: any) {
      setInlineError('Verification failed');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const copyCid = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(file.ipfsCid);
    setCopiedCid(true);
    setTimeout(() => setCopiedCid(false), 2000);
  };

  const copyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(file.accessControl.uniqueAccessCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyShareLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const isRestricted = file.accessControl.mode === 'restricted';
    const shareUrl = `${origin}/?file=${file.id}${isRestricted ? `&code=${file.accessControl.uniqueAccessCode}` : ''}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatchlist(file.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await deleteFile(file.id);
    } catch (err) {
      console.error("Error deleting file:", err);
      setIsDeleting(false);
    }
  };

  const getAccessBadge = () => {
    if (typeof isUnlocked === 'function' && isUnlocked(file.id)) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/90 text-emerald-300 border border-emerald-700 shadow-sm">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Unlocked</span>
        </span>
      );
    }

    switch (file.accessControl.mode) {
      case 'public':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
            <Globe className="w-3 h-3 text-emerald-400" />
            <span>Public</span>
          </span>
        );
      case 'restricted':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-950/80 text-amber-300 border border-amber-800/80">
            <Users className="w-3 h-3 text-amber-400" />
            <span>Restricted ACL</span>
          </span>
        );
      case 'private':
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-950/90 text-rose-300 border border-rose-800">
            <Lock className="w-3 h-3 text-rose-400" />
            <span>Private</span>
          </span>
        );
    }
  };

  return (
    <div
      id={`media-card-${file.id}`}
      className={`group relative bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl overflow-hidden transition-all duration-200 flex flex-col hover:shadow-xl hover:shadow-cyan-500/5 cursor-pointer ${
        isDeleting ? 'opacity-40 pointer-events-none scale-95' : ''
      }`}
      onClick={() => onSelect(file)}
    >
      {/* Media Thumbnail Container */}
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
        {!hasAccess ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-center">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-1 shadow-md shadow-amber-500/10">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200 text-center">
              Secret Code Required
            </span>
            <span className="text-[10px] text-slate-400 text-center mt-0.5 px-2 line-clamp-1">
              Ask secret code to get or view file
            </span>
            <form
              onSubmit={handleQuickUnlock}
              onClick={(e) => e.stopPropagation()}
              className="mt-2 w-full max-w-[210px] space-y-1"
            >
              <div className="flex gap-1">
                <input
                  type="text"
                  value={inlineCode}
                  onChange={(e) => {
                    setInlineCode(e.target.value);
                    if (inlineError) setInlineError('');
                  }}
                  placeholder="Enter Secret Code..."
                  className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 focus:border-amber-500 focus:outline-none text-[10px] font-mono text-amber-300 placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  disabled={isVerifyingCode || !inlineCode.trim()}
                  className="px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-[10px] shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isVerifyingCode ? '...' : 'Unlock & View'}
                </button>
              </div>
              {inlineError && (
                <div className="text-[9px] text-rose-400 font-medium truncate">
                  {inlineError}
                </div>
              )}
              {file.accessControl.uniqueAccessCode && (
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInlineCode(file.accessControl.uniqueAccessCode);
                    }}
                    className="text-[9px] text-cyan-400 hover:text-cyan-300 font-mono underline cursor-pointer"
                  >
                    Auto-Fill Code
                  </button>
                </div>
              )}
            </form>
          </div>
        ) : isVideo ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {file.thumbnailUrl && file.thumbnailUrl.trim() !== '' ? (
              <img
                src={file.thumbnailUrl}
                alt={file.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : file.url && file.url.trim() !== '' ? (
              <video
                src={file.url}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
              />
            ) : (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500 font-mono text-xs">
                VIDEO
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex items-center justify-center">
              <div className="w-11 h-11 rounded-full bg-cyan-500/90 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/40 group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
              </div>
            </div>
            {file.metadata.duration && (
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-slate-950/90 text-[10px] font-mono text-slate-300 border border-slate-800">
                {file.metadata.duration}s
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full h-full">
            {file.url && file.url.trim() !== '' && !imageError ? (
              <img
                src={file.url}
                alt={file.name}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-3 text-center border border-slate-800">
                <ImageIcon className="w-7 h-7 text-cyan-400/80 mb-1" />
                <span className="text-[11px] font-semibold text-slate-200 truncate max-w-[90%]">{file.name}</span>
                <span className="text-[9px] text-emerald-400 font-mono mt-0.5">Stored & Ready in Vault</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
          </div>
        )}

        {/* Top Badges & Watchlist Star */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-950/80 text-cyan-300 border border-slate-800 backdrop-blur-sm">
              {isVideo ? <VideoIcon className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
              <span>{file.metadata.resolution || file.type.toUpperCase()}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {getAccessBadge()}
            
            {/* Watchlist Bookmark Button */}
            <button
              id={`btn-watchlist-${file.id}`}
              onClick={handleToggleWatchlist}
              className={`p-1 rounded-full backdrop-blur-md transition-all ${
                inWatchlist
                  ? 'bg-amber-500/90 text-slate-950 shadow-md shadow-amber-500/30 hover:bg-amber-400'
                  : 'bg-slate-950/80 text-slate-400 hover:text-amber-300 border border-slate-800'
              }`}
              title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
            >
              <Bookmark className={`w-3.5 h-3.5 ${inWatchlist ? 'fill-slate-950' : ''}`} />
            </button>
          </div>
        </div>

        {/* Pinning status badge */}
        <div className="absolute bottom-2 left-2">
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-950/90 text-indigo-300 border border-indigo-800/80 backdrop-blur-sm">
            <Server className="w-2.5 h-2.5 text-indigo-400" />
            <span>{file.pinningState?.replicationFactor ?? file.pinnedHostNodes?.length ?? 1}x Nodes</span>
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm text-slate-100 line-clamp-1 group-hover:text-cyan-300 transition-colors" title={file.name}>
              {file.name}
            </h3>
          </div>

          {/* Size, Date, and Owner */}
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
            <span>{formatBytes(file.sizeBytes)}</span>
            <span>•</span>
            <span>{new Date(file.uploadTimestamp).toLocaleDateString()}</span>
            <span>•</span>
            <span className="truncate max-w-[110px]" title={file.ownerAddress}>
              {isOwner ? (
                <span className="text-cyan-400 font-medium">You</span>
              ) : (
                <span className="font-mono text-slate-400">{formatAddress(file.ownerAddress, 2)}</span>
              )}
            </span>
          </div>

          {/* IPFS CID Pill */}
          <div className="mt-3 flex items-center justify-between gap-2 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-slate-500 font-sans text-[10px] uppercase">CID</span>
              <span className="text-cyan-400 truncate">{formatCid(file.ipfsCid, 6)}</span>
            </div>
            <button
              onClick={copyCid}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
              title="Copy IPFS CID"
            >
              {copiedCid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {/* Owner Access Control & Sharing Manager Panel */}
          {isOwner && (
            <div className="mt-2.5">
              {file.accessControl.mode === 'private' ? (
                <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-900/60 space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="flex items-center gap-1 text-rose-300 font-semibold">
                      <Lock className="w-3 h-3 text-rose-400" />
                      <span>Private (Only You)</span>
                    </span>
                    <span className="text-[10px] text-rose-400 font-mono">Owner Locked</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Strictly locked to your owner wallet. Send a direct link to share.
                  </p>
                  <button
                    onClick={copyShareLink}
                    className="w-full py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
                    <span>{copiedLink ? 'Share Link Copied!' : 'Copy Direct Share Link'}</span>
                  </button>
                </div>
              ) : file.accessControl.mode === 'restricted' ? (
                <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-900/60 space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="flex items-center gap-1 text-amber-300 font-semibold">
                      <KeyRound className="w-3 h-3 text-amber-400" />
                      <span>Secret Code Protected</span>
                    </span>
                    <span className="text-[10px] text-amber-400/80 font-mono">Owner Access</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 font-mono text-[10px] text-amber-200 bg-slate-950/80 px-2 py-0.5 rounded border border-amber-900/40">
                    <span className="truncate">Code: {file.accessControl.uniqueAccessCode}</span>
                    <button onClick={copyCode} className="text-amber-400 hover:text-amber-200" title="Copy Secret Code">
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <button
                    onClick={copyShareLink}
                    className="w-full py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
                    <span>{copiedLink ? 'Share Link Copied!' : 'Copy Auto-Unlock Share Link'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-emerald-300">
                    <Globe className="w-3 h-3 text-emerald-400" />
                    <span>Public to Anyone</span>
                  </div>
                  <button
                    onClick={copyShareLink}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[10px] font-medium flex items-center gap-1 transition-colors"
                    title="Copy direct link to share with another person"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
                    <span>{copiedLink ? 'Copied!' : 'Share Link'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1">
          <button
            id={`btn-view-${file.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(file);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors"
          >
            {hasAccess ? (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Inspect & Get File</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Ask Secret Code to View</span>
              </>
            )}
          </button>

          {isOwner && (
            <>
              <button
                id={`btn-share-${file.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(file);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
                title="Manage Share & Access Control"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              <button
                id={`btn-transfer-${file.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onTransfer(file);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
                title="Transfer Complete Ownership"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            id={`btn-ai-${file.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onAnalyzeAi(file);
            }}
            className="p-1.5 rounded-lg text-violet-400 hover:text-violet-200 hover:bg-violet-950/60 border border-transparent hover:border-violet-800/50 transition-colors"
            title="Analyze with Cipher AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {/* Delete / Remove Button */}
          <button
            id={`btn-delete-${file.id}`}
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-colors"
            title="Remove from Vault & Watchlist"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

