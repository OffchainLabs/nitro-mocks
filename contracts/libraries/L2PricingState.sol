// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";
import {ArbosState, Storage} from "./ArbosState.sol";

struct L2PricingStorage {
    Storage store;
}

library L2PricingState {
    using L2PricingState for L2PricingStorage;

    uint256 internal constant SPEED_LIMIT_PER_SECOND_OFFSET = 0;
    uint256 internal constant PER_BLOCK_GAS_LIMIT_OFFSET = 1;
    uint256 internal constant BASE_FEE_WEI_OFFSET = 2;
    uint256 internal constant MIN_BASE_FEE_WEI_OFFSET = 3;
    uint256 internal constant GAS_BACKLOG_OFFSET = 4;
    uint256 internal constant PRICING_INERTIA_OFFSET = 5;
    uint256 internal constant BACKLOG_TOLERANCE_OFFSET = 6;

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

    function setBacklogTolerance(L2PricingStorage memory self, uint64 sec) internal {
        ArbosStorage(self.store.addr).setUint64(self.store.key, BACKLOG_TOLERANCE_OFFSET, sec);
    }

    function setPricingInertia(L2PricingStorage memory self, uint64 val) internal {
        ArbosStorage(self.store.addr).setUint64(self.store.key, PRICING_INERTIA_OFFSET, val);
    }
}
