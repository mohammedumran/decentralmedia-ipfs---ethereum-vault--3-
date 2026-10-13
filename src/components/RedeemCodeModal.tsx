import React, { useState } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  Play,
  Eye,
  Check,
  AlertCircle,
  ExternalLink,
  Download,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import { useDecentralMedia } from '../context/DecentralMediaContext';
import { MediaFile } from '../types';
import { formatBytes, formatCid } from '../lib/crypto';

interface RedeemCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: MediaFile) => void;
}

export const RedeemCodeModal: React.FC<RedeemCodeModalProps> = ({
  isOpen,
  onClose,
  onSelectFile,
}) => {
  const { redeemAccessCode, mediaFiles } = useDecentralMedia();

  const [codeInput, setCodeInput] = useState<string>('');
  const [unlockedFile, setUnlockedFile] = useState<MediaFile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleRedeem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setUnlockedFile(null);

    const result = await redeemAccessCode(codeInput);
    if (result.success && result.file) {
      setUnlockedFile(result.file);
      setSuccessMessage(result.message);
    } else {
      setErrorMessage(result.message);
    }
  };

  const sampleCodes = React.useMemo(() => {
    const list: { label: string; code: string }[] = [];
    mediaFiles.forEach((f) => {
      const name = f.name?.toLowerCase() || '';
      const isLegacy = f.id === 'med-nebula-4k-core' || name.includes('nebula') || name.includes('cosmic');
      if (f.accessControl?.uniqueAccessCode && !isLegacy) {
        list.push({
          label: `${f.name} (${f.accessControl.mode === 'public' ? 'Public' : 'Restricted'})`,
          code: f.accessControl.uniqueAccessCode,
        });
      }
    });
    return list.slice(0, 4);
  }, [mediaFiles]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Redeem Secret Access Code</h2>
              <p className="text-xs text-slate-400">Access Protected Media on IPFS & Smart Contract Registry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          
          <p className="text-slate-300 leading-relaxed">
            Enter the unique secret access code or IPFS CID shared with you by the media owner to authenticate and unlock streaming access.
          </p>

          {/* Form */}
          <form onSubmit={handleRedeem} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Paste IPFS-SEC-XXXX-XXXX-XXXX or CID..."
                className="w-full pl-3 pr-24 py-2.5 rounded-xl bg-slate-950 border border-indigo-900/60 focus:border-indigo-500 focus:outline-none font-mono text-sm text-indigo-200 tracking-wider placeholder:text-slate-600"
                autoFocus
              />
              <button
                type="submit"
                disabled={!codeInput.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow disabled:opacity-40 transition-colors"
              >
                Unlock
              </button>
            </div>
          </form>

          {/* Sample quick-test buttons */}
          {sampleCodes.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                Quick Test Sample Secret Codes:
              </span>
              <div className="space-y-1.5">
                {sampleCodes.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={async () => {
                      setCodeInput(item.code);
                      const res = await redeemAccessCode(item.code);
                      if (res.success && res.file) {
                        setUnlockedFile(res.file);
                        setSuccessMessage(res.message);
                        setErrorMessage('');
                      } else {
                        setErrorMessage(res.message);
                      }
                    }}
                    className="w-full p-2 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-left flex items-center justify-between transition-colors group"
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold text-slate-300 group-hover:text-cyan-300 transition-colors">{item.label}</div>
                      <div className="font-mono text-[10px] text-indigo-400">{item.code}</div>
                    </div>
                    <span className="text-[10px] text-cyan-400 flex items-center gap-1 font-semibold flex-shrink-0">
                      <span>Try</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Unlocked File Result Card */}
          {unlockedFile && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-700/50 space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Media Successfully Unlocked!</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-16 h-12 rounded-lg bg-black overflow-hidden flex-shrink-0 border border-slate-800">
                  {(() => {
                    const validThumb = unlockedFile.thumbnailUrl && unlockedFile.thumbnailUrl.trim() !== '' ? unlockedFile.thumbnailUrl : null;
                    const validMedia = unlockedFile.url && unlockedFile.url.trim() !== '' ? unlockedFile.url : null;
                    const displaySrc = validThumb || validMedia;

                    return displaySrc ? (
                      <img
                        src={displaySrc}
                        alt={unlockedFile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-emerald-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                    );
                  })()}
                  {unlockedFile.type === 'video' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-100 truncate">{unlockedFile.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {formatBytes(unlockedFile.sizeBytes)} • {unlockedFile.metadata.resolution || unlockedFile.type.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/80">
                <a
                  href={unlockedFile.url}
                  download={unlockedFile.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => {
                    onSelectFile(unlockedFile);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open & Stream Media</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
