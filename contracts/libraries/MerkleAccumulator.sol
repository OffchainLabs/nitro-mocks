// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";
import {ArbosState, Storage} from "./ArbosState.sol";

struct MerkleAccumulatorStorage {
    Storage store;
}


/// @title  Uint utils library
/// @notice Some additional bit inspection tools
library UintUtilsLib {
    /// @notice The least significant bit in the bit representation of a uint
    /// @dev    Zero indexed from the least sig bit. Eg 1010 => 1, 1100 => 2, 1001 => 0
    ///         Finds lsb in linear (uint size) time
    /// @param x Cannot be zero, since zero that has no signficant bits
    function leastSignificantBit(
        uint256 x
    ) internal pure returns (uint256 msb) {
        require(x > 0, "Zero has no significant bits");

        // isolate the least sig bit
        uint256 isolated = ((x - 1) & x) ^ x;

        // since we removed all higher bits, least sig == most sig
        return mostSignificantBit(isolated);
    }

    /// @notice The most significant bit in the bit representation of a uint
    /// @dev    Zero indexed from the least sig bit. Eg 1010 => 3, 110 => 2, 1 => 0
    ///         Taken from https://solidity-by-example.org/bitwise/
    ///         Finds msb in log (uint size) time
    /// @param x Cannot be zero, since zero has no sigificant bits
    function mostSignificantBit(
        uint256 x
    ) internal pure returns (uint256 msb) {
        require(x != 0, "Zero has no significant bits");

        // x >= 2 ** 128
        if (x >= 0x100000000000000000000000000000000) {
            x >>= 128;
            msb += 128;
        }
        // x >= 2 ** 64
        if (x >= 0x10000000000000000) {
            x >>= 64;
            msb += 64;
        }
        // x >= 2 ** 32
        if (x >= 0x100000000) {
            x >>= 32;
            msb += 32;
        }
        // x >= 2 ** 16
        if (x >= 0x10000) {
            x >>= 16;
            msb += 16;
        }
        // x >= 2 ** 8
        if (x >= 0x100) {
            x >>= 8;
            msb += 8;
        }
        // x >= 2 ** 4
        if (x >= 0x10) {
            x >>= 4;
            msb += 4;
        }
        // x >= 2 ** 2
        if (x >= 0x4) {
            x >>= 2;
            msb += 2;
        }
        // x >= 2 ** 1
        if (x >= 0x2) msb += 1;
    }
}

library MerkleAccumulator {
    using MerkleAccumulator for MerkleAccumulatorStorage;
    using UintUtilsLib for uint256;
    
    uint256 internal constant SIZE_OFFSET = 0;
    
    struct MerkleTreeNodeEvent {
        uint64 level;
        uint64 numLeaves;
        bytes32 hash;
    }
    
    function calcNumPartials(uint64 _size) internal pure returns (uint64) {
        if (_size == 0) return 0;
        
        // Go's Log2ceil returns 64 - LeadingZeros64(value)
        // This is equivalent to the position of the highest set bit (1-indexed)
        // The UintUtilsLib.mostSignificantBit returns 0-indexed position,
        // so we need to add 1 to match Go's behavior
        
        // Cast to uint256 for the library call, then back to uint64
        return uint64(uint256(_size).mostSignificantBit() + 1);
    }
    
    function getPartial(MerkleAccumulatorStorage memory self, uint64 level) internal view returns (bytes32) {
        return ArbosStorage(self.store.addr).getBytes32(self.store.key, 2 + level);
    }
    
    function getPartials(MerkleAccumulatorStorage memory self) internal view returns (bytes32[] memory) {
        uint64 _size = self.size();
        uint64 numPartials = calcNumPartials(_size);
        bytes32[] memory partials = new bytes32[](numPartials);
        
        for (uint64 i = 0; i < numPartials; i++) {
            partials[i] = self.getPartial(i);
        }
        
        return partials;
    }
    
    function setPartial(MerkleAccumulatorStorage memory self, uint64 level, bytes32 val) internal {
        ArbosStorage(self.store.addr).setBytes32(self.store.key, 2 + level, val);
    }
    
    function append(
        MerkleAccumulatorStorage memory self,
        bytes32 itemHash
    ) internal returns (MerkleTreeNodeEvent[] memory) {
        ArbosStorage arbosStorage = ArbosStorage(self.store.addr);
        
        uint64 size = self.size() + 1;
        arbosStorage.setUint64(self.store.key, SIZE_OFFSET, size);
        
        // In worst case, we'll have log2(size) events
        MerkleTreeNodeEvent[] memory events = new MerkleTreeNodeEvent[](64);
        uint64 eventCount = 0;
        
        uint64 level = 0;
        bytes32 soFar = keccak256(abi.encodePacked(itemHash));
        
        while (true) {
            if (level == calcNumPartials(size - 1)) { // -1 to counteract the size++ at top
                self.setPartial(level, soFar);
                break;
            }
            
            bytes32 thisLevel = self.getPartial(level);
            if (thisLevel == bytes32(0)) {
                self.setPartial(level, soFar);
                break;
            }
            
            soFar = keccak256(abi.encodePacked(thisLevel, soFar));
            
            self.setPartial(level, bytes32(0));
            
            level += 1;
            
            events[eventCount] = MerkleTreeNodeEvent({
                level: level,
                numLeaves: size - 1,
                hash: soFar
            });
            eventCount++;
        }
        
        MerkleTreeNodeEvent[] memory finalEvents = new MerkleTreeNodeEvent[](eventCount);
        for (uint64 i = 0; i < eventCount; i++) {
            finalEvents[i] = events[i];
        }
        
        return finalEvents;
    }
    
    function size(MerkleAccumulatorStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, SIZE_OFFSET);
    }
    
    function incrementSize(MerkleAccumulatorStorage memory self) internal returns (uint64) {
        uint64 currentSize = self.size();
        uint64 newSize = currentSize + 1;
        ArbosStorage(self.store.addr).setUint64(self.store.key, SIZE_OFFSET, newSize);
        return newSize;
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