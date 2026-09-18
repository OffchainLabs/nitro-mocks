import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentTxFromMultipleAddresses,
  expectEquivalentCallFromChainOwner,
  expectEquivalentTxFromChainOwner,
  storageAccessComparerExcludingVersion,
  storageValueComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbOwner__factory, ArbGasInfo__factory } from "../../typechain-types";

describe("ArbOwner.setMaxBlockGasLimit", function () {
  let originalValue: bigint;

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwner, ArbPrecompile.ArbGasInfo]);

    await expectEquivalentCallFromChainOwner(ArbGasInfo__factory, ArbPrecompile.ArbGasInfo, "getMaxBlockGasLimit", [], {
      storageAccess: storageAccessComparerExcludingVersion,
      result: (mock, _underlying) => {
        originalValue = mock as bigint;
      }
    });
  });

  afterEach(async function () {
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "setMaxBlockGasLimit",
      [originalValue],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });

  it("should match native implementation", async function () {
    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "setMaxBlockGasLimit",
      [30000000n],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});
