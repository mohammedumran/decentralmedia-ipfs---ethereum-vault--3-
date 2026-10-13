import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Lock,
  Unlock,
  X,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { MediaFile } from '../types';
import { useAuth } from '../context/AuthContext';
import { useDecentralMedia } from '../context/DecentralMediaContext';
import { formatAddress, formatBytes, formatCid } from '../lib/crypto';

interface SecretCodeUnlockModalProps {
  file: MediaFile | null;
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: (file: MediaFile) => void;
}

export const SecretCodeUnlockModal: React.FC<SecretCodeUnlockModalProps> = ({
  file,
  isOpen,
  onClose,
  onUnlocked,
}) => {
  const { currentUser } = useAuth();
  const { redeemAccessCode } = useDecentralMedia();

  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedUploaderCode, setCopiedUploaderCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputCode('');
      setErrorMsg(null);
      setIsVerifying(false);
    }
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const isOwner = currentUser
    ? file.ownerAddress.toLowerCase() === currentUser.address.toLowerCase()
    : false;

  const fileCode = file.accessControl?.uniqueAccessCode || '';

  const handleAutoFill = () => {
    if (fileCode) {
      setInputCode(fileCode);
      setErrorMsg(null);
    }
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileCode) {
      navigator.clipboard.writeText(fileCode);
      setCopiedUploaderCode(true);
      setTimeout(() => setCopiedUploaderCode(false), 2000);
    }
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputCode.trim();

    if (!cleanCode) {
      setErrorMsg('Please enter the 16-character Secret Access Code.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const res = await redeemAccessCode(cleanCode);
      if (res.success && res.file) {
        setIsVerifying(false);
        onUnlocked(res.file);
        onClose();
      } else {
        setIsVerifying(false);
        setErrorMsg(res.message || 'Invalid Secret Access Code. Please verify the code and try again.');
      }
    } catch (err: any) {
      setIsVerifying(false);
      setErrorMsg(err.message || 'Verification failed. Please check the code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3.5 shadow-lg shadow-amber-500/10">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Secret Code Required
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            This file is protected by a cryptographic Secret Access Code. Enter the code below to decrypt and view the media.
          </p>
        </div>

        {/* Target File Info */}
        <div className="my-4 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
          <div className="flex items-center justify-between font-medium">
            <span className="text-slate-200 truncate font-semibold">{file.name}</span>
            <span className="text-slate-400 font-mono text-[11px] shrink-0 ml-2">{formatBytes(file.sizeBytes)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono text-cyan-400 truncate">IPFS: {formatCid(file.ipfsCid)}</span>
            <span className="font-mono text-slate-500 shrink-0 ml-2">{formatAddress(file.ownerAddress, 3)}</span>
          </div>
        </div>

        {/* Uploader Helper Box (If this device uploaded the file) */}
        {isOwner && fileCode && (
          <div className="mb-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-cyan-300 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>You are the uploader of this file</span>
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-[10px] text-cyan-400 hover:text-cyan-200 font-mono flex items-center gap-1 cursor-pointer"
              >
                {copiedUploaderCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUploaderCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-950 border border-cyan-900/60 font-mono text-xs text-cyan-300">
              <span className="truncate">{fileCode}</span>
              <button
                type="button"
                onClick={handleAutoFill}
                className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-sans font-semibold shrink-0 cursor-pointer transition-colors"
              >
                Auto-fill
              </button>
            </div>
          </div>
        )}

        {/* Unlock Form */}
        <form onSubmit={handleUnlockSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Enter Secret Access Code:</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">16-char token</span>
            </label>
            <input
              type="text"
              autoFocus
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value.toUpperCase());
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="IPFS-SEC-XXXX-XXXX-XXXX"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-amber-300 font-mono text-xs placeholder:text-slate-600 outline-none transition-colors"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || !inputCode.trim()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{isVerifying ? 'Verifying...' : 'Unlock & View File'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
