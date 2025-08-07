# Go Coverage Measurement for Solidity Mocks

## Problem Statement

When implementing Solidity mocks of Arbitrum's Go precompiles, we want to ensure our mocks cover all code paths in the original Go implementation. However, measuring Go code coverage from Solidity tests is challenging since:

1. We're testing Solidity code, not running Go code directly
2. The Go precompiles run natively in Arbitrum nodes, not as separate testable units
3. We need to ensure behavioral parity across all edge cases

## Solution: Shared Test Definition Approach

Use JSON test definitions that can be consumed by both Go and TypeScript test runners, enabling:
- Identical test execution across both implementations
- Go code coverage measurement during test runs
- Single source of truth for test scenarios

### Architecture

```
test/shared/arbowner-tests.json  →  Go Test Runner    → Go Coverage Report
                                  ↘                    
                                    TypeScript Runner  → Solidity Tests
```

### Test Definition Format

```json
{
  "testSuites": [
    {
      "name": "ChainOwnerManagement",
      "setup": {
        "caller": "0x7fa9385be102ac3eac297483dd6233d62b3e1496",
        "initialOwners": ["0x0000000000000000000000000000000000000000"]
      },
      "tests": [
        {
          "name": "removeZeroAddressOwner",
          "method": "removeChainOwner",
          "args": ["0x0000000000000000000000000000000000000000"],
          "expectSuccess": true
        },
        {
          "name": "addMultipleOwners",
          "sequence": [
            {"method": "addChainOwner", "args": ["0xaddr1"]},
            {"method": "addChainOwner", "args": ["0xaddr2"]},
            {"method": "addChainOwner", "args": ["0xaddr1"]},
            {"method": "isChainOwner", "args": ["0xaddr1"], "expectReturn": true}
          ]
        }
      ]
    }
  ]
}
```

### Go Test Runner

Create a Go program that:
1. Parses the JSON test definitions
2. Sets up a mock EVM environment (using existing test utilities from nitro)
3. Executes precompile methods according to test definitions
4. Collects coverage data using Go's built-in coverage tools
5. Outputs coverage reports

Key implementation points:
- Reuse existing mock EVM setup from `precompiles/precompile_test.go`
- Enable coverage with `-coverprofile` flag
- Parse coverage data to identify uncovered code paths

### TypeScript Test Runner

Modify existing test structure to:
1. Load the same JSON test definitions
2. Generate test cases dynamically
3. Use existing `expectEquivalent` utilities
4. Ensure identical test execution order

### Implementation Steps

1. **Extract test patterns from existing Go tests**
   - Analyze `submodules/nitro/precompiles/ArbOwner_test.go`
   - Identify all test scenarios and edge cases
   - Convert to JSON format

2. **Build Go test runner**
   - Create standalone Go program in `test/go-runner/`
   - Import precompile packages and test utilities
   - Add JSON parsing and test execution logic

3. **Adapt TypeScript tests**
   - Create shared test loader utility
   - Modify existing tests to use shared definitions
   - Maintain backward compatibility with existing tests

4. **Integrate coverage reporting**
   - Add coverage collection to Go runner
   - Parse coverage output to identify gaps
   - Create dashboard showing coverage percentages

### Benefits

1. **Comprehensive coverage**: Directly measure which Go code paths are tested
2. **Single source of truth**: One test definition drives both implementations
3. **Maintainability**: Easy to add new test cases that apply to both
4. **Confidence**: Know exactly which precompile behaviors are covered

### Alternative Approaches Considered

1. **Running tests against instrumented testnode**: Too complex, requires modifying node infrastructure
2. **Manual test case extraction**: Prone to drift between implementations
3. **Fuzzing**: Doesn't provide targeted coverage of specific code paths

### Next Steps

1. Prototype Go test runner with simple ArbOwner test
2. Measure baseline coverage with existing tests
3. Add test cases to achieve full coverage
4. Automate coverage reporting in CI