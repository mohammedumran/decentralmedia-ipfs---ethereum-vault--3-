export type MediaType = 'image' | 'video';

export interface UserAccount {
  name: string;
  address: string; // 0x... Ethereum address
  privateKey: string; // 0x... private key
  mnemonic: string; // 12-word recovery phrase
  secretCode?: string; // 4-8 digit security PIN / secret access passcode
  createdAt: number;
  balanceEth: number;
  avatarSeed: string;
  role?: 'admin' | 'creator' | 'viewer';
  storageQuotaBytes?: number;
  storageUsedBytes?: number;
  email?: string; // Optional legacy compatibility
  phone?: string; // Optional legacy compatibility
}

export interface MediaMetadata {
  description: string;
  tags: string[];
  width?: number;
  height?: number;
  resolution?: string; // e.g. "1920x1080 (1080p FHD)"
  duration?: number; // in seconds for videos
  codec?: string; // e.g. "H.264 / AAC" or "WebP / Lossless"
  fps?: number;
  exifCamera?: string;
  customFields?: { key: string; value: string }[];
  encryption: 'none' | 'AES-GCM-256';
  unixFsChunkSize?: string;
}

export interface AccessControlRule {
  mode: 'public' | 'private' | 'restricted'; // public = anyone, private = owner only, restricted = whitelisted addresses or code
  allowedAddresses: string[];
  allowedEmails?: string[];
  uniqueAccessCode: string; // Secret share token (e.g. IPFS-SEC-9B3A-4F8E-1C72)
  codeRedemptions: number;
  allowDownload: boolean;
  expiresAt?: number; // timestamp or undefined
}

export interface PinningState {
  isPinned: boolean;
  pinnedNodes: string[];
  replicationFactor: number;
  primaryHostNodeId: string;
  storageUsageBytes: number;
  lastSyncTimestamp: number;
}

export interface OwnershipTransferRecord {
  id: string;
  fromAddress: string;
  toAddress: string;
  fromEmail?: string;
  toEmail?: string;
  timestamp: number;
  txHash: string;
  gasUsedEth: number;
  blockNumber: number;
  reason?: string;
}

export interface MediaFile {
  id: string;
  name: string;
  type: MediaType;
  mimeType: string;
  sizeBytes: number;
  url: string; // Data URL or Gateway Blob URL
  thumbnailUrl?: string;
  ipfsCid: string; // Qm... (v0) or bafy... (v1)
  cidVersion: 'v0' | 'v1';
  sha256Hash: string;
  keccak256Hash: string;
  uploadTimestamp: number;
  ownerAddress: string;
  ownerEmail?: string;
  metadata: MediaMetadata;
  accessControl: AccessControlRule;
  pinningState: PinningState;
  transferHistory: OwnershipTransferRecord[];
}

export interface SmartContractTransaction {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  method: 'storeMedia' | 'grantAccess' | 'revokeAccess' | 'transferOwnership' | 'rotateAccessCode' | 'pinToNode';
  status: 'confirmed' | 'pending' | 'reverted';
  gasUsed: number;
  gasFeeEth: number;
  fileId?: string;
  fileName?: string;
  eventLogs?: string[];
  params: Record<string, any>;
}

export interface HostNode {
  id: string;
  name: string;
  region: string;
  location: string;
  endpoint: string;
  status: 'online' | 'syncing' | 'offline';
  totalStorageGb: number;
  usedStorageGb: number;
  pinnedFilesCount: number;
  bandwidthMbps: number;
  uptimePercent: number;
  latencyMs: number;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  mediaReferenceId?: string;
  suggestedActions?: { label: string; action: string; payload?: any }[];
}

export type ViewTab = 'vault' | 'upload' | 'redeem' | 'hosts' | 'ledger' | 'assistant' | 'wallet';
