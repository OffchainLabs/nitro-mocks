# Implementing Precompile Functions

This guide explains how to implement new precompile functions in the Nitro Mocks project.

## Background: Why Nitro Mocks?

Arbitrum implements special system functionality through "precompiles" - contracts deployed at specific addresses (like `0x64`, `0x65`, etc.) that provide core chain functionality. These precompiles are implemented natively in Go within the Arbitrum Nitro node software, not as EVM bytecode.

This creates a challenge for developers:
- When testing on Arbitrum chains, precompiles work natively
- When testing on Hardhat forks or other EVM environments, calls to precompile addresses fail
- This makes it difficult to test Arbitrum-specific functionality in development

**Nitro Mocks solves this by providing Solidity implementations of these precompiles that can be deployed to any EVM chain.**

### How It Works

1. **Storage Architecture**: All Arbitrum system state is stored under a single account (`0xA4B05FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF`). Our mocks deploy an `ArbosStorage` contract at this address.

2. **Precompile Mocks**: We deploy mock contracts at each precompile address (0x64, 0x65, etc.) that replicate the behavior of the native implementations.

3. **Behavioral Parity**: Each mock function reads from/writes to the same storage locations as the Go implementation, ensuring consistent behavior.

4. **Testing Strategy**: We use differential testing (via `expectEquivalent`) to verify our mocks behave identically to real precompiles on an Arbitrum testnode.

### Project Goals

- Enable testing of Arbitrum-specific features on any EVM chain
- Maintain exact behavioral compatibility with native precompiles
- Provide a reference implementation for understanding precompile behavior
- Support development workflows that use Hardhat forks

## Overview

Each precompile function implementation follows the same pattern:
1. Study the Go implementation to understand behavior
2. Trace storage access patterns
3. Implement equivalent Solidity code
4. Test against real precompiles

This guide walks through the process with concrete examples.

## Prerequisites

1. **Understanding of the architecture**: Precompile contracts delegate storage operations to the ArbosStorage contract at `0xA4B05FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF`
2. **Access to the Nitro submodule**: You'll need to read Go implementations in `submodules/nitro/`

## Storage System Overview

Arbitrum uses a hierarchical storage system:
- All data is stored under a single account (`0xA4B05FFF...`)
- Storage is organized into "subspaces" identified by byte arrays
- Each subspace has its own storage key calculated as `keccak256(parentKey || subspaceId)`
- Within each subspace, individual storage slots are calculated using the `mapAddress` function

The storage hierarchy looks like:
```
Root Storage (empty key)
├── Direct offsets (VERSION, CHAIN_ID, etc.)
└── Subspaces
    ├── 0x00: L1 Pricing
    ├── 0x01: L2 Pricing
    ├── 0x04: Chain Owners
    ├── 0x0a: Native Token Owners
    └── ... other subspaces
```

## Implementation Process

### 1. Research the Go Implementation

Start by finding the function in the Nitro codebase:
- Precompile interfaces: `submodules/nitro/precompiles/Arb[Contract].go`
- Storage implementation: `submodules/nitro/arbos/arbosState/arbosstate.go`
- Specialized storage (e.g., addressSet): `submodules/nitro/arbos/addressSet/addressSet.go`

### 2. Understand the Storage Access Pattern

Trace how the Go code accesses storage:
1. Which storage space does it use?
2. What offsets/keys does it read/write?
3. What data types are involved?

### 3. Implement in Solidity

Create or update the appropriate contract in `contracts/`:
1. Import necessary interfaces and libraries
2. Implement the function matching the interface signature
3. Use ArbosStorage methods to access storage
4. Handle type conversions between Go and Solidity

### 4. Write Tests

Create a new test file in `test/[contract-name]/[function-name]/[function-name].test.ts`:
1. Use the `expectEquivalent` utility for differential testing
2. Test against a real Arbitrum testnode
3. Include edge cases and access control tests

## Detailed Examples

### Example 1: arbChainID (Direct Offset Pattern)

**Go Implementation** (`submodules/nitro/precompiles/ArbSys.go`):
```go
func (con *ArbSys) ArbChainID(c ctx, evm mech) (huge, error) {
    return evm.ChainConfig().ChainID, nil
}
```

**Storage Trace**:
1. Chain ID is stored at a fixed offset in root storage
2. Defined in `arbosState.go`: `chainIdOffset = 4`
3. Direct read from slot at offset 4

**Solidity Implementation** (`contracts/ArbSys.sol`):
```solidity
function arbChainID() external view override returns (uint256) {
    return ArbosStorage(ARBOS_STORAGE_ADDRESS).getUint256(
        ArbosState.ROOT_STORAGE_KEY,
        ArbosState.CHAIN_ID_OFFSET
    );
}
```

**Key Points**:
- Simple direct storage read
- Uses predefined offset constant
- No subspace calculation needed

### Example 2: getAllChainOwners (AddressSet Pattern)

**Go Implementation** (`submodules/nitro/precompiles/ArbOwnerPublic.go`):
```go
func (con ArbOwnerPublic) GetAllChainOwners(c ctx, evm mech) ([]addr, error) {
    return c.State.ChainOwners().AllMembers(65536)
}
```

**Storage Trace**:
1. `c.State.ChainOwners()` opens the chain owners subspace (ID: 0x04)
2. Storage key is calculated: `keccak256("" || 0x04)`
3. `AllMembers` reads from an AddressSet structure:
   - Size at offset 0
   - Members at offsets 1, 2, 3, etc.

**Solidity Implementation** (`contracts/ArbOwnerPublic.sol`):
```solidity
function getAllChainOwners() external view override returns (address[] memory) {
    bytes memory chainOwnerKey = ArbosStorage(ARBOS_STORAGE_ADDRESS).openSubStorage(
        ArbosState.ROOT_STORAGE_KEY,
        ArbosState.CHAIN_OWNER_SUBSTORAGE
    );
    return AddressSet.allMembers(ARBOS_STORAGE_ADDRESS, chainOwnerKey, 65536);
}
```

**Key Points**:
- Uses the AddressSet library to handle the storage pattern
- Calculates the subspace key using `openSubStorage`
- Passes the same max members limit (65536) as the Go code

## Common Patterns

### 1. AddressSet Operations
Used for managing lists of addresses (owners, managers, etc.):
```solidity
bytes memory subKey = ArbosStorage(ARBOS_STORAGE_ADDRESS).openSubStorage(
    parentKey,
    subspaceId
);
return AddressSet.allMembers(ARBOS_STORAGE_ADDRESS, subKey, maxSize);
```

### 2. Direct Storage Access
For simple values at known offsets:
```solidity
return ArbosStorage(ARBOS_STORAGE_ADDRESS).getUint64(
    storageKey,
    offset
);
```

### 3. Nested Subspaces
Some data requires multiple levels of subspace:
```solidity
bytes memory level1Key = ArbosStorage(ARBOS_STORAGE_ADDRESS).openSubStorage(
    ArbosState.ROOT_STORAGE_KEY,
    ArbosState.PROGRAMS_SUBSTORAGE
);
bytes memory level2Key = ArbosStorage(ARBOS_STORAGE_ADDRESS).openSubStorage(
    level1Key,
    programId
);
```

## Testing Guidelines

1. **Create a dedicated test file** for each function in `test/[contract-name]/[function-name]/[function-name].test.ts`

2. **Set up the test environment** in `beforeEach`:
   ```typescript
   beforeEach(async function() {
     await deployAndSetCode("ArbosStorage", "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf");
     await deployAndSetCode("contracts/ArbSys.sol:ArbSys", PRECOMPILE_ADDRESSES.ArbSys);
   });
   ```

3. **Use expectEquivalentCallFromMultipleAddresses** to test behavior:
   ```typescript
   await expectEquivalentCallFromMultipleAddresses(
     ArbSys__factory,
     PRECOMPILE_ADDRESSES.ArbSys,
     "arbChainID",
     [],  // function arguments
     {
       storage: storageComparerExcludingVersion
     }
   );
   ```

4. **Include edge cases** specific to the function in additional test cases

## Type Conversions

Common Go to Solidity type mappings:
- `common.Address` → `address`
- `*big.Int` → `uint256`
- `uint64` → `uint64`
- `[]byte` → `bytes`
- `[32]byte` → `bytes32`

## Checklist

Before submitting:
- [ ] Function signature matches the interface exactly
- [ ] Storage access patterns match the Go implementation
- [ ] All tests pass
- [ ] Edge cases are tested
- [ ] No unnecessary comments (code should be self-documenting)
- [ ] Any necessary comments explain "why" not "what"