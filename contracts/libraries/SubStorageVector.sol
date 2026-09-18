// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";
import {Storage} from "./ArbosState.sol";

/**
 * @dev A storage space containing a vector of sub-storages. The number of entries is held at
 * offset 0, and entry `i` lives in the sub-storage keyed by the big-endian encoding of `i`.
 */
library SubStorageVector {
    uint256 internal constant LENGTH_OFFSET = 0;

    function length(Storage memory self) internal view returns (uint64) {
        return ArbosStorage(self.addr).getUint64(self.key, LENGTH_OFFSET);
    }

    function at(Storage memory self, uint64 index) internal pure returns (Storage memory) {
        return Storage(self.addr, ArbosStorage(self.addr).openSubStorage(self.key, abi.encodePacked(index)));
    }

    function push(Storage memory self) internal returns (Storage memory) {
        uint64 len = length(self);
        Storage memory entry = at(self, len);
        ArbosStorage(self.addr).setUint64(self.key, LENGTH_OFFSET, len + 1);
        return entry;
    }

    function pop(Storage memory self) internal returns (Storage memory) {
        uint64 len = length(self);
        require(len != 0, "sub-storage vector: can't pop empty");

        Storage memory entry = at(self, len - 1);
        ArbosStorage(self.addr).setUint64(self.key, LENGTH_OFFSET, len - 1);
        return entry;
    }
}
