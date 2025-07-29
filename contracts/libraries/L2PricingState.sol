// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";
import {ArbosState, Storage} from "./ArbosState.sol";

/**
 * @notice Mirror of arbos/l2pricing/l2pricing.go
 */
library L2PricingState {
    uint256 internal constant SPEED_LIMIT_PER_SECOND_OFFSET = 0;
    uint256 internal constant PER_BLOCK_GAS_LIMIT_OFFSET = 1;
    uint256 internal constant BASE_FEE_WEI_OFFSET = 2;
    uint256 internal constant MIN_BASE_FEE_WEI_OFFSET = 3;
    uint256 internal constant GAS_BACKLOG_OFFSET = 4;
    uint256 internal constant PRICING_INERTIA_OFFSET = 5;
    uint256 internal constant BACKLOG_TOLERANCE_OFFSET = 6;
    
    function setBaseFeeWei(Storage memory store, uint256 priceInWei) internal {
        ArbosStorage(store.addr).setUint256(store.key, BASE_FEE_WEI_OFFSET, priceInWei);
    }
    
    function setMinBaseFeeWei(Storage memory store, uint256 priceInWei) internal {
        ArbosStorage(store.addr).setUint256(store.key, MIN_BASE_FEE_WEI_OFFSET, priceInWei);
    }
    
    function setSpeedLimitPerSecond(Storage memory store, uint64 limit) internal {
        ArbosStorage(store.addr).setUint64(store.key, SPEED_LIMIT_PER_SECOND_OFFSET, limit);
    }
}