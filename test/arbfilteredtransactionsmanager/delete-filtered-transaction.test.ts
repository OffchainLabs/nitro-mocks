import { ethers } from "hardhat";
import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentTxFromMultipleAddresses,
  getChainOwner,
  storageAccessComparerExcludingVersion,
  storageValueComparerExcludingVersion
} from "../utils/expect-equivalent";
import { applyNativeArbOwnerTxs } from "../utils/native-state";
import { ArbFilteredTransactionsManager__factory } from "../../typechain-types";

const comparers = {
  storageAccess: storageAccessComparerExcludingVersion,
  storageValues: storageValueComparerExcludingVersion
};

describe("ArbFilteredTransactionsManager.deleteFilteredTransaction", function () {
  before(async function () {
    await applyNativeArbOwnerTxs([{ method: "addTransactionFilterer", args: [getChainOwner().address] }]);
  });

  after(async function () {
    await applyNativeArbOwnerTxs([{ method: "removeTransactionFilterer", args: [getChainOwner().address] }]);
  });

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbFilteredTransactionsManager]);
  });

  it("should clear the mark of a filtered transaction hash", async function () {
    const txHash = ethers.keccak256(ethers.toUtf8Bytes("delete-filtered-transaction"));
    const manager = ArbPrecompile.ArbFilteredTransactionsManager;

    await expectEquivalentTxFromMultipleAddresses(
      ArbFilteredTransactionsManager__factory,
      manager,
      "addFilteredTransaction",
      [txHash],
      comparers
    );

    await expectEquivalentTxFromMultipleAddresses(
      ArbFilteredTransactionsManager__factory,
      manager,
      "deleteFilteredTransaction",
      [txHash],
      comparers
    );
  });

  // Go clears unconditionally, so an unfiltered hash is written to as well.
  it("should write the slot for a hash that was never filtered", async function () {
    const txHash = ethers.keccak256(ethers.toUtf8Bytes("delete-unfiltered-transaction"));

    await expectEquivalentTxFromMultipleAddresses(
      ArbFilteredTransactionsManager__factory,
      ArbPrecompile.ArbFilteredTransactionsManager,
      "deleteFilteredTransaction",
      [txHash],
      comparers
    );
  });
});
