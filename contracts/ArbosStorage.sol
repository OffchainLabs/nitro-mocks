// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ArbosStorage {
    function openSubStorage(bytes memory parentKey, bytes memory subStorageId) public pure returns (bytes memory) {
        return abi.encodePacked(keccak256(abi.encodePacked(parentKey, subStorageId)));
    }

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
    function mapAddress(bytes memory storageKey, bytes32 key) public pure returns (bytes32 result) {
        bytes memory keyFirst31 = new bytes(31);
        for (uint256 i = 0; i < 31; i++) {
            keyFirst31[i] = key[i];
        }

        bytes32 hashed = keccak256(abi.encodePacked(storageKey, keyFirst31));

        assembly {
            result :=
                or(and(hashed, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00), and(key, 0xff))
        }
    }

    function getUint64(bytes memory storageKey, uint256 offset) external view returns (uint64) {
        bytes32 slot = mapAddress(storageKey, bytes32(offset));
        uint256 value;
        assembly {
            value := sload(slot)
        }
        return uint64(value);
    }

    function setUint64(bytes memory storageKey, uint256 offset, uint64 value) external {
        bytes32 slot = mapAddress(storageKey, bytes32(offset));
        assembly {
            sstore(slot, value)
        }
    }

    function getAddr(bytes memory storageKey, uint256 offset) external view returns (address) {
        bytes32 slot = mapAddress(storageKey, bytes32(offset));
        uint256 value;
        assembly {
            value := sload(slot)
        }
        return address(uint160(value));
    }

    function setAddr(bytes memory storageKey, uint256 offset, address value) external {
        bytes32 slot = mapAddress(storageKey, bytes32(offset));
        assembly {
            sstore(slot, value)
        }
    }

    function getUint256(bytes memory storageKey, uint256 offset) external view returns (uint256) {
        bytes32 slot = mapAddress(storageKey, bytes32(offset));
        bytes32 value;
        assembly {
            value := sload(slot)
        }
        return uint256(value);
    }

    function setUint256(bytes memory storageKey, uint256 offset, uint256 value) external {
        bytes32 slot = mapAddress(storageKey, bytes32(offset));
        assembly {
            sstore(slot, value)
        }
    }

    function getInt64(bytes memory storageKey, uint256 offset) external view returns (int64) {
        bytes32 slot = mapAddress(storageKey, bytes32(offset));
        uint256 value;
        assembly {
            value := sload(slot)
        }
        return int64(uint64(value));
    }

    function setInt64(bytes memory storageKey, uint256 offset, int64 value) external {
        bytes32 slot = mapAddress(storageKey, bytes32(offset));
        uint256 uintValue = uint256(uint64(value));
        assembly {
            sstore(slot, uintValue)
        }
    }

    function getBytes32(bytes memory storageKey, uint256 offset) external view returns (bytes32) {
        bytes32 slot = mapAddress(storageKey, bytes32(offset));
        bytes32 value;
        assembly {
            value := sload(slot)
        }
        return value;
    }

    function setBytes32(bytes memory storageKey, uint256 offset, bytes32 value) external {
        bytes32 slot = mapAddress(storageKey, bytes32(offset));
        assembly {
            sstore(slot, value)
        }
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
