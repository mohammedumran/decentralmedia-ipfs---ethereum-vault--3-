import React, { useState } from 'react';
import {
  X,
  User,
  Copy,
  Check,
  Coins,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  RotateCcw,
  PlusCircle,
  AlertTriangle,
  HardDrive,
  Database,
  Trash2,
  Download,
  Sparkles,
  ArrowRight,
  LogOut,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDecentralMedia } from '../context/DecentralMediaContext';
import { formatAddress, formatBytes } from '../lib/crypto';
import { SMART_CONTRACT_ADDRESS } from '../lib/contracts';
import { UnlockAccountModal } from './UnlockAccountModal';
import { UserAccount } from '../types';

interface UserWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserWalletModal: React.FC<UserWalletModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    allAccounts,
    switchAccount,
    verifyAndUnlockAccount,
    setAccountSecretCode,
    createAccount,
    importAccountByPrivateKey,
    deleteAccount,
    logoutAccount,
    requestFaucet,
    exportKeys
  } = useAuth();
  const { mediaFiles, resetToDefaultData, purgeAllFiles } = useDecentralMedia();

  const [activeTab, setActiveTab] = useState<'profile' | 'accounts' | 'security'>('profile');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  
  // Unlock Modal State for switching accounts
  const [accountToUnlock, setAccountToUnlock] = useState<UserAccount | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

  // Secret Code editing state
  const [editingSecretCode, setEditingSecretCode] = useState(false);
  const [newSecretCodeInput, setNewSecretCodeInput] = useState('');
  
  // Create account form state
  const [newName, setNewName] = useState('');
  const [newSecretCode, setNewSecretCode] = useState('2026');
  const [importKey, setImportKey] = useState('');
  const [importMode, setImportMode] = useState<'create' | 'import'>('create');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [faucetSuccess, setFaucetSuccess] = useState(false);
  
  // Account and protocol deletion/reset confirmations
  const [accountPendingDelete, setAccountPendingDelete] = useState<string | null>(null);
  const [confirmResetState, setConfirmResetState] = useState(false);
  const [confirmPurgeFiles, setConfirmPurgeFiles] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (!isOpen || !currentUser) return null;

  const userFiles = mediaFiles.filter(
    f => f.ownerAddress.toLowerCase() === currentUser.address.toLowerCase()
  );
  const totalStorage = userFiles.reduce((acc, f) => acc + f.sizeBytes, 0);

  const copyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFaucet = () => {
    requestFaucet(1.5);
    setFaucetSuccess(true);
    setTimeout(() => setFaucetSuccess(false), 2500);
  };

  const handleCreateNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const alias = newName.trim() || 'Decentralized Member';
    
    const created = createAccount(alias, alias, undefined, 5.0, newSecretCode.trim() || '2026');
    setActionSuccessMsg(`Created & connected: ${created.name} (${formatAddress(created.address, 3)})`);
    setNewName('');
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const handleImportAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importKey.trim()) return;

    try {
      const imported = importAccountByPrivateKey(importKey.trim(), newName.trim() || undefined);
      setActionSuccessMsg(`Imported & connected: ${imported.name} (${formatAddress(imported.address, 3)})`);
      setImportKey('');
      setNewName('');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err) {
      alert("Invalid private key format");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-md shadow-cyan-500/20">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>{currentUser.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Active
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono truncate max-w-[240px]">
                {formatAddress(currentUser.address, 4)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {confirmLogout ? (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2 py-1 rounded-lg">
                <span className="text-[10px] text-slate-300">Log out?</span>
                <button
                  id="confirm-logout-btn"
                  onClick={() => {
                    logoutAccount();
                    setConfirmLogout(false);
                    onClose();
                  }}
                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-200 px-1"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                id="header-logout-btn"
                onClick={() => setConfirmLogout(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-800 text-slate-300 hover:text-rose-300 text-xs font-medium transition-colors"
                title="Log Out of this Account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            )}

            <button
              id="close-wallet-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-4 text-xs font-medium flex-shrink-0">
          <button
            id="tab-profile-btn"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Wallet & Vault
          </button>
          <button
            id="tab-accounts-btn"
            onClick={() => setActiveTab('accounts')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'accounts'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Accounts & Identities</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded-full font-mono">
              {allAccounts.length}
            </span>
          </button>
          <button
            id="tab-security-btn"
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Keys & Protocol
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto">

          {/* Success Banner */}
          {actionSuccessMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-center gap-2 text-xs text-emerald-300 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Ethereum Public Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ethereum Public Address (Web3 Identity)</span>
                </label>
                <div className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 break-all">
                  <span className="flex-1">{currentUser.address}</span>
                  <button
                    id="copy-addr-modal-btn"
                    onClick={() => copyText(currentUser.address, 'address')}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                    title="Copy Address"
                  >
                    {copiedField === 'address' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Balance & Faucet */}
              <div className="p-4 bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-medium">
                    Testnet Gas Balance
                  </span>
                  <div className="text-2xl font-bold font-mono text-slate-100 mt-0.5">
                    {currentUser.balanceEth.toFixed(3)} <span className="text-cyan-400 text-sm">ETH</span>
                  </div>
                </div>

                <button
                  id="request-faucet-btn"
                  onClick={handleFaucet}
                  className="px-3 py-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{faucetSuccess ? '+1.5 ETH Received!' : 'Request Test ETH'}</span>
                </button>
              </div>

              {/* User Vault Statistics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span>Owned Assets</span>
                  </div>
                  <div className="mt-1 text-lg font-bold text-slate-200 font-mono">
                    {userFiles.length} <span className="text-xs text-slate-500 font-sans">files</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400">
                    <HardDrive className="w-4 h-4 text-indigo-400" />
                    <span>IPFS Pinned</span>
                  </div>
                  <div className="mt-1 text-lg font-bold text-slate-200 font-mono">
                    {formatBytes(totalStorage)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'accounts' && (
            <div className="space-y-4">
              
              {/* Add Account Card */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-cyan-400" />
                    <span>Create or Add New Account</span>
                  </span>

                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setImportMode('create')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        importMode === 'create'
                          ? 'bg-cyan-500 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      New Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('import')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        importMode === 'import'
                          ? 'bg-cyan-500 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Import Key
                    </button>
                  </div>
                </div>

                {importMode === 'create' ? (
                  <form onSubmit={handleCreateNewAccount} className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-medium">
                        Web3 Identity / Node Alias
                      </label>
                      <input
                        id="new-account-name-input"
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Satoshi, CreativeDirector, SecureStorage"
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-medium flex items-center justify-between">
                        <span>Security PIN / Passcode</span>
                        <span className="text-slate-500 font-mono">Default: 2026</span>
                      </label>
                      <input
                        type="password"
                        value={newSecretCode}
                        onChange={(e) => setNewSecretCode(e.target.value)}
                        placeholder="2026"
                        className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <button
                      id="submit-create-account-btn"
                      type="submit"
                      className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/10 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Ethereum Wallet & Connect</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleImportAccount} className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-medium">
                        Private Key (Hex 0x...) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id="import-account-key-input"
                        type="password"
                        required
                        value={importKey}
                        onChange={(e) => setImportKey(e.target.value)}
                        placeholder="0x4c0883a69102937d..."
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-medium">Account Name (Optional)</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="My Cold Wallet"
                        className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <button
                      id="submit-import-account-btn"
                      type="submit"
                      className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/10 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Import Account & Connect</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Existing Accounts Switcher */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Registered Accounts</span>
                  <span>Click to switch active wallet</span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {allAccounts.map((account) => {
                    const isSelected = account.address.toLowerCase() === currentUser.address.toLowerCase();
                    return (
                      <div
                        key={account.address}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                          isSelected
                            ? 'bg-slate-950 border-cyan-500/60 shadow-sm ring-1 ring-cyan-500/20'
                            : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (!isSelected) {
                              setAccountToUnlock(account);
                              setIsUnlockModalOpen(true);
                            }
                          }}
                          className="flex items-center gap-2.5 truncate flex-1"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {account.name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-medium text-slate-200 truncate flex items-center gap-1.5">
                              <span>{account.name}</span>
                              {isSelected && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded font-mono">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate">
                              {formatAddress(account.address, 4)} • Web3 Keypair
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                          <span className="text-xs font-mono text-emerald-400 font-semibold">
                            {account.balanceEth} ETH
                          </span>
                          {allAccounts.length > 1 && !isSelected && (
                            accountPendingDelete === account.address ? (
                              <div className="flex items-center gap-1 bg-rose-950/80 p-1 rounded-lg border border-rose-800">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteAccount(account.address);
                                    setAccountPendingDelete(null);
                                    setActionSuccessMsg(`Deleted account: ${account.name}`);
                                    setTimeout(() => setActionSuccessMsg(null), 3000);
                                  }}
                                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAccountPendingDelete(null);
                                  }}
                                  className="px-1.5 py-0.5 text-slate-400 hover:text-slate-200 text-[10px]"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAccountPendingDelete(account.address);
                                }}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                                title="Delete account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              {/* Private Key Inspection */}
              <div className="p-4 bg-slate-950 rounded-xl border border-amber-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Private Key & Credentials</span>
                  </span>
                  <button
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {showPrivateKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPrivateKey ? 'Hide' : 'Reveal Key'}</span>
                  </button>
                </div>

                {showPrivateKey ? (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Never share private key. Grants full control over your media smart contracts.</span>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Raw Private Key (EVM)</div>
                      <div className="mt-1 flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-amber-300 break-all">
                        <span>{currentUser.privateKey}</span>
                        <button
                          onClick={() => copyText(currentUser.privateKey, 'privateKey')}
                          className="ml-2 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 flex-shrink-0"
                          title="Copy Private Key"
                        >
                          {copiedField === 'privateKey' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {currentUser.mnemonic && (
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">12-Word BIP-39 Recovery Phrase</div>
                        <div className="mt-1 flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 break-all">
                          <span>{currentUser.mnemonic}</span>
                          <button
                            onClick={() => copyText(currentUser.mnemonic, 'mnemonic')}
                            className="ml-2 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 flex-shrink-0"
                            title="Copy Seed Phrase"
                          >
                            {copiedField === 'mnemonic' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Your wallet credentials are cryptographically derived and stored locally. Click "Reveal Key" to inspect or export.
                  </p>
                )}
              </div>

              {/* Secret Access Code / Security PIN Settings */}
              <div className="p-4 bg-slate-950 rounded-xl border border-cyan-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Account Secret Access Code / PIN</span>
                  </span>
                  <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                    Dashboard Login Gate
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  This secret code is required to unlock your saved account when signing in or switching accounts from the main dashboard.
                </p>

                {editingSecretCode ? (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newSecretCodeInput}
                        onChange={(e) => setNewSecretCodeInput(e.target.value)}
                        placeholder="Enter new secret code/PIN"
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newSecretCodeInput.trim()) {
                            setAccountSecretCode(currentUser.address, newSecretCodeInput.trim());
                            setActionSuccessMsg(`Secret code updated to "${newSecretCodeInput.trim()}"`);
                            setEditingSecretCode(false);
                            setNewSecretCodeInput('');
                            setTimeout(() => setActionSuccessMsg(null), 3000);
                          }
                        }}
                        className="px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
                      >
                        Save PIN
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSecretCode(false);
                          setNewSecretCodeInput('');
                        }}
                        className="px-2.5 py-2 text-xs text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {currentUser.secretCode || "2026"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {currentUser.secretCode ? '(Custom PIN)' : '(Default PIN: 2026)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyText(currentUser.secretCode || "2026", 'secretCode')}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
                        title="Copy Secret Code"
                      >
                        {copiedField === 'secretCode' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewSecretCodeInput(currentUser.secretCode || '2026');
                          setEditingSecretCode(true);
                        }}
                        className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
                      >
                        Change Code
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Database Clean & Reset Actions */}
              <div className="space-y-3">
                {/* Purge All Files */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Clear All Stored Media Files</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Remove all files ({mediaFiles.length}) to start with an empty database</div>
                  </div>

                  {confirmPurgeFiles ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          purgeAllFiles();
                          setConfirmPurgeFiles(false);
                          setActionSuccessMsg("All media files cleared successfully");
                          setTimeout(() => setActionSuccessMsg(null), 3000);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
                      >
                        Confirm Purge
                      </button>
                      <button
                        onClick={() => setConfirmPurgeFiles(false)}
                        className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmPurgeFiles(true)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-900 text-slate-300 hover:text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge Files</span>
                    </button>
                  )}
                </div>

                {/* Protocol Reset */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Genesis Protocol State</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Reset demo files, peers and ledger back to defaults</div>
                  </div>

                  {confirmResetState ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          resetToDefaultData();
                          setConfirmResetState(false);
                          setActionSuccessMsg("Protocol reset to genesis demo state");
                          setTimeout(() => setActionSuccessMsg(null), 3000);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
                      >
                        Confirm Reset
                      </button>
                      <button
                        onClick={() => setConfirmResetState(false)}
                        className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmResetState(true)}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-900 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset State</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Secret Code Verification Modal for switching accounts */}
      <UnlockAccountModal
        account={accountToUnlock}
        isOpen={isUnlockModalOpen}
        onClose={() => {
          setIsUnlockModalOpen(false);
          setAccountToUnlock(null);
        }}
        onSuccess={() => {
          setIsUnlockModalOpen(false);
          setAccountToUnlock(null);
          setActionSuccessMsg(`Switched to account: ${accountToUnlock?.name || 'Account'}`);
          setTimeout(() => setActionSuccessMsg(null), 3000);
        }}
      />
    </div>
  );
};
