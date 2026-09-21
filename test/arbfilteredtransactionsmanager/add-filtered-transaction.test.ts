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

// The testnode's own filterer is not one of the addresses the differential framework sends from,
// so the chain owner holds the role while this file runs. The other sender is left out of the set
// to cover the unauthorized path.
describe("ArbFilteredTransactionsManager.addFilteredTransaction", function () {
  before(async function () {
    await applyNativeArbOwnerTxs([{ method: "addTransactionFilterer", args: [getChainOwner().address] }]);
  });

  after(async function () {
    await applyNativeArbOwnerTxs([{ method: "removeTransactionFilterer", args: [getChainOwner().address] }]);
  });

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbFilteredTransactionsManager]);
  });

  it("should mark a transaction hash as filtered", async function () {
    const txHash = ethers.keccak256(ethers.toUtf8Bytes("add-filtered-transaction"));
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

  it("should write the same slot again when the hash is already filtered", async function () {
    const txHash = ethers.keccak256(ethers.toUtf8Bytes("add-filtered-transaction-twice"));
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
});
