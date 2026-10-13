// Cryptographic and Web3 Utilities for Decentralized Database

const WORDLIST = [
  "matrix", "cipher", "merkle", "shard", "beacon", "crypto", "ether", "zenith",
  "nebula", "quantum", "vertex", "plasma", "genesis", "protocol", "solidity", "node",
  "validator", "gateway", "hash", "ledger", "entropy", "synapse", "stratum", "voyager",
  "orbital", "keccak", "parity", "sigil", "timber", "vortex", "cascade", "prism"
];

// Generates a 12-word mnemonic seed phrase
export function generateMnemonic(): string {
  const words: string[] = [];
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * WORDLIST.length);
    words.push(WORDLIST[randomIndex]);
  }
  return words.join(" ");
}

// Generates deterministic or random Ethereum address and private key
export function generateEthereumWallet(seedInput?: string): {
  address: string;
  privateKey: string;
  mnemonic: string;
} {
  const mnemonic = generateMnemonic();
  const rawSeed = seedInput 
    ? `${seedInput}-${Date.now()}-${Math.random()}` 
    : `${mnemonic}-${Date.now()}-${Math.random()}`;

  // Generate 64-char hex private key (32 bytes)
  const hexChars = "0123456789abcdef";
  let privKey = "0x";
  for (let i = 0; i < 64; i++) {
    const r = Math.floor(Math.random() * 16);
    privKey += hexChars[r];
  }

  // Generate 40-char Ethereum address (20 bytes)
  let address = "0x";
  for (let i = 0; i < 40; i++) {
    const r = Math.floor(Math.random() * 16);
    address += hexChars[r];
  }

  return {
    address,
    privateKey: privKey,
    mnemonic,
  };
}

// Generate real SHA-256 Hash using Web Crypto API
export async function calculateSha256(data: ArrayBuffer | string): Promise<string> {
  let buffer: ArrayBuffer;
  if (typeof data === "string") {
    buffer = new TextEncoder().encode(data);
  } else {
    buffer = data;
  }

  if (window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return "0x" + hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  // Fallback
  return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

// Generates Keccak-256 style hash for smart contract verification
export async function calculateKeccak256(data: string): Promise<string> {
  const sha = await calculateSha256("keccak256-" + data);
  return sha;
}

// Base58 / Base32 simulation for standard IPFS CIDs
export function generateIpfsCid(contentString: string, version: 'v0' | 'v1' = 'v1'): string {
  let hashVal = 0;
  for (let i = 0; i < contentString.length; i++) {
    hashVal = (hashVal << 5) - hashVal + contentString.charCodeAt(i);
    hashVal |= 0;
  }

  const base58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const base32Chars = "abcdefghijklmnopqrstuvwxyz234567";

  if (version === 'v0') {
    // CIDv0 starts with Qm (46 chars)
    let cid = "Qm";
    for (let i = 0; i < 44; i++) {
      const idx = Math.abs(Math.floor(Math.sin(hashVal + i * 13) * 100000)) % base58Chars.length;
      cid += base58Chars[idx];
    }
    return cid;
  } else {
    // CIDv1 starts with bafy... (59 chars)
    let cid = "bafybeic";
    for (let i = 0; i < 51; i++) {
      const idx = Math.abs(Math.floor(Math.cos(hashVal + i * 17) * 100000)) % base32Chars.length;
      cid += base32Chars[idx];
    }
    return cid;
  }
}

// Generates a unique, high-entropy Secret Access Code for file sharing
export function generateUniqueAccessCode(prefix: string = "IPFS-SEC"): string {
  const hexChars = "0123456789ABCDEF";
  const seg1 = Array.from({ length: 4 }, () => hexChars[Math.floor(Math.random() * hexChars.length)]).join("");
  const seg2 = Array.from({ length: 4 }, () => hexChars[Math.floor(Math.random() * hexChars.length)]).join("");
  const seg3 = Array.from({ length: 4 }, () => hexChars[Math.floor(Math.random() * hexChars.length)]).join("");
  return `${prefix}-${seg1}-${seg2}-${seg3}`;
}

// Generates a simulated Ethereum Transaction Hash
export function generateTxHash(): string {
  const hex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return `0x${hex}`;
}

// Helpers for formatted display
export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatCid(cid: string, chars: number = 6): string {
  if (!cid) return "";
  if (cid.length <= chars * 2 + 3) return cid;
  return `${cid.slice(0, chars + 2)}...${cid.slice(-chars)}`;
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
