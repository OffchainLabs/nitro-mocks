import { PRECOMPILE_ADDRESSES, deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbSys__factory } from "../../typechain-types/factories/contracts/ArbSys__factory";

describe("ArbSys.arbChainID", function () {
  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbSys]);
  });

  it("should behave equivalently from all standard addresses", async function () {
    await expectEquivalentCallFromMultipleAddresses(ArbSys__factory, PRECOMPILE_ADDRESSES.ArbSys, "arbChainID", [], {
      storageAccess: storageAccessComparerExcludingVersion
    });
  });
});
