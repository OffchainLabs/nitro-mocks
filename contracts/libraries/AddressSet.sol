// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";

/**
 * @notice Mirror of arbos/addressSet/addressSet.go
 * @dev Size is stored at position 0, members are stored sequentially from position 1 onward
 */
library AddressSet {
    function isMember(
        address storageAddress,
        bytes memory subStorageKey,
        address addr
    ) internal view returns (bool) {
        ArbosStorage arbosStorage = ArbosStorage(storageAddress);
        
        bytes memory byAddressKey = arbosStorage.openSubStorage(subStorageKey, abi.encodePacked(bytes1(0x00)));
        
        bytes32 slot = arbosStorage.mapAddress(byAddressKey, bytes32(uint256(uint160(addr))));
        bytes32 value = arbosStorage.getStorageAt(slot);
        
        return value != bytes32(0);
    }

    function allMembers(
        address storageAddress,
        bytes memory subStorageKey,
        uint64 maxMembers
    ) internal view returns (address[] memory) {
        ArbosStorage arbosStorage = ArbosStorage(storageAddress);
        
        uint64 size = arbosStorage.getUint64(subStorageKey, 0);
        
        if (size > maxMembers) {
            size = maxMembers;
        }
        
        address[] memory members = new address[](size);
        for (uint64 i = 0; i < size; i++) {
            members[i] = arbosStorage.getAddr(subStorageKey, i + 1);
        }
        
        return members;
    }

    function add(
        address storageAddress,
        bytes memory subStorageKey,
        address addr
    ) internal {
        ArbosStorage arbosStorage = ArbosStorage(storageAddress);
        
        require(!isMember(storageAddress, subStorageKey, addr), "AddressSet: address already exists");
        
        uint64 size = arbosStorage.getUint64(subStorageKey, 0);
        uint64 newSize = size + 1;
        
        bytes memory byAddressKey = arbosStorage.openSubStorage(subStorageKey, abi.encodePacked(bytes1(0x00)));
        bytes32 addrAsHash = bytes32(uint256(uint160(addr)));
        bytes32 slotValue = bytes32(uint256(newSize));
        arbosStorage.setStorageAt(arbosStorage.mapAddress(byAddressKey, addrAsHash), slotValue);
        
        arbosStorage.setAddr(subStorageKey, newSize, addr);
        
        // go code does an increment - which always reads before writing
        arbosStorage.getUint64(subStorageKey, 0);
        arbosStorage.setUint64(subStorageKey, 0, newSize);
    }

    function remove(
        address storageAddress,
        bytes memory subStorageKey,
        address addr
    ) internal {
        ArbosStorage arbosStorage = ArbosStorage(storageAddress);
        
        bytes memory byAddressKey = arbosStorage.openSubStorage(subStorageKey, abi.encodePacked(bytes1(0x00)));
        bytes32 addrAsHash = bytes32(uint256(uint160(addr)));
        
        bytes32 slotValue = arbosStorage.getStorageAt(arbosStorage.mapAddress(byAddressKey, addrAsHash));
        uint64 slot = uint64(uint256(slotValue));
        
        require(slot != 0, "AddressSet: address does not exist");
        
        arbosStorage.setStorageAt(arbosStorage.mapAddress(byAddressKey, addrAsHash), bytes32(0));
        
        uint64 size = arbosStorage.getUint64(subStorageKey, 0);
        
        if (slot < size) {
            address lastAddr = arbosStorage.getAddr(subStorageKey, size);
            arbosStorage.setAddr(subStorageKey, slot, lastAddr);
            
            bytes32 lastAddrAsHash = bytes32(uint256(uint160(lastAddr)));
            arbosStorage.setStorageAt(arbosStorage.mapAddress(byAddressKey, lastAddrAsHash), bytes32(uint256(slot)));
        }
        
        arbosStorage.setAddr(subStorageKey, size, address(0));
        
        uint64 newSize = size - 1;
        // go code does an decrement - which always reads before writing
        arbosStorage.getUint64(subStorageKey, 0);
        arbosStorage.setUint64(subStorageKey, 0, newSize);
    }
}