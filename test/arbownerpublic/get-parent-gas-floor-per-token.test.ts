import { deployAndSetCode, ArbPrecompile, getUnderlyingProvider } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { applyNativeArbOwnerTxs } from "../utils/native-state";
import { ArbOwnerPublic__factory } from "../../typechain-types";

const TEST_FLOOR = 10n;

describe("ArbOwnerPublic.getParentGasFloorPerToken", function () {
  let originalValue: bigint;

  before(async function () {
    const arbOwnerPublic = ArbOwnerPublic__factory.connect(ArbPrecompile.ArbOwnerPublic, getUnderlyingProvider());
    originalValue = await arbOwnerPublic.getParentGasFloorPerToken();

    await applyNativeArbOwnerTxs([{ method: "setParentGasFloorPerToken", args: [TEST_FLOOR] }]);
  });

  after(async function () {
    await applyNativeArbOwnerTxs([{ method: "setParentGasFloorPerToken", args: [originalValue] }]);
  });

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwnerPublic]);
  });

  it("should behave equivalently from all standard addresses", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwnerPublic__factory,
      ArbPrecompile.ArbOwnerPublic,
      "getParentGasFloorPerToken",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
