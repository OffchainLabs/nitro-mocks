// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ArbOwner as IArbOwner} from "../submodules/nitro-precompile-interfaces/ArbOwner.sol";
import {AddressSet, AddressSetStorage} from "./libraries/AddressSet.sol";
import {ArbosState, Storage} from "./libraries/ArbosState.sol";
import {L1PricingState, L1PricingStorage} from "./libraries/L1PricingState.sol";
import {L2PricingState, L2PricingStorage} from "./libraries/L2PricingState.sol";

contract ArbOwner is IArbOwner {
    using L1PricingState for L1PricingStorage;
    using L2PricingState for L2PricingStorage;
    using AddressSet for AddressSetStorage;
    modifier onlyChainOwner() {
        require(ArbosState.chainOwners().isMember(msg.sender), "unauthorized caller to access-controlled method");
        _;
    }
    
    function getAllChainOwners() external view override onlyChainOwner returns (address[] memory) {
        return ArbosState.chainOwners().allMembers(65536);
    }

    function isChainOwner(address addr) external view override onlyChainOwner returns (bool) {
        return ArbosState.chainOwners().isMember(addr);
    }

    function setL2BaseFee(uint256 priceInWei) external override onlyChainOwner {
        ArbosState.l2PricingState().setBaseFeeWei(priceInWei);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function setMinimumL2BaseFee(uint256 priceInWei) external override onlyChainOwner {
        ArbosState.l2PricingState().setMinBaseFeeWei(priceInWei);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function setSpeedLimit(uint64 limit) external override onlyChainOwner {
        require(limit != 0, "speed limit must be nonzero");
        ArbosState.l2PricingState().setSpeedLimitPerSecond(limit);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function setL1BaseFeeEstimateInertia(uint64 inertia) external override onlyChainOwner {
        ArbosState.l1PricingState().setInertia(inertia);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function setNetworkFeeAccount(address newNetworkFeeAccount) external override onlyChainOwner {
        ArbosState.setNetworkFeeAccount(newNetworkFeeAccount);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function setMaxTxGasLimit(uint64 limit) external override onlyChainOwner {
        ArbosState.l2PricingState().setMaxPerBlockGasLimit(limit);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function addChainOwner(address newOwner) external override onlyChainOwner {
        ArbosState.chainOwners().add(newOwner);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function removeChainOwner(address ownerToRemove) external override onlyChainOwner {
        require(ArbosState.chainOwners().isMember(ownerToRemove), "tried to remove non-owner");
        
        ArbosState.chainOwners().remove(ownerToRemove);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function setAmortizedCostCapBips(uint64 cap) external override onlyChainOwner {
        ArbosState.l1PricingState().setAmortizedCostCapBips(cap);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function setBrotliCompressionLevel(uint64 level) external override onlyChainOwner {
        ArbosState.setBrotliCompressionLevel(level);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function releaseL1PricerSurplusFunds(uint256 maxWeiToRelease) external override onlyChainOwner returns (uint256) {
        uint256 balance = L1PricingState.L1_PRICER_FUNDS_POOL_ADDRESS.balance;
        L1PricingStorage memory l1PricingState = ArbosState.l1PricingState();
        uint256 recognized = l1PricingState.l1FeesAvailable();
        
        int256 weiToTransfer = int256(balance) - int256(recognized);
        if (weiToTransfer < 0) {
            return 0;
        }
        
        uint256 weiToTransferUint = uint256(weiToTransfer);
        if (weiToTransferUint > maxWeiToRelease) {
            weiToTransferUint = maxWeiToRelease;
        }
        
        l1PricingState.addToL1FeesAvailable(int256(weiToTransferUint));
        emit OwnerActs(msg.sig, msg.sender, msg.data);
        return weiToTransferUint;
    }

    function setPerBatchGasCharge(int64 cost) external override onlyChainOwner {
        ArbosState.l1PricingState().setPerBatchGasCost(cost);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function setL1PricingEquilibrationUnits(uint256 equilibrationUnits) external override onlyChainOwner {
        ArbosState.l1PricingState().setEquilibrationUnits(equilibrationUnits);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function setL1PricingInertia(uint64 inertia) external override onlyChainOwner {
        ArbosState.l1PricingState().setInertia(inertia);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function setL1PricingRewardRecipient(address recipient) external override onlyChainOwner {
        ArbosState.l1PricingState().setPayRewardsTo(recipient);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function setL1PricingRewardRate(uint64 weiPerUnit) external override onlyChainOwner {
        ArbosState.l1PricingState().setPerUnitReward(weiPerUnit);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function setL1PricePerUnit(uint256 pricePerUnit) external override onlyChainOwner {
        ArbosState.l1PricingState().setPricePerUnit(pricePerUnit);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function setL2GasBacklogTolerance(uint64 sec) external override onlyChainOwner {
        ArbosState.l2PricingState().setBacklogTolerance(sec);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function setL2GasPricingInertia(uint64 sec) external override onlyChainOwner {
        require(sec != 0, "price inertia must be nonzero");
        ArbosState.l2PricingState().setPricingInertia(sec);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function scheduleArbOSUpgrade(uint64 newVersion, uint64 timestamp) external override onlyChainOwner {
        ArbosState.scheduleArbOSUpgrade(newVersion, timestamp);
        emit OwnerActs(msg.sig, msg.sender, msg.data);
    }

    function setChainConfig(string calldata) external override {
        revert("Not implemented");
    }
    
    function getNetworkFeeAccount() external view override onlyChainOwner returns (address) {
        return ArbosState.networkFeeAccount();
    }
    
    function getInfraFeeAccount() external view override onlyChainOwner returns (address) {
        return ArbosState.infraFeeAccount();
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