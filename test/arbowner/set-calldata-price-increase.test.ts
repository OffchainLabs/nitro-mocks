import { deployAndSetCode, ArbPrecompile, getUnderlyingProvider } from "../utils/utils";
import {
  expectEquivalentTxFromMultipleAddresses,
  expectEquivalentTxFromChainOwner,
  storageAccessComparerExcludingVersion,
  storageValueComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbOwner__factory, ArbOwnerPublic__factory } from "../../typechain-types";

describe("ArbOwner.setCalldataPriceIncrease", function () {
  let originalValue: boolean;

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwner]);

    // Only ArbOwner is deployed on the fork, so the original is read from the testnode.
    const arbOwnerPublic = ArbOwnerPublic__factory.connect(ArbPrecompile.ArbOwnerPublic, getUnderlyingProvider());
    originalValue = await arbOwnerPublic.isCalldataPriceIncreaseEnabled();
  });

  afterEach(async function () {
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "setCalldataPriceIncrease",
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
      "setCalldataPriceIncrease",
      [!originalValue],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});
