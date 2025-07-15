# Testing Equivalence Between Mock and Native Precompiles

This document describes our approach for testing that our mock Arbitrum precompiles behave identically to the native implementations.

## Overview

Our testing strategy ensures that mock precompiles match native behavior across:
- Return values
- Storage access patterns
- Events emitted
- Revert conditions and messages

## Core Testing Function

### `expectEquivalent`

The primary testing utility that compares behavior between fork and underlying networks.

```typescript
await expectEquivalent(
  forkProvider,
  underlyingProvider,
  address,
  method,
  args,
  options
);
```

### Parameters

- `forkProvider`: The Hardhat forked network provider with mock contracts
- `underlyingProvider`: The original Arbitrum network provider
- `address`: Precompile address to test
- `method`: Function name to call
- `args`: Array of arguments for the function
- `options`: Optional configuration for value, exceptions, etc.

## Basic Usage

### Simple Equivalence Test

```typescript
it("arbChainID should behave equivalently", async function() {
  await expectEquivalent(
    this.forkProvider,
    this.underlyingProvider,
    PRECOMPILE_ADDRESSES.ArbSys,
    "arbChainID"
  );
});
```

### With Arguments

```typescript
it("arbBlockHash should behave equivalently", async function() {
  const blockNum = 12345;
  await expectEquivalent(
    this.forkProvider,
    this.underlyingProvider,
    PRECOMPILE_ADDRESSES.ArbSys,
    "arbBlockHash",
    [blockNum]
  );
});
```

### Payable Functions

```typescript
it("sendTxToL1 should behave equivalently", async function() {
  await expectEquivalent(
    this.forkProvider,
    this.underlyingProvider,
    PRECOMPILE_ADDRESSES.ArbSys,
    "sendTxToL1",
    [recipient, data],
    {
      value: ethers.utils.parseEther("1")
    }
  );
});
```

## Handling Exceptions

Sometimes mock implementations cannot achieve perfect parity due to technical limitations. Use validators to handle expected differences:

### Storage Exceptions

```typescript
import { storage } from './validators';

it("function with storage exceptions", async function() {
  await expectEquivalent(
    this.forkProvider,
    this.underlyingProvider,
    PRECOMPILE_ADDRESSES.ArbSys,
    "someFunction",
    [],
    {
      storage: storage.excludingSlots(["0x1234...", "0x5678..."])
    }
  );
});
```

### Result Tolerance

```typescript
import { result } from './validators';

it("function with result tolerance", async function() {
  await expectEquivalent(
    this.forkProvider,
    this.underlyingProvider,
    PRECOMPILE_ADDRESSES.ArbSys,
    "getBlockNumber",
    [],
    {
      result: result.within(100) // Allow difference of up to 100
    }
  );
});
```

### Custom Validators

```typescript
it("function with custom validation", async function() {
  await expectEquivalent(
    this.forkProvider,
    this.underlyingProvider,
    PRECOMPILE_ADDRESSES.ArbSys,
    "complexFunction",
    [],
    {
      storage: (mock, underlying) => {
        // Custom storage comparison logic
        const filtered = mock.filter(a => !a.slot.startsWith("0xtemp"));
        expect(filtered).to.deep.equal(underlying);
      },
      result: (mock, underlying) => {
        // Custom result comparison
        const mockDecoded = abi.decode(['uint256', 'address'], mock);
        const underlyingDecoded = abi.decode(['uint256', 'address'], underlying);
        expect(mockDecoded[0]).to.equal(underlyingDecoded[0]);
        // Address might differ but that's OK in this case
      }
    }
  );
});
```

## Property-Based Testing with Fuzzing

Use fast-check for property-based testing:

```typescript
import fc from 'fast-check';

it("arbBlockHash behaves equivalently for all valid blocks", async function() {
  const currentBlock = await ethers.provider.getBlockNumber();
  
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: currentBlock - 1 }),
      async (blockNum) => {
        await expectEquivalent(
          this.forkProvider,
          this.underlyingProvider,
          PRECOMPILE_ADDRESSES.ArbSys,
          "arbBlockHash",
          [blockNum]
        );
      }
    ),
    { numRuns: 100 }
  );
});
```

## Revert Testing

`expectEquivalent` automatically handles reverts - both implementations should revert with the same reason:

```typescript
it("should revert equivalently for invalid input", async function() {
  const futureBlock = 999999999;
  // Both should revert with same error message
  await expectEquivalent(
    this.forkProvider,
    this.underlyingProvider,
    PRECOMPILE_ADDRESSES.ArbSys,
    "arbBlockHash",
    [futureBlock]
  );
});
```

## Available Validators

### Storage Validators
- `storage.exact()` - Require exact match (default)
- `storage.excludingSlots(slots)` - Ignore specific storage slots
- `storage.excludingAddress(address)` - Ignore storage at specific address
- `storage.excludingWhere(predicate)` - Custom filtering logic

### Result Validators
- `result.exact()` - Require exact match (default)
- `result.within(tolerance)` - Allow numerical difference
- `result.custom(fn)` - Custom comparison logic

### Event Validators
- `events.exact()` - Require exact match (default)
- `events.ignoring(eventNames)` - Ignore specific events
- `events.ignoringOrder()` - Match events regardless of order

## Test Structure

```typescript
describe("ArbSys", () => {
  beforeEach(async function() {
    // Deploy mock contracts
    await deployAndSetCode("ArbosStorage", ARBOS_STORAGE_ADDRESS);
    await deployAndSetCode("contracts/ArbSys.sol:ArbSys", PRECOMPILE_ADDRESSES.ArbSys);
  });

  it("arbChainID should behave equivalently", async function() {
    await expectEquivalent(
      this.forkProvider,
      this.underlyingProvider,
      PRECOMPILE_ADDRESSES.ArbSys,
      "arbChainID"
    );
  });

  // More tests...
});
```

## Implementation Notes

1. **Storage Access**: The testing framework handles Arbitrum's special precompile behavior where storage accesses appear to come from the precompile but actually access ArbosStorage.

2. **Provider Access**: Tests should use `this.forkProvider` and `this.underlyingProvider` which are set up by the test harness.

3. **Debugging**: When tests fail, `expectEquivalent` provides detailed information about which aspect (result, storage, events) differed.

4. **Performance**: The function makes parallel calls to both networks for efficiency.