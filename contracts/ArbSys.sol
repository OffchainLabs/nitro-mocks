// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ArbSys as IArbSys} from "../submodules/nitro-precompile-interfaces/ArbSys.sol";
import {ArbosStorage} from "./ArbosStorage.sol";
import {ArbosState, MerkleAccumulatorStorage, BlockHashesStorage} from "./libraries/ArbosState.sol";
import {MerkleAccumulator} from "./libraries/MerkleAccumulator.sol";
import {BlockHashes} from "./libraries/BlockHashes.sol";

contract ArbSys is IArbSys {
    using MerkleAccumulator for MerkleAccumulatorStorage;
    using BlockHashes for BlockHashesStorage;
    
    address constant ARBOS_STORAGE_ADDRESS = 0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf;
    address constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
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

    function sendTxToL1(address destination, bytes memory data) public payable override returns (uint256) {
        uint256 l1BlockNum = ArbosState.blockHashes().l1BlockNumber();
        
        bytes32 sendHash = keccak256(abi.encodePacked(
            msg.sender,
            destination,
            bytes32(block.number),
            bytes32(l1BlockNum),
            bytes32(block.timestamp),
            bytes32(msg.value),
            data
        ));
        
        MerkleAccumulatorStorage memory merkleAcc = ArbosState.sendMerkleAccumulator();
        MerkleAccumulator.MerkleTreeNodeEvent[] memory merkleUpdateEvents = merkleAcc.append(sendHash);
        
        uint256 size = merkleAcc.size();
        
        if (msg.value > 0) {
            (bool success, ) = BURN_ADDRESS.call{value: msg.value}("");
            require(success, "Burn transfer failed");
        }

        for (uint256 i = 0; i < merkleUpdateEvents.length; i++) {
            uint256 position = (uint256(merkleUpdateEvents[i].level) << 192) | uint256(merkleUpdateEvents[i].numLeaves);
            emit SendMerkleUpdate(
                0,
                merkleUpdateEvents[i].hash,
                position
            );
        }
        
        uint256 leafNum = size - 1;
        
        _emitL2ToL1TxWithParams(sendHash, leafNum, destination, l1BlockNum, data);
        
        return leafNum;
    }
    
    function _emitL2ToL1TxWithParams(
        bytes32 sendHash,
        uint256 leafNum,
        address destination,
        uint256 l1BlockNum,
        bytes memory data
    ) private {
        emit L2ToL1Tx(
            msg.sender,
            destination,
            uint256(sendHash),
            leafNum,
            block.number,
            l1BlockNum,
            block.timestamp,
            msg.value,
            data
        );
    }

    function sendMerkleTreeState() external view override returns (uint256, bytes32, bytes32[] memory) {
        if (msg.sender != address(0)) {
            revert("method can only be called by address zero");
        }
        
        (uint64 size, bytes32 rootHash, bytes32[] memory partials) = ArbosState.sendMerkleAccumulator().stateForExport();
        
        return (uint256(size), rootHash, partials);
    }

    function withdrawEth(address destination) external payable override returns (uint256) {
        return sendTxToL1(destination, "");
    }

    function getStorageGasAvailable() external view override returns (uint256) {
        ArbosState.version();
        return 0;
    }
}