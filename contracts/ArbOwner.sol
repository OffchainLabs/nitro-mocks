// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ArbOwner as IArbOwner} from "../submodules/nitro-precompile-interfaces/ArbOwner.sol";
import {AddressSet} from "./libraries/AddressSet.sol";
import {ArbosState} from "./libraries/ArbosState.sol";
import {ArbosStorage} from "./ArbosStorage.sol";

contract ArbOwner is IArbOwner {
    address constant ARBOS_STORAGE_ADDRESS = 0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf;
    
    modifier onlyChainOwner() {
        bytes memory chainOwnerKey = ArbosStorage(ARBOS_STORAGE_ADDRESS).openSubStorage(
            ArbosState.ROOT_STORAGE_KEY,
            ArbosState.CHAIN_OWNER_SUBSTORAGE
        );
        require(AddressSet.isMember(ARBOS_STORAGE_ADDRESS, chainOwnerKey, msg.sender), "unauthorized caller to access-controlled method");
        _;
    }
    
    function getAllChainOwners() external view override onlyChainOwner returns (address[] memory) {
        bytes memory chainOwnerKey = ArbosStorage(ARBOS_STORAGE_ADDRESS).openSubStorage(
            ArbosState.ROOT_STORAGE_KEY,
            ArbosState.CHAIN_OWNER_SUBSTORAGE
        );
        return AddressSet.allMembers(ARBOS_STORAGE_ADDRESS, chainOwnerKey, 65536);
    }

    function isChainOwner(address addr) external view override onlyChainOwner returns (bool) {
        bytes memory chainOwnerKey = ArbosStorage(ARBOS_STORAGE_ADDRESS).openSubStorage(
            ArbosState.ROOT_STORAGE_KEY,
            ArbosState.CHAIN_OWNER_SUBSTORAGE
        );
        return AddressSet.isMember(ARBOS_STORAGE_ADDRESS, chainOwnerKey, addr);
    }

    function setL2BaseFee(uint256 priceInWei) external override onlyChainOwner {
        bytes memory l2PricingStorageKey = ArbosStorage(ARBOS_STORAGE_ADDRESS).openSubStorage(
            ArbosState.ROOT_STORAGE_KEY,
            ArbosState.L2_PRICING_SUBSTORAGE
        );
        
        ArbosStorage(ARBOS_STORAGE_ADDRESS).setUint256(l2PricingStorageKey, ArbosState.L2_PRICING_BASE_FEE_WEI_OFFSET, priceInWei);
        
        emit OwnerActs(bytes4(keccak256("setL2BaseFee(uint256)")), msg.sender, abi.encodeWithSelector(bytes4(keccak256("setL2BaseFee(uint256)")), priceInWei));
    }

    function setMinimumL2BaseFee(uint256) external override {
        revert("Not implemented");
    }

    function setSpeedLimit(uint64 limit) external override {
        revert("Not implemented");
    }

    function setL1BaseFeeEstimateInertia(uint64) external override {
        revert("Not implemented");
    }

    function setNetworkFeeAccount(address) external override {
        revert("Not implemented");
    }

    function setMaxTxGasLimit(uint64 limit) external override {
        revert("Not implemented");
    }

    function addChainOwner(address newOwner) external override onlyChainOwner {
        bytes memory chainOwnerKey = ArbosStorage(ARBOS_STORAGE_ADDRESS).openSubStorage(
            ArbosState.ROOT_STORAGE_KEY,
            ArbosState.CHAIN_OWNER_SUBSTORAGE
        );
        AddressSet.add(ARBOS_STORAGE_ADDRESS, chainOwnerKey, newOwner);
        emit OwnerActs(bytes4(keccak256("addChainOwner(address)")), msg.sender, abi.encodeWithSelector(bytes4(keccak256("addChainOwner(address)")), newOwner));
    }

    function removeChainOwner(address ownerToRemove) external override onlyChainOwner {
        bytes memory chainOwnerKey = ArbosStorage(ARBOS_STORAGE_ADDRESS).openSubStorage(
            ArbosState.ROOT_STORAGE_KEY,
            ArbosState.CHAIN_OWNER_SUBSTORAGE
        );
        
        require(AddressSet.isMember(ARBOS_STORAGE_ADDRESS, chainOwnerKey, ownerToRemove), "tried to remove non-owner");
        
        AddressSet.remove(ARBOS_STORAGE_ADDRESS, chainOwnerKey, ownerToRemove);
        emit OwnerActs(bytes4(keccak256("removeChainOwner(address)")), msg.sender, abi.encodeWithSelector(bytes4(keccak256("removeChainOwner(address)")), ownerToRemove));
    }

    function setAmortizedCostCapBips(uint64 cap) external override {
        revert("Not implemented");
    }

    function setBrotliCompressionLevel(uint64 level) external override {
        revert("Not implemented");
    }

    function releaseL1PricerSurplusFunds(uint256) external override returns (uint256) {
        revert("Not implemented");
    }

    function setPerBatchGasCharge(int64 cost) external override {
        revert("Not implemented");
    }

    function setL1PricingEquilibrationUnits(uint256) external override {
        revert("Not implemented");
    }

    function setL1PricingInertia(uint64 inertia) external override {
        revert("Not implemented");
    }

    function setL1PricingRewardRecipient(address) external override {
        revert("Not implemented");
    }

    function setL1PricingRewardRate(uint64 weiPerUnit) external override {
        revert("Not implemented");
    }

    function setL1PricePerUnit(uint256) external override {
        revert("Not implemented");
    }

    function setL2GasBacklogTolerance(uint64 sec) external override {
        revert("Not implemented");
    }

    function setL2GasPricingInertia(uint64 sec) external override {
        revert("Not implemented");
    }

    function scheduleArbOSUpgrade(uint64 newVersion, uint64 timestamp) external override {
        revert("Not implemented");
    }

    function setChainConfig(string calldata) external override {
        revert("Not implemented");
    }
    
    function getNetworkFeeAccount() external view override returns (address) {
        revert("Not implemented");
    }
    
    function getInfraFeeAccount() external view override returns (address) {
        revert("Not implemented");
    }
    
    function setInfraFeeAccount(address newInfraFeeAccount) external override {
        revert("Not implemented");
    }
    
    function setNativeTokenManagementFrom(uint64 timestamp) external override {
        revert("Not implemented");
    }
    
    function addNativeTokenOwner(address newOwner) external override {
        revert("Not implemented");
    }
    
    function removeNativeTokenOwner(address ownerToRemove) external override {
        revert("Not implemented");
    }
    
    function isNativeTokenOwner(address addr) external view override returns (bool) {
        revert("Not implemented");
    }
    
    function getAllNativeTokenOwners() external view override returns (address[] memory) {
        revert("Not implemented");
    }
    
    function setInkPrice(uint32 price) external override {
        revert("Not implemented");
    }
    
    function setWasmMaxStackDepth(uint32 depth) external override {
        revert("Not implemented");
    }
    
    function setWasmFreePages(uint16 pages) external override {
        revert("Not implemented");
    }
    
    function setWasmPageGas(uint16 gas) external override {
        revert("Not implemented");
    }
    
    function setWasmPageLimit(uint16 limit) external override {
        revert("Not implemented");
    }
    
    function setWasmMaxSize(uint32 size) external override {
        revert("Not implemented");
    }
    
    function setWasmMinInitGas(uint8 gas, uint16 cached) external override {
        revert("Not implemented");
    }
    
    function setWasmInitCostScalar(uint64 percent) external override {
        revert("Not implemented");
    }
    
    function setWasmExpiryDays(uint16 _days) external override {
        revert("Not implemented");
    }
    
    function setWasmKeepaliveDays(uint16 _days) external override {
        revert("Not implemented");
    }
    
    function setWasmBlockCacheSize(uint16 count) external override {
        revert("Not implemented");
    }
    
    function addWasmCacheManager(address manager) external override {
        revert("Not implemented");
    }
    
    function removeWasmCacheManager(address manager) external override {
        revert("Not implemented");
    }
    
    function setCalldataPriceIncrease(bool enable) external override {
        revert("Not implemented");
    }
}