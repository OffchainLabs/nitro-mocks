# v60 Bump: New Unimplemented Functions

Buckets for the ❌ entries added to the README by the v31 → v60 interface bump, based on the nitro Go implementations. Buckets 1-4 match the reasons the pre-bump ❌s were skipped; bucket 5 is work to do.

## Bucket 1: Impossible in pure Solidity (needs Go/EVM internals)

- **ArbNativeTokenManager (`0x73`)**, whole contract: `mintNativeToken`/`burnNativeToken` call `StateDB.AddBalance`/`SubBalance` with `ExpectBalanceMint/Burn`. A contract cannot mint native token balance.

## Bucket 2: Stylus config, no consumer in mock

Read/write `Programs().Params()` — same store as the existing `setWasm*` ❌s. Nothing in a vanilla EVM consumes them.

- `ArbOwner.setMaxStylusContractFragments`
- `ArbOwner.setWasmActivationGas`
- `ArbOwnerPublic.getMaxStylusContractFragments`

## Bucket 3: Node-consumed state, no EVM-observable effect

None. Unlike `setChainConfig`, every new setter has a getter counterpart (or gates another precompile), so round-trips are differentially testable.

## Bucket 4: Only reachable from corrupted legacy state

None.

## Bucket 5: Should implement

All plain ArbOS storage reads/writes, same patterns as existing code.

### ArbGasInfo

- `getMaxTxGasLimit`
- `getMaxBlockGasLimit`
- `getGasPricingConstraints`
- `getMultiGasPricingConstraints`
- `getMultiGasBaseFee` (uses `block.basefee` plus stored constraints — BASEFEE opcode covers it)

### ArbOwner: native token management

Timestamp plus AddressSet, identical pattern to chainOwners.

- `setNativeTokenManagementFrom`
- `addNativeTokenOwner`
- `removeNativeTokenOwner`
- `isNativeTokenOwner`
- `getAllNativeTokenOwners`

### ArbOwner: transaction filtering

- `setTransactionFilteringFrom`
- `addTransactionFilterer`
- `removeTransactionFilterer`
- `isTransactionFilterer`
- `getAllTransactionFilterers`
- `setFilteredFundsRecipient`
- `getFilteredFundsRecipient`

### ArbOwner: pricing

- `setMaxBlockGasLimit`
- `setParentGasFloorPerToken`
- `setCalldataPriceIncrease`
- `setGasBacklog` (getter already implemented)
- `setGasPricingConstraints`
- `setMultiGasPricingConstraints`
- `setCollectTips`

### ArbOwnerPublic

- `getNativeTokenManagementFrom`
- `isNativeTokenOwner`
- `getAllNativeTokenOwners`
- `getTransactionFilteringFrom`
- `isTransactionFilterer`
- `getAllTransactionFilterers`
- `getFilteredFundsRecipient`
- `getParentGasFloorPerToken`
- `isCalldataPriceIncreaseEnabled`
- `getCollectTips`

### ArbFilteredTransactionsManager (`0x74`), whole contract

`addFilteredTransaction`/`deleteFilteredTransaction`/`isTransactionFiltered` are a raw KV set in a dedicated account (`FilteredTransactionsStateAddress`) gated by the TransactionFilterers set — mockable; only the sequencer-side enforcement is node-level.

### Effort notes

The two multi-gas constraint functions are the most work (struct arrays in ArbOS storage, clear-then-write semantics, version gates); everything else is boilerplate get/set.

### Branches the testnode cannot reach

`setFeatureFromTime` only accepts a new enable time at least 7 days out, and the ErrBackward branch then forbids pulling it in. Disabling (timestamp 0) is ungated, so a feature can be scheduled and cleared but never becomes active within a testnode's lifetime.

On the current testnode `transactionFilteringFrom` is 1 and `nativeTokenManagementFrom` is 0, so:

- Transaction filtering: add/remove/set happy paths are tested. ErrDelay, ErrBackward and the not-enabled gate are not.
- Native token management: only the rejection paths are tested, since `addNativeTokenOwner` requires an enable time that has already passed. The successful add/remove, their events, and the non-zero `setNativeTokenManagementFrom` write are implemented but unverified.

Covering these needs a testnode started with both features enabled at genesis.

## Not new

The README diff also touched `ArbFunctionTable`, `ArbAggregator`, `ArbRetryableTx`, and `ArbStatistics` rows, but those were address fixes only — they were already unimplemented pre-bump.
