import { PRECOMPILE_ADDRESSES, deployAndSetCode, forkSync, getUnderlyingProvider, ArbPrecompile } from "../utils/utils";
import { expectEquivalentCallFromMultipleAddresses, storageAccessComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbSys__factory } from "../../typechain-types/factories/contracts/ArbSys__factory";
import { ethers } from "hardhat";
import { mineBlocks } from "../utils/l2-to-l1-test-helpers"

describe("ArbSys.arbBlockHash", function () {
  this.beforeAll(async function() {
    // wait a bit of time in case some blocks are being mined in other tests
    await mineBlocks(1, getUnderlyingProvider());
  })

  beforeEach(async function() {
    await forkSync();
    await deployAndSetCode([
          ArbPrecompile.ArbSys
        ]);
  });
  
  it("should behave equivalently for recent block", async function () {
    const provider = ethers.provider;
    const currentBlock = await provider.getBlockNumber();
    const recentBlockNum = Math.max(0, currentBlock - 5);
    
    await expectEquivalentCallFromMultipleAddresses(
      ArbSys__factory,
      PRECOMPILE_ADDRESSES.ArbSys,
      "arbBlockHash",
      [recentBlockNum],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });

  it("should behave equivalently for current block", async function () {
    const provider = ethers.provider;
    const currentBlock = await provider.getBlockNumber();
    
    await expectEquivalentCallFromMultipleAddresses(
      ArbSys__factory,
      PRECOMPILE_ADDRESSES.ArbSys,
      "arbBlockHash",
      [currentBlock],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });

  it("should behave equivalently for future block", async function () {
    const provider = ethers.provider;
    const currentBlock = await provider.getBlockNumber();
    const futureBlockNum = currentBlock + 10;
    
    await expectEquivalentCallFromMultipleAddresses(
      ArbSys__factory,
      PRECOMPILE_ADDRESSES.ArbSys,
      "arbBlockHash",
      [futureBlockNum],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });

  it("should behave equivalently for old block beyond 256", async function () {
    const provider = ethers.provider;
    const currentBlock = await provider.getBlockNumber();
    const oldBlockNum = Math.max(0, currentBlock - 300);
    
    await expectEquivalentCallFromMultipleAddresses(
      ArbSys__factory,
      PRECOMPILE_ADDRESSES.ArbSys,
      "arbBlockHash",
      [oldBlockNum],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});