# Testing Storage Mutations

This document describes our approach for testing precompile functions that modify storage while maintaining test isolation between the fork and underlying networks.

## Challenge

When testing storage-mutating functions:
- The fork resets between test runs, starting with clean state
- The underlying network persists changes across test runs
- This creates test isolation issues where fork and underlying network diverge

## Solution

We employ two complementary strategies:

### 1. Storage Diff Comparison

Instead of comparing absolute storage values, we compare the **changes** in storage caused by each operation.

#### Implementation

```typescript
async function expectEquivalentStorageChanges(
  address: string,
  callData: string,
  options?: EquivalenceOptions
) {
  // Capture storage state before execution
  const [mockBefore, underlyingBefore] = await Promise.all([
    captureStorageSnapshot(forkProvider, address),
    captureStorageSnapshot(underlyingProvider, address)
  ]);
  
  // Execute the storage-mutating call on both networks
  await forkProvider.call({ to: address, data: callData });
  await underlyingProvider.call({ to: address, data: callData });
  
  // Capture storage state after execution
  const [mockAfter, underlyingAfter] = await Promise.all([
    captureStorageSnapshot(forkProvider, address),
    captureStorageSnapshot(underlyingProvider, address)
  ]);
  
  // Calculate storage deltas
  const mockChanges = computeStorageDiff(mockBefore, mockAfter);
  const underlyingChanges = computeStorageDiff(underlyingBefore, underlyingAfter);
  
  // Verify that both networks experienced identical storage changes
  expect(mockChanges).to.deep.equal(underlyingChanges);
}
```

This approach ensures that even if the underlying network has different initial values, we're verifying that both implementations modify storage in the same way.

### 2. Test-Specific Unique Values

We use timestamp-based or incrementing values to ensure each test uses unique data that can be verified independently.

#### Implementation

```typescript
it("should set L2 base fee equivalently", async function() {
  // Generate a unique test value
  const testId = Date.now();
  const testValue = BigInt(testId) * 1000n; // Ensures uniqueness
  
  await expectEquivalentCall(
    ArbOwner_ADDRESS,
    iface.encodeFunctionData("setL2BaseFee", [testValue]),
    {
      storage: (mock, underlying) => {
        // Verify both networks wrote our specific test value
        const mockWrite = mock.find(s => 
          s.type === 'write' && 
          s.value.includes(testValue.toString(16))
        );
        const underlyingWrite = underlying.find(s => 
          s.type === 'write' && 
          s.value.includes(testValue.toString(16))
        );
        
        expect(mockWrite).to.exist;
        expect(underlyingWrite).to.exist;
        expect(mockWrite.slot).to.equal(underlyingWrite.slot);
      }
    }
  );
});
```

## Benefits

1. **True Isolation**: Tests don't depend on network state
2. **Deterministic**: Same test behavior regardless of prior test runs
3. **Debuggable**: Clear which values belong to which test run
4. **Parallel-Safe**: Tests can run concurrently without interference

## Best Practices

1. **Always use unique values** - Never hardcode values that might already exist on the underlying network
2. **Verify the change, not the state** - Focus on what the function changed rather than absolute values
3. **Document mutations** - Clearly indicate in test names that they modify network state
4. **Group write tests** - Keep storage-mutating tests in dedicated test suites for clarity

## Example Test Structure

```typescript
describe("ArbOwner Storage Mutations", () => {
  it("should set L2 base fee with identical storage changes", async function() {
    const uniqueBaseFee = generateUniqueValue("baseFee");
    
    await expectEquivalentStorageChanges(
      ARBOWNER_ADDRESS,
      iface.encodeFunctionData("setL2BaseFee", [uniqueBaseFee])
    );
  });
  
  it("should set minimum base fee with identical storage changes", async function() {
    const uniqueMinFee = generateUniqueValue("minBaseFee");
    
    await expectEquivalentStorageChanges(
      ARBOWNER_ADDRESS,
      iface.encodeFunctionData("setMinimumL2BaseFee", [uniqueMinFee])
    );
  });
});
```

## Implementation Notes

- Storage diff comparison should handle all storage operations (SLOAD, SSTORE)
- The diff algorithm should account for multiple writes to the same slot
- Consider storage packing when comparing values (e.g., uint64 in a uint256 slot)
- Test utilities should provide clear error messages showing storage differences