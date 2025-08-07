import { deployAndSetCode, getUnderlyingProvider, PRECOMPILE_ADDRESSES } from "../utils/utils";
import { expectEquivalentCallFromMultipleAddresses, storageAccessComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbGasInfo__factory } from "../../typechain-types";
import { ethers } from "hardhat";

describe("ArbGasInfo.getGasBacklog", function () {
  beforeEach(async function() {  
    await deployAndSetCode([
          { contractName: "ArbosStorage", precompileAddress: "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf" },
          { contractName: "contracts/ArbGasInfo.sol:ArbGasInfo", precompileAddress: PRECOMPILE_ADDRESSES.ArbGasInfo }
        ]);
  });

  it("should match native implementation", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbGasInfo__factory,
      PRECOMPILE_ADDRESSES.ArbGasInfo,
      "getGasBacklog",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});