import { deployAndSetCode, ArbPrecompile, getUnderlyingProvider } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { applyNativeArbOwnerTxs } from "../utils/native-state";
import { ArbOwnerPublic__factory } from "../../typechain-types";

// A time already in the past keeps the feature enabled and, unlike a future time, can be moved
// back to the original one afterwards.
const TEST_TIMESTAMP = 12345n;

describe("ArbOwnerPublic.getTransactionFilteringFrom", function () {
  let originalValue: bigint;

  before(async function () {
    const arbOwnerPublic = ArbOwnerPublic__factory.connect(ArbPrecompile.ArbOwnerPublic, getUnderlyingProvider());
    originalValue = await arbOwnerPublic.getTransactionFilteringFrom();

    await applyNativeArbOwnerTxs([{ method: "setTransactionFilteringFrom", args: [TEST_TIMESTAMP] }]);
  });

  after(async function () {
    await applyNativeArbOwnerTxs([{ method: "setTransactionFilteringFrom", args: [originalValue] }]);
  });

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwnerPublic]);
  });

  it("should behave equivalently from all standard addresses", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwnerPublic__factory,
      ArbPrecompile.ArbOwnerPublic,
      "getTransactionFilteringFrom",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
