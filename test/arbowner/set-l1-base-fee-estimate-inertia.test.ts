import { ethers } from "hardhat";
import { deployAndSetCode, PRECOMPILE_ADDRESSES } from "../utils/utils";
import { expectEquivalentTxFromMultipleAddresses, storageAccessComparerExcludingVersion, storageValueComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types";

describe("ArbOwner.setL1BaseFeeEstimateInertia", function () {
  beforeEach(async function() {  
    await deployAndSetCode("ArbosStorage", "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf");
    await deployAndSetCode("contracts/ArbOwner.sol:ArbOwner", PRECOMPILE_ADDRESSES.ArbOwner);
  });

  it("should match native implementation", async function () {
    const testValues = [0n, 10n, 18446744073709551615n]; // 0, 10, max uint64
    
    for (const inertia of testValues) {
      await expectEquivalentTxFromMultipleAddresses(
        ArbOwner__factory,
        PRECOMPILE_ADDRESSES.ArbOwner,
        "setL1BaseFeeEstimateInertia",
        [inertia],
        {
          storageAccess: storageAccessComparerExcludingVersion,
          storageValues: storageValueComparerExcludingVersion
        }
      );
    }
  });
});