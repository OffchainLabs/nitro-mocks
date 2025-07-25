// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ArbOwnerPublic as IArbOwnerPublic} from "@arbitrum/nitro-precompiles/ArbOwnerPublic.sol";
import {AddressSet} from "./libraries/AddressSet.sol";
import {ArbosState} from "./libraries/ArbosState.sol";
import {ArbosStorage} from "./ArbosStorage.sol";

contract ArbOwnerPublic is IArbOwnerPublic {
    address constant ARBOS_STORAGE_ADDRESS = 0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf;

    function isChainOwner(address addr) external view override returns (bool) {
        bytes memory chainOwnerKey = ArbosStorage(ARBOS_STORAGE_ADDRESS).openSubStorage(
            ArbosState.ROOT_STORAGE_KEY,
            ArbosState.CHAIN_OWNER_SUBSTORAGE
        );
        return AddressSet.isMember(ARBOS_STORAGE_ADDRESS, chainOwnerKey, addr);
    }

    function rectifyChainOwner(address) external override {
        revert("Not implemented");
    }

    function getAllChainOwners() external view override returns (address[] memory) {
        bytes memory chainOwnerKey = ArbosStorage(ARBOS_STORAGE_ADDRESS).openSubStorage(
            ArbosState.ROOT_STORAGE_KEY,
            ArbosState.CHAIN_OWNER_SUBSTORAGE
        );
        return AddressSet.allMembers(ARBOS_STORAGE_ADDRESS, chainOwnerKey, 65536);
    }

    function isNativeTokenOwner(address) external view override returns (bool) {
        revert("Not implemented");
    }

    function getAllNativeTokenOwners() external view override returns (address[] memory) {
        revert("Not implemented");
    }

    function getNetworkFeeAccount() external view override returns (address) {
        return ArbosStorage(ARBOS_STORAGE_ADDRESS).getAddr(
            ArbosState.ROOT_STORAGE_KEY,
            ArbosState.NETWORK_FEE_ACCOUNT_OFFSET
        );
    }

    function getInfraFeeAccount() external view override returns (address) {
        return ArbosStorage(ARBOS_STORAGE_ADDRESS).getAddr(
            ArbosState.ROOT_STORAGE_KEY,
            ArbosState.INFRA_FEE_ACCOUNT_OFFSET
        );
    }

    function getBrotliCompressionLevel() external view override returns (uint64) {
        return ArbosStorage(ARBOS_STORAGE_ADDRESS).getUint64(
            ArbosState.ROOT_STORAGE_KEY,
            ArbosState.BROTLI_COMPRESSION_LEVEL_OFFSET
        );
    }

    function getScheduledUpgrade() external view override returns (uint64, uint64) {
        uint64 version = ArbosStorage(ARBOS_STORAGE_ADDRESS).getUint64(
            ArbosState.ROOT_STORAGE_KEY,
            ArbosState.UPGRADE_VERSION_OFFSET
        );
        uint64 timestamp = ArbosStorage(ARBOS_STORAGE_ADDRESS).getUint64(
            ArbosState.ROOT_STORAGE_KEY,
            ArbosState.UPGRADE_TIMESTAMP_OFFSET
        );
        return (version, timestamp);
    }

    function isCalldataPriceIncreaseEnabled() external view override returns (bool) {
        revert("Not implemented");
    }
}