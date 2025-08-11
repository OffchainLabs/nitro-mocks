# Nitro Mocks

## Project Overview

Nitro Mocks provides Solidity implementations of Arbitrum's precompiled contracts for local testing environments.

Arbitrum chains include system contracts (precompiles) at addresses like `0x64`, `0x65` that handle L2-specific operations - gas pricing, L1 messaging, chain management. These are built into Arbitrum nodes as Go code, not deployable Solidity contracts.

This repository contains Solidity versions of these precompiles that:
- Deploy to the same addresses as native precompiles
- Use identical storage layouts
- Replicate the same behavior (verified through differential testing against real Arbitrum nodes)

When you deploy these mocks to your Hardhat fork or local testnet, your code can interact with Arbitrum's system functions exactly as it would on mainnet.

## How It Works

### Storage Architecture

All Arbitrum system state lives at a single address: `0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf`. The `ArbosStorage` contract deployed here manages storage for all precompiles using a hierarchical key system.

### Implementation Status

#### ArbSys (`0x64`)
| Function | Implemented |
|----------|-------------|
| arbBlockNumber | ✅ |
| arbBlockHash | ✅ |
| arbChainID | ✅ |
| arbOSVersion | ✅ |
| getStorageGasAvailable | ✅ |
| isTopLevelCall | ❌ |
| mapL1SenderContractAddressToL2Alias | ✅ |
| wasMyCallersAddressAliased | ❌ |
| myCallersAddressWithoutAliasing | ❌ |
| withdrawEth | ✅ |
| sendTxToL1 | ✅ |
| sendMerkleTreeState | ✅ |

#### ArbGasInfo (`0x6c`)
| Function | Implemented |
|----------|-------------|
| getPricesInWei | ✅ |
| getPricesInWeiWithAggregator | ✅ |
| getPricesInArbGas | ✅ |
| getPricesInArbGasWithAggregator | ✅ |
| getGasAccountingParams | ✅ |
| getMinimumGasPrice | ✅ |
| getL1BaseFeeEstimate | ✅ |
| getL1BaseFeeEstimateInertia | ✅ |
| getL1RewardRate | ✅ |
| getL1RewardRecipient | ✅ |
| getL1GasPriceEstimate | ✅ |
| getCurrentTxL1GasFees | ✅ |
| getGasBacklog | ✅ |
| getPricingInertia | ✅ |
| getGasBacklogTolerance | ✅ |
| getL1PricingSurplus | ✅ |
| getPerBatchGasCharge | ✅ |
| getAmortizedCostCapBips | ✅ |
| getL1FeesAvailable | ✅ |
| getL1PricingEquilibrationUnits | ✅ |
| getLastL1PricingUpdateTime | ✅ |
| getL1PricingFundsDueForRewards | ✅ |
| getL1PricingUnitsSinceUpdate | ✅ |
| getLastL1PricingSurplus | ✅ |

#### ArbOwner (`0x70`)
| Function | Implemented |
|----------|-------------|
| getAllChainOwners | ✅ |
| isChainOwner | ✅ |
| setL2BaseFee | ✅ |
| setMinimumL2BaseFee | ✅ |
| setSpeedLimit | ✅ |
| setMaxTxGasLimit | ✅ |
| setL1BaseFeeEstimateInertia | ✅ |
| setNetworkFeeAccount | ✅ |
| addChainOwner | ✅ |
| removeChainOwner | ✅ |
| setAmortizedCostCapBips | ✅ |
| setBrotliCompressionLevel | ✅ |
| releaseL1PricerSurplusFunds | ✅ |
| setPerBatchGasCharge | ✅ |
| setL1PricingEquilibrationUnits | ✅ |
| setL1PricingInertia | ✅ |
| setL1PricingRewardRecipient | ✅ |
| setL1PricingRewardRate | ✅ |
| setL1PricePerUnit | ✅ |
| setL2GasBacklogTolerance | ✅ |
| setL2GasPricingInertia | ✅ |
| scheduleArbOSUpgrade | ✅ |
| getNetworkFeeAccount | ✅ |
| getInfraFeeAccount | ✅ |
| setInfraFeeAccount | ✅ |
| setChainConfig | ❌ |
| setInkPrice | ❌ |
| setWasmMaxStackDepth | ❌ |
| setWasmFreePages | ❌ |
| setWasmPageGas | ❌ |
| setWasmPageLimit | ❌ |
| setWasmMaxSize | ❌ |
| setWasmMinInitGas | ❌ |
| setWasmInitCostScalar | ❌ |
| setWasmExpiryDays | ❌ |
| setWasmKeepaliveDays | ❌ |
| setWasmBlockCacheSize | ❌ |
| addWasmCacheManager | ❌ |
| removeWasmCacheManager | ❌ |

#### ArbOwnerPublic (`0x6b`)
| Function | Implemented |
|----------|-------------|
| isChainOwner | ✅ |
| getAllChainOwners | ✅ |
| getNetworkFeeAccount | ✅ |
| getInfraFeeAccount | ✅ |
| getBrotliCompressionLevel | ✅ |
| getScheduledUpgrade | ✅ |
| rectifyChainOwner | ❌ |

#### Not Implemented
- ArbInfo (`0x65`) ❌
- ArbAddressTable (`0x66`) ❌
- ArbAggregator (`0x67`) ❌
- ArbRetryableTx (`0x68`) ❌
- ArbStatistics (`0x6a`) ❌
- ArbFunctionTable (`0x6d`) ❌
- ArbWasm (`0x71`) ❌
- ArbWasmCache (`0x72`) ❌

## Testing & Verification

This project uses differential testing to ensure the mocks behave identically to Arbitrum's native precompiles. 

### How Differential Testing Works

Each test executes the same function call twice:
1. Against the mock contract deployed in a Hardhat fork
2. Against the native precompile on the same fork (which forwards to the real Arbitrum node)

The test framework then compares:
- **Storage Access Patterns**: Every storage read and write is recorded and compared. The mocks must access the exact same storage slots in the same order as the native implementation.
- **Return Values**: Function outputs must be byte-for-byte identical.
- **State Changes**: Final storage values must match after execution.
- **Events**: Emitted events must be identical in both data and order.

### Limitations

The current test suite does not measure coverage of the Go implementations that define the actual precompile behavior. While differential testing verifies that tested code paths match, there may be edge cases or error conditions in the native precompiles that aren't covered by the test suite. 

Until Go code coverage is implemented, the mocks may not handle all edge cases identically to native precompiles. Users should be aware that while the mocks work for common use cases, they should not be relied upon for perfect behavioral parity in all scenarios.

## Usage

### 1. Hardhat Tests

Deploy Arbitrum precompile mocks directly in your test suite.

```typescript
import { deployNitroMocksHardhat, ArbPrecompile } from "@arbitrum/nitro-mocks/deployer";

describe("MyContract", function () {
  beforeEach(async function () {
    // Deploy all implemented precompiles
    await deployNitroMocksHardhat();
    
    // Or deploy specific precompiles
    await deployNitroMocksHardhat([ArbPrecompile.ArbSys, ArbPrecompile.ArbGasInfo]);
  });

  it("should interact with ArbSys", async function () {
    const arbSys = await ethers.getContractAt("IArbSys", ArbPrecompile.ArbSys);
    const blockNumber = await arbSys.arbBlockNumber();
  });
});
```

### 2. Hardhat Task

Deploy to a standalone Hardhat node using the built-in task.

```bash
# Start Hardhat node
npx hardhat node

# In another terminal, deploy all precompiles
npx hardhat deploy-precompiles --network localhost

# Deploy specific precompiles
npx hardhat deploy-precompiles --network localhost --precompiles ArbSys,ArbGasInfo
```

### 3. Hardhat via CLI

Deploy to any Hardhat node using the standalone CLI.

```bash
# Install globally
npm install -g @arbitrum/nitro-mocks

# Deploy to Hardhat node (auto-detects Hardhat)
nitro-mocks-deploy --rpc-url http://localhost:8545

# Deploy specific precompiles
nitro-mocks-deploy --rpc-url http://localhost:8545 --precompiles ArbSys,ArbGasInfo
```

### 4. Foundry Tests

Deploy in Foundry test environment.

```solidity
import "forge-std/Test.sol";
import "@arbitrum/nitro-mocks/deployer/DeployMocks.sol";

contract MyTest is Test {
    function setUp() public {
        // Deploy all implemented precompiles
        DeployMocks.deployNitroMocks();
        
        // Or deploy specific precompiles
        DeployMocks.ArbPrecompile[] memory precompiles = new DeployMocks.ArbPrecompile[](2);
        precompiles[0] = DeployMocks.ArbPrecompile.ArbSys;
        precompiles[1] = DeployMocks.ArbPrecompile.ArbGasInfo;
        DeployMocks.deployNitroMocks(precompiles);
    }

    function testArbSys() public {
        address arbSysAddr = DeployMocks.getPrecompileAddress(DeployMocks.ArbPrecompile.ArbSys);
        // Interact with precompile...
    }
}
```

### 5. Anvil via CLI

Deploy to Anvil nodes using the standalone CLI.

```bash
# Start Anvil
anvil

# In another terminal, deploy all precompiles
nitro-mocks-deploy --rpc-url http://localhost:8545

# Deploy specific precompiles
nitro-mocks-deploy --rpc-url http://localhost:8545 --precompiles ArbSys,ArbGasInfo
```