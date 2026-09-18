import { ethers } from "hardhat";
import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentTxFromMultipleAddresses,
  storageAccessComparerExcludingVersion,
  storageValueComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types";

const comparers = {
  storageAccess: storageAccessComparerExcludingVersion,
  storageValues: storageValueComparerExcludingVersion
};

describe("ArbOwner.removeTransactionFilterer", function () {
  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwner]);
  });

  // Removing a filterer that is not last moves the last member into the freed slot, so both
  // orderings are covered.
  it("should remove existing transaction filterers when called by a chain owner", async function () {
    const firstFilterer = ethers.Wallet.createRandom().address;
    const secondFilterer = ethers.Wallet.createRandom().address;
    const arbOwner = ArbPrecompile.ArbOwner;

    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      arbOwner,
      "addTransactionFilterer",
      [firstFilterer],
      comparers
    );
    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      arbOwner,
      "addTransactionFilterer",
      [secondFilterer],
      comparers
    );

    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      arbOwner,
      "removeTransactionFilterer",
      [firstFilterer],
      comparers
    );
    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      arbOwner,
      "removeTransactionFilterer",
      [secondFilterer],
      comparers
    );
  });
});
