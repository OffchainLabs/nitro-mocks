import { PRECOMPILE_ADDRESSES, deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbOwnerPublic__factory } from "../../typechain-types/factories/contracts/ArbOwnerPublic__factory";

describe("ArbOwnerPublic.getBrotliCompressionLevel", function () {
  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwnerPublic]);
  });

  it("should behave equivalently from all standard addresses", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwnerPublic__factory,
      PRECOMPILE_ADDRESSES.ArbOwnerPublic,
      "getBrotliCompressionLevel",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
