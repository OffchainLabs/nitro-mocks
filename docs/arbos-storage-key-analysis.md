# ArbOS Storage Key Analysis

This document provides a comprehensive analysis of how storage keys are calculated and managed in the Nitro implementation of ArbOS.

## Overview

ArbOS uses a hierarchical storage system built on top of Ethereum's state database. All ArbOS data is stored under a single Ethereum account at address `0xA4B05FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF`.

## Key Concepts

### 1. Storage Structure

The storage is organized as a tree of storage spaces (subspaces) that can be nested hierarchically. Each storage space contains a key-value store with 256-bit keys and values.

### 2. Storage Key Calculation

#### Root Storage
- The root storage has an empty `storageKey`: `[]byte{}`
- Direct storage at the root level uses the `mapAddress` function

#### Subspaces
- Child storage spaces are created using `OpenSubStorage(id []byte)` or `OpenCachedSubStorage(id []byte)`
- The storage key for a child is calculated as: `keccak256(parent.storageKey, id)`
- This ensures no collisions between different storage spaces

#### Slot Mapping
Within a storage space, the actual storage location for a key is calculated using the `mapAddress` function:

```go
func (s *Storage) mapAddress(key common.Hash) common.Hash {
    keyBytes := key.Bytes()
    boundary := common.HashLength - 1
    mapped := make([]byte, 0, common.HashLength)
    mapped = append(mapped, s.cachedKeccak(s.storageKey, keyBytes[:boundary])[:boundary]...)
    mapped = append(mapped, keyBytes[boundary])
    return common.BytesToHash(mapped)
}
```

This function:
1. Takes the first 31 bytes of the key
2. Calculates `keccak256(storageKey, keyBytes[:31])`
3. Takes the first 31 bytes of the hash result
4. Appends the last byte of the original key
5. This preserves contiguity within "pages" of 256 storage slots

### 3. Predefined Subspaces

ArbOS defines several subspaces with specific IDs:

```go
var (
    l1PricingSubspace        SubspaceID = []byte{0}
    l2PricingSubspace        SubspaceID = []byte{1}
    retryablesSubspace       SubspaceID = []byte{2}
    addressTableSubspace     SubspaceID = []byte{3}
    chainOwnerSubspace       SubspaceID = []byte{4}
    sendMerkleSubspace       SubspaceID = []byte{5}
    blockhashesSubspace      SubspaceID = []byte{6}
    chainConfigSubspace      SubspaceID = []byte{7}
    programsSubspace         SubspaceID = []byte{8}
    featuresSubspace         SubspaceID = []byte{9}
    nativeTokenOwnerSubspace SubspaceID = []byte{10}
)
```

### 4. Direct Offsets

Some values are stored at direct offsets in the root storage:

```go
const (
    versionOffset Offset = iota                    // 0
    upgradeVersionOffset                           // 1
    upgradeTimestampOffset                         // 2
    networkFeeAccountOffset                        // 3
    chainIdOffset                                  // 4
    genesisBlockNumOffset                          // 5
    infraFeeAccountOffset                          // 6
    brotliCompressionLevelOffset                   // 7
    nativeTokenEnabledFromTimeOffset               // 8
)
```

## Example: Chain Owners Storage

The chain owners are stored using an `AddressSet` in the `chainOwnerSubspace`:

1. **Subspace Creation**: 
   - Storage key = `keccak256("", []byte{4})`

2. **AddressSet Structure**:
   - Position 0: Size of the set (uint64)
   - Positions 1+: Addresses stored sequentially
   - Additional substorage at `[]byte{0}` for address-to-index mapping

3. **Address Storage**:
   - Each address in the set is stored at position `1 + index`
   - A mapping from address to its position is maintained in a substorage

## Storage Access Patterns

### Reading a Value
1. Calculate the storage slot using `mapAddress(key)`
2. Read from the Ethereum state DB at the calculated slot
3. Gas cost: `params.SloadGasEIP2200` (2100 gas)

### Writing a Value
1. Calculate the storage slot using `mapAddress(key)`
2. Write to the Ethereum state DB at the calculated slot
3. Gas cost: 
   - Zero value: `params.SstoreResetGasEIP2200` (2900 gas)
   - Non-zero value: `params.SstoreSetGasEIP2200` (20000 gas)

## Key Utility Functions

### Address Conversion
```go
func AddressToHash(address common.Address) common.Hash {
    return common.BytesToHash(address.Bytes())
}
```

### Uint Conversion
```go
func UintToHash(val uint64) common.Hash {
    return common.BigToHash(new(big.Int).SetUint64(val))
}
```

## Storage Calculation Example

For a chain owner address `0x1234...`:

1. **Subspace key**: `keccak256("", []byte{4})`
2. **Address as hash**: `common.BytesToHash(address.Bytes())`
3. **Mapping substorage key**: `keccak256(subspaceKey, []byte{0})`
4. **Final storage slot**: `mapAddress(addressHash)` in the mapping substorage

## Security Considerations

1. **Collision Resistance**: The use of keccak256 for key derivation provides strong collision resistance
2. **Page Security**: The mapAddress function provides 124-bit security against collision attacks
3. **Hierarchical Isolation**: Each subspace is cryptographically isolated from others

## Performance Optimizations

1. **Hash Caching**: A LRU cache of size 1024 is used to cache keccak256 computations
2. **Page Alignment**: The mapAddress function preserves contiguity within 256-slot pages
3. **Cached Subspaces**: Frequently accessed subspaces can use cached storage to reduce hash computations