import { ethers } from "hardhat";
import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { applyNativeArbOwnerTxs } from "../utils/native-state";
import { ArbOwner__factory } from "../../typechain-types";

const EXTRA_FILTERER = ethers.Wallet.createRandom().address;

describe("ArbOwner.getAllTransactionFilterers", function () {
  before(async function () {
    await applyNativeArbOwnerTxs([{ method: "addTransactionFilterer", args: [EXTRA_FILTERER] }]);
  });

  after(async function () {
    await applyNativeArbOwnerTxs([{ method: "removeTransactionFilterer", args: [EXTRA_FILTERER] }]);
  });

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwner]);
  });

  it("should behave equivalently from all standard addresses", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "getAllTransactionFilterers",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
