import { MediaFile, HostNode, SmartContractTransaction, UserAccount } from '../types';
import { generateUniqueAccessCode } from './crypto';

export const INITIAL_USERS: UserAccount[] = [
  {
    address: "0x32a30c65da6957229b38c59ca34054662e3576cd",
    name: "Public Explorer",
    balanceEth: 0.05,
    privateKey: "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
    mnemonic: "matrix cipher merkle shard beacon crypto ether zenith nebula quantum vertex plasma",
    secretCode: "2026",
    avatarSeed: "public-explorer",
    role: "creator",
    storageQuotaBytes: 10 * 1024 * 1024 * 1024,
    storageUsedBytes: 1341868,
    createdAt: 1790758300000,
  }
];

export const INITIAL_HOST_NODES: HostNode[] = [
  {
    id: "node-us-east-01",
    name: "Helia IPFS Gateway (US-East)",
    region: "North Virginia, USA",
    location: "US East (N. Virginia)",
    endpoint: "https://ipfs.us-east.decentralmedia.eth:8080",
    status: "online",
    totalStorageGb: 1024,
    usedStorageGb: 0,
    pinnedFilesCount: 0,
    bandwidthMbps: 950,
    uptimePercent: 99.98,
    latencyMs: 24,
  },
  {
    id: "node-eu-central-02",
    name: "Pinata Cluster Node (EU-Central)",
    region: "Frankfurt, Germany",
    location: "EU Central (Frankfurt)",
    endpoint: "https://gateway.pinata.cloud/ipfs",
    status: "online",
    totalStorageGb: 2048,
    usedStorageGb: 0,
    pinnedFilesCount: 0,
    bandwidthMbps: 1200,
    uptimePercent: 99.99,
    latencyMs: 42,
  },
  {
    id: "node-ap-sg-03",
    name: "Cloudflare Web3 Relay (AP-SouthEast)",
    region: "Singapore",
    location: "Asia Pacific (Singapore)",
    endpoint: "https://cloudflare-ipfs.com/ipfs",
    status: "online",
    totalStorageGb: 1500,
    usedStorageGb: 0,
    pinnedFilesCount: 0,
    bandwidthMbps: 880,
    uptimePercent: 99.95,
    latencyMs: 65,
  },
  {
    id: "node-local-validator-04",
    name: "Local Swarm Validator Node",
    region: "Self-Hosted Edge Docker",
    location: "Localhost:5001",
    endpoint: "http://127.0.0.1:8080/ipfs",
    status: "online",
    totalStorageGb: 512,
    usedStorageGb: 0,
    pinnedFilesCount: 0,
    bandwidthMbps: 450,
    uptimePercent: 99.82,
    latencyMs: 5,
  }
];

export const INITIAL_MEDIA_FILES: MediaFile[] = [
  {
    id: "med-prism-art-01",
    name: "Prism_Geometry_Art.jpg",
    type: "image",
    mimeType: "image/jpeg",
    sizeBytes: 675958,
    url: "/uploads/vault_master_artwork.jpg",
    thumbnailUrl: "/uploads/vault_master_artwork.jpg",
    ipfsCid: "bafybeicikwtuoqjt3fye3cua3nyzwibanrreg7rvmqcvh7kyr3ioke54qj",
    cidVersion: "v1",
    sha256Hash: "0x1ebf0611fc8e6ccc588cca857a6a339d2f9d902389eb9597e58e74fe229c17ff",
    keccak256Hash: "0xd2b35cfb779c8949555007eb1d95dd43e62e7ee94de771f3eaa0208ea9143eec",
    uploadTimestamp: 1791398228036,
    ownerAddress: "0x32a30c65da6957229b38c59ca34054662e3576cd",
    metadata: {
      description: "Decentralized geometric architectural art pinned across IPFS swarm nodes.",
      tags: ["Decentralized", "IPFS", "Architecture", "FineArt"],
      width: 1792,
      height: 1024,
      resolution: "1792x1024",
      codec: "JPEG / High-Fidelity",
      customFields: [],
      encryption: "none",
      unixFsChunkSize: "256 KB DAG-PB"
    },
    accessControl: {
      mode: "restricted",
      allowedAddresses: [],
      allowedEmails: [],
      uniqueAccessCode: "IPFS-SEC-6926-4CC1-8243",
      codeRedemptions: 0,
      allowDownload: true
    },
    pinningState: {
      isPinned: true,
      pinnedNodes: ["node-us-east-01", "node-eu-central-02"],
      replicationFactor: 2,
      primaryHostNodeId: "node-us-east-01",
      storageUsageBytes: 675958,
      lastSyncTimestamp: 1791398228036
    },
    transferHistory: []
  }
];

export const INITIAL_TRANSACTIONS: SmartContractTransaction[] = [];
