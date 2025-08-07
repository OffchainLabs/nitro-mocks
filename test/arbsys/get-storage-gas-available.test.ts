import { deployAndSetCode, PRECOMPILE_ADDRESSES, ArbPrecompile } from "../utils/utils";
import { ArbSys__factory } from "../../typechain-types";
import { expectEquivalentCallFromMultipleAddresses } from "../utils/expect-equivalent";

describe("ArbSys.getStorageGasAvailable", function () {
  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbSys]);
  });

  it("should match native implementation", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbSys__factory,
      PRECOMPILE_ADDRESSES.ArbSys,
      "getStorageGasAvailable",
      []
    );
  });
});
