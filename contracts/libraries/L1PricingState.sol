// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";
import {ArbosState, Storage} from "./ArbosState.sol";
import {BatchPostersTable, BatchPostersTableStorage} from "./BatchPostersTable.sol";

struct L1PricingStorage {
    Storage store;
}

/**
 * @notice Mirror of arbos/l1pricing/l1pricing.go
 */
library L1PricingState {
    using L1PricingState for L1PricingStorage;
    using BatchPostersTable for BatchPostersTableStorage;
    
    address internal constant L1_PRICER_FUNDS_POOL_ADDRESS = 0xa4B00000000000000000000000000000000000F6;
    
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
    uint256 internal constant L1_FEES_AVAILABLE_OFFSET = 11;
    
    bytes internal constant BATCH_POSTER_TABLE_KEY = hex"00";
    
    function setInertia(L1PricingStorage memory self, uint64 inertia) internal {
        ArbosStorage(self.store.addr).setUint64(self.store.key, INERTIA_OFFSET, inertia);
    }
    
    function setAmortizedCostCapBips(L1PricingStorage memory self, uint64 cap) internal {
        ArbosStorage(self.store.addr).setUint64(self.store.key, AMORTIZED_COST_CAP_BIPS_OFFSET, cap);
    }
    
    function l1FeesAvailable(L1PricingStorage memory self) internal view returns (uint256) {
        return ArbosStorage(self.store.addr).getUint256(self.store.key, L1_FEES_AVAILABLE_OFFSET);
    }
    
    function addToL1FeesAvailable(L1PricingStorage memory self, int256 delta) internal {
        uint256 current = self.l1FeesAvailable();
        if (delta >= 0) {
            current += uint256(delta);
        } else {
            uint256 absDelta = uint256(-delta);
            require(current >= absDelta, "L1 fees available underflow");
            current -= absDelta;
        }
        ArbosStorage(self.store.addr).setUint256(self.store.key, L1_FEES_AVAILABLE_OFFSET, current);
    }
    
    function setPerBatchGasCost(L1PricingStorage memory self, int64 cost) internal {
        ArbosStorage(self.store.addr).setInt64(self.store.key, PER_BATCH_GAS_COST_OFFSET, cost);
    }
    
    function setPayRewardsTo(L1PricingStorage memory self, address recipient) internal {
        ArbosStorage(self.store.addr).setAddr(self.store.key, PAY_REWARDS_TO_OFFSET, recipient);
    }
    
    function setEquilibrationUnits(L1PricingStorage memory self, uint256 units) internal {
        ArbosStorage(self.store.addr).setUint256(self.store.key, EQUILIBRATION_UNITS_OFFSET, units);
    }
    
    function setPerUnitReward(L1PricingStorage memory self, uint64 weiPerUnit) internal {
        ArbosStorage(self.store.addr).setUint64(self.store.key, PER_UNIT_REWARD_OFFSET, weiPerUnit);
    }
    
    function setPricePerUnit(L1PricingStorage memory self, uint256 pricePerUnit) internal {
        ArbosStorage(self.store.addr).setUint256(self.store.key, PRICE_PER_UNIT_OFFSET, pricePerUnit);
    }
    
    function pricePerUnit(L1PricingStorage memory self) internal view returns (uint256) {
        return ArbosStorage(self.store.addr).getUint256(self.store.key, PRICE_PER_UNIT_OFFSET);
    }
    
    function inertia(L1PricingStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, INERTIA_OFFSET);
    }
    
    function perUnitReward(L1PricingStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, PER_UNIT_REWARD_OFFSET);
    }
    
    function payRewardsTo(L1PricingStorage memory self) internal view returns (address) {
        return ArbosStorage(self.store.addr).getAddr(self.store.key, PAY_REWARDS_TO_OFFSET);
    }
    
    function perBatchGasCost(L1PricingStorage memory self) internal view returns (int64) {
        return ArbosStorage(self.store.addr).getInt64(self.store.key, PER_BATCH_GAS_COST_OFFSET);
    }
    
    function amortizedCostCapBips(L1PricingStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, AMORTIZED_COST_CAP_BIPS_OFFSET);
    }
    
    function fundsDueForRewards(L1PricingStorage memory self) internal view returns (int256) {
        return int256(ArbosStorage(self.store.addr).getUint256(self.store.key, FUNDS_DUE_FOR_REWARDS_OFFSET));
    }
    
    function batchPosterTable(L1PricingStorage memory self) internal pure returns (BatchPostersTableStorage memory) {
        bytes memory tableKey = ArbosStorage(self.store.addr).openSubStorage(
            self.store.key, 
            BATCH_POSTER_TABLE_KEY
        );
        return BatchPostersTableStorage({
            store: Storage({
                addr: self.store.addr,
                key: tableKey
            })
        });
    }
    
    function equilibrationUnits(L1PricingStorage memory self) internal view returns (uint256) {
        return ArbosStorage(self.store.addr).getUint256(self.store.key, EQUILIBRATION_UNITS_OFFSET);
    }
    
    function lastUpdateTime(L1PricingStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, LAST_UPDATE_TIME_OFFSET);
    }
    
    function unitsSinceUpdate(L1PricingStorage memory self) internal view returns (uint64) {
        return ArbosStorage(self.store.addr).getUint64(self.store.key, UNITS_SINCE_OFFSET);
    }
    
    function getL1PricingSurplus(L1PricingStorage memory self) internal view returns (int256) {
        uint256 fundsDueForRefunds = self.batchPosterTable().totalFundsDue();
        int256 fundsDueForRewards = self.fundsDueForRewards();
        uint256 haveFunds = self.l1FeesAvailable();
        
        int256 needFunds = int256(fundsDueForRefunds) + fundsDueForRewards;
        return int256(haveFunds) - needFunds;
    }
}