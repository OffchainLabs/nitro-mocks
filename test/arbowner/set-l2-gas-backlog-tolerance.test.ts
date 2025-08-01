import { ethers } from "hardhat";
import { deployAndSetCode, PRECOMPILE_ADDRESSES } from "../utils/utils";
import { expectEquivalentTxFromChainOwner, storageAccessComparerExcludingVersion, storageValueComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbOwner__factory, ArbGasInfo__factory } from "../../typechain-types";

describe("ArbOwner.setL2GasBacklogTolerance", function () {
  let originalBacklogTolerance: bigint;

  beforeEach(async function() {  
    await deployAndSetCode("ArbosStorage", "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf");
    await deployAndSetCode("contracts/ArbOwner.sol:ArbOwner", PRECOMPILE_ADDRESSES.ArbOwner);
    await deployAndSetCode("contracts/ArbGasInfo.sol:ArbGasInfo", PRECOMPILE_ADDRESSES.ArbGasInfo);

    const arbGasInfo = ArbGasInfo__factory.connect(PRECOMPILE_ADDRESSES.ArbGasInfo, ethers.provider);
    originalBacklogTolerance = await arbGasInfo.getGasBacklogTolerance();
  });

  afterEach(async function() {
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "setL2GasBacklogTolerance",
      [originalBacklogTolerance],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });

  it("should match native implementation", async function () {
    const newBacklogTolerance = 100n;
    
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "setL2GasBacklogTolerance",
      [newBacklogTolerance],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});