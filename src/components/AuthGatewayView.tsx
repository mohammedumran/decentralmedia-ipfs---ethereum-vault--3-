import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  UserPlus,
  LogIn,
  FileCode2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Database,
  Globe,
  Upload,
  ArrowRight,
  HardDrive,
  FolderLock,
  User,
  AlertCircle,
  Lock,
  Key,
  ChevronDown,
  ChevronUp,
  Server,
  FileText,
  CheckCircle2,
  Play,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDecentralMedia } from '../context/DecentralMediaContext';
import { generateEthereumWallet, formatAddress, formatCid } from '../lib/crypto';
import { UserAccount, MediaFile } from '../types';
import { UnlockAccountModal } from './UnlockAccountModal';

interface AuthGatewayViewProps {
  onOpenUpload?: () => void;
  onOpenRedeem?: () => void;
  onExplorePublic?: () => void;
  onSelectFile?: (file: MediaFile) => void;
}

export const AuthGatewayView: React.FC<AuthGatewayViewProps> = ({
  onOpenUpload,
  onOpenRedeem,
  onExplorePublic,
  onSelectFile,
}) => {
  const {
    allAccounts,
    loginWithEmail,
    createAccount,
    importAccountByPrivateKey,
    importAccountByMnemonic,
    switchAccount,
    currentUser,
    logoutAccount,
    verifyAndUnlockAccount,
  } = useAuth();
  const { redeemAccessCode, setSelectedFile, mediaFiles, hostNodes } = useDecentralMedia();

  // Mode: 'login' | 'create' | 'import-key' | 'import-file'
  const [activeMode, setActiveMode] = useState<'create' | 'login' | 'import-file' | 'import-key'>('create');

  // Saved Account Unlock Modal State
  const [accountToUnlock, setAccountToUnlock] = useState<UserAccount | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registration Form
  const [regName, setRegName] = useState('');
  const [regSecretCode, setRegSecretCode] = useState('2026');
  const [regError, setRegError] = useState<string | null>(null);
  const [isGeneratingAccount, setIsGeneratingAccount] = useState(false);

  // Key Generation Review State (after creating account)
  const [generatedAccount, setGeneratedAccount] = useState<UserAccount | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [hasConfirmedBackup, setHasConfirmedBackup] = useState(false);
  const [vaultAccessCode, setVaultAccessCode] = useState('');
  const [vaultAccessError, setVaultAccessError] = useState<string | null>(null);

  // Import Key Form
  const [importKeyType, setImportKeyType] = useState<'privateKey' | 'mnemonic'>('privateKey');
  const [rawSecretKey, setRawSecretKey] = useState('');
  const [importName, setImportName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Import / Redeem File Form
  const [filePasscode, setFilePasscode] = useState('');
  const [fileRedeemResult, setFileRedeemResult] = useState<{ success: boolean; message: string; file?: MediaFile } | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Copy feedback state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Handle Login
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    const input = loginEmail.trim();
    if (!input) {
      setLoginError("Please enter your Ethereum Address (0x...) or saved Alias.");
      return;
    }
    
    // Check if account already exists
    const existing = allAccounts.find(
      a => a.address.toLowerCase() === input.toLowerCase() ||
           a.name.toLowerCase() === input.toLowerCase() ||
           (a.email && a.email.toLowerCase() === input.toLowerCase())
    );
    if (existing) {
      // Prompt for secret code verification!
      setAccountToUnlock(existing);
      setIsUnlockModalOpen(true);
      return;
    }

    const account = loginWithEmail(input);
    if (account) {
      if (onExplorePublic) onExplorePublic();
    } else {
      setLoginError("Could not initialize account. Please try again.");
    }
  };

  // Instant Demo Explorer Login
  const handleInstantDemoLogin = () => {
    const demo = allAccounts[0] || loginWithEmail("Public Explorer");
    if (demo) {
      switchAccount(demo.address);
      if (onExplorePublic) onExplorePublic();
    }
  };

  // Handle Create Account
  const handleStartCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setVaultAccessCode('');
    setVaultAccessError(null);
    const alias = regName.trim() || 'Creator Vault';
    setIsGeneratingAccount(true);

    setTimeout(() => {
      try {
        const created = createAccount(
          alias,
          alias,
          undefined,
          5.0,
          regSecretCode.trim() || "2026"
        );
        setGeneratedAccount(created);
        logoutAccount();
      } catch (err: any) {
        setRegError(err?.message || "Failed to generate cryptographic account.");
      } finally {
        setIsGeneratingAccount(false);
      }
    }, 450);
  };

  const handleEnterCreatedVault = () => {
    if (!generatedAccount) return;

    const result = verifyAndUnlockAccount(generatedAccount.address, vaultAccessCode);
    if (!result.success) {
      setVaultAccessError(result.message || 'Invalid access code. Please try again.');
      return;
    }

    setGeneratedAccount(null);
    if (onExplorePublic) onExplorePublic();
  };

  // Handle Import Account via Key
  const handleImportAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    const input = rawSecretKey.trim();
    if (!input) {
      setImportError("Please enter your Private Key or 12-Word Secret Recovery Phrase.");
      return;
    }

    try {
      if (importKeyType === 'mnemonic' || input.split(/\s+/).length >= 10) {
        importAccountByMnemonic(
          input,
          importName.trim() || undefined,
          undefined,
          undefined,
          "2026"
        );
      } else {
        importAccountByPrivateKey(
          input,
          importName.trim() || undefined,
          undefined,
          undefined,
          "2026"
        );
      }
      if (onExplorePublic) onExplorePublic();
    } catch (err: any) {
      setImportError("Invalid secret key or mnemonic format. Please check and retry.");
    }
  };

  // Handle Redeem File by Passcode
  const handleRedeemPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileRedeemResult(null);
    const code = filePasscode.trim();
    if (!code) {
      setFileRedeemResult({ success: false, message: "Please enter a secret key or access code." });
      return;
    }
    setIsRedeeming(true);
    try {
      const result = await redeemAccessCode(code);
      setFileRedeemResult(result);
      if (result.success && result.file) {
        setSelectedFile(result.file);
        if (onSelectFile) {
          onSelectFile(result.file);
        }
      }
    } finally {
      setIsRedeeming(false);
    }
  };

  // Pinned media preview item (first real stored file)
  const featuredFile = mediaFiles[0];

  const faqs = [
    {
      q: "How do unique secret codes work?",
      a: "Every media file uploaded to the decentralized cluster can have an access mode: Public, Private, or Restricted. For restricted files, a 16-character cryptographic code (e.g. IPFS-SEC-XXXX-XXXX-XXXX) is generated. Anyone with this unique code can unlock and stream the media without having to ask for owner permissions.",
    },
    {
      q: "Can anyone access my private files without my consent?",
      a: "No. When an asset is marked as Private, access is cryptographically locked exclusively to your Ethereum address. Even if someone knows the raw IPFS CID, the access gate enforces cryptographic ACL verification on both the client and cluster nodes.",
    },
    {
      q: "What makes IPFS storage different from regular cloud hosting?",
      a: "Traditional cloud storage relies on location addresses (e.g., https://server.com/my-photo.jpg). If the server fails or deletes the file, it's gone. IPFS uses content addressing: files are identified by their unique cryptographic hash (CID). They are replicated across multiple swarm nodes, making them tamper-proof and censorship-resistant.",
    },
    {
      q: "Do I need real cryptocurrency to store or share files?",
      a: "No. The vault runs on Ethereum Sepolia testnet with zero real-money cost. Upon vault creation, you are automatically airdropped 5.0 ETH of testnet gas to execute smart contract operations, access control updates, and ownership handovers.",
    },
  ];

  return (
    <div className="w-full space-y-16 py-4 animate-in fade-in duration-300">

      {/* 1. EMERGE HERO SECTION */}
      <section aria-label="Welcome Overview" className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-10 lg:p-12 shadow-2xl overflow-hidden">
        
        {/* Subtle Ambient Glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-5">
          
          {/* Unboxed Metadata Protocol Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 text-xs font-semibold tracking-wide shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Decentralized Media Protocol · IPFS DAG-PB + Ethereum Sepolia</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Decentralized Media Vault for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-400">High-Value Assets</span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Store, stream, encrypt, and share photos, 4K videos, and raw assets across distributed IPFS cluster nodes with cryptographic ownership and secret access codes. No centralized cloud lock-in.
          </p>

          {/* Quick Action Launchers Bar */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            
            {/* Primary Instant Explorer Button */}
            {onExplorePublic && (
              <button
                id="hero-launch-vault-btn"
                onClick={onExplorePublic}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Globe className="w-4 h-4 text-slate-950" />
                <span>Launch Public Vault (Instant Demo)</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            )}

            {/* Create Vault Button */}
            <button
              id="hero-create-vault-btn"
              onClick={() => {
                setActiveMode('create');
                const target = document.getElementById('auth-interactive-card');
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700 hover:border-slate-600 text-sm font-semibold transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-cyan-400" />
              <span>Create Free Vault</span>
            </button>

            {/* Redeem Code Button */}
            <button
              id="hero-redeem-code-btn"
              onClick={() => {
                setActiveMode('import-file');
                const target = document.getElementById('auth-interactive-card');
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 text-sm font-medium transition-all cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>Redeem Secret Code</span>
            </button>
          </div>

          {/* Live Network Invariants Ticker */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{hostNodes.length} Swarm Nodes Online</span>
            </span>
            <span aria-hidden="true" className="text-slate-600 hidden sm:inline">·</span>
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sepolia Smart Contract ACL</span>
            </span>
            <span aria-hidden="true" className="text-slate-600 hidden sm:inline">·</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Zero-Knowledge Secret Codes</span>
            </span>
          </div>

        </div>
      </section>

      {/* 2. WOW-LOOKING INTERACTIVE SIGN IN & SIGN UP GATEWAY CARD */}
      <section id="auth-interactive-card" aria-label="Authentication & Vault Entry" className="max-w-3xl mx-auto">
        
        {/* If user just created an account and is reviewing generated keys */}
        {generatedAccount ? (
          <div className="bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl animate-in fade-in zoom-in duration-300">
            
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    Vault Minted Successfully
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your unique cryptographic address and secret recovery phrase have been initialized on-chain.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-mono font-medium">
                +5.0 ETH Gas Airdropped
              </span>
            </div>

            {/* Profile Overview Card */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 mb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">Web3 Node Alias</span>
                  <span className="text-slate-200 font-medium truncate block">{generatedAccount.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">Testnet Gas Balance</span>
                  <span className="text-emerald-400 font-mono font-medium truncate block">{generatedAccount.balanceEth} ETH</span>
                </div>
              </div>
            </div>

            {/* Unique Ethereum Address */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Unique EVM Address</span>
                </label>
                <button
                  id="copy-generated-address-btn"
                  onClick={() => copyToClipboard(generatedAccount.address, 'address')}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors font-mono cursor-pointer"
                >
                  {copiedField === 'address' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Address</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-100 flex items-center justify-between select-all break-all">
                <span>{generatedAccount.address}</span>
              </div>
            </div>

            {/* Account Secret Access Code / PIN */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Vault Access Code / Security PIN</span>
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedAccount.secretCode || "2026", 'secretCode')}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors font-mono cursor-pointer"
                >
                  {copiedField === 'secretCode' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Code Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-3 bg-slate-950 border border-cyan-500/40 rounded-xl font-mono text-sm font-bold text-cyan-300 flex items-center justify-between">
                <span>{generatedAccount.secretCode || "2026"}</span>
                <span className="text-[10px] text-slate-400 font-sans font-normal">
                  Required when switching or unlocking this vault on the dashboard
                </span>
              </div>
            </div>

            {/* 12-Word Secret Recovery Seed Phrase */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FolderLock className="w-3.5 h-3.5 text-amber-400" />
                  <span>12-Word Secret Recovery Phrase (Seed)</span>
                </label>
                <button
                  id="copy-generated-mnemonic-btn"
                  onClick={() => copyToClipboard(generatedAccount.mnemonic, 'mnemonic')}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-mono cursor-pointer"
                >
                  {copiedField === 'mnemonic' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Phrase Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy 12 Words</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-slate-950/90 border border-amber-900/40 rounded-xl p-3.5">
                {generatedAccount.mnemonic.split(/\s+/).map((word, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-mono">
                    <span className="text-slate-500 text-[10px] w-3">{idx + 1}.</span>
                    <span className="text-amber-200 font-semibold">{word}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Store this phrase offline. It allows you to restore full access to all your files and encrypted keys.
              </p>
            </div>

            {/* Raw Private Key (Collapsible) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1.5">
                <button
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPrivateKey ? 'Hide Raw Private Key' : 'Reveal Raw Private Key'}</span>
                </button>
                {showPrivateKey && (
                  <button
                    onClick={() => copyToClipboard(generatedAccount.privateKey, 'privateKey')}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 font-mono cursor-pointer"
                  >
                    {copiedField === 'privateKey' ? 'Copied Key!' : 'Copy Key'}
                  </button>
                )}
              </div>
              {showPrivateKey && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 break-all select-all">
                  {generatedAccount.privateKey}
                </div>
              )}
            </div>

            {/* Backup Confirmation Checkbox */}
            <label className="flex items-start gap-2.5 mb-6 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 cursor-pointer hover:bg-slate-950 transition-colors">
              <input
                id="backup-confirm-checkbox"
                type="checkbox"
                checked={hasConfirmedBackup}
                onChange={(e) => setHasConfirmedBackup(e.target.checked)}
                className="mt-0.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                I have securely saved my unique address and 12-word secret phrase. I understand that decentralized keys cannot be recovered by centralized third parties.
              </span>
            </label>

            <div className="mb-4 space-y-1.5">
              <label htmlFor="new-vault-access-code" className="text-xs font-semibold text-slate-300">
                Enter your vault access code / PIN to continue
              </label>
              <input
                id="new-vault-access-code"
                type="password"
                autoComplete="one-time-code"
                value={vaultAccessCode}
                onChange={(e) => {
                  setVaultAccessCode(e.target.value);
                  setVaultAccessError(null);
                }}
                placeholder="Enter your PIN (default: 2026)"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:outline-none text-slate-100 text-sm font-mono"
              />
              {vaultAccessError && (
                <p role="alert" className="text-xs text-rose-300">{vaultAccessError}</p>
              )}
            </div>

            {/* Enter Vault Button */}
            <button
              id="finish-enter-vault-btn"
              disabled={!hasConfirmedBackup || !vaultAccessCode.trim()}
              onClick={handleEnterCreatedVault}
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                hasConfirmedBackup && vaultAccessCode.trim()
                  ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 shadow-cyan-500/25 scale-[1.01]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <span>Enter Decentralized Vault</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>
        ) : (

          /* Main Auth Selection Hub */
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl">

            {/* Main Tabs Navigation */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-950/90 rounded-xl border border-slate-800 mb-6">
              
              <button
                id="auth-tab-create"
                onClick={() => { setActiveMode('create'); setRegError(null); }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeMode === 'create'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Vault</span>
              </button>

              <button
                id="auth-tab-login"
                onClick={() => { setActiveMode('login'); setLoginError(null); }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeMode === 'login'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Unlock</span>
              </button>

              <button
                id="auth-tab-import-file"
                onClick={() => { setActiveMode('import-file'); setFileRedeemResult(null); }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeMode === 'import-file'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>Redeem Code</span>
              </button>

              <button
                id="auth-tab-import-key"
                onClick={() => { setActiveMode('import-key'); setImportError(null); }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeMode === 'import-key'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Import Key</span>
              </button>

            </div>

            {/* TAB 1: CREATE ACCOUNT (REGISTRATION) */}
            {activeMode === 'create' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-cyan-400" />
                    Mint Your Decentralized Media Vault
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Choose a vault name to immediately generate a cryptographic Ethereum keypair, unique address, and 12-word recovery seed phrase.
                  </p>
                </div>

                {regError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <form onSubmit={handleStartCreate} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Vault Alias / Web3 Identity Name
                      </label>
                      <div className="flex items-center gap-1.5">
                        {['CreatorVault', 'StudioDirector', 'PersonalVault'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setRegName(preset)}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 transition-colors cursor-pointer"
                          >
                            +{preset}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative">
                      <User className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-name-input"
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. CreatorVault, PersonalArchival, StudioTeam"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Security Passcode / PIN</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Default: 2026</span>
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-secret-code-input"
                        type="text"
                        value={regSecretCode}
                        onChange={(e) => setRegSecretCode(e.target.value)}
                        placeholder="e.g. 2026 or secret PIN"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm font-mono focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      You will use this passcode to unlock your saved account when returning.
                    </p>
                  </div>

                  {/* Minting Specifications Box */}
                  <div className="p-3.5 bg-cyan-950/20 border border-cyan-800/40 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Included with Your Free Vault:</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 pt-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>+5.0 ETH Testnet Gas</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>10 GB IPFS Pin Quota</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Client-Side Keys</span>
                      </div>
                    </div>
                  </div>

                  <button
                    id="submit-register-account-btn"
                    type="submit"
                    disabled={isGeneratingAccount}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <KeyRound className="w-4 h-4 text-slate-950" />
                    <span>{isGeneratingAccount ? 'Generating On-Chain Identity...' : 'Generate & Enter Vault'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: LOG IN */}
            {activeMode === 'login' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <LogIn className="w-4 h-4 text-cyan-400" />
                      Connect Existing Web3 Vault
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Connect via saved local account, or input your Ethereum address (0x...).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleInstantDemoLogin}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    title="Sign in immediately with the public demo explorer account"
                  >
                    1-Click Demo Login
                  </button>
                </div>

                {loginError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Ethereum Wallet Address or Alias
                    </label>
                    <div className="relative">
                      <Database className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="login-email-input"
                        type="text"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="0x71C... or Public Explorer"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono placeholder-slate-500 text-xs focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    id="submit-login-btn"
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-slate-950" />
                    <span>Connect Vault</span>
                  </button>
                </form>

                {/* Saved Profiles Quick Select */}
                {allAccounts.length > 0 && (
                  <div className="pt-4 border-t border-slate-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] uppercase font-semibold text-slate-400 flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-cyan-400" />
                        <span>Saved Accounts on this Device</span>
                      </span>
                      <span className="text-[10px] text-cyan-400/80 font-mono">
                        PIN Required
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {allAccounts.map(acc => (
                        <button
                          key={acc.address}
                          type="button"
                          id={`saved-account-quick-login-${acc.address.slice(0, 6)}`}
                          onClick={() => {
                            setAccountToUnlock(acc);
                            setIsUnlockModalOpen(true);
                          }}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-cyan-500/60 text-left transition-all group relative cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-inner">
                            {acc.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 truncate flex items-center gap-1.5">
                              <span>{acc.name}</span>
                              <Lock className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              {formatAddress(acc.address, 4)} • {acc.balanceEth} ETH
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/50 px-2 py-1 rounded-md border border-cyan-800/40 group-hover:border-cyan-500/60 transition-colors">
                            <span>Unlock</span>
                            <ArrowRight className="w-3 h-3 text-cyan-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: REDEEM / IMPORT FILE WITH SECRET ACCESS CODE */}
            {activeMode === 'import-file' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-cyan-400" />
                    Redeem & Stream Media with Secret Access Code
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter any 16-character secret code (or IPFS CID) to instantly unlock and view files stored on the server cluster.
                  </p>
                </div>

                {fileRedeemResult && (
                  <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    fileRedeemResult.success
                      ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
                      : 'bg-rose-950/50 border-rose-800 text-rose-300'
                  }`}>
                    {fileRedeemResult.success ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{fileRedeemResult.message}</div>
                      {fileRedeemResult.file && (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-emerald-300 font-mono">
                            {fileRedeemResult.file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectFile && fileRedeemResult.file) {
                                onSelectFile(fileRedeemResult.file);
                              }
                            }}
                            className="px-2.5 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] transition-colors cursor-pointer"
                          >
                            Open Media Stage
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={handleRedeemPasscode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Secret Access Code / IPFS CID
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="redeem-passcode-input"
                        type="text"
                        required
                        value={filePasscode}
                        onChange={(e) => setFilePasscode(e.target.value)}
                        placeholder="e.g. IPFS-SEC-6926-4CC1-8243"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 font-mono text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    id="submit-redeem-file-btn"
                    type="submit"
                    disabled={isRedeeming}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FileCode2 className="w-4 h-4 text-slate-950" />
                    <span>{isRedeeming ? 'Verifying with IPFS Cluster...' : 'Redeem & Unlock File'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 4: IMPORT ACCOUNT USING SECRET KEY */}
            {activeMode === 'import-key' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    Import Account with Private Key / Seed Phrase
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Restore access to an existing Web3 wallet by entering your 64-character private key or 12-word mnemonic phrase.
                  </p>
                </div>

                {importError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}

                <form onSubmit={handleImportAccount} className="space-y-4">
                  {/* Key Type Selector */}
                  <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setImportKeyType('privateKey')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        importKeyType === 'privateKey'
                          ? 'bg-slate-800 text-cyan-400'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Raw Private Key (0x...)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportKeyType('mnemonic')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        importKeyType === 'mnemonic'
                          ? 'bg-slate-800 text-amber-400'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      12-Word Recovery Phrase
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {importKeyType === 'mnemonic' ? '12-Word Seed Phrase' : 'Raw Private Key (0x...)'}
                    </label>
                    <textarea
                      id="import-secret-key-input"
                      rows={3}
                      required
                      value={rawSecretKey}
                      onChange={(e) => setRawSecretKey(e.target.value)}
                      placeholder={
                        importKeyType === 'mnemonic'
                          ? 'e.g. apple banana cherry diamond eagle falcon garden harbor island jungle kingdom lagoon'
                          : '0x4f3edf983ac636a65a842ce7c78d5a70db55f8e9e5d22fed179d9b8a613b1f9b'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 font-mono text-xs focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Account Alias / Label (Optional)
                    </label>
                    <input
                      type="text"
                      value={importName}
                      onChange={(e) => setImportName(e.target.value)}
                      placeholder="My Restored Vault"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <button
                    id="submit-import-account-btn"
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-slate-950" />
                    <span>Import & Unlock Vault</span>
                  </button>
                </form>
              </div>
            )}

            {/* Bottom Guest Explore Button */}
            <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Want to test the public IPFS network first?</span>
              </div>
              {onExplorePublic && (
                <button
                  id="explore-public-network-btn"
                  onClick={onExplorePublic}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Launch Guest Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>
        )}

      </section>

      {/* 3. LIVE FEATURED VAULT MEDIA PREVIEW */}
      {featuredFile && (
        <section aria-label="Featured Cluster Media" className="max-w-4xl mx-auto rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            
            {/* Thumbnail Preview Stage */}
            <div className="w-full md:w-5/12 aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden relative group">
              <img
                src={featuredFile.url}
                alt={featuredFile.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-cyan-400">
                {featuredFile.metadata.resolution || "1024x743"}
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-800 text-[10px] font-semibold text-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Cluster Pinned</span>
              </div>
            </div>

            {/* Content & Direct Action */}
            <div className="w-full md:w-7/12 space-y-3 text-left">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-cyan-400 font-semibold uppercase">Currently Stored in Vault</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[11px]">{featuredFile.mimeType}</span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-100 truncate">
                {featuredFile.name}
              </h3>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">IPFS CID:</span>
                  <span className="text-cyan-400 font-semibold">{formatCid(featuredFile.ipfsCid || "bafybeicikwtuoqjt3fye3cua3nyzwibanrreg7rvmqcvh7kyr3ioke54qj", 10)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Storage Protection:</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1 font-sans">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Cryptographically Protected (Access Key Required)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Resolution & Specs:</span>
                  <span className="text-slate-300">{featuredFile.metadata.resolution || "1792x1024"} • JPEG High-Fidelity</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => {
                    if (onSelectFile) {
                      onSelectFile(featuredFile);
                    } else if (onExplorePublic) {
                      onExplorePublic();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect & View File</span>
                </button>
                <a
                  href={featuredFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Raw File</span>
                </a>
              </div>

            </div>

          </div>
        </section>
      )}

      {/* 4. CORE ARCHITECTURAL CAPABILITIES (4-COLUMN GRID) */}
      <section aria-label="Core Architecture" className="max-w-6xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Engineered for Media Integrity & Privacy
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Traditional cloud platforms control your keys and delete your content. saus gives you sovereign media ownership.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Immutable IPFS Storage</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Files are chunked into DAG-PB blocks and addressed by cryptographic CIDs. Data cannot be silently modified or censored.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Secret Access Codes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate 16-character passcodes for sensitive files. Share direct links with auto-unlocking for seamless recipient access.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-violet-500/40 transition-all flex flex-col space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Smart Contract Ledger</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ownership is recorded on Ethereum Sepolia. Irreversibly transfer smart contract rights to another address at any time.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Multi-Node Cluster Pinning</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Files are replicated across multi-region gateway nodes with 99.9% uptime, high-bandwidth streaming, and DHT caching.
            </p>
          </div>

        </div>

      </section>

      {/* 5. HOW IT WORKS (STEP-BY-STEP EDITORIAL WALKTHROUGH) */}
      <section aria-label="How It Works" className="max-w-5xl mx-auto rounded-3xl bg-slate-900/50 border border-slate-800 p-6 sm:p-10">
        
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">User Workflow</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            How Decentralized Media Access Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-bold font-mono text-xs flex items-center justify-center">
              01
            </div>
            <h4 className="text-sm font-bold text-slate-200">Upload & Pin</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload any image, video, audio, or archive. Your file is split into verifiable blocks and pinned to cluster nodes.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/40 text-indigo-400 font-bold font-mono text-xs flex items-center justify-center">
              02
            </div>
            <h4 className="text-sm font-bold text-slate-200">Set Permissions</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose Public (community browsing), Private (wallet owner only), or Restricted with a 16-character Secret Code.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/40 text-violet-400 font-bold font-mono text-xs flex items-center justify-center">
              03
            </div>
            <h4 className="text-sm font-bold text-slate-200">Share & Stream</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Recipients enter the Secret Code or open a share link to instantly stream 4K video or download raw original files.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center">
              04
            </div>
            <h4 className="text-sm font-bold text-slate-200">Transfer On-Chain</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Permanently transfer ownership of the media record to another Ethereum address with cryptographic proof.
            </p>
          </div>

        </div>

      </section>

      {/* 6. TECHNICAL INVARIANTS & SECURITY TABLE */}
      <section aria-label="Technical Invariants" className="max-w-4xl mx-auto rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Cryptographic & Protocol Invariants</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">Live & Verified</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase text-slate-500 font-sans block">Hashing</span>
            <span className="text-cyan-300 font-semibold block">SHA-256 + Keccak</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase text-slate-500 font-sans block">IPFS Blocks</span>
            <span className="text-slate-200 font-semibold block">256 KB DAG-PB</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase text-slate-500 font-sans block">Blockchain</span>
            <span className="text-indigo-300 font-semibold block">Ethereum Sepolia</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase text-slate-500 font-sans block">Keys & Auth</span>
            <span className="text-emerald-300 font-semibold block">Secp256k1 Curve</span>
          </div>
        </div>

      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS (ACCORDION) */}
      <section aria-label="Frequently Asked Questions" className="max-w-3xl mx-auto space-y-4">
        
        <div className="text-center space-y-1.5 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-400">
            Everything you need to know about decentralized media storage and access codes.
          </p>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-slate-200 hover:text-cyan-300 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3 animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </section>

      {/* 8. FINAL CALL TO ACTION BANNER */}
      <section aria-label="Final CTA" className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-800/40 p-8 sm:p-10 text-center space-y-4 shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          Ready to Store & Stream on Decentralized IPFS?
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Start in seconds with free starter gas and 10 GB of cluster storage. No centralized lock-in.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {onExplorePublic && (
            <button
              onClick={onExplorePublic}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              Enter Public Vault Now
            </button>
          )}
          <button
            onClick={() => {
              setActiveMode('create');
              const target = document.getElementById('auth-interactive-card');
              if (target) target.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            Create My Account
          </button>
        </div>
      </section>

      {/* Secret Code Verification Modal for Saved Account Access */}
      <UnlockAccountModal
        isOpen={isUnlockModalOpen}
        account={accountToUnlock}
        onClose={() => {
          setIsUnlockModalOpen(false);
          setAccountToUnlock(null);
        }}
        onUnlocked={(unlockedAcc) => {
          setIsUnlockModalOpen(false);
          setAccountToUnlock(null);
          if (onExplorePublic) onExplorePublic();
        }}
      />

    </div>
  );
};
