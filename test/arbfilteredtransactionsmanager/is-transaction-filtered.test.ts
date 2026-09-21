import { ethers } from "hardhat";
import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  expectEquivalentTxFromMultipleAddresses,
  getChainOwner,
  storageAccessComparerExcludingVersion,
  storageValueComparerExcludingVersion
} from "../utils/expect-equivalent";
import { applyNativeArbOwnerTxs } from "../utils/native-state";
import { ArbFilteredTransactionsManager__factory } from "../../typechain-types";

describe("ArbFilteredTransactionsManager.isTransactionFiltered", function () {
  before(async function () {
    await applyNativeArbOwnerTxs([{ method: "addTransactionFilterer", args: [getChainOwner().address] }]);
  });

  after(async function () {
    await applyNativeArbOwnerTxs([{ method: "removeTransactionFilterer", args: [getChainOwner().address] }]);
  });

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbFilteredTransactionsManager]);
  });

  it("should report a filtered transaction hash", async function () {
    const txHash = ethers.keccak256(ethers.toUtf8Bytes("is-transaction-filtered"));
    const manager = ArbPrecompile.ArbFilteredTransactionsManager;

    await expectEquivalentTxFromMultipleAddresses(
      ArbFilteredTransactionsManager__factory,
      manager,
      "addFilteredTransaction",
      [txHash],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );

    await expectEquivalentCallFromMultipleAddresses(
      ArbFilteredTransactionsManager__factory,
      manager,
      "isTransactionFiltered",
      [txHash],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );

    await expectEquivalentTxFromMultipleAddresses(
      ArbFilteredTransactionsManager__factory,
      manager,
      "deleteFilteredTransaction",
      [txHash],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });

  // The zero hash is left out: it maps onto the same slot as the ArbOS version, which the
  // comparer drops from the native trace but not from the mock's.
  it("should report an unfiltered transaction hash", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbFilteredTransactionsManager__factory,
      ArbPrecompile.ArbFilteredTransactionsManager,
      "isTransactionFiltered",
      [ethers.keccak256(ethers.toUtf8Bytes("is-transaction-filtered-never-added"))],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
