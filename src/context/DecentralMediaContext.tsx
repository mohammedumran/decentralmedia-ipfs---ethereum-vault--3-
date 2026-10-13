import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  MediaFile,
  HostNode,
  SmartContractTransaction,
  ViewTab,
  AccessControlRule,
  MediaType,
} from '../types';
import {
  INITIAL_MEDIA_FILES,
  INITIAL_HOST_NODES,
  INITIAL_TRANSACTIONS,
} from '../lib/initialData';
import { useAuth } from './AuthContext';
import {
  calculateSha256,
  calculateKeccak256,
  generateIpfsCid,
  generateUniqueAccessCode,
  generateTxHash,
} from '../lib/crypto';
import { SMART_CONTRACT_ADDRESS } from '../lib/contracts';

interface UploadParams {
  name: string;
  type: MediaType;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  description: string;
  tags: string[];
  width?: number;
  height?: number;
  duration?: number;
  codec?: string;
  fps?: number;
  exifCamera?: string;
  customFields?: { key: string; value: string }[];
  accessMode: 'public' | 'private' | 'restricted';
  allowedAddresses?: string[];
  allowedEmails?: string[];
  selectedHostNodes?: string[];
  customAccessCode?: string;
}

interface DecentralMediaContextType {
  mediaFiles: MediaFile[];
  hostNodes: HostNode[];
  transactions: SmartContractTransaction[];
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  selectedFile: MediaFile | null;
  setSelectedFile: (file: MediaFile | null) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOption: string;
  setSortOption: (sort: string) => void;
  
  // Watchlist state
  watchlist: string[];
  toggleWatchlist: (fileId: string) => void;
  removeFromWatchlist: (fileId: string) => void;
  addToWatchlist: (fileId: string) => void;
  isWatchlisted: (fileId: string) => boolean;
  
  // Actions
  uploadMedia: (params: UploadParams) => Promise<MediaFile>;
  updateAccessControl: (fileId: string, rule: Partial<AccessControlRule>) => Promise<void>;
  rotateAccessCode: (fileId: string) => Promise<string>;
  transferOwnership: (fileId: string, targetAddressOrEmail: string, reason?: string) => Promise<{ success: boolean; message: string; txHash?: string }>;
  toggleHostNodePin: (fileId: string, nodeId: string) => Promise<void>;
  redeemAccessCode: (codeOrCid: string) => Promise<{ success: boolean; file?: MediaFile; message: string }>;
  checkFileAccess: (file: MediaFile) => { hasAccess: boolean; isOwner: boolean; reason: string };
  unlockedFileIds: string[];
  isUnlocked: (fileId: string) => boolean;
  deleteFile: (fileId: string) => Promise<void>;
  purgeAllFiles: () => void;
  resetToDefaultData: () => void;
  refreshVault: () => Promise<void>;
}

const DecentralMediaContext = createContext<DecentralMediaContextType | undefined>(undefined);

const STORAGE_MEDIA_KEY = 'decentralmedia_files_v2';
const STORAGE_HOSTS_KEY = 'decentralmedia_hosts_v2';
const STORAGE_TXS_KEY = 'decentralmedia_txs_v2';
const STORAGE_WATCHLIST_KEY = 'decentralmedia_watchlist_v2';

export const DecentralMediaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, allAccounts, updateBalance } = useAuth();

  // Clear legacy v1 mock media files and transactions on initial boot
  try {
    localStorage.removeItem('decentralmedia_files_v1');
    localStorage.removeItem('decentralmedia_txs_v1');
    localStorage.removeItem('decentralmedia_watchlist_v1');
  } catch (e) {}

  const isLegacySample = (f: MediaFile): boolean => {
    if (!f) return false;
    if (f.id === 'med-nebula-4k-core') return true;
    const name = f.name?.toLowerCase() || '';
    const desc = f.metadata?.description?.toLowerCase() || '';
    return name.includes('nebula') || name.includes('cosmic') || desc.includes('cosmic');
  };

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MEDIA_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((f: MediaFile) => !isLegacySample(f));
          // Persist the clean array to avoid stale localStorage entries
          localStorage.setItem(STORAGE_MEDIA_KEY, JSON.stringify(cleaned));
          return cleaned;
        }
      }
    } catch (e) {}
    return INITIAL_MEDIA_FILES.filter(f => !isLegacySample(f));
  });

  const [hostNodes, setHostNodes] = useState<HostNode[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HOSTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_HOST_NODES;
  });

  const [transactions, setTransactions] = useState<SmartContractTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TXS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_TRANSACTIONS;
  });

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_WATCHLIST_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Track files unlocked via secret access code in the current session
  const [unlockedFileIds, setUnlockedFileIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('decentralmedia_unlocked_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('decentralmedia_unlocked_v2', JSON.stringify(unlockedFileIds));
    } catch (e) {}
  }, [unlockedFileIds]);

  const [activeTab, setActiveTab] = useState<ViewTab>('vault');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('newest');

  // Background sync with server for seamless multi-device persistence
  const fetchServerVault = async () => {
    try {
      const res = await fetch('/api/media');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.mediaFiles) && data.mediaFiles.length > 0) {
          setMediaFiles(prev => {
            const map = new Map<string, MediaFile>();
            // Keep local state (filtering out legacy sample files)
            prev
              .filter(f => !isLegacySample(f))
              .forEach(f => map.set(f.id, f));
            // Merge server state
            data.mediaFiles
              .filter((f: MediaFile) => !isLegacySample(f))
              .forEach((f: MediaFile) => map.set(f.id, f));
            return Array.from(map.values()).sort((a, b) => b.uploadTimestamp - a.uploadTimestamp);
          });
        }
        if (Array.isArray(data.transactions) && data.transactions.length > 0) {
          setTransactions(prev => {
            const map = new Map<string, SmartContractTransaction>();
            prev.forEach(t => map.set(t.txHash, t));
            data.transactions.forEach((t: SmartContractTransaction) => map.set(t.txHash, t));
            return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
          });
        }
      }
    } catch (e) {
      console.warn("Could not sync with /api/media:", e);
    }
  };

  useEffect(() => {
    fetchServerVault();
    // Poll every 3s to discover files uploaded or shared from other devices
    const interval = setInterval(fetchServerVault, 3000);
    // Immediately sync when tab becomes active / focused on other device
    const onFocus = () => fetchServerVault();
    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MEDIA_KEY, JSON.stringify(mediaFiles));
      localStorage.setItem(STORAGE_HOSTS_KEY, JSON.stringify(hostNodes));
      localStorage.setItem(STORAGE_TXS_KEY, JSON.stringify(transactions));
      localStorage.setItem(STORAGE_WATCHLIST_KEY, JSON.stringify(watchlist));
    } catch (e) {
      console.warn("Storage quota or error saving media state:", e);
    }
  }, [mediaFiles, hostNodes, transactions, watchlist]);

  // Keep selectedFile in sync if updated
  useEffect(() => {
    if (selectedFile) {
      const updated = mediaFiles.find(f => f.id === selectedFile.id);
      if (updated) setSelectedFile(updated);
    }
  }, [mediaFiles]);

  const checkFileAccess = (file: MediaFile): { hasAccess: boolean; isOwner: boolean; reason: string } => {
    const isOwner = currentUser ? file.ownerAddress.toLowerCase() === currentUser.address.toLowerCase() : false;

    // 1. If unlocked via verified Secret Access Code in this session
    if (unlockedFileIds.includes(file.id)) {
      return { hasAccess: true, isOwner, reason: "Access granted via verified Secret Access Code" };
    }

    // 2. If explicitly whitelisted on Ethereum Address ACL
    if (currentUser) {
      const userAddrLower = currentUser.address.toLowerCase();
      const isWhitelistedAddr = file.accessControl.allowedAddresses.some(
        a => a.toLowerCase() === userAddrLower
      );
      if (isWhitelistedAddr) {
        return { hasAccess: true, isOwner, reason: "Explicitly authorized on Web3 Address Whitelist" };
      }
    }

    // 3. File requires Secret Access Code to view or get media
    return {
      hasAccess: false,
      isOwner,
      reason: "Protected by Secret Access Code: Enter code to decrypt and view file",
    };
  };

  const isUnlocked = (fileId: string): boolean => {
    return unlockedFileIds.includes(fileId);
  };

  const uploadMedia = async (params: UploadParams): Promise<MediaFile> => {
    const fileId = `med-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const sha256 = await calculateSha256(params.dataUrl);
    const keccak = await calculateKeccak256(params.name + sha256);
    const cidV1 = generateIpfsCid(params.name + params.dataUrl.slice(0, 100), 'v1');
    const accessCode = params.customAccessCode || generateUniqueAccessCode();
    
    const pinnedNodes = params.selectedHostNodes && params.selectedHostNodes.length > 0
      ? params.selectedHostNodes
      : ["node-us-east-01", "node-eu-central-02"];

    // 1. Upload binary file directly to server permanent storage
    let serverFileUrl = params.dataUrl;
    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileDataUrl: params.dataUrl,
          fileName: params.name,
          mimeType: params.mimeType,
          fileId,
        }),
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          serverFileUrl = uploadData.url;
        }
      }
    } catch (err) {
      console.warn("Direct /api/upload warning, using base64 fallback:", err);
    }

    const newFile: MediaFile = {
      id: fileId,
      name: params.name,
      type: params.type,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      url: serverFileUrl,
      thumbnailUrl: params.type === 'image' ? serverFileUrl : undefined,
      ipfsCid: cidV1,
      cidVersion: 'v1',
      sha256Hash: sha256,
      keccak256Hash: keccak,
      uploadTimestamp: Date.now(),
      ownerAddress: currentUser?.address || "0x0000000000000000000000000000000000000000",
      metadata: {
        description: params.description || `Decentralized ${params.type} uploaded to IPFS cluster.`,
        tags: params.tags && params.tags.length > 0 ? params.tags : ['Decentralized', 'IPFS', params.type.toUpperCase()],
        width: params.width,
        height: params.height,
        resolution: params.width && params.height ? `${params.width}x${params.height}` : undefined,
        duration: params.duration,
        codec: params.codec || (params.type === 'video' ? 'H.264 / AAC' : 'WebP / Original'),
        fps: params.fps,
        exifCamera: params.exifCamera,
        customFields: params.customFields || [],
        encryption: 'none',
        unixFsChunkSize: '256 KB DAG-PB',
      },
      accessControl: {
        mode: params.accessMode || 'restricted',
        allowedAddresses: params.allowedAddresses || [],
        allowedEmails: [],
        uniqueAccessCode: accessCode,
        codeRedemptions: 0,
        allowDownload: true,
      },
      pinningState: {
        isPinned: true,
        pinnedNodes,
        replicationFactor: pinnedNodes.length,
        primaryHostNodeId: pinnedNodes[0] || 'node-us-east-01',
        storageUsageBytes: params.sizeBytes,
        lastSyncTimestamp: Date.now(),
      },
      transferHistory: [],
    };

    // Smart contract registration transaction
    const gasUsed = 125000 + Math.floor(Math.random() * 15000);
    const gasFee = 0.0028;
    const tx: SmartContractTransaction = {
      txHash: generateTxHash(),
      blockNumber: 19485000 + Math.floor(Math.random() * 5000),
      timestamp: Date.now(),
      from: currentUser?.address || "0x0000000000000000000000000000000000000000",
      to: SMART_CONTRACT_ADDRESS,
      method: 'storeMedia',
      status: 'confirmed',
      gasUsed,
      gasFeeEth: gasFee,
      fileId: newFile.id,
      fileName: newFile.name,
      eventLogs: [`MediaStored(cid=${cidV1.slice(0, 14)}..., owner=${(currentUser?.address || '0x0000').slice(0, 10)}..., mode=${params.accessMode})`],
      params: {
        cid: cidV1,
        accessMode: params.accessMode,
        uniqueCode: accessCode,
        pinnedNodesCount: pinnedNodes.length,
      }
    };

    updateBalance(-gasFee);
    setTransactions(prev => [tx, ...prev]);
    setMediaFiles(prev => [newFile, ...prev]);

    // Persist to server so other devices can discover and stream this file immediately
    try {
      await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaFile: newFile, transaction: tx }),
      });
      // Immediate vault refresh to sync state across browser sessions
      fetchServerVault();
    } catch (e) {
      console.warn("Failed to persist media to server:", e);
    }

    // Update host nodes storage
    setHostNodes(prev => prev.map(node => {
      if (pinnedNodes.includes(node.id)) {
        return {
          ...node,
          pinnedFilesCount: node.pinnedFilesCount + 1,
          usedStorageGb: Math.round((node.usedStorageGb + (params.sizeBytes / (1024 * 1024 * 1024))) * 100) / 100,
        };
      }
      return node;
    }));

    return newFile;
  };

  const updateAccessControl = async (fileId: string, rule: Partial<AccessControlRule>): Promise<void> => {
    const file = mediaFiles.find(f => f.id === fileId);
    if (!file) return;

    const updatedACL: AccessControlRule = {
      ...file.accessControl,
      ...rule,
    };

    const gasUsed = 65000;
    const gasFee = 0.0014;
    const tx: SmartContractTransaction = {
      txHash: generateTxHash(),
      blockNumber: 19485000 + Math.floor(Math.random() * 5000),
      timestamp: Date.now(),
      from: currentUser?.address || "0x0000000000000000000000000000000000000000",
      to: SMART_CONTRACT_ADDRESS,
      method: 'grantAccess',
      status: 'confirmed',
      gasUsed,
      gasFeeEth: gasFee,
      fileId,
      fileName: file.name,
      eventLogs: [`AccessUpdated(fileId=${fileId}, mode=${updatedACL.mode})`],
      params: {
        mode: updatedACL.mode,
        allowedAddresses: updatedACL.allowedAddresses,
        allowedEmails: updatedACL.allowedEmails,
      }
    };

    updateBalance(-gasFee);
    setTransactions(prev => [tx, ...prev]);
    setMediaFiles(prev => prev.map(f => f.id === fileId ? { ...f, accessControl: updatedACL } : f));

    // Sync ACL updates to server
    fetch(`/api/media/${fileId}/access`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessControl: updatedACL, transaction: tx }),
    }).catch(e => console.warn("Failed to sync ACL to server:", e));
  };

  const rotateAccessCode = async (fileId: string): Promise<string> => {
    const file = mediaFiles.find(f => f.id === fileId);
    if (!file) throw new Error("File not found");

    const newCode = generateUniqueAccessCode();
    const updatedACL: AccessControlRule = {
      ...file.accessControl,
      uniqueAccessCode: newCode,
    };

    const gasFee = 0.0012;
    const tx: SmartContractTransaction = {
      txHash: generateTxHash(),
      blockNumber: 19485000 + Math.floor(Math.random() * 5000),
      timestamp: Date.now(),
      from: currentUser?.address || "0x0000000000000000000000000000000000000000",
      to: SMART_CONTRACT_ADDRESS,
      method: 'rotateAccessCode',
      status: 'confirmed',
      gasUsed: 54000,
      gasFeeEth: gasFee,
      fileId,
      fileName: file.name,
      eventLogs: [`AccessCodeRotated(fileId=${fileId}, newHash=${newCode.slice(0, 12)}...)`],
      params: {
        newCodePrefix: newCode.slice(0, 12) + "...",
      }
    };

    updateBalance(-gasFee);
    setTransactions(prev => [tx, ...prev]);
    setMediaFiles(prev => prev.map(f => f.id === fileId ? { ...f, accessControl: updatedACL } : f));

    // Sync rotated code to server
    fetch(`/api/media/${fileId}/access`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessControl: updatedACL, transaction: tx }),
    }).catch(e => console.warn("Failed to sync rotated code to server:", e));

    return newCode;
  };

  const transferOwnership = async (
    fileId: string,
    targetAddressOrEmail: string,
    reason?: string
  ): Promise<{ success: boolean; message: string; txHash?: string }> => {
    const file = mediaFiles.find(f => f.id === fileId);
    if (!file) return { success: false, message: "File not found." };
    if (!currentUser || file.ownerAddress.toLowerCase() !== currentUser.address.toLowerCase()) {
      return { success: false, message: "You are not the smart contract owner of this file." };
    }

    const input = targetAddressOrEmail.trim();
    if (!input) return { success: false, message: "Recipient Ethereum address cannot be empty." };

    let targetAddress = "";
    if (input.startsWith("0x") && input.length === 42) {
      targetAddress = input;
    } else {
      return { success: false, message: "Please provide a valid 42-character Ethereum Address (0x...)." };
    }

    if (currentUser && targetAddress.toLowerCase() === currentUser.address.toLowerCase()) {
      return { success: false, message: "You already own this file." };
    }

    const txHash = generateTxHash();
    const blockNumber = 19485000 + Math.floor(Math.random() * 5000);
    const gasFee = 0.0035;

    const transferRecord = {
      id: `tf-${Date.now()}`,
      fromAddress: currentUser?.address || "0x0000000000000000000000000000000000000000",
      toAddress: targetAddress,
      timestamp: Date.now(),
      txHash,
      gasUsedEth: gasFee,
      blockNumber,
      reason: reason || "Web3 ownership transfer on smart contract ledger.",
    };

    const tx: SmartContractTransaction = {
      txHash,
      blockNumber,
      timestamp: Date.now(),
      from: currentUser?.address || "0x0000000000000000000000000000000000000000",
      to: SMART_CONTRACT_ADDRESS,
      method: 'transferOwnership',
      status: 'confirmed',
      gasUsed: 142000,
      gasFeeEth: gasFee,
      fileId,
      fileName: file.name,
      eventLogs: [
        `OwnershipTransferred(fileId=${fileId}, from=${(currentUser?.address || '0x0000').slice(0, 8)}..., to=${targetAddress.slice(0, 8)}...)`
      ],
      params: {
        from: currentUser?.address || "",
        to: targetAddress,
      }
    };

    updateBalance(-gasFee);
    setTransactions(prev => [tx, ...prev]);

    setMediaFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        return {
          ...f,
          ownerAddress: targetAddress,
          transferHistory: [transferRecord, ...(f.transferHistory || [])],
        };
      }
      return f;
    }));

    // Sync ownership transfer to server
    fetch(`/api/media/${fileId}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetAddress,
        transferRecord,
        transaction: tx,
      }),
    }).catch(e => console.warn("Failed to sync transfer to server:", e));

    return {
      success: true,
      message: `Ownership successfully transferred to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)} on the Ethereum ledger.`,
      txHash,
    };
  };

  const toggleHostNodePin = async (fileId: string, nodeId: string): Promise<void> => {
    const file = mediaFiles.find(f => f.id === fileId);
    if (!file) return;

    const isCurrentlyPinned = file.pinningState.pinnedNodes.includes(nodeId);
    let newPinnedNodes = isCurrentlyPinned
      ? file.pinningState.pinnedNodes.filter(n => n !== nodeId)
      : [...file.pinningState.pinnedNodes, nodeId];

    if (newPinnedNodes.length === 0) {
      newPinnedNodes = ["node-local-validator-04"];
    }

    const updatedPinning = {
      ...file.pinningState,
      pinnedNodes: newPinnedNodes,
      replicationFactor: newPinnedNodes.length,
      isPinned: newPinnedNodes.length > 0,
      lastSyncTimestamp: Date.now(),
    };

    const gasFee = 0.001;
    const tx: SmartContractTransaction = {
      txHash: generateTxHash(),
      blockNumber: 19485000 + Math.floor(Math.random() * 5000),
      timestamp: Date.now(),
      from: currentUser?.address || "0x0000000000000000000000000000000000000000",
      to: SMART_CONTRACT_ADDRESS,
      method: 'pinToNode',
      status: 'confirmed',
      gasUsed: 42000,
      gasFeeEth: gasFee,
      fileId,
      fileName: file.name,
      eventLogs: [`PinningUpdated(fileId=${fileId}, nodes=${newPinnedNodes.length})`],
      params: {
        nodeId,
        action: isCurrentlyPinned ? 'unpinned' : 'pinned',
        replicationFactor: newPinnedNodes.length,
      }
    };

    updateBalance(-gasFee);
    setTransactions(prev => [tx, ...prev]);
    setMediaFiles(prev => prev.map(f => f.id === fileId ? { ...f, pinningState: updatedPinning } : f));

    // Sync pinning state to server
    fetch(`/api/media/${fileId}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinningState: updatedPinning, transaction: tx }),
    }).catch(e => console.warn("Failed to sync pin to server:", e));
  };

  const redeemAccessCode = async (
    codeOrCid: string
  ): Promise<{ success: boolean; file?: MediaFile; message: string }> => {
    const trimmed = codeOrCid.trim();
    if (!trimmed) {
      return { success: false, message: "Please enter a valid unique access code or IPFS CID." };
    }

    const userAddr = currentUser?.address || "";

    // 1. Attempt cross-device redemption on the server
    try {
      const res = await fetch('/api/media/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeOrCid: trimmed,
          requesterAddress: userAddr,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.file) {
        setMediaFiles(prev => {
          const exists = prev.some(f => f.id === data.file.id);
          if (exists) {
            return prev.map(f => f.id === data.file.id ? data.file : f);
          }
          return [data.file, ...prev];
        });
        setUnlockedFileIds(prev => prev.includes(data.file.id) ? prev : [...prev, data.file.id]);
        setSelectedFile(prev => prev && prev.id === data.file.id ? data.file : prev);
        return { success: true, file: data.file, message: data.message };
      } else if (res.status === 403) {
        return { success: false, message: data.message || "Access Denied: Private or restricted media." };
      }
    } catch (e) {
      console.warn("Server redeem error, falling back to local:", e);
    }

    // 2. Local fallback check
    let match = mediaFiles.find(f => 
      f.accessControl.uniqueAccessCode.toLowerCase() === trimmed.toLowerCase()
    );
    let matchedByCode = !!match;

    // Or match by IPFS CID
    if (!match) {
      match = mediaFiles.find(f => 
        f.ipfsCid.toLowerCase() === trimmed.toLowerCase()
      );
    }

    if (!match) {
      return {
        success: false,
        message: "No matching decentralized media record found for the provided access code or CID on any node."
      };
    }

    // STRICT PRIVACY RULES:
    const mode = match.accessControl.mode;
    const isOwner = currentUser && match.ownerAddress.toLowerCase() === currentUser.address.toLowerCase();
    const isWhitelisted = currentUser &&
      match.accessControl.allowedAddresses.some(a => a.toLowerCase() === currentUser.address.toLowerCase());

    if (mode === 'private') {
      if (!isOwner) {
        return {
          success: false,
          message: "Access Denied: This media record is marked strictly Private by its smart contract owner and cannot be accessed via code or CID."
        };
      }
    } else if (mode === 'restricted') {
      if (!isOwner && !isWhitelisted && !matchedByCode) {
        return {
          success: false,
          message: "Access Denied: This file has Restricted ACL. A valid secret access code is required to unlock."
        };
      }
    }

    // Increment redemption count
    const updatedACL = {
      ...match.accessControl,
      codeRedemptions: match.accessControl.codeRedemptions + 1,
    };

    setMediaFiles(prev => prev.map(f => f.id === match!.id ? { ...f, accessControl: updatedACL } : f));
    setUnlockedFileIds(prev => prev.includes(match!.id) ? prev : [...prev, match!.id]);
    setSelectedFile(prev => prev && prev.id === match!.id ? match : prev);

    return {
      success: true,
      file: match,
      message: `Access granted! Successfully unlocked "${match.name}" (${match.metadata.resolution || match.type.toUpperCase()}).`
    };
  };

  const toggleWatchlist = (fileId: string) => {
    setWatchlist(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [fileId, ...prev];
      }
    });
  };

  const addToWatchlist = (fileId: string) => {
    setWatchlist(prev => prev.includes(fileId) ? prev : [fileId, ...prev]);
  };

  const removeFromWatchlist = (fileId: string) => {
    setWatchlist(prev => prev.filter(id => id !== fileId));
  };

  const isWatchlisted = (fileId: string): boolean => {
    return watchlist.includes(fileId);
  };

  const deleteFile = async (fileId: string): Promise<void> => {
    const file = mediaFiles.find(f => f.id === fileId);
    
    // Remove from media files and watchlist
    setMediaFiles(prev => prev.filter(f => f.id !== fileId));
    setWatchlist(prev => prev.filter(id => id !== fileId));
    
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }

    // Sync deletion to server
    fetch(`/api/media/${fileId}`, { method: 'DELETE' }).catch(e => console.warn("Failed to delete on server:", e));

    // Register smart contract unpin / deletion audit record if file existed
    if (file && currentUser) {
      const gasFee = 0.0008;
      const tx: SmartContractTransaction = {
        txHash: generateTxHash(),
        blockNumber: 19485000 + Math.floor(Math.random() * 5000),
        timestamp: Date.now(),
        from: currentUser.address,
        to: SMART_CONTRACT_ADDRESS,
        method: 'revokeAccess',
        status: 'confirmed',
        gasUsed: 35000,
        gasFeeEth: gasFee,
        fileId,
        fileName: file.name,
        eventLogs: [`MediaUnpinnedAndRemoved(fileId=${fileId}, cid=${file.ipfsCid.slice(0, 10)}...)`],
        params: {
          fileId,
          cid: file.ipfsCid,
          action: 'unpin_and_purge',
        }
      };

      updateBalance(-gasFee);
      setTransactions(prev => [tx, ...prev]);
    }
  };

  const purgeAllFiles = () => {
    setMediaFiles([]);
    setWatchlist([]);
    setSelectedFile(null);
    localStorage.setItem(STORAGE_MEDIA_KEY, JSON.stringify([]));
    localStorage.setItem(STORAGE_WATCHLIST_KEY, JSON.stringify([]));
  };

  const resetToDefaultData = () => {
    setMediaFiles(INITIAL_MEDIA_FILES);
    setHostNodes(INITIAL_HOST_NODES);
    setTransactions(INITIAL_TRANSACTIONS);
    setWatchlist([]);
    localStorage.removeItem(STORAGE_MEDIA_KEY);
    localStorage.removeItem(STORAGE_HOSTS_KEY);
    localStorage.removeItem(STORAGE_TXS_KEY);
    localStorage.removeItem(STORAGE_WATCHLIST_KEY);
  };

  return (
    <DecentralMediaContext.Provider
      value={{
        mediaFiles,
        hostNodes,
        transactions,
        activeTab,
        setActiveTab,
        selectedFile,
        setSelectedFile,
        activeFilter,
        setActiveFilter,
        searchQuery,
        setSearchQuery,
        sortOption,
        setSortOption,
        watchlist,
        toggleWatchlist,
        removeFromWatchlist,
        addToWatchlist,
        isWatchlisted,
        uploadMedia,
        updateAccessControl,
        rotateAccessCode,
        transferOwnership,
        toggleHostNodePin,
        redeemAccessCode,
        checkFileAccess,
        unlockedFileIds,
        isUnlocked,
        deleteFile,
        purgeAllFiles,
        resetToDefaultData,
        refreshVault: fetchServerVault,
      }}
    >
      {children}
    </DecentralMediaContext.Provider>
  );
};

export const useDecentralMedia = () => {
  const context = useContext(DecentralMediaContext);
  if (!context) {
    throw new Error("useDecentralMedia must be used within a DecentralMediaProvider");
  }
  return context;
};
