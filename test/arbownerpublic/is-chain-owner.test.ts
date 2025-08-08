import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbOwnerPublic__factory } from "../../typechain-types/factories/contracts/ArbOwnerPublic__factory";
import { ethers } from "hardhat";

describe("ArbOwnerPublic.isChainOwner", function () {
  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwnerPublic]);
  });

  it("should behave equivalently for existing chain owners", async function () {
    const arbOwnerPublic = ArbOwnerPublic__factory.connect(ArbPrecompile.ArbOwnerPublic, ethers.provider);
    const chainOwners = await arbOwnerPublic.getAllChainOwners();

    if (chainOwners.length > 0) {
      await expectEquivalentCallFromMultipleAddresses(
        ArbOwnerPublic__factory,
        ArbPrecompile.ArbOwnerPublic,
        "isChainOwner",
        [chainOwners[0]],
        {
          storageAccess: storageAccessComparerExcludingVersion
        }
      );
    }
  });

  it("should behave equivalently for non-chain owners", async function () {
    const testAddress = "0x0000000000000000000000000000000000000001";

    await expectEquivalentCallFromMultipleAddresses(
      ArbOwnerPublic__factory,
      ArbPrecompile.ArbOwnerPublic,
      "isChainOwner",
      [testAddress],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });

  it("should behave equivalently for zero address", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwnerPublic__factory,
      ArbPrecompile.ArbOwnerPublic,
      "isChainOwner",
      ["0x0000000000000000000000000000000000000000"],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
