import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  ShieldCheck,
  KeyRound,
  User,
  Mail,
  Phone,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Coins,
  HardDrive,
  Blocks,
  FileCheck,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserAccount } from '../types';
import { formatAddress } from '../lib/crypto';

interface WelcomeRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const WelcomeRegisterModal: React.FC<WelcomeRegisterModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { createAccount, currentUser } = useAuth();

  // Registration step: 'welcome' -> 'register' -> 'credentials' (unique address & secret phrase reveal)
  const [step, setStep] = useState<'welcome' | 'register' | 'credentials'>('welcome');

  // Form Fields
  const [name, setName] = useState('Public Explorer');
  const [secretCode, setSecretCode] = useState('2026');
  const [formError, setFormError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generated Result
  const [newAccount, setNewAccount] = useState<UserAccount | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [hasSavedKeys, setHasSavedKeys] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = name.trim() || 'Decentralized Member';
    const cleanSecret = secretCode.trim() || '2026';

    setIsGenerating(true);

    setTimeout(() => {
      try {
        const created = createAccount(cleanName, cleanName, undefined, 5.0, cleanSecret);
        setNewAccount(created);
        setIsGenerating(false);
        setStep('credentials');
      } catch (err: any) {
        setFormError(err.message || 'Failed to generate Web3 wallet credentials.');
        setIsGenerating(false);
      }
    }, 600);
  };

  const handleFinish = () => {
    onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-500" />

        {/* STEP 1: WELCOME SCREEN */}
        {step === 'welcome' && (
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Header / Brand */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-violet-500/20 border border-cyan-500/30 text-cyan-400 shadow-xl shadow-cyan-500/10 mb-2">
                <Layers className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 via-indigo-200 to-violet-300 bg-clip-text text-transparent">
                  Welcome to saus
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                  The Decentralized IPFS Media Vault & EVM Protocol for censorship-resistant media storage, encrypted sharing, and immutable ownership.
                </p>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-200">Decentralized Vault</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Pin images and videos directly to IPFS swarm nodes with content identifiers.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-200">Zero-Knowledge Keys</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Generate your unique EVM address and 12-word cryptographic seed phrase.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-200">EVM Smart Ledger</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Every access rule, transfer, and whitelist update is verified on Ethereum.
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-2 space-y-3">
              <button
                id="welcome-create-account-btn"
                onClick={() => setStep('register')}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 hover:scale-[1.01] transition-all"
              >
                <span>Create Account & Get Unique Address</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-400">
                  Already have a profile or demo session?
                </span>
                <button
                  id="welcome-continue-guest-btn"
                  onClick={onClose}
                  className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2"
                >
                  Continue with Demo Account ({formatAddress(currentUser?.address, 3)})
                </button>
              </div>
            </div>

          </div>
        )}

        {/* STEP 2: REGISTRATION DASHBOARD FORM (Decentralized Web3 Identity & Passcode) */}
        {step === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-6 sm:p-8 space-y-5">
            
            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-800/80 text-cyan-400 text-[10px] font-semibold">
                  <Sparkles className="w-3 h-3" />
                  <span>Account Registration</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('welcome')}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Back
                </button>
              </div>
              <h2 className="text-xl font-bold text-slate-100 mt-2">
                Register Your saus Identity
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter your details below. A cryptographic Ethereum address, private key, and 12-word seed phrase will be minted for your decentralized vault.
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
                {formError}
              </div>
            )}

            {/* Inputs */}
            <div className="space-y-3.5">
              {/* Display Name / Web3 Alias */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Web3 Identity / Node Alias</span>
                </label>
                <input
                  id="reg-input-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Satoshi, CreativeVault, Public Explorer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 text-xs placeholder:text-slate-500 outline-none transition-colors"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Public decentralized label associated with your Ethereum address and IPFS pins.
                </span>
              </div>

              {/* Secret Access Code / PIN */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Secret Access Code / Security PIN</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Default: 2026</span>
                </label>
                <input
                  id="reg-input-secret-code"
                  type="text"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  placeholder="e.g. 2026 or PIN"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 text-xs font-mono placeholder:text-slate-500 outline-none transition-colors"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Required to unlock or switch this account on the main dashboard.
                </span>
              </div>
            </div>

            {/* Starter Gas Grant Notice */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-900/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Coins className="w-4 h-4" />
              </div>
              <div className="text-[11px] text-slate-300">
                <span className="font-semibold text-emerald-400">5.0 ETH Testnet Gas Grant:</span> Automatically credited to your new address to cover IPFS pinning and access control smart contract executions.
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('welcome')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              
              <button
                id="submit-register-btn"
                type="submit"
                disabled={isGenerating}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
              >
                {isGenerating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Minting Vault Keys...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Unique Address & Secret Keys</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}

        {/* STEP 3: REVEAL UNIQUE ADDRESS & SECRET PHRASE TO ACCESS ACCOUNT */}
        {step === 'credentials' && newAccount && (
          <div className="p-6 sm:p-8 space-y-5">
            
            {/* Success Header */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10 mb-1">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-100">
                Account Created Successfully!
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Here is your unique decentralized Ethereum address and 12-word secret recovery phrase. Save these credentials securely to access your vault anytime.
              </p>
            </div>

            {/* Profile Overview Card */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-slate-950 font-bold text-sm flex-shrink-0">
                  {newAccount.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">{newAccount.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{formatAddress(newAccount.address, 4)} • Web3 Verified Node</div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-xs font-bold text-emerald-400">{newAccount.balanceEth} ETH</div>
                <div className="text-[10px] text-slate-500">Starter Gas</div>
              </div>
            </div>

            {/* 1. Unique EVM Address */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Unique Decentralized Address (Public Identity)</span>
                </span>
                <button
                  onClick={() => handleCopy(newAccount.address, 'address')}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
                >
                  {copiedKey === 'address' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'address' ? 'Copied' : 'Copy Address'}</span>
                </button>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-cyan-900/50 font-mono text-xs text-cyan-300 break-all select-all flex items-center justify-between">
                <span>{newAccount.address}</span>
              </div>
            </div>

            {/* Secret Code / PIN */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Secret Access Code / Security PIN</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(newAccount.secretCode || "2026", 'secretCode')}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
                >
                  {copiedKey === 'secretCode' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'secretCode' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40 font-mono text-sm font-bold text-cyan-300 flex items-center justify-between">
                <span>{newAccount.secretCode || "2026"}</span>
                <span className="text-[10px] text-slate-400 font-sans font-normal">
                  Required to unlock on dashboard
                </span>
              </div>
            </div>

            {/* 2. 12-Word Secret Recovery Phrase */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-violet-400" />
                  <span>12-Word Secret Recovery Phrase (Seed)</span>
                </span>
                <button
                  onClick={() => handleCopy(newAccount.mnemonic, 'mnemonic')}
                  className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300"
                >
                  {copiedKey === 'mnemonic' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'mnemonic' ? 'Copied Phrase' : 'Copy Phrase'}</span>
                </button>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-violet-900/50">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {newAccount.mnemonic.split(' ').map((word, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-1.5 rounded-lg border border-slate-800 text-[11px]">
                      <span className="text-slate-500 font-mono text-[9px]">{idx + 1}.</span>
                      <span className="text-violet-200 font-mono font-medium">{word}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Raw Private Key (Collapsible) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Raw Private Key</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    {showPrivateKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPrivateKey ? 'Hide' : 'Reveal'}</span>
                  </button>
                  <button
                    onClick={() => handleCopy(newAccount.privateKey, 'privateKey')}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    {copiedKey === 'privateKey' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'privateKey' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              {showPrivateKey ? (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-amber-300 break-all select-all">
                  {newAccount.privateKey}
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-[11px] text-slate-600">
                  ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
                </div>
              )}
            </div>

            {/* Security Confirmation Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasSavedKeys}
                onChange={(e) => setHasSavedKeys(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-900"
              />
              <span className="text-[11px] text-slate-300">
                I have copied and safely stored my unique address and 12-word secret recovery phrase.
              </span>
            </label>

            {/* Finish & Launch Dashboard */}
            <button
              id="finish-welcome-btn"
              onClick={handleFinish}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01]"
            >
              <FileCheck className="w-4 h-4" />
              <span>Enter My Decentralized Vault</span>
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
