import { ethers } from "hardhat";
import { PRECOMPILE_ADDRESSES, deployAndSetCode, getUnderlyingProvider, forkSync } from "../utils/utils";
import { ArbSys__factory } from "../../typechain-types";
import { 
  executeTx,
  compareTxResults, 
  storageAccessComparerExcludingVersion, 
  getChainOwner,
  storageValueComparerExcludingVersion
} from "../utils/expect-equivalent";
import { expect } from "chai";
import type { TransactionReceipt, Provider } from "ethers";

declare const hre: any;

describe("ArbSys.sendTxToL1", function () {
  const L1_BLOCK_NUMBER_SLOT = "0x3c79da47f96b0f39664f73c0a1f350580be90742947dddfa21ba64d578dfe600";
  const ARBOS_STORAGE_ADDRESS = "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf";
  
  async function waitForNextBlock(provider: Provider, txReceipt: TransactionReceipt, timeoutMs: number = 3000): Promise<void> {
    const startTime = Date.now();
    
    const targetBlock = txReceipt.blockNumber;
    if (!targetBlock) {
      throw new Error("Transaction receipt has no block number");
    }
    
    while (Date.now() - startTime < timeoutMs) {
      const currentBlock = await provider.getBlockNumber();
      if (currentBlock >= targetBlock) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  async function mineBlocks(n: number, provider: Provider) {
    const chainOwner = getChainOwner();
    const chainOwnerSigner = chainOwner.connect(provider);
    
    for (let index = 0; index < n; index++) { 
      const tx = await chainOwnerSigner.sendTransaction({
        to: chainOwner.address,
        value: 0,
        nonce: await provider.getTransactionCount(chainOwner.address)
      });
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error("Transaction receipt is null");
      }
      
      await waitForNextBlock(provider, receipt);
    }
  }
  
  beforeEach(async function() {
    await forkSync();

    await deployAndSetCode("ArbosStorage", ARBOS_STORAGE_ADDRESS);
    await deployAndSetCode("contracts/ArbSys.sol:ArbSys", PRECOMPILE_ADDRESSES.ArbSys);
  });
  
    
  async function testSendTxToL1(destination: string, data: string, value: bigint) {
    const underlyingProvider = await getUnderlyingProvider();
    await mineBlocks(5, underlyingProvider);
    const forkProvider = ethers.provider;
    const chainOwner = getChainOwner();
    
    const underlyingResult = await executeTx(
      ArbSys__factory,
      PRECOMPILE_ADDRESSES.ArbSys,
      "sendTxToL1",
      [destination, data],
      chainOwner.address,
      underlyingProvider,
      { value }
    );
    
    const underlyingBlock = await underlyingProvider.getBlock(underlyingResult.receipt!.blockHash);
    const underlyingTimestamp = underlyingBlock?.timestamp;
    const underlyingBlockNumber = underlyingBlock?.number;
    const l1BlockNumberHex = await underlyingProvider.getStorage(ARBOS_STORAGE_ADDRESS, L1_BLOCK_NUMBER_SLOT, underlyingBlockNumber);
    const l1BlockNumber = BigInt(l1BlockNumberHex);

    const forkBlockNumber = await forkProvider.getBlockNumber();
    if (forkBlockNumber >= underlyingBlockNumber!) {
      throw new Error(`Fork provider block number (${forkBlockNumber}) is already at or ahead of underlying block number (${underlyingBlockNumber})`);
    }
    
    // Mine to underlyingBlockNumber - 1, accounting for 3 blocks that will be mined: TestUtils deploy, setL1BlockNumber, and final sendTxToL1
    const blocksToMine = underlyingBlockNumber! - forkBlockNumber - 3;
    for (let i = 0; i < blocksToMine; i++) {
      await hre.network.provider.send("evm_setNextBlockTimestamp", [underlyingTimestamp]);
      await hre.network.provider.send("evm_mine");
    }

    // Set timestamp to match underlying for each block to ensure deterministic state
    await hre.network.provider.send("evm_setNextBlockTimestamp", [underlyingTimestamp]);
    const TestUtilsFactory = await hre.ethers.getContractFactory("contracts/test/TestUtils.sol:TestUtils");
    const testUtils = await TestUtilsFactory.deploy();
    await testUtils.waitForDeployment();
    await hre.network.provider.send("evm_setNextBlockTimestamp", [underlyingTimestamp]);
    await testUtils.setL1BlockNumber(l1BlockNumber);
    await hre.network.provider.send("evm_setNextBlockTimestamp", [underlyingTimestamp]);
    const finalForkBlockNumber = await forkProvider.getBlockNumber();
    if (finalForkBlockNumber !== underlyingBlockNumber! - 1) {
      throw new Error(`Failed to mine to correct block. Expected ${underlyingBlockNumber! - 1}, got ${finalForkBlockNumber}`);
    }
    
    const mockResult = await executeTx(
      ArbSys__factory,
      PRECOMPILE_ADDRESSES.ArbSys,
      "sendTxToL1",
      [destination, data],
      chainOwner.address,
      forkProvider,
      { value }
    );
    
    compareTxResults(
      mockResult,
      underlyingResult,
      ArbSys__factory,
      PRECOMPILE_ADDRESSES.ArbSys,
      "sendTxToL1",
      [destination, data],
      {
        from: chainOwner.address,
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
    
    if (!mockResult.staticReverted && !underlyingResult.staticReverted) {
      expect(mockResult.staticResult).to.equal(underlyingResult.staticResult);
    }
  }

  it("should match native implementation", async function () {
    const destination = "0x1234567890123456789012345678901234567890";
    const data = "0xdeadbeef";
    const value = ethers.parseEther("0");
    
    await testSendTxToL1(destination, data, value);
  })

  it("should handle empty data", async function () {
    const destination = "0x1234567890123456789012345678901234567890";
    const data = "0x";
    const value = ethers.parseEther("0.1");
    
    await testSendTxToL1(destination, data, value);
  })

  it("should handle zero value", async function () {
    const destination = "0x1234567890123456789012345678901234567890";
    const data = "0xdeadbeef";
    const value = ethers.parseEther("0");
    
    await testSendTxToL1(destination, data, value);
  })

  it("should match native implementation for many calls", async function () {
    this.timeout(500000);
    
    for (let i = 0; i < 16; i++) {
      const destination = `0x${(BigInt("1234567890123456789012345678901234567890") + BigInt(i)).toString(16).padStart(40, '0')}`;
      const data = `0xdeadbeef${i.toString(16).padStart(2, '0')}`;
      const value = ethers.parseEther((0.001 * i).toString());
      
      await testSendTxToL1(destination, data, value);
    }
  })
});