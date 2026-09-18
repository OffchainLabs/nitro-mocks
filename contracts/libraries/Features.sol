// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";
import {Storage} from "./ArbosState.sol";

struct FeaturesStorage {
    Storage store;
}

/**
 * @dev Feature toggles packed as bits of a single word.
 */
library Features {
    uint256 internal constant FEATURES_OFFSET = 0;
    uint256 internal constant INCREASED_CALLDATA_BIT = 0;

    function setCalldataPriceIncrease(FeaturesStorage memory self, bool enabled) internal {
        setBit(self, INCREASED_CALLDATA_BIT, enabled);
    }

    function setBit(FeaturesStorage memory self, uint256 index, bool enabled) private {
        ArbosStorage arbosStorage = ArbosStorage(self.store.addr);
        uint256 flags = arbosStorage.getUint256(self.store.key, FEATURES_OFFSET);

        if (enabled) {
            flags |= uint256(1) << index;
        } else {
            flags &= ~(uint256(1) << index);
        }
        arbosStorage.setUint256(self.store.key, FEATURES_OFFSET, flags);
    }
}
