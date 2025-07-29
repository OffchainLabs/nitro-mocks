// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";
import {ArbosState, Storage} from "./ArbosState.sol";

/**
 * @notice Mirror of arbos/l1pricing/l1pricing.go
 */
library L1PricingState {
    uint256 internal constant PAY_REWARDS_TO_OFFSET = 0;
    uint256 internal constant EQUILIBRATION_UNITS_OFFSET = 1;
    uint256 internal constant INERTIA_OFFSET = 2;
    uint256 internal constant PER_UNIT_REWARD_OFFSET = 3;
    uint256 internal constant LAST_UPDATE_TIME_OFFSET = 4;
    uint256 internal constant FUNDS_DUE_FOR_REWARDS_OFFSET = 5;
    uint256 internal constant UNITS_SINCE_OFFSET = 6;
    uint256 internal constant PRICE_PER_UNIT_OFFSET = 7;
    uint256 internal constant LAST_SURPLUS_OFFSET = 8;
    uint256 internal constant PER_BATCH_GAS_COST_OFFSET = 9;
    uint256 internal constant AMORTIZED_COST_CAP_BIPS_OFFSET = 10;
    
    function setInertia(Storage memory store, uint64 inertia) internal {
        ArbosStorage(store.addr).setUint64(store.key, INERTIA_OFFSET, inertia);
    }
    
    function setAmortizedCostCapBips(Storage memory store, uint64 cap) internal {
        ArbosStorage(store.addr).setUint64(store.key, AMORTIZED_COST_CAP_BIPS_OFFSET, cap);
    }
}