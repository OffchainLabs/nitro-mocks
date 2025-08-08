import { ethers } from "hardhat";
import { type TransactionReceipt, type Provider, parseEther } from "ethers";
import { deployAndSetCode, getUnderlyingProvider, forkSync, ArbPrecompile } from "./utils";
import { ArbSys__factory } from "../../typechain-types";
import {
  executeTx,
  compareTxResults,
  storageAccessComparerExcludingVersion,
  getChainOwner,
  storageValueComparerExcludingVersion,
  getUser
} from "./expect-equivalent";
import { expect } from "chai";

declare const hre: any;

const L1_BLOCK_NUMBER_SLOT = "0x3c79da47f96b0f39664f73c0a1f350580be90742947dddfa21ba64d578dfe600";
const ARBOS_STORAGE_ADDRESS = "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf";

async function waitForNextBlock(
  provider: Provider,
  txReceipt: TransactionReceipt,
  timeoutMs: number = 3000
): Promise<void> {
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

async function trySend(signer: any, txParams: any) {
  let tx;
  let receipt;

  try {
    tx = await signer.sendTransaction(txParams);
    receipt = await tx.wait();
  } catch (error: any) {
    if (error.message?.includes("nonce too low")) {
      console.log(`Nonce too low error, retrying after 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));

      try {
        const provider = signer.provider;
        const retryNonce = await provider.getTransactionCount(signer.address);
        tx = await signer.sendTransaction({
          ...txParams,
          nonce: retryNonce
        });
        receipt = await tx.wait();
      } catch (retryError: any) {
        console.error(`Retry failed: ${retryError.message}`);
        throw retryError;
      }
    } else {
      throw error;
    }
  }

  return receipt;
}

export async function mineBlocks(n: number, provider: Provider) {
  const wal = getUser();
  const walSigner = wal.connect(provider);
  const bal = await provider.getBalance(wal.address);
  const chainOwner = getChainOwner().connect(provider);
  if (bal < parseEther("1")) {
    await chainOwner.sendTransaction({
      to: wal.address,
      value: parseEther("2"),
      nonce: await provider.getTransactionCount(chainOwner.address)
    });
  }

  for (let index = 0; index < n; index++) {
    const nonce = await provider.getTransactionCount(wal.address);
    const receipt = await trySend(walSigner, {
      to: wal.address,
      value: 0,
      nonce: nonce
    });

    if (!receipt) {
      throw new Error("Transaction receipt is null");
    }

    await waitForNextBlock(provider, receipt);
  }
}

export async function testL2ToL1Tx(functionName: "sendTxToL1" | "withdrawEth", args: any[], value: bigint) {
  await forkSync();

  await deployAndSetCode([ArbPrecompile.ArbSys]);

  const underlyingProvider = await getUnderlyingProvider();
  await mineBlocks(5, underlyingProvider);
  const forkProvider = ethers.provider;
  const chainOwner = getChainOwner();

  const underlyingResult = await executeTx(
    ArbSys__factory,
    ArbPrecompile.ArbSys,
    functionName,
    args,
    chainOwner.address,
    underlyingProvider,
    { value }
  );

  const underlyingBlock = await underlyingProvider.getBlock(underlyingResult.receipt!.blockHash);
  const underlyingTimestamp = underlyingBlock?.timestamp;
  const underlyingBlockNumber = underlyingBlock?.number;
  const l1BlockNumberHex = await underlyingProvider.getStorage(
    ARBOS_STORAGE_ADDRESS,
    L1_BLOCK_NUMBER_SLOT,
    underlyingBlockNumber
  );
  const l1BlockNumber = BigInt(l1BlockNumberHex);

  const forkBlockNumber = await forkProvider.getBlockNumber();
  if (forkBlockNumber >= underlyingBlockNumber!) {
    throw new Error(
      `Fork provider block number (${forkBlockNumber}) is already at or ahead of underlying block number (${underlyingBlockNumber})`
    );
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
    throw new Error(
      `Failed to mine to correct block. Expected ${underlyingBlockNumber! - 1}, got ${finalForkBlockNumber}`
    );
  }

  const mockResult = await executeTx(
    ArbSys__factory,
    ArbPrecompile.ArbSys,
    functionName,
    args,
    chainOwner.address,
    forkProvider,
    { value }
  );

  compareTxResults(mockResult, underlyingResult, ArbSys__factory, ArbPrecompile.ArbSys, functionName, args, {
    from: chainOwner.address,
    storageAccess: storageAccessComparerExcludingVersion,
    storageValues: storageValueComparerExcludingVersion
  });

  if (!mockResult.staticReverted && !underlyingResult.staticReverted) {
    expect(mockResult.staticResult).to.equal(underlyingResult.staticResult);
  }
}
