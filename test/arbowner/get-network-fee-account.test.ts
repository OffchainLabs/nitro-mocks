import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types/factories/contracts/ArbOwner__factory";

describe("ArbOwner.getNetworkFeeAccount", function () {
  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwner]);
  });

  it("should behave equivalently from all standard addresses", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "getNetworkFeeAccount",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
