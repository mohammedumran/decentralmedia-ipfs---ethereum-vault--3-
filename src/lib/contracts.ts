// Smart Contract Definition & ABI for Ethereum EVM Decentralized Storage Vault

export const SMART_CONTRACT_ADDRESS = "0xDECE9712aC0a6311E6a635DeB06292b3aD853A81";

export const SOLIDITY_CONTRACT_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DecentralMediaVault
 * @dev Cryptographic storage, access control, and ownership transfer ledger on Ethereum.
 */
contract DecentralMediaVault {
    enum AccessMode { Public, Private, Restricted }

    struct MediaRecord {
        string cid;                 // IPFS Content Identifier (v0 / v1)
        string metadataUri;         // IPFS URI to JSON metadata
        bytes32 sha256Hash;         // File integrity hash
        bytes32 secretCodeHash;     // Keccak256 hash of unique access code
        address owner;              // Current owner address
        AccessMode mode;            // Access control mode
        uint256 createdAt;          // Block timestamp
        uint256 accessCount;        // Total access redemptions
        bool isPinned;              // IPFS pinning state
    }

    // Storage mappings
    mapping(string => MediaRecord) private _records;
    mapping(string => mapping(address => bool)) private _allowedAddresses;
    mapping(address => string[]) private _userOwnedFiles;

    // Events
    event MediaStored(string indexed fileId, string cid, address indexed owner, AccessMode mode);
    event AccessGranted(string indexed fileId, address indexed targetUser);
    event AccessRevoked(string indexed fileId, address indexed targetUser);
    event AccessCodeRotated(string indexed fileId, bytes32 newCodeHash);
    event OwnershipTransferred(string indexed fileId, address indexed previousOwner, address indexed newOwner);
    event PinningStateUpdated(string indexed fileId, bool isPinned, uint8 replicationFactor);

    modifier onlyOwner(string memory fileId) {
        require(_records[fileId].owner == msg.sender, "Caller is not the media owner");
        _;
    }

    /**
     * @notice Registers a new IPFS media asset with metadata & secret access code hash
     */
    function storeMedia(
        string memory fileId,
        string memory cid,
        string memory metadataUri,
        bytes32 sha256Hash,
        bytes32 secretCodeHash,
        AccessMode mode
    ) external {
        require(bytes(_records[fileId].cid).length == 0, "File already registered");
        require(bytes(cid).length > 0, "Invalid IPFS CID");

        _records[fileId] = MediaRecord({
            cid: cid,
            metadataUri: metadataUri,
            sha256Hash: sha256Hash,
            secretCodeHash: secretCodeHash,
            owner: msg.sender,
            mode: mode,
            createdAt: block.timestamp,
            accessCount: 0,
            isPinned: true
        });

        _userOwnedFiles[msg.sender].push(fileId);
        emit MediaStored(fileId, cid, msg.sender, mode);
    }

    /**
     * @notice Grants access permission to a specific Ethereum address
     */
    function grantAccess(string memory fileId, address targetUser) external onlyOwner(fileId) {
        require(targetUser != address(0), "Invalid target address");
        _allowedAddresses[fileId][targetUser] = true;
        emit AccessGranted(fileId, targetUser);
    }

    /**
     * @notice Revokes access permission from a specific Ethereum address
     */
    function revokeAccess(string memory fileId, address targetUser) external onlyOwner(fileId) {
        _allowedAddresses[fileId][targetUser] = false;
        emit AccessRevoked(fileId, targetUser);
    }

    /**
     * @notice Rotates or updates the unique secret access code hash
     */
    function rotateAccessCode(string memory fileId, bytes32 newCodeHash) external onlyOwner(fileId) {
        _records[fileId].secretCodeHash = newCodeHash;
        emit AccessCodeRotated(fileId, newCodeHash);
    }

    /**
     * @notice Completely transfers ownership of the media record to a new address
     */
    function transferOwnership(string memory fileId, address newOwner) external onlyOwner(fileId) {
        require(newOwner != address(0), "New owner cannot be zero address");
        require(newOwner != msg.sender, "Already the owner");

        address previousOwner = _records[fileId].owner;
        _records[fileId].owner = newOwner;
        _userOwnedFiles[newOwner].push(fileId);

        emit OwnershipTransferred(fileId, previousOwner, newOwner);
    }

    /**
     * @notice Verifies if a user or code hash has authorization to access the media
     */
    function verifyAccess(string memory fileId, address user, string memory providedCode) external view returns (bool) {
        MediaRecord memory record = _records[fileId];
        if (record.mode == AccessMode.Public) return true;
        if (record.owner == user) return true;
        if (_allowedAddresses[fileId][user]) return true;

        if (bytes(providedCode).length > 0) {
            bytes32 hashedCode = keccak256(abi.encodePacked(providedCode));
            if (hashedCode == record.secretCodeHash) {
                return true;
            }
        }
        return false;
    }
}`;

export const SOLIDITY_VAULT_SOURCE = SOLIDITY_CONTRACT_SOURCE;

export const CONTRACT_ABI = [
  "function storeMedia(string fileId, string cid, string metadataUri, bytes32 sha256Hash, bytes32 secretCodeHash, uint8 mode) external",
  "function grantAccess(string fileId, address targetUser) external",
  "function revokeAccess(string fileId, address targetUser) external",
  "function rotateAccessCode(string fileId, bytes32 newCodeHash) external",
  "function transferOwnership(string fileId, address newOwner) external",
  "function verifyAccess(string fileId, address user, string providedCode) external view returns (bool)",
  "event MediaStored(string indexed fileId, string cid, address indexed owner, uint8 mode)",
  "event AccessGranted(string indexed fileId, address indexed targetUser)",
  "event AccessRevoked(string indexed fileId, address indexed targetUser)",
  "event AccessCodeRotated(string indexed fileId, bytes32 newCodeHash)",
  "event OwnershipTransferred(string indexed fileId, address indexed previousOwner, address indexed newOwner)"
];

export const SMART_CONTRACT_ABI = CONTRACT_ABI;
