import { ethers } from "hardhat";
import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentTxFromMultipleAddresses,
  storageAccessComparerExcludingVersion,
  storageValueComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types";

describe("ArbOwner.addTransactionFilterer", function () {
  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwner]);
  });

  it("should add a new transaction filterer when called by a chain owner", async function () {
    const newFilterer = ethers.Wallet.createRandom().address;

    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "addTransactionFilterer",
      [newFilterer],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );

    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "removeTransactionFilterer",
      [newFilterer],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});
