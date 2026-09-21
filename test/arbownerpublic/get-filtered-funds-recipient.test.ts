import { ethers } from "hardhat";
import { deployAndSetCode, ArbPrecompile, getUnderlyingProvider } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { applyNativeArbOwnerTxs } from "../utils/native-state";
import { ArbOwnerPublic__factory } from "../../typechain-types";

const RECIPIENT = ethers.Wallet.createRandom().address;

describe("ArbOwnerPublic.getFilteredFundsRecipient", function () {
  let originalValue: string;

  before(async function () {
    const arbOwnerPublic = ArbOwnerPublic__factory.connect(ArbPrecompile.ArbOwnerPublic, getUnderlyingProvider());
    originalValue = await arbOwnerPublic.getFilteredFundsRecipient();

    await applyNativeArbOwnerTxs([{ method: "setFilteredFundsRecipient", args: [RECIPIENT] }]);
  });

  after(async function () {
    await applyNativeArbOwnerTxs([{ method: "setFilteredFundsRecipient", args: [originalValue] }]);
  });

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwnerPublic]);
  });

  it("should behave equivalently from all standard addresses", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwnerPublic__factory,
      ArbPrecompile.ArbOwnerPublic,
      "getFilteredFundsRecipient",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
