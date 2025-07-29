// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ArbOwner as IArbOwner} from "../submodules/nitro-precompile-interfaces/ArbOwner.sol";
import {AddressSet} from "./libraries/AddressSet.sol";
import {ArbosState, Storage} from "./libraries/ArbosState.sol";
import {L1PricingState} from "./libraries/L1PricingState.sol";
import {L2PricingState} from "./libraries/L2PricingState.sol";
import {ArbosStorage} from "./ArbosStorage.sol";

contract ArbOwner is IArbOwner {
    address constant ARBOS_STORAGE_ADDRESS = 0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf;
    
    modifier onlyChainOwner() {
        require(AddressSet.isMember(ArbosState.ChainOwners(), msg.sender), "unauthorized caller to access-controlled method");
        _;
    }
    
    function getAllChainOwners() external view override onlyChainOwner returns (address[] memory) {
        return AddressSet.allMembers(ArbosState.ChainOwners(), 65536);
    }

    function isChainOwner(address addr) external view override onlyChainOwner returns (bool) {
        return AddressSet.isMember(ArbosState.ChainOwners(), addr);
    }

    function setL2BaseFee(uint256 priceInWei) external override onlyChainOwner {
        L2PricingState.setBaseFeeWei(ArbosState.L2PricingState(), priceInWei);
        emit OwnerActs(bytes4(keccak256("setL2BaseFee(uint256)")), msg.sender, abi.encodeWithSelector(bytes4(keccak256("setL2BaseFee(uint256)")), priceInWei));
    }

    function setMinimumL2BaseFee(uint256 priceInWei) external override onlyChainOwner {
        L2PricingState.setMinBaseFeeWei(ArbosState.L2PricingState(), priceInWei);
        emit OwnerActs(bytes4(keccak256("setMinimumL2BaseFee(uint256)")), msg.sender, abi.encodeWithSelector(bytes4(keccak256("setMinimumL2BaseFee(uint256)")), priceInWei));
    }

    function setSpeedLimit(uint64 limit) external override onlyChainOwner {
        require(limit != 0, "speed limit must be nonzero");
        L2PricingState.setSpeedLimitPerSecond(ArbosState.L2PricingState(), limit);
        emit OwnerActs(bytes4(keccak256("setSpeedLimit(uint64)")), msg.sender, abi.encodeWithSelector(bytes4(keccak256("setSpeedLimit(uint64)")), limit));
    }

    function setL1BaseFeeEstimateInertia(uint64 inertia) external override onlyChainOwner {
        L1PricingState.setInertia(ArbosState.L1PricingState(), inertia);
        emit OwnerActs(bytes4(keccak256("setL1BaseFeeEstimateInertia(uint64)")), msg.sender, abi.encodeWithSelector(bytes4(keccak256("setL1BaseFeeEstimateInertia(uint64)")), inertia));
    }

    function setNetworkFeeAccount(address) external override {
        revert("Not implemented");
    }

    function setMaxTxGasLimit(uint64 limit) external override {
        revert("Not implemented");
    }

    function addChainOwner(address newOwner) external override onlyChainOwner {
        AddressSet.add(ArbosState.ChainOwners(), newOwner);
        emit OwnerActs(bytes4(keccak256("addChainOwner(address)")), msg.sender, abi.encodeWithSelector(bytes4(keccak256("addChainOwner(address)")), newOwner));
    }

    function removeChainOwner(address ownerToRemove) external override onlyChainOwner {
        require(AddressSet.isMember(ArbosState.ChainOwners(), ownerToRemove), "tried to remove non-owner");
        
        AddressSet.remove(ArbosState.ChainOwners(), ownerToRemove);
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