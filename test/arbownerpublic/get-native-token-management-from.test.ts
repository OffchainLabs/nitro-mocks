import { deployAndSetCode, ArbPrecompile, getUnderlyingProvider } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { applyNativeArbOwnerTxs } from "../utils/native-state";
import { ArbOwnerPublic__factory } from "../../typechain-types";

// The gate only accepts times at least 7 days out, so the scheduled time never arrives while the
// testnode lives, and clearing the feature back to zero is ungated.
const ENABLE_DELAY = 8n * 24n * 60n * 60n;

describe("ArbOwnerPublic.getNativeTokenManagementFrom", function () {
  before(async function () {
    const block = await getUnderlyingProvider().getBlock("latest");
    await applyNativeArbOwnerTxs([
      { method: "setNativeTokenManagementFrom", args: [BigInt(block!.timestamp) + ENABLE_DELAY] }
    ]);
  });

  after(async function () {
    await applyNativeArbOwnerTxs([{ method: "setNativeTokenManagementFrom", args: [0n] }]);
  });

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwnerPublic]);
  });

  it("should behave equivalently from all standard addresses", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwnerPublic__factory,
      ArbPrecompile.ArbOwnerPublic,
      "getNativeTokenManagementFrom",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
