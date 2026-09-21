// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";
import {Storage} from "./ArbosState.sol";

uint256 constant NUM_RESOURCE_KIND = 9;

struct MultiGasConstraintStorage {
    Storage store;
}

/**
 * @dev Flat layout: target, adjustment window, backlog, max weight, then one weight per resource kind.
 */
library MultiGasConstraint {
    uint256 internal constant TARGET_OFFSET = 0;
    uint256 internal constant ADJUSTMENT_WINDOW_OFFSET = 1;
    uint256 internal constant BACKLOG_OFFSET = 2;
    uint256 internal constant MAX_WEIGHT_OFFSET = 3;
    uint256 internal constant WEIGHTED_RESOURCES_BASE_OFFSET = 4;

    function target(MultiGasConstraintStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, TARGET_OFFSET);
    }

    function adjustmentWindow(MultiGasConstraintStorage memory self) internal view returns (uint32) {
        return uint32(ArbosStorage(self.store.addr).getUint64(self.store.key, ADJUSTMENT_WINDOW_OFFSET));
    }

    function backlog(MultiGasConstraintStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, BACKLOG_OFFSET);
    }

    function maxWeight(MultiGasConstraintStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, MAX_WEIGHT_OFFSET);
    }

    function resourceWeight(MultiGasConstraintStorage memory self, uint256 kind) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, WEIGHTED_RESOURCES_BASE_OFFSET + kind);
    }

    function getResourceWeights(MultiGasConstraintStorage memory self)
        internal
        view
        returns (uint64[NUM_RESOURCE_KIND] memory weights)
    {
        ArbosStorage arbosStorage = ArbosStorage(self.store.addr);
        for (uint256 kind = 0; kind < NUM_RESOURCE_KIND; kind++) {
            weights[kind] = arbosStorage.getUint64(self.store.key, WEIGHTED_RESOURCES_BASE_OFFSET + kind);
        }
    }

    function set(
        MultiGasConstraintStorage memory self,
        uint64 target_,
        uint32 adjustmentWindow_,
        uint64 backlog_,
        uint64[NUM_RESOURCE_KIND] memory weights
    ) internal {
        ArbosStorage arbosStorage = ArbosStorage(self.store.addr);
        arbosStorage.setUint64(self.store.key, TARGET_OFFSET, target_);
        arbosStorage.setUint64(self.store.key, ADJUSTMENT_WINDOW_OFFSET, adjustmentWindow_);
        arbosStorage.setUint64(self.store.key, BACKLOG_OFFSET, backlog_);

        uint64 max = 0;
        for (uint256 kind = 0; kind < NUM_RESOURCE_KIND; kind++) {
            if (weights[kind] > max) {
                max = weights[kind];
            }
            arbosStorage.setUint64(self.store.key, WEIGHTED_RESOURCES_BASE_OFFSET + kind, weights[kind]);
        }
        arbosStorage.setUint64(self.store.key, MAX_WEIGHT_OFFSET, max);
    }

    /**
     * @dev The Go Clear zeroes the fields in declaration order, so the max weight is written before
     * the per-resource weights rather than after them as in set.
     */
    function clear(MultiGasConstraintStorage memory self) internal {
        ArbosStorage arbosStorage = ArbosStorage(self.store.addr);
        arbosStorage.setUint64(self.store.key, TARGET_OFFSET, 0);
        arbosStorage.setUint64(self.store.key, ADJUSTMENT_WINDOW_OFFSET, 0);
        arbosStorage.setUint64(self.store.key, BACKLOG_OFFSET, 0);
        arbosStorage.setUint64(self.store.key, MAX_WEIGHT_OFFSET, 0);
        for (uint256 kind = 0; kind < NUM_RESOURCE_KIND; kind++) {
            arbosStorage.setUint64(self.store.key, WEIGHTED_RESOURCES_BASE_OFFSET + kind, 0);
        }
    }
}
