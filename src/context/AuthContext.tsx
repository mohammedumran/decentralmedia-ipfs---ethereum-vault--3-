import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount } from '../types';
import { INITIAL_USERS } from '../lib/initialData';
import { generateEthereumWallet } from '../lib/crypto';

interface AuthContextType {
  currentUser: UserAccount | null;
  allAccounts: UserAccount[];
  switchAccount: (address: string) => void;
  verifyAndUnlockAccount: (address: string, secretInput: string) => { success: boolean; message?: string };
  setAccountSecretCode: (address: string, newSecretCode: string) => void;
  loginWithEmail: (email: string, name?: string, phone?: string, secretCode?: string) => UserAccount;
  createAccount: (email: string, name?: string, phone?: string, startingBalanceEth?: number, secretCode?: string) => UserAccount;
  importAccountByPrivateKey: (privateKey: string, name?: string, email?: string, phone?: string, secretCode?: string) => UserAccount;
  importAccountByMnemonic: (mnemonic: string, name?: string, email?: string, phone?: string, secretCode?: string) => UserAccount;
  deleteAccount: (address: string) => void;
  logoutAccount: () => void;
  requestFaucet: (amount?: number) => void;
  exportKeys: () => { address: string; privateKey: string; mnemonic: string } | null;
  updateBalance: (deltaEth: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_USERS_KEY = 'decentralmedia_users_v2';
const STORAGE_ACTIVE_ADDR_KEY = 'decentralmedia_active_addr_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clear legacy v1 mock user data on initial boot
  try {
    localStorage.removeItem('decentralmedia_users_v1');
    localStorage.removeItem('decentralmedia_active_addr_v1');
  } catch (e) {}

  const [allAccounts, setAllAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Could not load users from localStorage:", e);
    }
    // Generate an instant public Web3 identity for frictionless public use
    const wallet = generateEthereumWallet("public-user");
    const defaultUser: UserAccount = {
      address: wallet.address,
      name: "Public Explorer",
      balanceEth: 0.05,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic,
      secretCode: "2026",
      avatarSeed: "public-avatar",
      role: "creator",
      storageQuotaBytes: 10 * 1024 * 1024 * 1024, // 10 GB
      storageUsedBytes: 0,
      createdAt: Date.now(),
    };
    return [defaultUser];
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const savedAddr = localStorage.getItem(STORAGE_ACTIVE_ADDR_KEY);
      if (savedAddr === 'LOGGED_OUT') {
        return null;
      }
      if (savedAddr) {
        const found = allAccounts.find(a => a.address.toLowerCase() === savedAddr.toLowerCase());
        if (found) return found;
      }
    } catch (e) {}
    return allAccounts[0] || null;
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(allAccounts));
      if (currentUser) {
        localStorage.setItem(STORAGE_ACTIVE_ADDR_KEY, currentUser.address);
      } else {
        localStorage.setItem(STORAGE_ACTIVE_ADDR_KEY, 'LOGGED_OUT');
      }
    } catch (e) {
      console.warn("Failed to persist accounts:", e);
    }
  }, [allAccounts, currentUser]);

  const switchAccount = (address: string) => {
    const target = allAccounts.find(a => a.address.toLowerCase() === address.toLowerCase());
    if (target) {
      setCurrentUser(target);
    }
  };

  const verifyAndUnlockAccount = (address: string, secretInput: string): { success: boolean; message?: string } => {
    const target = allAccounts.find(a => a.address.toLowerCase() === address.toLowerCase());
    if (!target) {
      return { success: false, message: "Account not found on this device." };
    }

    const input = secretInput.trim();
    if (!input) {
      return { success: false, message: "Please enter the secret code, PIN, or private key." };
    }

    // 1. Direct match with account's secretCode
    const expectedSecret = target.secretCode?.trim().toLowerCase();
    if (expectedSecret && input.toLowerCase() === expectedSecret) {
      setCurrentUser(target);
      return { success: true };
    }

    // 2. Default fallback passcodes
    const fallbackCodes = ['2026', '1234', '7777', '0000', '123456'];
    if (fallbackCodes.includes(input.toLowerCase())) {
      setCurrentUser(target);
      return { success: true };
    }

    // 3. Match with raw Private Key
    if (input.toLowerCase() === target.privateKey.toLowerCase() ||
        input.toLowerCase() === target.privateKey.replace(/^0x/i, '').toLowerCase()) {
      setCurrentUser(target);
      return { success: true };
    }

    // 4. Match with any word from 12-word mnemonic (or full mnemonic)
    if (target.mnemonic) {
      const mnemonicWords = target.mnemonic.toLowerCase().split(/\s+/);
      if (input.toLowerCase() === target.mnemonic.toLowerCase() || mnemonicWords.includes(input.toLowerCase())) {
        setCurrentUser(target);
        return { success: true };
      }
    }

    // 5. Match with last 4 characters of address
    if (input.toLowerCase() === target.address.slice(-4).toLowerCase()) {
      setCurrentUser(target);
      return { success: true };
    }

    return {
      success: false,
      message: "Incorrect secret code. (Hint: Try default 2026, 1234, or account private key/mnemonic word)"
    };
  };

  const setAccountSecretCode = (address: string, newSecretCode: string) => {
    setAllAccounts(prev => prev.map(acc => {
      if (acc.address.toLowerCase() === address.toLowerCase()) {
        return { ...acc, secretCode: newSecretCode.trim() };
      }
      return acc;
    }));
    if (currentUser && currentUser.address.toLowerCase() === address.toLowerCase()) {
      setCurrentUser(prev => prev ? { ...prev, secretCode: newSecretCode.trim() } : null);
    }
  };

  const createAccount = (
    email: string,
    name?: string,
    phone?: string,
    startingBalanceEth: number = 5.0,
    secretCode?: string
  ): UserAccount => {
    const trimmed = email.trim().toLowerCase();
    const displayName = name?.trim() || (trimmed.includes('@') ? trimmed.split('@')[0] : trimmed) || "Decentralized Member";
    const cleanPhone = phone?.trim() || undefined;
    const cleanSecret = secretCode?.trim() || "2026";
    
    // Check if account already exists with this email
    const existing = allAccounts.find(a => a.email.toLowerCase() === trimmed);
    if (existing) {
      const updated = {
        ...existing,
        name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        phone: cleanPhone || existing.phone,
        secretCode: cleanSecret || existing.secretCode || "2026",
      };
      setAllAccounts(prev => prev.map(a => a.address.toLowerCase() === updated.address.toLowerCase() ? updated : a));
      setCurrentUser(updated);
      return updated;
    }

    // Generate fresh cryptographic Ethereum wallet
    const wallet = generateEthereumWallet(trimmed + '-' + Date.now());
    const newAccount: UserAccount = {
      email: trimmed,
      name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
      phone: cleanPhone,
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic,
      secretCode: cleanSecret,
      createdAt: Date.now(),
      balanceEth: startingBalanceEth,
      avatarSeed: trimmed || wallet.address,
    };

    setAllAccounts(prev => [newAccount, ...prev]);
    setCurrentUser(newAccount);
    return newAccount;
  };

  const loginWithEmail = (email: string, name?: string, phone?: string, secretCode?: string): UserAccount => {
    return createAccount(email, name, phone, 5.0, secretCode);
  };

  const importAccountByPrivateKey = (
    privateKey: string,
    name?: string,
    email?: string,
    phone?: string,
    secretCode?: string
  ): UserAccount => {
    const cleanKey = privateKey.trim().startsWith('0x') ? privateKey.trim() : `0x${privateKey.trim()}`;
    const cleanEmail = email?.trim().toLowerCase() || `wallet_${cleanKey.slice(2, 8)}@decentral.eth`;
    const cleanName = name?.trim() || `Imported Account (${cleanKey.slice(2, 6)})`;
    const cleanPhone = phone?.trim() || undefined;

    // Derive address
    let address = "0x";
    const hexChars = "0123456789abcdef";
    for (let i = 0; i < 40; i++) {
      const idx = (cleanKey.charCodeAt(i % cleanKey.length) + i * 7) % 16;
      address += hexChars[idx];
    }

    const importedAccount: UserAccount = {
      email: cleanEmail,
      name: cleanName,
      phone: cleanPhone,
      address,
      privateKey: cleanKey,
      mnemonic: "Imported via Private Key directly (Seed phrase not stored)",
      secretCode: secretCode?.trim() || "2026",
      createdAt: Date.now(),
      balanceEth: 3.5,
      avatarSeed: address,
    };

    setAllAccounts(prev => {
      const filtered = prev.filter(a => a.address.toLowerCase() !== address.toLowerCase());
      return [importedAccount, ...filtered];
    });
    setCurrentUser(importedAccount);
    return importedAccount;
  };

  const importAccountByMnemonic = (
    mnemonic: string,
    name?: string,
    email?: string,
    phone?: string,
    secretCode?: string
  ): UserAccount => {
    const cleanMnemonic = mnemonic.trim().toLowerCase();
    const words = cleanMnemonic.split(/\s+/);
    const cleanEmail = email?.trim().toLowerCase() || `vault_${words[0] || 'seed'}@decentral.eth`;
    const cleanName = name?.trim() || `Vault (${words[0] || 'Identity'})`;
    const cleanPhone = phone?.trim() || undefined;

    let seedVal = 0;
    for (let i = 0; i < cleanMnemonic.length; i++) {
      seedVal = (seedVal * 31 + cleanMnemonic.charCodeAt(i)) % 1000000007;
    }
    const hexChars = "0123456789abcdef";
    let address = "0x";
    let privateKey = "0x";
    for (let i = 0; i < 40; i++) {
      address += hexChars[(seedVal + i * 13) % 16];
    }
    for (let i = 0; i < 64; i++) {
      privateKey += hexChars[(seedVal * 7 + i * 17) % 16];
    }

    const importedAccount: UserAccount = {
      email: cleanEmail,
      name: cleanName,
      phone: cleanPhone,
      address,
      privateKey,
      mnemonic: cleanMnemonic,
      secretCode: secretCode?.trim() || "2026",
      createdAt: Date.now(),
      balanceEth: 4.2,
      avatarSeed: address,
    };

    setAllAccounts(prev => {
      const filtered = prev.filter(a => a.address.toLowerCase() !== address.toLowerCase());
      return [importedAccount, ...filtered];
    });
    setCurrentUser(importedAccount);
    return importedAccount;
  };

  const deleteAccount = (address: string) => {
    setAllAccounts(prev => {
      const updated = prev.filter(a => a.address.toLowerCase() !== address.toLowerCase());
      if (currentUser?.address.toLowerCase() === address.toLowerCase()) {
        if (updated.length > 0) {
          setCurrentUser(updated[0]);
        } else {
          setCurrentUser(null);
        }
      }
      return updated;
    });
  };

  const logoutAccount = () => {
    setCurrentUser(null);
    try {
      localStorage.setItem(STORAGE_ACTIVE_ADDR_KEY, 'LOGGED_OUT');
    } catch (e) {}
  };

  const requestFaucet = (amount: number = 2.5) => {
    if (!currentUser) return;
    const updated = { ...currentUser, balanceEth: Math.round((currentUser.balanceEth + amount) * 1000) / 1000 };
    setCurrentUser(updated);
    setAllAccounts(prev => prev.map(a => a.address.toLowerCase() === updated.address.toLowerCase() ? updated : a));
  };

  const updateBalance = (deltaEth: number) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      balanceEth: Math.max(0, Math.round((currentUser.balanceEth + deltaEth) * 1000) / 1000)
    };
    setCurrentUser(updated);
    setAllAccounts(prev => prev.map(a => a.address.toLowerCase() === updated.address.toLowerCase() ? updated : a));
  };

  const exportKeys = () => {
    if (!currentUser) return null;
    return {
      address: currentUser.address,
      privateKey: currentUser.privateKey,
      mnemonic: currentUser.mnemonic,
    };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allAccounts,
        switchAccount,
        verifyAndUnlockAccount,
        setAccountSecretCode,
        loginWithEmail,
        createAccount,
        importAccountByPrivateKey,
        importAccountByMnemonic,
        deleteAccount,
        logoutAccount,
        requestFaucet,
        exportKeys,
        updateBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
