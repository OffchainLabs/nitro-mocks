import { deployAndSetCode, ArbPrecompile, getUnderlyingProvider } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { applyNativeArbOwnerTxs } from "../utils/native-state";
import { ArbOwnerPublic__factory } from "../../typechain-types";

describe("ArbOwnerPublic.getCollectTips", function () {
  let originalValue: boolean;

  before(async function () {
    const arbOwnerPublic = ArbOwnerPublic__factory.connect(ArbPrecompile.ArbOwnerPublic, getUnderlyingProvider());
    originalValue = await arbOwnerPublic.getCollectTips();

    await applyNativeArbOwnerTxs([{ method: "setCollectTips", args: [!originalValue] }]);
  });

  after(async function () {
    await applyNativeArbOwnerTxs([{ method: "setCollectTips", args: [originalValue] }]);
  });

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwnerPublic]);
  });

  it("should behave equivalently from all standard addresses", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwnerPublic__factory,
      ArbPrecompile.ArbOwnerPublic,
      "getCollectTips",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
