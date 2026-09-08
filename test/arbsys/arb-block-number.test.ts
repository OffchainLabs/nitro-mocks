import { deployAndSetCode, forkSync, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbSys__factory } from "../../typechain-types/factories/contracts/ArbSys__factory";

describe("ArbSys.arbBlockNumber", function () {
  beforeEach(async function () {
    await forkSync();
    await deployAndSetCode([ArbPrecompile.ArbSys]);
  });

  it("should behave equivalently from all standard addresses", async function () {
    await expectEquivalentCallFromMultipleAddresses(ArbSys__factory, ArbPrecompile.ArbSys, "arbBlockNumber", [], {
      storageAccess: storageAccessComparerExcludingVersion
    });
  });
});
