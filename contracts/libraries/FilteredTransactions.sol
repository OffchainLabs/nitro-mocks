// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";
import {Storage} from "./ArbosState.sol";

struct FilteredTransactionsStorage {
    Storage store;
}

/**
 * @dev Flat key-value set of filtered transaction hashes, keyed by the hash itself.
 */
library FilteredTransactions {
    bytes32 internal constant PRESENT = bytes32(uint256(1));

    function add(FilteredTransactionsStorage memory self, bytes32 txHash) internal {
        ArbosStorage(self.store.addr).setBytes32(self.store.key, uint256(txHash), PRESENT);
    }

    function remove(FilteredTransactionsStorage memory self, bytes32 txHash) internal {
        ArbosStorage(self.store.addr).setBytes32(self.store.key, uint256(txHash), bytes32(0));
    }

    function isFiltered(FilteredTransactionsStorage memory self, bytes32 txHash) internal view returns (bool) {
        return ArbosStorage(self.store.addr).getBytes32(self.store.key, uint256(txHash)) == PRESENT;
    }
}
