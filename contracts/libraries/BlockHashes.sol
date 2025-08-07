// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";
import {Storage, ArbosState} from "./ArbosState.sol";

struct BlockHashesStorage {
    Storage store;
}

library BlockHashes {
    uint256 internal constant L1_BLOCK_NUMBER_OFFSET = 0;

    function l1BlockNumber(BlockHashesStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, L1_BLOCK_NUMBER_OFFSET);
    }

    function recordNewL1Block(BlockHashesStorage memory self, uint64 number, bytes32 blockHash, uint64 arbosVersion)
        internal
    {
        uint64 nextNumber = l1BlockNumber(self);

        if (number < nextNumber) {
            return;
        }

        if (nextNumber + 256 < number) {
            // No need to record hashes that we're just going to discard
            nextNumber = number - 256;
        }

        while (nextNumber + 1 < number) {
            nextNumber++;
            bytes memory nextNumBuf = new bytes(8);
            if (arbosVersion >= 8) {
                // Little-endian encoding of nextNumber
                for (uint256 i = 0; i < 8; i++) {
                    nextNumBuf[i] = bytes1(uint8(nextNumber >> (i * 8)));
                }
            }

            bytes32 fill = keccak256(abi.encodePacked(blockHash, nextNumBuf));
            ArbosStorage(self.store.addr).setBytes32(self.store.key, 1 + (nextNumber % 256), fill);
        }

        ArbosStorage(self.store.addr).setBytes32(self.store.key, 1 + (number % 256), blockHash);

        ArbosStorage(self.store.addr).setUint64(self.store.key, L1_BLOCK_NUMBER_OFFSET, number + 1);
    }
}
