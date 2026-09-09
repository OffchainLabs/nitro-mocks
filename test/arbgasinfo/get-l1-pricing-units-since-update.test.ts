import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbGasInfo__factory } from "../../typechain-types";

describe("ArbGasInfo.getL1PricingUnitsSinceUpdate", function () {
  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbGasInfo]);
  });

  it("should match native implementation", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbGasInfo__factory,
      ArbPrecompile.ArbGasInfo,
      "getL1PricingUnitsSinceUpdate",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        result: (mockResult: bigint, underlyingResult: bigint) => {
          // The mock reads the committed value. The native precompile also sees the units
          // the tx processor added in memory for the current call, so it is always larger.
          if (underlyingResult <= mockResult) {
            throw new Error(`Expected underlying > mock, got mock=${mockResult}, underlying=${underlyingResult}`);
          }
        }
      }
    );
  });
});
