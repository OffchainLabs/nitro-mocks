// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ArbOwnerPublic as IArbOwnerPublic} from "../submodules/nitro-precompile-interfaces/ArbOwnerPublic.sol";
import {AddressSet, AddressSetStorage} from "./libraries/AddressSet.sol";
import {ArbosState} from "./libraries/ArbosState.sol";
import {Features, FeaturesStorage} from "./libraries/Features.sol";
import {L1PricingState, L1PricingStorage} from "./libraries/L1PricingState.sol";

contract ArbOwnerPublic is IArbOwnerPublic {
    using AddressSet for AddressSetStorage;
    using Features for FeaturesStorage;
    using L1PricingState for L1PricingStorage;

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
        return ArbosState.nativeTokenManagementFromTime();
    }

    function isNativeTokenOwner(address addr) external view override returns (bool) {
        return ArbosState.nativeTokenOwners().isMember(addr);
    }

    function getAllNativeTokenOwners() external view override returns (address[] memory) {
        return ArbosState.nativeTokenOwners().allMembers(65536);
    }

    function getTransactionFilteringFrom() external view override returns (uint64) {
        return ArbosState.transactionFilteringFromTime();
    }

    function isTransactionFilterer(address filterer) external view override returns (bool) {
        return ArbosState.transactionFilterers().isMember(filterer);
    }

    function getAllTransactionFilterers() external view override returns (address[] memory) {
        return ArbosState.transactionFilterers().allMembers(65536);
    }

    function getFilteredFundsRecipient() external view override returns (address) {
        return ArbosState.filteredFundsRecipient();
    }

    function getParentGasFloorPerToken() external view override returns (uint64) {
        return ArbosState.l1PricingState().parentGasFloorPerToken();
    }

    function isCalldataPriceIncreaseEnabled() external view override returns (bool) {
        return ArbosState.features().isCalldataPriceIncreaseEnabled();
    }

    function getCollectTips() external view override returns (bool) {
        return ArbosState.collectTips();
    }

    function getMaxStylusContractFragments() external view override returns (uint8) {
        revert("Not implemented");
    }
}
