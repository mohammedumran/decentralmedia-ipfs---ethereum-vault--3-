import React, { useState } from 'react';
import {
  X,
  Share2,
  Lock,
  Globe,
  Users,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Coins,
  ShieldAlert
} from 'lucide-react';
import { MediaFile, AccessControlRule } from '../types';
import { useDecentralMedia } from '../context/DecentralMediaContext';
import { generateUniqueAccessCode } from '../lib/crypto';

interface ShareAndAccessModalProps {
  file: MediaFile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareAndAccessModal: React.FC<ShareAndAccessModalProps> = ({
  file,
  isOpen,
  onClose,
}) => {
  const { updateAccessControl, rotateAccessCode } = useDecentralMedia();

  const [mode, setMode] = useState<'public' | 'private' | 'restricted'>(
    file?.accessControl.mode || 'public'
  );
  const [allowedAddresses, setAllowedAddresses] = useState<string[]>(
    file?.accessControl.allowedAddresses || []
  );
  const [addressInput, setAddressInput] = useState<string>('');
  const [allowDownload, setAllowDownload] = useState<boolean>(
    file?.accessControl.allowDownload ?? true
  );

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentCode, setCurrentCode] = useState<string>(
    file?.accessControl.uniqueAccessCode || ''
  );

  if (!isOpen || !file) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const directShareUrl = `${origin}/?file=${file.id}&code=${currentCode || file.accessControl.uniqueAccessCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode || file.accessControl.uniqueAccessCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleQuickMakePublic = () => {
    setMode('public');
  };

  const handleRotate = async () => {
    setIsRotating(true);
    try {
      const newCode = await rotateAccessCode(file.id);
      setCurrentCode(newCode);
    } catch (e) {
      console.error("Rotate error:", e);
    } finally {
      setIsRotating(false);
    }
  };

  const handleAddAddress = () => {
    const trimmed = addressInput.trim();
    if (trimmed && !allowedAddresses.includes(trimmed)) {
      setAllowedAddresses([...allowedAddresses, trimmed]);
      setAddressInput('');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAccessControl(file.id, {
        mode,
        allowedAddresses,
        allowDownload,
      });
      onClose();
    } catch (err) {
      console.error("Failed to update access rules:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Access Control & Sharing</h2>
              <p className="text-xs text-slate-400 truncate max-w-xs">{file.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">

          {/* Direct Shareable Link (Auto-Unlock) */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/50 to-slate-950 border border-cyan-700/40 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-cyan-200 flex items-center gap-1.5 text-xs">
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span>Direct Shareable Link (Auto-Unlock for recipient)</span>
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied Link!' : 'Copy Share Link'}</span>
              </button>
            </div>

            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 select-all truncate">
              {directShareUrl}
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Send this link to anyone on WhatsApp, Telegram, email, or Discord. Opening this link will automatically unlock and stream the media file on their device!
            </p>
          </div>

          {/* Access Permissions Advice Banner */}
          {mode === 'private' ? (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/70 text-rose-200 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs block text-rose-200">
                      Why can another person not access this file?
                    </span>
                    <p className="text-[11px] text-rose-300/90 mt-0.5 leading-normal">
                      This file is set to <strong className="text-white">"Private (Owner Only)"</strong>. In Private mode, only your connected wallet address can view it. Another person or device will see a locked screen.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleQuickMakePublic}
                  className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex-shrink-0 shadow-sm transition-colors"
                >
                  Make Public Now
                </button>
              </div>
            </div>
          ) : mode === 'restricted' ? (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/70 text-amber-200 space-y-1">
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-xs block text-amber-200">
                    Restricted Mode: Access Code or Whitelist Required
                  </span>
                  <p className="text-[11px] text-amber-300/90 mt-0.5 leading-normal">
                    Another person can only view this file if you give them your <strong className="text-white">Secret Access Code</strong>, send them the Direct Share Link above, or whitelist their Ethereum address (0x...) below.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-200">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-[11px] text-emerald-300">
                  <strong className="text-white">Public Mode:</strong> Anyone on the network, any device, or anyone with the link can view, stream, and download this media asset freely!
                </span>
              </div>
            </div>
          )}

          {/* Unique Access Code Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/70 to-slate-950 border border-indigo-700/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-indigo-200 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <span>Unique Secret Access Code</span>
              </span>
              <button
                type="button"
                onClick={handleRotate}
                disabled={isRotating}
                className="text-[11px] text-indigo-400 hover:text-indigo-200 flex items-center gap-1 font-mono disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} />
                <span>Rotate Secret Key</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950 border border-indigo-900/60 font-mono text-sm font-bold text-indigo-300">
              <span className="tracking-wider truncate">{currentCode || file.accessControl.uniqueAccessCode}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 rounded-md bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200"
                title="Copy Access Code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-slate-400 text-[11px]">
              Share this secret code with any trusted user or client. They can paste it in the "Redeem by Code" portal to instantly stream and decrypt this media file.
            </p>
          </div>

          {/* Access Mode Selector */}
          <div>
            <label className="font-bold text-slate-300 uppercase tracking-wider block mb-2 text-[10px]">
              Smart Contract Access Mode
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'public', label: 'Public', desc: 'Open to everyone', icon: Globe },
                { id: 'restricted', label: 'Restricted', desc: 'Whitelist + Code', icon: Users },
                { id: 'private', label: 'Private', desc: 'Owner only', icon: Lock },
              ].map(item => {
                const Icon = item.icon;
                const isSelected = mode === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setMode(item.id as any)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all text-center ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/60 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    <div className="font-semibold text-xs">{item.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Whitelisted Ethereum Addresses */}
          <div className="space-y-2">
            <label className="font-bold text-slate-300 uppercase tracking-wider block text-[10px]">
              Whitelisted Ethereum Addresses ({allowedAddresses.length})
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="Enter 0x... address"
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddAddress}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
              >
                Add
              </button>
            </div>
            {allowedAddresses.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-28 overflow-y-auto">
                {allowedAddresses.map((addr, idx) => (
                  <span key={idx} className="px-2 py-1 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 flex items-center gap-1.5">
                    <span>{addr.slice(0, 10)}...{addr.slice(-6)}</span>
                    <button type="button" onClick={() => setAllowedAddresses(allowedAddresses.filter((_, i) => i !== idx))}>
                      <X className="w-3 h-3 text-slate-400 hover:text-rose-400" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gas: ~0.0014 ETH</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Save & Update Contract</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
