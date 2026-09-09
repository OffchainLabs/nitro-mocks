// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ArbOwnerPublic as IArbOwnerPublic} from "../submodules/nitro-precompile-interfaces/ArbOwnerPublic.sol";
import {AddressSet, AddressSetStorage} from "./libraries/AddressSet.sol";
import {ArbosState} from "./libraries/ArbosState.sol";

contract ArbOwnerPublic is IArbOwnerPublic {
    using AddressSet for AddressSetStorage;

    function isChainOwner(address addr) external view override returns (bool) {
        return ArbosState.chainOwners().isMember(addr);
    }

    function rectifyChainOwner(address) external override {
        revert("Not implemented");
    }

    function getAllChainOwners() external view override returns (address[] memory) {
        return ArbosState.chainOwners().allMembers(65536);
    }

    function getNetworkFeeAccount() external view override returns (address) {
        return ArbosState.networkFeeAccount();
    }

    function getInfraFeeAccount() external view override returns (address) {
        return ArbosState.infraFeeAccount();
    }

    function getBrotliCompressionLevel() external view override returns (uint64) {
        return ArbosState.brotliCompressionLevel();
    }

    function getScheduledUpgrade() external view override returns (uint64, uint64) {
        return ArbosState.getScheduledUpgrade();
    }

    function getNativeTokenManagementFrom() external view override returns (uint64) {
        revert("Not implemented");
    }

    function isNativeTokenOwner(address) external view override returns (bool) {
        revert("Not implemented");
    }

    function getAllNativeTokenOwners() external view override returns (address[] memory) {
        revert("Not implemented");
    }

    function getTransactionFilteringFrom() external view override returns (uint64) {
        revert("Not implemented");
    }

    function isTransactionFilterer(address) external view override returns (bool) {
        revert("Not implemented");
    }

    function getAllTransactionFilterers() external view override returns (address[] memory) {
        revert("Not implemented");
    }

    function getFilteredFundsRecipient() external view override returns (address) {
        revert("Not implemented");
    }

    function getParentGasFloorPerToken() external view override returns (uint64) {
        revert("Not implemented");
    }

    function isCalldataPriceIncreaseEnabled() external view override returns (bool) {
        revert("Not implemented");
    }

    function getCollectTips() external view override returns (bool) {
        revert("Not implemented");
    }

    function getMaxStylusContractFragments() external view override returns (uint8) {
        revert("Not implemented");
    }
}
