// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";
import {Storage} from "./ArbosState.sol";
import {GasConstraint, GasConstraintStorage} from "./GasConstraint.sol";
import {MultiGasConstraint, MultiGasConstraintStorage, NUM_RESOURCE_KIND} from "./MultiGasConstraint.sol";
import {SubStorageVector} from "./SubStorageVector.sol";

struct L2PricingStorage {
    Storage store;
}

library L2PricingState {
    using GasConstraint for GasConstraintStorage;
    using L2PricingState for L2PricingStorage;
    using MultiGasConstraint for MultiGasConstraintStorage;
    using SubStorageVector for Storage;

    uint256 internal constant SPEED_LIMIT_PER_SECOND_OFFSET = 0;
    uint256 internal constant PER_BLOCK_GAS_LIMIT_OFFSET = 1;
    uint256 internal constant BASE_FEE_WEI_OFFSET = 2;
    uint256 internal constant MIN_BASE_FEE_WEI_OFFSET = 3;
    uint256 internal constant GAS_BACKLOG_OFFSET = 4;
    uint256 internal constant PRICING_INERTIA_OFFSET = 5;
    uint256 internal constant BACKLOG_TOLERANCE_OFFSET = 6;
    uint256 internal constant PER_TX_GAS_LIMIT_OFFSET = 7;

    bytes internal constant GAS_CONSTRAINTS_KEY = hex"00";
    bytes internal constant MULTI_GAS_CONSTRAINTS_KEY = hex"01";
    bytes internal constant MULTI_GAS_BASE_FEES_KEY = hex"02";

    uint256 internal constant RESOURCE_KIND_SINGLE_DIM = 6;
    uint256 internal constant CURRENT_BLOCK_FEES_OFFSET = NUM_RESOURCE_KIND;

    // exp(8.5) ~= x5,000 min base fee
    uint64 internal constant MAX_PRICING_EXPONENT_BIPS = 85000;

    uint256 private constant ONE_IN_BIPS = 10000;
    uint256 private constant UINT64_MAX = type(uint64).max;
    uint256 private constant INT64_MAX = uint256(uint64(type(int64).max));

    function setBaseFeeWei(L2PricingStorage memory self, uint256 priceInWei) internal {
        ArbosStorage(self.store.addr).setUint256(self.store.key, BASE_FEE_WEI_OFFSET, priceInWei);
    }

    function setMinBaseFeeWei(L2PricingStorage memory self, uint256 priceInWei) internal {
        ArbosStorage(self.store.addr).setUint256(self.store.key, MIN_BASE_FEE_WEI_OFFSET, priceInWei);
    }

    function setSpeedLimitPerSecond(L2PricingStorage memory self, uint64 limit) internal {
        ArbosStorage(self.store.addr).setUint64(self.store.key, SPEED_LIMIT_PER_SECOND_OFFSET, limit);
    }

    function setMaxPerBlockGasLimit(L2PricingStorage memory self, uint64 limit) internal {
        ArbosStorage(self.store.addr).setUint64(self.store.key, PER_BLOCK_GAS_LIMIT_OFFSET, limit);
    }

    function setMaxPerTxGasLimit(L2PricingStorage memory self, uint64 limit) internal {
        ArbosStorage(self.store.addr).setUint64(self.store.key, PER_TX_GAS_LIMIT_OFFSET, limit);
    }

    function minBaseFeeWei(L2PricingStorage memory self) internal view returns (uint256) {
        return ArbosStorage(self.store.addr).getUint256(self.store.key, MIN_BASE_FEE_WEI_OFFSET);
    }

    function gasBacklog(L2PricingStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, GAS_BACKLOG_OFFSET);
    }

    function pricingInertia(L2PricingStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, PRICING_INERTIA_OFFSET);
    }

    function backlogTolerance(L2PricingStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, BACKLOG_TOLERANCE_OFFSET);
    }

    function speedLimitPerSecond(L2PricingStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, SPEED_LIMIT_PER_SECOND_OFFSET);
    }

    function perBlockGasLimit(L2PricingStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, PER_BLOCK_GAS_LIMIT_OFFSET);
    }

    function baseFeeWei(L2PricingStorage memory self) internal view returns (uint256) {
        return ArbosStorage(self.store.addr).getUint256(self.store.key, BASE_FEE_WEI_OFFSET);
    }

    function setGasBacklog(L2PricingStorage memory self, uint64 backlog) internal {
        ArbosStorage(self.store.addr).setUint64(self.store.key, GAS_BACKLOG_OFFSET, backlog);
    }

    function setBacklogTolerance(L2PricingStorage memory self, uint64 sec) internal {
        ArbosStorage(self.store.addr).setUint64(self.store.key, BACKLOG_TOLERANCE_OFFSET, sec);
    }

    function setPricingInertia(L2PricingStorage memory self, uint64 val) internal {
        ArbosStorage(self.store.addr).setUint64(self.store.key, PRICING_INERTIA_OFFSET, val);
    }

    function perTxGasLimit(L2PricingStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, PER_TX_GAS_LIMIT_OFFSET);
    }

    function gasConstraintsLength(L2PricingStorage memory self) internal view returns (uint64) {
        return gasConstraints(self).length();
    }

    function openGasConstraintAt(L2PricingStorage memory self, uint64 index)
        internal
        pure
        returns (GasConstraintStorage memory)
    {
        return GasConstraintStorage(gasConstraints(self).at(index));
    }

    function clearGasConstraints(L2PricingStorage memory self) internal {
        Storage memory vector = gasConstraints(self);
        uint64 length = vector.length();

        for (uint64 i = 0; i < length; i++) {
            GasConstraintStorage(vector.pop()).clear();
        }
    }

    function addGasConstraint(L2PricingStorage memory self, uint64 target, uint64 adjustmentWindow, uint64 backlog)
        internal
    {
        GasConstraintStorage(gasConstraints(self).push()).set(target, adjustmentWindow, backlog);
    }

    function multiGasConstraintsLength(L2PricingStorage memory self) internal view returns (uint64) {
        return multiGasConstraints(self).length();
    }

    function openMultiGasConstraintAt(L2PricingStorage memory self, uint64 index)
        internal
        pure
        returns (MultiGasConstraintStorage memory)
    {
        return MultiGasConstraintStorage(multiGasConstraints(self).at(index));
    }

    function clearMultiGasConstraints(L2PricingStorage memory self) internal {
        Storage memory vector = multiGasConstraints(self);
        uint64 length = vector.length();

        for (uint64 i = 0; i < length; i++) {
            MultiGasConstraintStorage(vector.pop()).clear();
        }
    }

    function addMultiGasConstraint(
        L2PricingStorage memory self,
        uint64 target,
        uint32 adjustmentWindow,
        uint64 backlog,
        uint64[NUM_RESOURCE_KIND] memory weights
    ) internal {
        MultiGasConstraintStorage(multiGasConstraints(self).push()).set(target, adjustmentWindow, backlog, weights);
    }

    /**
     * @dev Mirrors the Go bips arithmetic, which saturates at the uint64 and int64 bounds at every
     * step rather than wrapping or reverting.
     */
    function calcMultiGasConstraintsExponents(L2PricingStorage memory self)
        internal
        view
        returns (uint64[NUM_RESOURCE_KIND] memory exponents)
    {
        uint64 length = self.multiGasConstraintsLength();

        for (uint64 i = 0; i < length; i++) {
            MultiGasConstraintStorage memory constraint = self.openMultiGasConstraintAt(i);
            uint64 target = constraint.target();
            uint64 backlog = constraint.backlog();
            if (backlog == 0) {
                continue;
            }

            uint256 divisor =
                saturate(saturatingUMul(constraint.adjustmentWindow(), saturatingUMul(target, constraint.maxWeight())));
            uint64[NUM_RESOURCE_KIND] memory weights = constraint.getResourceWeights();

            for (uint256 kind = 0; kind < NUM_RESOURCE_KIND; kind++) {
                if (weights[kind] == 0 || kind == RESOURCE_KIND_SINGLE_DIM) {
                    continue;
                }
                uint256 dividend =
                    saturate(saturate(saturatingUMul(backlog, constraint.resourceWeight(kind))) * ONE_IN_BIPS);
                exponents[kind] = uint64(saturate(exponents[kind] + dividend / divisor));
            }
        }
    }

    function saturatingUMul(uint256 a, uint256 b) private pure returns (uint256) {
        uint256 product = a * b;
        return product > UINT64_MAX ? UINT64_MAX : product;
    }

    function saturate(uint256 value) private pure returns (uint256) {
        return value > INT64_MAX ? INT64_MAX : value;
    }

    /**
     * @dev Before ArbOS 61 the single-dimensional fee is taken from the stored L2 base fee rather
     * than the base fee of the block being executed.
     */
    function getMultiGasBaseFeePerResource(L2PricingStorage memory self) internal view returns (uint256[] memory) {
        uint256 blockBaseFee = self.baseFeeWei();

        ArbosStorage arbosStorage = ArbosStorage(self.store.addr);
        bytes memory feesKey = arbosStorage.openSubStorage(self.store.key, MULTI_GAS_BASE_FEES_KEY);

        uint256[] memory fees = new uint256[](NUM_RESOURCE_KIND);
        for (uint256 kind = 0; kind < fees.length; kind++) {
            uint256 fee = arbosStorage.getUint256(feesKey, CURRENT_BLOCK_FEES_OFFSET + kind);
            if (kind == RESOURCE_KIND_SINGLE_DIM || fee == 0) {
                fee = blockBaseFee;
            }
            fees[kind] = fee;
        }
        return fees;
    }

    function gasConstraints(L2PricingStorage memory self) private pure returns (Storage memory) {
        return
            Storage(self.store.addr, ArbosStorage(self.store.addr).openSubStorage(self.store.key, GAS_CONSTRAINTS_KEY));
    }

    function multiGasConstraints(L2PricingStorage memory self) private pure returns (Storage memory) {
        return Storage(
            self.store.addr, ArbosStorage(self.store.addr).openSubStorage(self.store.key, MULTI_GAS_CONSTRAINTS_KEY)
        );
    }
}
