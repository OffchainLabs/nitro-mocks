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

## General Implementation Approach

### Step 1: Research and Understand

1. **Locate the Go implementation**
   - Start in `submodules/nitro/precompiles/Arb[Contract].go`
   - Follow function calls to understand the complete flow
   - Pay attention to error messages - they must be matched exactly

2. **Trace storage patterns**
   - Identify which storage subsystems are used
   - Note the order of reads and writes
   - Look for side effects (e.g., functions that read before writing)

3. **Understand data structures**
   - Common patterns include AddressSet, simple storage slots, mappings
   - Check `submodules/nitro/arbos/` for specialized storage implementations

### Step 2: Implementation Strategy

1. **Check existing libraries**
   - Look for existing Solidity libraries that match Go patterns
   - Extend libraries if needed rather than duplicating code
   - Check existing precompile Solidity implementations for common patterns

2. **Match behavior exactly**
   - Function signatures must be identical to the interface
   - Error messages must match word-for-word
   - Storage access order must be preserved

3. **Mirror Go code structure**
   - If Go has methods on ArbosState (e.g., `state.NetworkFeeAccount()`), create corresponding accessor functions in the ArbosState library
   - This makes the Solidity implementation more maintainable and closer to the Go structure
   - Place accessor functions after offset constants in ArbosState.sol

4. **Handle access control**
   - Many functions require ownership or permission checks
   - Look for modifiers like `onlyChainOwner` in existing code

### Step 3: Testing Approach

#### Test Structure

```typescript
describe("Contract.functionName", function () {
  beforeEach(async function() {  
    // Deploy required contracts
    await deployAndSetCode("ArbosStorage", "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf");
    await deployAndSetCode("contracts/YourContract.sol:YourContract", PRECOMPILE_ADDRESSES.YourContract);
    // Deploy any other required precompiles
  });

  it("should match native implementation", async function () {
    await expectEquivalentTxFromMultipleAddresses(
      YourContract__factory,
      PRECOMPILE_ADDRESSES.YourContract,
      "functionName",
      [/* arguments */],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});
```

#### Testing Functions

There are two main testing utilities:

1. **For state-changing functions**: Use `expectEquivalentTxFromMultipleAddresses`
   - Tests that a transaction produces identical state changes
   - Compares storage access patterns and final values

2. **For view/pure functions**: Use `expectEquivalentCallFromMultipleAddresses`
   - Tests that a call returns identical results
   - No transaction is sent, only return values are compared

#### Important Testing Principles

1. **Always use version-excluding comparers initially**
   - `storageAccessComparerExcludingVersion`
   - `storageValueComparerExcludingVersion`
   
2. **Only the version slot should be excluded**
   - If tests fail for other reasons, DO NOT create custom comparers
   - Instead, fix your implementation to match the native behavior
   - If you genuinely need exceptions beyond version, raise this with the requester for guidance

3. **For state-mutating tests, implement state restoration**
   - Use `beforeEach` to capture original values and `afterEach` to restore them (see `test/arbowner/set-l1-price-per-unit.test.ts` for example)

### Step 4: Debugging Test Failures

When differential tests fail, they provide detailed storage access traces:

1. **Analyze the differences**
   - Compare mock vs underlying storage accesses
   - Look for missing reads/writes or wrong order
   - Check slot calculations

2. **Common issues**
   - Missing storage reads (Go often reads before writing)
   - Incorrect subspace calculations
   - Wrong data type conversions
   - Mismatched error messages

3. **Iterative refinement**
   - Adjust implementation based on test output
   - Re-run tests to verify fixes
   - Repeat until storage patterns match

## Key Concepts

### Storage Hierarchy

Arbitrum uses a hierarchical storage system:
- Root storage with direct offsets for system values
- Subspaces for different subsystems (accessed via `openSubStorage`)
- Storage slots within subspaces calculated via hashing

### Common Patterns

1. **Direct storage access**: Simple values at known offsets
2. **Subspace access**: Data organized in subsystems
3. **AddressSet pattern**: Lists of addresses with O(1) membership checks
4. **Mapping patterns**: Key-value storage within subspaces

### Error Handling

- Error messages must match Go implementation exactly
- Use `require` statements with the exact error text
- Pay attention to error conditions and their order

## Best Practices

1. **Read existing implementations**
   - Study similar functions that are already implemented
   - Follow established patterns and conventions

2. **Maintain consistency**
   - Use existing libraries and helpers
   - Follow the project's code style
   - Match naming conventions

3. **Document only when necessary**
   - Code should be self-documenting
   - Only add comments that explain WHY code exists, not WHAT it does
   - Comments describing what code does are unnecessary and should be avoided
   - Valid reasons for comments: explaining non-obvious behavior, documenting workarounds, or clarifying complex business logic


## When to Seek Help

Raise questions with the requester if:
- Tests require exceptions beyond version exclusion
- Storage patterns don't match despite correct implementation
- Go implementation has version-specific behavior that's unclear
- You encounter patterns not covered by existing utilities

## Checklist

Before considering implementation complete:
- [ ] Function signature matches interface exactly
- [ ] All error messages match Go implementation
- [ ] Storage access patterns verified via differential testing
- [ ] Tests pass with version-excluding comparers only
- [ ] Access control properly implemente
- [ ] Code follows project conventions
- [ ] No unnecessary comments or documentation