// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";

/**
 * @notice Mirrors the Go implementation of arbos/addressSet/addressSet.go
 * @dev Size is stored at position 0, members are stored sequentially from position 1 onward
 */
library AddressSet {
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
}