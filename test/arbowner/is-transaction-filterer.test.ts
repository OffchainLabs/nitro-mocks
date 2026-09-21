import { ethers } from "hardhat";
import { deployAndSetCode, ArbPrecompile, getUnderlyingProvider } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbOwner__factory, ArbOwnerPublic__factory } from "../../typechain-types";

describe("ArbOwner.isTransactionFilterer", function () {
  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwner]);
  });

  it("should behave equivalently for existing transaction filterers", async function () {
    const arbOwnerPublic = ArbOwnerPublic__factory.connect(ArbPrecompile.ArbOwnerPublic, getUnderlyingProvider());
    const filterers = await arbOwnerPublic.getAllTransactionFilterers();

    if (filterers.length > 0) {
      await expectEquivalentCallFromMultipleAddresses(
        ArbOwner__factory,
        ArbPrecompile.ArbOwner,
        "isTransactionFilterer",
        [filterers[0]],
        {
          storageAccess: storageAccessComparerExcludingVersion
        }
      );
    }
  });

  it("should behave equivalently for non transaction filterers", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "isTransactionFilterer",
      ["0x0000000000000000000000000000000000000001"],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });

  it("should behave equivalently for zero address", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "isTransactionFilterer",
      [ethers.ZeroAddress],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
