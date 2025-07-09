# Testing Approach

## Differential Testing Setup
- Run local Arbitrum testnode (has real precompiles)
- Fork testnode with Hardhat
- Deploy mocks to precompile addresses on Hardhat fork
- Send identical transactions to both environments
- Compare results

## What to Compare

### 1. Function Return Values
- All return values must match exactly
- Including complex types (tuples, arrays)

### 2. Revert Behavior
- Functions must revert under same conditions
- Error messages must match

### 3. Event Emissions
- Same events emitted
- Same parameters
- Same ordering

### 4. Access Control
- Permission checks must behave identically
- Owner-only functions must fail for non-owners

### 5. State Changes
- Raw storage slots must match exactly (via Storage Manager)
- State transitions must be identical
- Sequential operations must produce same final state