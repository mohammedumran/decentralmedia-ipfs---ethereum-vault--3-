import React, { useState } from 'react';
import {
  X,
  ArrowRightLeft,
  ShieldAlert,
  User,
  Check,
  RefreshCw,
  Coins,
  AlertTriangle,
  Info
} from 'lucide-react';
import { MediaFile } from '../types';
import { useAuth } from '../context/AuthContext';
import { useDecentralMedia } from '../context/DecentralMediaContext';
import { formatAddress } from '../lib/crypto';

interface TransferOwnershipModalProps {
  file: MediaFile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransferOwnershipModal: React.FC<TransferOwnershipModalProps> = ({
  file,
  isOpen,
  onClose,
}) => {
  const { currentUser, allAccounts } = useAuth();
  const { transferOwnership } = useDecentralMedia();

  const [recipientInput, setRecipientInput] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('Permanent ownership handover to recipient');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !file) return null;

  const candidateAccounts = (allAccounts || []).filter(
    a => a && a.address && (!currentUser?.address || a.address.toLowerCase() !== currentUser.address.toLowerCase())
  );

  const handleTransfer = async () => {
    if (!recipientInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Please select or enter a recipient Ethereum address (0x...).' });
      return;
    }

    setIsTransferring(true);
    setStatusMessage(null);

    try {
      const result = await transferOwnership(file.id, recipientInput, transferReason);
      if (result.success) {
        setStatusMessage({ type: 'success', text: result.message });
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setStatusMessage({ type: 'error', text: result.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Transfer failed.' });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Transfer Complete Ownership</h2>
              <p className="text-xs text-slate-400">Irrevocable Smart Contract Ledger Handover</p>
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
        <div className="p-6 space-y-5 text-xs">
          
          {/* Target File Info */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200 text-sm truncate max-w-[280px]">{file.name}</div>
              <div className="text-[11px] font-mono text-cyan-400 mt-0.5">CID: {file.ipfsCid.slice(0, 16)}...</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase block">Current Owner</span>
              <span className="font-mono text-slate-300 font-medium">You ({formatAddress(currentUser.address, 2)})</span>
            </div>
          </div>

          {/* Critical Warning Banner */}
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Permanent Decentralized Handover</span>
            </div>
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              Transferring ownership will execute the <code className="font-mono text-amber-300">transferOwnership()</code> method on Ethereum. You will forfeit all owner modification rights and the media asset will reside under the recipient's decentralized vault.
            </p>
          </div>

          {/* Quick Select Recipient from Saved Accounts */}
          {candidateAccounts.length > 0 && (
            <div>
              <label className="font-bold text-slate-300 uppercase tracking-wider block mb-2 text-[10px]">
                Quick Select Known Web3 Member
              </label>
              <div className="space-y-1.5">
                {candidateAccounts.map(account => (
                  <button
                    key={account.address}
                    type="button"
                    onClick={() => setRecipientInput(account.address)}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-colors text-left ${
                      recipientInput.toLowerCase() === account.address.toLowerCase()
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-900/60 flex items-center justify-center font-bold text-white text-xs">
                        {account.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-200">{account.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{formatAddress(account.address, 4)}</div>
                      </div>
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {formatAddress(account.address, 3)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Or Manual Input */}
          <div>
            <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1 text-[10px]">
              Recipient Ethereum Address (0x...)
            </label>
            <input
              type="text"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              placeholder="0x71C... (42-character Ethereum address)"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1 text-[10px]">
              Transfer Ledger Memo (Optional)
            </label>
            <input
              type="text"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="e.g. Media license buyout or project transfer"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/60 border-rose-800 text-rose-300'
            }`}>
              {statusMessage.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gas: ~0.0035 ETH</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleTransfer}
              disabled={isTransferring || !recipientInput.trim()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all font-bold"
            >
              {isTransferring ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
              <span>Confirm & Transfer</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
