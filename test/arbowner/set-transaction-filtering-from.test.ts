import { deployAndSetCode, ArbPrecompile, getUnderlyingProvider } from "../utils/utils";
import {
  expectEquivalentTxFromMultipleAddresses,
  expectEquivalentTxFromChainOwner,
  storageAccessComparerExcludingVersion,
  storageValueComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbOwner__factory, ArbOwnerPublic__factory } from "../../typechain-types";

// A time already in the past leaves the feature enabled and, unlike a future time, can be moved
// back to the original one afterwards.
const TEST_TIMESTAMP = 12345n;

describe("ArbOwner.setTransactionFilteringFrom", function () {
  let originalValue: bigint;

  before(async function () {
    const arbOwnerPublic = ArbOwnerPublic__factory.connect(ArbPrecompile.ArbOwnerPublic, getUnderlyingProvider());
    originalValue = await arbOwnerPublic.getTransactionFilteringFrom();
  });

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwner]);
  });

  afterEach(async function () {
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "setTransactionFilteringFrom",
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
      "setTransactionFilteringFrom",
      [TEST_TIMESTAMP],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});
