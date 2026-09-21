import { ethers } from "hardhat";
import { deployAndSetCode, ArbPrecompile, getUnderlyingProvider } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbOwnerPublic__factory } from "../../typechain-types";

describe("ArbOwnerPublic.isTransactionFilterer", function () {
  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwnerPublic]);
  });

  it("should behave equivalently for existing transaction filterers", async function () {
    const arbOwnerPublic = ArbOwnerPublic__factory.connect(ArbPrecompile.ArbOwnerPublic, getUnderlyingProvider());
    const filterers = await arbOwnerPublic.getAllTransactionFilterers();

    if (filterers.length === 0) {
      throw new Error("testnode has no transaction filterer to test against");
    }

    await expectEquivalentCallFromMultipleAddresses(
      ArbOwnerPublic__factory,
      ArbPrecompile.ArbOwnerPublic,
      "isTransactionFilterer",
      [filterers[0]],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });

  it("should behave equivalently for non transaction filterers", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwnerPublic__factory,
      ArbPrecompile.ArbOwnerPublic,
      "isTransactionFilterer",
      [ethers.Wallet.createRandom().address],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });

  it("should behave equivalently for zero address", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwnerPublic__factory,
      ArbPrecompile.ArbOwnerPublic,
      "isTransactionFilterer",
      [ethers.ZeroAddress],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
