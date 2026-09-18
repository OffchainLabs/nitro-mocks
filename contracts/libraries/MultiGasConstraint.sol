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
}
