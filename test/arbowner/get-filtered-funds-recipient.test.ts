import { ethers } from "hardhat";
import { deployAndSetCode, ArbPrecompile, getUnderlyingProvider } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { applyNativeArbOwnerTxs } from "../utils/native-state";
import { ArbOwner__factory, ArbOwnerPublic__factory } from "../../typechain-types";

const RECIPIENT = ethers.Wallet.createRandom().address;

describe("ArbOwner.getFilteredFundsRecipient", function () {
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
    await deployAndSetCode([ArbPrecompile.ArbOwner]);
  });

  it("should behave equivalently from all standard addresses", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "getFilteredFundsRecipient",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
