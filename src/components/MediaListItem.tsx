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
  Eye,
  Bookmark,
  Trash2
} from 'lucide-react';
import { MediaFile } from '../types';
import { useAuth } from '../context/AuthContext';
import { useDecentralMedia } from '../context/DecentralMediaContext';
import { formatAddress, formatBytes, formatCid } from '../lib/crypto';

interface MediaListItemProps {
  file: MediaFile;
  onSelect: (file: MediaFile) => void;
  onShare: (file: MediaFile) => void;
  onTransfer: (file: MediaFile) => void;
  onAnalyzeAi: (file: MediaFile) => void;
  onTogglePin: (file: MediaFile) => void;
}

export const MediaListItem: React.FC<MediaListItemProps> = ({
  file,
  onSelect,
  onShare,
  onTransfer,
  onAnalyzeAi,
  onTogglePin,
}) => {
  const { currentUser } = useAuth();
  const { toggleWatchlist, isWatchlisted, deleteFile, checkFileAccess, isUnlocked } = useDecentralMedia();
  const [copiedCid, setCopiedCid] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [file.id, file.url]);

  const { hasAccess, isOwner } = checkFileAccess(file);
  const isVideo = file.type === 'video';
  const inWatchlist = isWatchlisted(file.id);

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

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatchlist(file.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteFile(file.id);
  };

  return (
    <div
      id={`media-list-item-${file.id}`}
      onClick={() => onSelect(file)}
      className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all cursor-pointer"
    >
      {/* Thumbnail + Title info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="relative w-16 h-12 rounded-lg bg-slate-950 overflow-hidden flex-shrink-0 border border-slate-800 flex items-center justify-center">
          {!hasAccess ? (
            <div className="w-full h-full bg-slate-950 flex items-center justify-center text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
          ) : (
            <>
              {(() => {
                const validThumbnail = file.thumbnailUrl && file.thumbnailUrl.trim() !== '' ? file.thumbnailUrl : null;
                const validUrl = file.url && file.url.trim() !== '' ? file.url : null;
                const displaySrc = validThumbnail || validUrl;

                return displaySrc && !imageError ? (
                  <img
                    src={displaySrc}
                    alt={file.name}
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500 font-mono text-[10px]">
                    MEDIA
                  </div>
                );
              })()}
              {isVideo && (
                <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                </div>
              )}
            </>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
              {file.name}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
              {file.metadata.resolution || file.type.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-400">
            <span>{formatBytes(file.sizeBytes)}</span>
            <span>•</span>
            <span>{new Date(file.uploadTimestamp).toLocaleDateString()}</span>
            <span>•</span>
            <span className="truncate max-w-[130px]">
              {isOwner ? <span className="text-cyan-400">Owned by You</span> : formatAddress(file.ownerAddress, 2)}
            </span>
          </div>
        </div>
      </div>

      {/* CID and Unique Access Code info */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
        
        {/* CID badge */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs font-mono">
          <span className="text-slate-500 text-[10px]">CID</span>
          <span className="text-cyan-400">{formatCid(file.ipfsCid, 4)}</span>
          <button
            onClick={copyCid}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
            title="Copy CID"
          >
            {copiedCid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        {/* Unique Access Code: ONLY visible to Owner */}
        {isOwner && (
          <div className="hidden lg:flex items-center gap-1.5 bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-900/50 text-xs font-mono">
            <span className="text-indigo-400 text-[10px]">Code</span>
            <span className="text-indigo-200 truncate max-w-[120px]">{file.accessControl.uniqueAccessCode}</span>
            <button
              onClick={copyCode}
              className="p-1 hover:bg-indigo-900/60 rounded text-indigo-400 hover:text-indigo-200"
              title="Copy Access Code"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        )}

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {/* Watchlist Toggle */}
          <button
            id={`btn-list-watchlist-${file.id}`}
            onClick={handleToggleWatchlist}
            className={`p-2 rounded-lg transition-colors ${
              inWatchlist
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'hover:bg-slate-800 text-slate-400 hover:text-amber-300'
            }`}
            title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
          >
            <Bookmark className={`w-4 h-4 ${inWatchlist ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(file);
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Inspect Media"
          >
            <Eye className="w-4 h-4" />
          </button>

          {isOwner && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(file);
                }}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                title="Share & Access Control"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTransfer(file);
                }}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors"
                title="Transfer Complete Ownership"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAnalyzeAi(file);
            }}
            className="p-2 rounded-lg hover:bg-violet-950/60 text-violet-400 hover:text-violet-200 transition-colors"
            title="Analyze with AI"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            id={`btn-list-delete-${file.id}`}
            onClick={handleDelete}
            className="p-2 rounded-lg hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-colors"
            title="Delete / Remove from Vault"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
