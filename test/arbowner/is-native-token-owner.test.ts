import { ethers } from "hardhat";
import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion,
  getChainOwner
} from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types";

describe("ArbOwner.isNativeTokenOwner", function () {
  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwner]);
  });

  it("should behave equivalently for a chain owner that is not a native token owner", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "isNativeTokenOwner",
      [getChainOwner().address],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });

  it("should behave equivalently for an unknown address", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "isNativeTokenOwner",
      [ethers.Wallet.createRandom().address],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });

  it("should behave equivalently for zero address", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "isNativeTokenOwner",
      [ethers.ZeroAddress],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
