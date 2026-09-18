// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";
import {Storage} from "./ArbosState.sol";
import {GasConstraintStorage} from "./GasConstraint.sol";
import {MultiGasConstraintStorage, NUM_RESOURCE_KIND} from "./MultiGasConstraint.sol";
import {SubStorageVector} from "./SubStorageVector.sol";

struct L2PricingStorage {
    Storage store;
}

library L2PricingState {
    using L2PricingState for L2PricingStorage;
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
