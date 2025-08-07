import { deployAndSetCode, PRECOMPILE_ADDRESSES, ArbPrecompile } from "../utils/utils";
import { expectEquivalentTxFromMultipleAddresses, expectEquivalentCallFromChainOwner, expectEquivalentTxFromChainOwner, storageAccessComparerExcludingVersion, storageValueComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbOwner__factory, ArbGasInfo__factory } from "../../typechain-types";

describe("ArbOwner.setMaxTxGasLimit", function () {
  let originalMaxTxGasLimit: bigint;

  beforeEach(async function() {  
    await deployAndSetCode([
          ArbPrecompile.ArbOwner, ArbPrecompile.ArbGasInfo]);

    await expectEquivalentCallFromChainOwner(
      ArbGasInfo__factory,
      PRECOMPILE_ADDRESSES.ArbGasInfo,
      "getGasAccountingParams",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        result: (mock, underlying) => {
          originalMaxTxGasLimit = mock[1];
        }
      }
    );
  });

  afterEach(async function() {
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "setMaxTxGasLimit",
      [originalMaxTxGasLimit],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });

  it("should match native implementation", async function () {
    const newMaxTxGasLimit = 32000137;
    
    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "setMaxTxGasLimit",
      [newMaxTxGasLimit],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});