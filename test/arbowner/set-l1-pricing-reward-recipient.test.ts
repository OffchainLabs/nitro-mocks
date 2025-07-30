import { ethers } from "hardhat";
import { describe, it, beforeEach } from "mocha";
import { deployAndSetCode, PRECOMPILE_ADDRESSES } from "../utils/utils";
import {
  expectEquivalentTxFromMultipleAddresses,
  storageAccessComparerExcludingVersion,
  storageValueComparerExcludingVersion,
} from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types";

describe("ArbOwner.setL1PricingRewardRecipient", function () {
  beforeEach(async function () {
    await deployAndSetCode(
      "ArbosStorage",
      "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf"
    );
    await deployAndSetCode(
      "contracts/ArbOwner.sol:ArbOwner",
      PRECOMPILE_ADDRESSES.ArbOwner
    );
  });

  it("should match native implementation", async function () {
    const [,,rewardRecipient] = await ethers.getSigners();

    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "setL1PricingRewardRecipient",
      [rewardRecipient.address],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion,
      }
    );
  });
});