import { PRECOMPILE_ADDRESSES, deployAndSetCode } from "../utils/utils";
import { expectEquivalentCallFromMultipleAddresses, storageAccessComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbOwnerPublic__factory } from "../../typechain-types/factories/contracts/ArbOwnerPublic__factory";

describe("ArbOwnerPublic.getScheduledUpgrade", function () {
  beforeEach(async function() {
    await deployAndSetCode([
          { contractName: "ArbosStorage", precompileAddress: "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf" },
          { contractName: "contracts/ArbOwnerPublic.sol:ArbOwnerPublic", precompileAddress: PRECOMPILE_ADDRESSES.ArbOwnerPublic }
        ]);
  });

  it("should behave equivalently from all standard addresses", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwnerPublic__factory,
      PRECOMPILE_ADDRESSES.ArbOwnerPublic,
      "getScheduledUpgrade",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});