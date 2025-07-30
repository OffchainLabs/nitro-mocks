// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbGasInfo as IArbGasInfo} from "../submodules/nitro-precompile-interfaces/ArbGasInfo.sol";
import {ArbosState} from "./libraries/ArbosState.sol";
import {L1PricingState, L1PricingStorage} from "./libraries/L1PricingState.sol";
import {L2PricingState, L2PricingStorage} from "./libraries/L2PricingState.sol";

contract ArbGasInfo is IArbGasInfo {
    using L1PricingState for L1PricingStorage;
    using L2PricingState for L2PricingStorage;

    function getPricesInWeiWithAggregator(
        address aggregator
    ) external view override returns (uint256, uint256, uint256, uint256, uint256, uint256) {
        revert("NOT_IMPLEMENTED");
    }

    function getPricesInWei()
        external
        view
        override
        returns (uint256, uint256, uint256, uint256, uint256, uint256)
    {
        revert("NOT_IMPLEMENTED");
    }

    function getPricesInArbGasWithAggregator(
        address aggregator
    ) external view override returns (uint256, uint256, uint256) {
        revert("NOT_IMPLEMENTED");
    }

    function getPricesInArbGas() external view override returns (uint256, uint256, uint256) {
        revert("NOT_IMPLEMENTED");
    }

    function getGasAccountingParams() external view override returns (uint256, uint256, uint256) {
        revert("NOT_IMPLEMENTED");
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
        revert("NOT_IMPLEMENTED");
    }

    function getGasBacklogTolerance() external view override returns (uint64) {
        revert("NOT_IMPLEMENTED");
    }

    function getL1PricingSurplus() external view override returns (int256) {
        revert("NOT_IMPLEMENTED");
    }

    function getPerBatchGasCharge() external view override returns (int64) {
        revert("NOT_IMPLEMENTED");
    }

    function getAmortizedCostCapBips() external view override returns (uint64) {
        revert("NOT_IMPLEMENTED");
    }

    function getL1FeesAvailable() external view override returns (uint256) {
        revert("NOT_IMPLEMENTED");
    }

    function getL1PricingEquilibrationUnits() external view override returns (uint256) {
        revert("NOT_IMPLEMENTED");
    }

    function getLastL1PricingUpdateTime() external view override returns (uint64) {
        revert("NOT_IMPLEMENTED");
    }

    function getL1PricingFundsDueForRewards() external view override returns (uint256) {
        revert("NOT_IMPLEMENTED");
    }

    function getL1PricingUnitsSinceUpdate() external view override returns (uint64) {
        revert("NOT_IMPLEMENTED");
    }

    function getLastL1PricingSurplus() external view override returns (int256) {
        revert("NOT_IMPLEMENTED");
    }
}