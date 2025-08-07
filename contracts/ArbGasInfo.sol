// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbGasInfo as IArbGasInfo} from "../submodules/nitro-precompile-interfaces/ArbGasInfo.sol";
import {ArbosState} from "./libraries/ArbosState.sol";
import {L1PricingState, L1PricingStorage} from "./libraries/L1PricingState.sol";
import {L2PricingState, L2PricingStorage} from "./libraries/L2PricingState.sol";

contract ArbGasInfo is IArbGasInfo {
    using L1PricingState for L1PricingStorage;
    using L2PricingState for L2PricingStorage;

    uint256 constant private TX_DATA_NON_ZERO_GAS_EIP2028 = 16;
    uint256 constant private ASSUMED_SIMPLE_TX_SIZE = 140;
    uint256 constant private STORAGE_ARB_GAS = 20000; // StorageWriteCost

    function getPricesInWeiWithAggregator(
        address // aggregator - not used in the go implementation
    ) external view override returns (uint256, uint256, uint256, uint256, uint256, uint256) {
        uint256 l1GasPrice = ArbosState.l1PricingState().pricePerUnit();
        uint256 l2GasPrice = block.basefee;
        // The native precompile returns the actual L2 base fee even during eth_call,
        // while the block.basefee opcode returns 0 during eth_call.
        // To mimic the precompile behavior, we fall back to reading from L2PricingState.
        if (l2GasPrice == 0) {
            l2GasPrice = ArbosState.l2PricingState().baseFeeWei();
        }

        uint256 weiForL1Calldata = l1GasPrice * TX_DATA_NON_ZERO_GAS_EIP2028;
        uint256 perL2Tx = weiForL1Calldata * ASSUMED_SIMPLE_TX_SIZE;
        uint256 perArbGasBase = ArbosState.l2PricingState().minBaseFeeWei();
        if (l2GasPrice < perArbGasBase) {
            perArbGasBase = l2GasPrice;
        }
        uint256 perArbGasCongestion = l2GasPrice - perArbGasBase;
        uint256 perArbGasTotal = l2GasPrice;

        uint256 weiForL2Storage = l2GasPrice * STORAGE_ARB_GAS;

        return (perL2Tx, weiForL1Calldata, weiForL2Storage, perArbGasBase, perArbGasCongestion, perArbGasTotal);
    }

    function getPricesInWei() external view override returns (uint256, uint256, uint256, uint256, uint256, uint256) {
        return this.getPricesInWeiWithAggregator(address(0));
    }

    function getPricesInArbGasWithAggregator(
        address // aggregator - not used in the go implementation
    ) external view override returns (uint256, uint256, uint256) {
        uint256 l1GasPrice = ArbosState.l1PricingState().pricePerUnit();
        uint256 l2GasPrice = block.basefee;
        // The native precompile returns the actual L2 base fee even during eth_call,
        // while the block.basefee opcode returns 0 during eth_call.
        // To mimic the precompile behavior, we fall back to reading from L2PricingState.
        if (l2GasPrice == 0) {
            l2GasPrice = ArbosState.l2PricingState().baseFeeWei();
        }

        uint256 weiForL1Calldata = l1GasPrice * TX_DATA_NON_ZERO_GAS_EIP2028;
        uint256 weiPerL2Tx = weiForL1Calldata * ASSUMED_SIMPLE_TX_SIZE;

        uint256 gasForL1Calldata = 0;
        uint256 gasPerL2Tx = 0;
        if (l2GasPrice > 0) {
            gasForL1Calldata = weiForL1Calldata / l2GasPrice;
            gasPerL2Tx = weiPerL2Tx / l2GasPrice;
        }

        return (gasPerL2Tx, gasForL1Calldata, STORAGE_ARB_GAS);
    }

    function getPricesInArbGas() external view override returns (uint256, uint256, uint256) {
        return this.getPricesInArbGasWithAggregator(address(0));
    }

    function getGasAccountingParams() external view override returns (uint256, uint256, uint256) {
        L2PricingStorage memory l2pricing = ArbosState.l2PricingState();
        uint256 speedLimit = l2pricing.speedLimitPerSecond();
        uint256 maxTxGasLimit = l2pricing.perBlockGasLimit();
        return (speedLimit, maxTxGasLimit, maxTxGasLimit);
    }

    function getMinimumGasPrice() external view override returns (uint256) {
        return ArbosState.l2PricingState().minBaseFeeWei();
    }

    function getL1BaseFeeEstimate() external view override returns (uint256) {
        return ArbosState.l1PricingState().pricePerUnit();
    }

    function getL1BaseFeeEstimateInertia() external view override returns (uint64) {
        return ArbosState.l1PricingState().inertia();
    }

    function getL1RewardRate() external view override returns (uint64) {
        return ArbosState.l1PricingState().perUnitReward();
    }

    function getL1RewardRecipient() external view override returns (address) {
        return ArbosState.l1PricingState().payRewardsTo();
    }

    function getL1GasPriceEstimate() external view override returns (uint256) {
        return ArbosState.l1PricingState().pricePerUnit();
    }

    function getCurrentTxL1GasFees() external view override returns (uint256) {
        // Cannot be mocked: requires access to txProcessor.PosterFee from current transaction context
        revert("NOT_IMPLEMENTED");
    }

    function getGasBacklog() external view override returns (uint64) {
        return ArbosState.l2PricingState().gasBacklog();
    }

    function getPricingInertia() external view override returns (uint64) {
        return ArbosState.l2PricingState().pricingInertia();
    }

    function getGasBacklogTolerance() external view override returns (uint64) {
        return ArbosState.l2PricingState().backlogTolerance();
    }

    function getL1PricingSurplus() external view override returns (int256) {
        return ArbosState.l1PricingState().getL1PricingSurplus();
    }

    function getPerBatchGasCharge() external view override returns (int64) {
        return ArbosState.l1PricingState().perBatchGasCost();
    }

    function getAmortizedCostCapBips() external view override returns (uint64) {
        return ArbosState.l1PricingState().amortizedCostCapBips();
    }

    function getL1FeesAvailable() external view override returns (uint256) {
        return ArbosState.l1PricingState().l1FeesAvailable();
    }

    function getL1PricingEquilibrationUnits() external view override returns (uint256) {
        return ArbosState.l1PricingState().equilibrationUnits();
    }

    function getLastL1PricingUpdateTime() external view override returns (uint64) {
        return ArbosState.l1PricingState().lastUpdateTime();
    }

    function getL1PricingFundsDueForRewards() external view override returns (uint256) {
        return uint256(ArbosState.l1PricingState().fundsDueForRewards());
    }

    function getL1PricingUnitsSinceUpdate() external view override returns (uint64) {
        return ArbosState.l1PricingState().unitsSinceUpdate();
    }

    function getLastL1PricingSurplus() external view override returns (int256) {
        return ArbosState.l1PricingState().lastSurplus();
    }
}
