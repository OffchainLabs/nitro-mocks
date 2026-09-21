import { ethers } from "hardhat";
import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion,
  getChainOwner
} from "../utils/expect-equivalent";
import { ArbOwnerPublic__factory } from "../../typechain-types";

describe("ArbOwnerPublic.isNativeTokenOwner", function () {
  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwnerPublic]);
  });

  it("should behave equivalently for a chain owner that is not a native token owner", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwnerPublic__factory,
      ArbPrecompile.ArbOwnerPublic,
      "isNativeTokenOwner",
      [getChainOwner().address],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });

  it("should behave equivalently for an unknown address", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwnerPublic__factory,
      ArbPrecompile.ArbOwnerPublic,
      "isNativeTokenOwner",
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
      "isNativeTokenOwner",
      [ethers.ZeroAddress],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
