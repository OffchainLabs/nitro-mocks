import { PRECOMPILE_ADDRESSES, deployAndSetCode } from "../utils/utils";
import { expectEquivalentCallFromMultipleAddresses, storageAccessComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types/factories/contracts/ArbOwner__factory";

describe("ArbOwner.getAllChainOwners", function () {
  beforeEach(async function() {
    await deployAndSetCode([
          { contractName: "ArbosStorage", precompileAddress: "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf" },
          { contractName: "contracts/ArbOwner.sol:ArbOwner", precompileAddress: PRECOMPILE_ADDRESSES.ArbOwner }
        ]);
  });

  it("should behave equivalently from all standard addresses", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "getAllChainOwners",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});