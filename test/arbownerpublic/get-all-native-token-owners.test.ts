import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbOwnerPublic__factory } from "../../typechain-types";

describe("ArbOwnerPublic.getAllNativeTokenOwners", function () {
  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwnerPublic]);
  });

  it("should behave equivalently from all standard addresses", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwnerPublic__factory,
      ArbPrecompile.ArbOwnerPublic,
      "getAllNativeTokenOwners",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
