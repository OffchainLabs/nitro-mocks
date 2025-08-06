// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosState, BlockHashesStorage} from "../libraries/ArbosState.sol";
import {BlockHashes} from "../libraries/BlockHashes.sol";
import {ArbosStorage} from "../ArbosStorage.sol";

contract TestUtils {
    using BlockHashes for BlockHashesStorage;
    
    address constant ARBOS_STORAGE_ADDRESS = 0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf;
    
    function setL1BlockNumber(uint64 blockNumber) external {
        BlockHashesStorage memory blockHashesStorage = ArbosState.blockHashes();
        ArbosStorage(ARBOS_STORAGE_ADDRESS).setUint64(blockHashesStorage.store.key, 0, blockNumber);
    }
    
    function getL1BlockNumber() external view returns (uint64) {
        BlockHashesStorage memory blockHashesStorage = ArbosState.blockHashes();
        return blockHashesStorage.l1BlockNumber();
    }
}