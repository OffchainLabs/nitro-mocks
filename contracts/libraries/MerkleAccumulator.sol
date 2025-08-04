// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";
import {ArbosState, Storage} from "./ArbosState.sol";

struct MerkleAccumulatorStorage {
    Storage store;
}

library MerkleAccumulator {
    using MerkleAccumulator for MerkleAccumulatorStorage;
    
    uint256 internal constant SIZE_OFFSET = 0;
    
    function size(MerkleAccumulatorStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, SIZE_OFFSET);
    }
    
    function getPartial(MerkleAccumulatorStorage memory self, uint64 level) internal view returns (bytes32) {
        return ArbosStorage(self.store.addr).getBytes32(self.store.key, 2 + level);
    }
    
    function calcNumPartials(uint64 _size) internal pure returns (uint64) {
        if (_size == 0) return 0;
        uint64 bits = 0;
        uint64 n = _size - 1;
        while (n > 0) {
            bits++;
            n >>= 1;
        }
        return bits + 1;
    }
    
    function root(MerkleAccumulatorStorage memory self) internal view returns (bytes32) {
        uint64 _size = self.size();
        if (_size == 0) {
            return bytes32(0);
        }
        
        bytes32 hashSoFar;
        uint64 capacityInHash = 0;
        uint64 capacity = 1;
        uint64 numPartials = calcNumPartials(_size);
        
        for (uint64 level = 0; level < numPartials; level++) {
            bytes32 partialHash = self.getPartial(level);
            if (partialHash != bytes32(0)) {
                if (capacityInHash == 0) {
                    hashSoFar = partialHash;
                    capacityInHash = capacity;
                } else {
                    while (capacityInHash < capacity) {
                        hashSoFar = keccak256(abi.encodePacked(hashSoFar, bytes32(0)));
                        capacityInHash *= 2;
                    }
                    hashSoFar = keccak256(abi.encodePacked(partialHash, hashSoFar));
                    capacityInHash = 2 * capacity;
                }
            }
            capacity *= 2;
        }
        return hashSoFar;
    }
    
    function stateForExport(MerkleAccumulatorStorage memory self) internal view returns (uint64, bytes32, bytes32[] memory) {
        bytes32 _root = self.root();
        uint64 _size = self.size();
        uint64 numPartials = calcNumPartials(_size);
        bytes32[] memory partials = new bytes32[](numPartials);
        
        for (uint64 i = 0; i < numPartials; i++) {
            partials[i] = self.getPartial(i);
        }
        
        return (_size, _root, partials);
    }
}