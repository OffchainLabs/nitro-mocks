import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbSys__factory } from "../../typechain-types/factories/contracts/ArbSys__factory";

describe("ArbSys.sendMerkleTreeState", function () {
  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbSys]);
  });

  it("should match native implementation", async function () {
    await expectEquivalentCallFromMultipleAddresses(ArbSys__factory, ArbPrecompile.ArbSys, "sendMerkleTreeState", [], {
      storageAccess: storageAccessComparerExcludingVersion
    });
  });
});
