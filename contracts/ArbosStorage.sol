// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ArbosStorage {
    uint256 private constant VERSION_OFFSET = 0;
    uint256 private constant UPGRADE_VERSION_OFFSET = 1;
    uint256 private constant UPGRADE_TIMESTAMP_OFFSET = 2;
    uint256 private constant NETWORK_FEE_ACCOUNT_OFFSET = 3;
    uint256 private constant CHAIN_ID_OFFSET = 4;
    uint256 private constant GENESIS_BLOCK_NUM_OFFSET = 5;
    uint256 private constant INFRA_FEE_ACCOUNT_OFFSET = 6;
    uint256 private constant BROTLI_COMPRESSION_LEVEL_OFFSET = 7;
    uint256 private constant NATIVE_TOKEN_ENABLED_TIME_OFFSET = 8;
    
    /**
     * @dev Maps a key to a storage slot using ArbOS's special storage mapping algorithm.
     * 
     * This function preserves contiguity within 256-slot "pages" while providing 
     * collision resistance. It works by:
     * 
     * 1. Taking the first 31 bytes of the input key (bytes 0-30)
     * 2. Hashing these 31 bytes with keccak256
     * 3. Taking the first 31 bytes of this hash
     * 4. Appending the original key's last byte (byte 31) to the hash
     * 
     * This means keys that have identical first 31 bytes will map to consecutive
     * storage slots, creating 256-slot "pages". For example:
     * - key 0xAABBCC...(31 bytes)...00 maps to slot 0xHHHH...00
     * - key 0xAABBCC...(31 bytes)...01 maps to slot 0xHHHH...01
     * - key 0xAABBCC...(31 bytes)...FF maps to slot 0xHHHH...FF
     * where HHHH... = keccak256(0xAABBCC...)[0:31]
     * 
     * This is useful for array-like structures where sequential access patterns
     * benefit from storage locality.
     * 
     * Note: For root storage (this contract), the storageKey prefix is empty.
     * Subspaces would prepend their own prefix before hashing.
     */
    function mapAddress(bytes32 key) public pure returns (bytes32 result) {
        assembly {
            let freeMemPtr := mload(0x40)
            mstore(freeMemPtr, key)
            // Hash first 31 bytes, then append the last byte
            result := or(
                and(keccak256(freeMemPtr, 31), 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00),
                and(key, 0xff)
            )
        }
    }
    
    function getUint64(uint256 offset) internal view returns (uint64) {
        bytes32 slot = mapAddress(bytes32(offset));
        bytes32 value;
        assembly {
            value := sload(slot)
        }
        return uint64(uint256(value));
    }
    
    function setUint64(uint256 offset, uint64 value) internal {
        bytes32 slot = mapAddress(bytes32(offset));
        assembly {
            sstore(slot, value)
        }
    }
    
    function getAddress(uint256 offset) internal view returns (address) {
        bytes32 slot = mapAddress(bytes32(offset));
        bytes32 value;
        assembly {
            value := sload(slot)
        }
        return address(uint160(uint256(value)));
    }
    
    function setAddress(uint256 offset, address value) internal {
        bytes32 slot = mapAddress(bytes32(offset));
        assembly {
            sstore(slot, value)
        }
    }
    
    function getUint256(uint256 offset) internal view returns (uint256) {
        bytes32 slot = mapAddress(bytes32(offset));
        bytes32 value;
        assembly {
            value := sload(slot)
        }
        return uint256(value);
    }
    
    function setUint256(uint256 offset, uint256 value) internal {
        bytes32 slot = mapAddress(bytes32(offset));
        assembly {
            sstore(slot, value)
        }
    }
    
    function getVersion() external view returns (uint64) {
        return getUint64(VERSION_OFFSET);
    }
    
    function setVersion(uint64 _version) external {
        setUint64(VERSION_OFFSET, _version);
    }
    
    function getNetworkFeeAccount() external view returns (address) {
        return getAddress(NETWORK_FEE_ACCOUNT_OFFSET);
    }
    
    function setNetworkFeeAccount(address _account) external {
        setAddress(NETWORK_FEE_ACCOUNT_OFFSET, _account);
    }
    
    function getChainId() external view returns (uint256) {
        return getUint256(CHAIN_ID_OFFSET);
    }
    
    function setChainId(uint256 _chainId) external {
        setUint256(CHAIN_ID_OFFSET, _chainId);
    }
    
    function getStorageAt(bytes32 slot) external view returns (bytes32 value) {
        assembly {
            value := sload(slot)
        }
    }
    
    function setStorageAt(bytes32 slot, bytes32 value) external {
        assembly {
            sstore(slot, value)
        }
    }
}