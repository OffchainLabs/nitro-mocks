import { deployAndSetCode, forkSync, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentTxFromMultipleAddresses,
  storageAccessComparerExcludingVersion,
  storageValueComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types";
import { parseEther } from "ethers";

describe("ArbOwner.releaseL1PricerSurplusFunds", function () {
  beforeEach(async function () {
    await forkSync();
    await deployAndSetCode([ArbPrecompile.ArbOwner]);
  });

  it("should match native implementation when there is no surplus", async function () {
    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "releaseL1PricerSurplusFunds",
      [parseEther("1")],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});
