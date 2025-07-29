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
        revert("Not implemented - testnode version too low");
    }

    function getAllChainOwners() external view override returns (address[] memory) {
        return ArbosState.chainOwners().allMembers(65536);
    }

    function isNativeTokenOwner(address) external view override returns (bool) {
        revert("Not implemented - testnode version too low");
    }

    function getAllNativeTokenOwners() external view override returns (address[] memory) {
        revert("Not implemented - testnode version too low");
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

    function isCalldataPriceIncreaseEnabled() external view override returns (bool) {
        revert("Not implemented - testnode version too low");
    }
}