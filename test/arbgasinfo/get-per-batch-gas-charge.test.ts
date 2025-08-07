import { deployAndSetCode, PRECOMPILE_ADDRESSES, ArbPrecompile } from "../utils/utils";
import { expectEquivalentCallFromMultipleAddresses, storageAccessComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbGasInfo__factory } from "../../typechain-types";

describe("ArbGasInfo.getPerBatchGasCharge", function () {
  beforeEach(async function() {  
    await deployAndSetCode([
          ArbPrecompile.ArbGasInfo
        ]);
  });

  it("should match native implementation", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbGasInfo__factory,
      PRECOMPILE_ADDRESSES.ArbGasInfo,
      "getPerBatchGasCharge",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});