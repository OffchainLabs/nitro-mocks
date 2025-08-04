// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ArbSys as IArbSys} from "../submodules/nitro-precompile-interfaces/ArbSys.sol";
import {ArbosStorage} from "./ArbosStorage.sol";
import {ArbosState, MerkleAccumulatorStorage} from "./libraries/ArbosState.sol";
import {MerkleAccumulator} from "./libraries/MerkleAccumulator.sol";

contract ArbSys is IArbSys {
    using MerkleAccumulator for MerkleAccumulatorStorage;
    
    address constant ARBOS_STORAGE_ADDRESS = 0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf;
    function arbBlockNumber() external view override returns (uint256) {
        return block.number;
    }

    function arbBlockHash(uint256 arbBlockNum) external view override returns (bytes32) {
        uint256 currentBlockNum = block.number;
        if (arbBlockNum >= currentBlockNum || arbBlockNum + 256 < currentBlockNum) {
            revert InvalidBlockNumber(arbBlockNum, currentBlockNum);
        }
        return blockhash(arbBlockNum);
    }

    function arbChainID() external view override returns (uint256) {
        return block.chainid;
    }

    function arbOSVersion() external view override returns (uint256) {
        return ArbosState.version() + 55;
    }

    function isTopLevelCall() external view override returns (bool) {
        revert("Not implemented");
    }

    function wasMyCallersAddressAliased() external view override returns (bool) {
        revert("Not implemented");
    }

    function myCallersAddressWithoutAliasing() external view override returns (address) {
        revert("Not implemented");
    }

    function mapL1SenderContractAddressToL2Alias(address sender, address) external pure override returns (address) {
        uint160 offset = uint160(0x1111000000000000000000000000000000001111);
        uint160 sum = uint160(sender) + offset;
        return address(sum);
    }

    function sendTxToL1(address, bytes calldata) external payable override returns (uint256) {
        revert("Not implemented");
    }

    function sendMerkleTreeState() external view override returns (uint256, bytes32, bytes32[] memory) {
        if (msg.sender != address(0)) {
            bytes32[] memory emptyPartials;
            return (0, bytes32(0), emptyPartials);
        }
        
        (uint64 size, bytes32 rootHash, bytes32[] memory partials) = ArbosState.sendMerkleAccumulator().stateForExport();
        
        return (uint256(size), rootHash, partials);
    }

    function withdrawEth(address) external payable override returns (uint256) {
        revert("Not implemented");
    }

    function getStorageGasAvailable() external view override returns (uint256) {
        revert("Not implemented");
    }
}