import { deployAndSetCode, PRECOMPILE_ADDRESSES, ArbPrecompile } from "../utils/utils";
import { expectEquivalentCallFromMultipleAddresses, storageAccessComparerExcludingVersionAndBaseFee } from "../utils/expect-equivalent";
import { ArbGasInfo__factory } from "../../typechain-types";

describe("ArbGasInfo.getPricesInWei", function () {
  beforeEach(async function() {  
    await deployAndSetCode([
          ArbPrecompile.ArbGasInfo
        ]);
  });

  it("should match native implementation", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbGasInfo__factory,
      PRECOMPILE_ADDRESSES.ArbGasInfo,
      "getPricesInWei",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersionAndBaseFee
      }
    );
  });
});