import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Delete,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserAccount } from '../types';
import { formatAddress } from '../lib/crypto';

interface UnlockAccountModalProps {
  account: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onUnlocked?: (account: UserAccount) => void;
}

export const UnlockAccountModal: React.FC<UnlockAccountModalProps> = ({
  account,
  isOpen,
  onClose,
  onUnlocked,
}) => {
  const { verifyAndUnlockAccount } = useAuth();

  const [secretCode, setSecretCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlockMethod, setUnlockMethod] = useState<'pin' | 'mnemonic' | 'key'>('pin');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSecretCode('');
      setErrorMessage(null);
      setIsSuccess(false);
      setShowPassword(false);
    }
  }, [isOpen, account]);

  if (!isOpen || !account) return null;

  const handleKeypadPress = (digit: string) => {
    setErrorMessage(null);
    setSecretCode(prev => prev + digit);
  };

  const handleKeypadBackspace = () => {
    setErrorMessage(null);
    setSecretCode(prev => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setErrorMessage(null);
    setSecretCode('');
  };

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const input = secretCode.trim();
    if (!input) {
      setErrorMessage("Please enter the secret code or PIN to access this account.");
      return;
    }

    const result = verifyAndUnlockAccount(account.address, input);
    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        if (onUnlocked) {
          onUnlocked(account);
        }
        onClose();
      }, 500);
    } else {
      setErrorMessage(result.message || "Invalid secret code. Please verify and try again.");
    }
  };

  const demoPasscode = account.secretCode || "2026";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden my-6">
        
        {/* Top Gradient Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600" />

        {/* Modal Close Button */}
        <button
          id="close-unlock-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          
          {/* Header Title */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Unlock Saved Account</span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </h3>
              <p className="text-xs text-slate-400">
                Enter your secret code or PIN to authorize access.
              </p>
            </div>
          </div>

          {/* Target Account Badge */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 mb-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
              {account.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-200 truncate">
                {account.name}
              </div>
              <div className="text-xs text-slate-400 font-mono truncate">
                {account.address}
              </div>
              <div className="text-[11px] text-cyan-400/90 font-mono flex items-center gap-1.5 mt-0.5">
                <span>{formatAddress(account.address, 3)}</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400">{account.balanceEth} ETH</span>
              </div>
            </div>
          </div>

          {/* Quick Demo Helper Hint */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-300 mb-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Secret Code: <strong>{demoPasscode}</strong></span>
            </div>
            <button
              type="button"
              id="fill-demo-secret-code-btn"
              onClick={() => {
                setSecretCode(demoPasscode);
                setErrorMessage(null);
              }}
              className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-200 uppercase tracking-wider underline cursor-pointer"
            >
              Auto-Fill
            </button>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Enter Secret Code / Security PIN</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {secretCode.length > 0 ? `${secretCode.length} characters` : 'Required'}
                </span>
              </div>

              <div className="relative">
                <input
                  id="account-unlock-secret-input"
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  value={secretCode}
                  onChange={(e) => {
                    setSecretCode(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Enter Secret Code (e.g. 2026)"
                  className={`w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-slate-950 border font-mono text-sm tracking-wider focus:outline-none transition-colors ${
                    errorMessage
                      ? 'border-rose-500 text-rose-200'
                      : isSuccess
                      ? 'border-emerald-500 text-emerald-200'
                      : 'border-slate-800 text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                  }`}
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                    title={showPassword ? 'Hide code' : 'Show code'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {secretCode && (
                    <button
                      type="button"
                      onClick={handleKeypadClear}
                      className="p-1 text-slate-500 hover:text-slate-300 transition-colors text-xs"
                      title="Clear"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Error or Success Message */}
            {errorMessage && (
              <div className="p-2.5 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isSuccess && (
              <div className="p-2.5 bg-emerald-950/50 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Passcode verified! Loading decentralized vault...</span>
              </div>
            )}

            {/* Virtual PIN Keypad */}
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <div className="grid grid-cols-3 gap-1.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    type="button"
                    id={`keypad-btn-${num}`}
                    onClick={() => handleKeypadPress(num)}
                    className="py-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-200 font-mono text-sm font-semibold transition-all active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  id="keypad-btn-clear"
                  onClick={handleKeypadClear}
                  className="py-2.5 rounded-lg bg-slate-900/60 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/50 text-slate-400 hover:text-rose-300 text-xs font-semibold transition-all"
                >
                  Clear
                </button>
                <button
                  type="button"
                  id="keypad-btn-0"
                  onClick={() => handleKeypadPress('0')}
                  className="py-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-200 font-mono text-sm font-semibold transition-all active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  id="keypad-btn-backspace"
                  onClick={handleKeypadBackspace}
                  className="py-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center transition-all"
                  title="Backspace"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                id="cancel-unlock-btn"
                onClick={onClose}
                className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                id="submit-unlock-btn"
                disabled={isSuccess}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSuccess ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unlocked</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Verify & Unlock</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
