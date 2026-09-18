// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";
import {Storage} from "./ArbosState.sol";

struct GasConstraintStorage {
    Storage store;
}

library GasConstraint {
    uint256 internal constant TARGET_OFFSET = 0;
    uint256 internal constant ADJUSTMENT_WINDOW_OFFSET = 1;
    uint256 internal constant BACKLOG_OFFSET = 2;

    function target(GasConstraintStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, TARGET_OFFSET);
    }

    function adjustmentWindow(GasConstraintStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, ADJUSTMENT_WINDOW_OFFSET);
    }

    function backlog(GasConstraintStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, BACKLOG_OFFSET);
    }

    function set(GasConstraintStorage memory self, uint64 target_, uint64 adjustmentWindow_, uint64 backlog_) internal {
        ArbosStorage arbosStorage = ArbosStorage(self.store.addr);
        arbosStorage.setUint64(self.store.key, TARGET_OFFSET, target_);
        arbosStorage.setUint64(self.store.key, ADJUSTMENT_WINDOW_OFFSET, adjustmentWindow_);
        arbosStorage.setUint64(self.store.key, BACKLOG_OFFSET, backlog_);
    }

    function clear(GasConstraintStorage memory self) internal {
        set(self, 0, 0, 0);
    }
}
