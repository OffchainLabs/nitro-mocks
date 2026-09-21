// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {
    ArbFilteredTransactionsManager as IArbFilteredTransactionsManager
} from "../submodules/nitro-precompile-interfaces/ArbFilteredTransactionsManager.sol";
import {AddressSet, AddressSetStorage} from "./libraries/AddressSet.sol";
import {ArbosState} from "./libraries/ArbosState.sol";
import {FilteredTransactions, FilteredTransactionsStorage} from "./libraries/FilteredTransactions.sol";

contract ArbFilteredTransactionsManager is IArbFilteredTransactionsManager {
    using AddressSet for AddressSetStorage;
    using FilteredTransactions for FilteredTransactionsStorage;

    // The FreeAccessPrecompile wrapper reads the filterer set on every call to decide whether the
    // storage the call goes on to use is free, before the method reads it again for itself.
    modifier meteringRead() {
        ArbosState.transactionFilterers().isMember(msg.sender);
        _;
    }

    // Go burns the caller out rather than returning an error, which surfaces as a revert with no
    // return data.
    modifier onlyTransactionFilterer() {
        if (!ArbosState.transactionFilterers().isMember(msg.sender)) {
            revert();
        }
        _;
    }

    function addFilteredTransaction(bytes32 txHash) external override meteringRead onlyTransactionFilterer {
        ArbosState.filteredTransactions().add(txHash);
        emit FilteredTransactionAdded(txHash);
    }

    function deleteFilteredTransaction(bytes32 txHash) external override meteringRead onlyTransactionFilterer {
        ArbosState.filteredTransactions().remove(txHash);
        emit FilteredTransactionDeleted(txHash);
    }

    function isTransactionFiltered(bytes32 txHash) external view override meteringRead returns (bool) {
        return ArbosState.filteredTransactions().isFiltered(txHash);
    }
}
