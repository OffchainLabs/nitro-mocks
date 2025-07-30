import { deployAndSetCode, PRECOMPILE_ADDRESSES } from "../utils/utils";
import { expectEquivalentTxFromMultipleAddresses, storageAccessComparerExcludingVersion, storageValueComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types";

describe("ArbOwner.setPerBatchGasCharge", function () {
  beforeEach(async function() {  
    await deployAndSetCode("ArbosStorage", "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf");
    await deployAndSetCode("contracts/ArbOwner.sol:ArbOwner", PRECOMPILE_ADDRESSES.ArbOwner);
  });

  it("should match native implementation", async function () {
    const testCosts = [-100000, 0, 210000];
    
    for (const cost of testCosts) {
      await expectEquivalentTxFromMultipleAddresses(
        ArbOwner__factory,
        PRECOMPILE_ADDRESSES.ArbOwner,
        "setPerBatchGasCharge",
        [cost],
        {
          storageAccess: storageAccessComparerExcludingVersion,
          storageValues: storageValueComparerExcludingVersion
        }
      );
    }
  });
});