import { deployAndSetCode, ArbPrecompile, getUnderlyingProvider } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { applyNativeArbOwnerTxs } from "../utils/native-state";
import { ArbOwnerPublic__factory } from "../../typechain-types";

describe("ArbOwnerPublic.isCalldataPriceIncreaseEnabled", function () {
  let originalValue: boolean;

  before(async function () {
    const arbOwnerPublic = ArbOwnerPublic__factory.connect(ArbPrecompile.ArbOwnerPublic, getUnderlyingProvider());
    originalValue = await arbOwnerPublic.isCalldataPriceIncreaseEnabled();

    await applyNativeArbOwnerTxs([{ method: "setCalldataPriceIncrease", args: [!originalValue] }]);
  });

  after(async function () {
    await applyNativeArbOwnerTxs([{ method: "setCalldataPriceIncrease", args: [originalValue] }]);
  });

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwnerPublic]);
  });

  it("should behave equivalently from all standard addresses", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwnerPublic__factory,
      ArbPrecompile.ArbOwnerPublic,
      "isCalldataPriceIncreaseEnabled",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
