// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";
import {Storage} from "./ArbosState.sol";

struct BatchPostersTableStorage {
    Storage store;
}

library BatchPostersTable {
    using BatchPostersTable for BatchPostersTableStorage;

    uint256 internal constant TOTAL_FUNDS_DUE_OFFSET = 0;

    bytes internal constant POSTER_ADDRS_KEY = hex"00";
    bytes internal constant POSTER_INFO_KEY = hex"01";

    function totalFundsDue(BatchPostersTableStorage memory self) internal view returns (uint256) {
        return ArbosStorage(self.store.addr).getUint256(self.store.key, TOTAL_FUNDS_DUE_OFFSET);
    }
}
