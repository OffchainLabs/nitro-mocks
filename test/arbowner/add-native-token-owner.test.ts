import { ethers } from "hardhat";
import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentTxFromMultipleAddresses,
  storageAccessComparerExcludingVersion,
  storageValueComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types";

// The testnode ships with native token management disabled, and the enable gate only accepts times
// at least 7 days out, so the add itself is unreachable here. This pins the mock to the native
// rejection instead, which would fail if the mock added the owner anyway.
describe("ArbOwner.addNativeTokenOwner", function () {
  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwner]);
  });

  it("should match native implementation", async function () {
    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "addNativeTokenOwner",
      [ethers.Wallet.createRandom().address],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});
