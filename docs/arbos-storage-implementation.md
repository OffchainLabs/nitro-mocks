# ArbOS State Solidity Implementation Plan (Simplified)

## Overview

This document outlines the plan for implementing a Solidity equivalent of the ArbOS state storage system currently implemented in Go. The goal is to create a contract system that can be deployed on a forked network (like Hardhat) at the same address and maintain compatibility with the existing storage layout.

## Key Challenges

1. **Storage Address**: The ArbOS state uses a special address (`0xA4B05FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF`) which needs to be pre-deployed in our fork
2. **Hierarchical Storage**: Go implementation uses a complex subspace system that needs to be replicated efficiently in Solidity
3. **Storage Slot Mapping**: Special mapping function that preserves contiguity within "pages" of 256 slots

## Proposed Architecture

### 1. Core Storage Contract (`ArbosStorage.sol`)

The main contract that holds all state at the special address.

```solidity
contract ArbosStorage {
    // Version test: slot 0x15fed0451499512d95f3ec5a41c878b9de55f21878b5b4e190d4667ec709b400
    // This will be our first implementation to verify the storage mapping works correctly
}
```

### 2. Storage Type Mappings

Direct mappings for storage-backed types (no structs needed):
- `uint64` → stored as-is in lower 8 bytes of slot
- `address` → stored as-is in lower 20 bytes of slot
- `uint256/int256` → stored across full slot
- `bytes` → length in first slot, data follows
- `BigInt` → custom encoding with value and sign

### 3. Component Implementation

All components will be implemented as libraries.

**Library Pattern**:
```solidity
library ComponentLib {
    function getValue(mapping(bytes32 => bytes32) storage store, bytes32 key) 
        internal view returns (uint256) {
        return uint256(store[key]);
    }
    
    function setValue(mapping(bytes32 => bytes32) storage store, bytes32 key, uint256 value) 
        internal {
        store[key] = bytes32(value);
    }
}
```

### 4. Implementation Scope

#### Phase 1: Core Infrastructure (Current Focus)
1. Create base `ArbosStorage` contract
2. Implement storage slot mapping function
3. Start with version ID to verify slot calculation
4. Add basic fixed-offset variables

#### Phase 2: Basic Components
1. `AddressSet` library for chain/token owners
2. Simple storage variables (fees, timestamps, etc.)
3. Basic getter/setter functions

#### Phase 3: Complex Components (Documentation Only)
Document the following for future implementation:
- **L1PricingState**: Manages L1 gas price data, base fee, surplus
- **L2PricingState**: Controls L2 gas pricing, speed limits, pool sizes
- **RetryableState**: Handles retryable transaction storage and timeouts
- **AddressTable**: Compression table for frequently used addresses
- **MerkleAccumulator**: Maintains merkle tree of L2→L1 messages
- **Programs**: WASM program storage and stylus contract management
- **Features**: Feature flag system for protocol upgrades
- **Blockhashes**: Recent blockhash storage

### 5. Storage Layout Calculation

The Go implementation uses a special mapping function:
```go
func (s *Storage) mapAddress(key common.Hash) common.Hash {
    // Preserves contiguity within pages of 256 slots
    mapped := crypto.Keccak256Hash(s.storageKey[:], key[:])
    // Clear the lower byte to stay within page
    mapped[31] = 0
    return mapped
}
```

This needs to be replicated exactly in Solidity to match storage slots.

## Future Scope

1. **Access Control**: Implement chain owner permissions
2. **Upgrade Mechanism**: Version-based upgrade system
3. **Full Testing Suite**: Comprehensive storage layout verification
4. **Advanced Features**: Programs, features, full pricing states

## Initial Implementation Strategy

1. Start with minimal `ArbosStorage` contract
2. Implement version storage at known slot
3. Verify slot `0x15fed0451499512d95f3ec5a41c878b9de55f21878b5b4e190d4667ec709b400` contains version
4. Add subspace slot calculation
5. Test with additional known subspace slot (to be provided)
6. Gradually add basic components

## Next Steps

1. Create `ArbosStorage.sol` with version storage
2. Test deployment at correct address on fork
3. Verify version slot matches expected value
4. Expand to other basic storage variables