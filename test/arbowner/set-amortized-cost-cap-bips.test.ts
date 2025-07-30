import { deployAndSetCode, PRECOMPILE_ADDRESSES } from "../utils/utils";
import { expectEquivalentTxFromMultipleAddresses, storageAccessComparerExcludingVersion, storageValueComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types";

describe("ArbOwner.setAmortizedCostCapBips", function () {
  beforeEach(async function() {  
    // Deploy required contracts
    await deployAndSetCode("ArbosStorage", "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf");
    await deployAndSetCode("contracts/ArbOwner.sol:ArbOwner", PRECOMPILE_ADDRESSES.ArbOwner);
  });

  it("should match native implementation", async function () {
    // Test with various cap values
    const testCaps = [65535, 0, 10];
    
    for (const cap of testCaps) {
      await expectEquivalentTxFromMultipleAddresses(
        ArbOwner__factory,
        PRECOMPILE_ADDRESSES.ArbOwner,
        "setAmortizedCostCapBips",
        [cap],
        {
          storageAccess: storageAccessComparerExcludingVersion,
          storageValues: storageValueComparerExcludingVersion
        }
      );
    }
  });
});