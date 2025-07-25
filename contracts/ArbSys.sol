// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ArbSys as IArbSys} from "../submodules/nitro-precompile-interfaces/ArbSys.sol";
import {ArbosStorage} from "./ArbosStorage.sol";

contract ArbSys is IArbSys {
    address constant ARBOS_STORAGE_ADDRESS = 0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf;
    function arbBlockNumber() external view override returns (uint256) {
        revert("Not implemented");
    }

    function arbBlockHash(uint256) external view override returns (bytes32) {
        revert("Not implemented");
    }

    function arbChainID() external view override returns (uint256) {
        return block.chainid;
    }

    function arbOSVersion() external view override returns (uint256) {
        revert("Not implemented");
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

    function mapL1SenderContractAddressToL2Alias(address, address) external pure override returns (address) {
        revert("Not implemented");
    }

    function sendTxToL1(address, bytes calldata) external payable override returns (uint256) {
        revert("Not implemented");
    }

    function sendMerkleTreeState() external view override returns (uint256, bytes32, bytes32[] memory) {
        revert("Not implemented");
    }

    function withdrawEth(address) external payable override returns (uint256) {
        revert("Not implemented");
    }

    function getStorageGasAvailable() external view override returns (uint256) {
        revert("Not implemented");
    }
}