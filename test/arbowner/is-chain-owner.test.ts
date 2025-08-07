import { PRECOMPILE_ADDRESSES, deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types/factories/contracts/ArbOwner__factory";
import { ArbOwnerPublic__factory } from "../../typechain-types/factories/contracts/ArbOwnerPublic__factory";
import { ethers } from "hardhat";

describe("ArbOwner.isChainOwner", function () {
  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwner, ArbPrecompile.ArbOwnerPublic]);
  });

  it("should behave equivalently for existing chain owners", async function () {
    const arbOwnerPublic = ArbOwnerPublic__factory.connect(PRECOMPILE_ADDRESSES.ArbOwnerPublic, ethers.provider);
    const chainOwners = await arbOwnerPublic.getAllChainOwners();

    if (chainOwners.length > 0) {
      await expectEquivalentCallFromMultipleAddresses(
        ArbOwner__factory,
        PRECOMPILE_ADDRESSES.ArbOwner,
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
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "isChainOwner",
      [testAddress],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });

  it("should behave equivalently for zero address", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "isChainOwner",
      [ethers.ZeroAddress],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
