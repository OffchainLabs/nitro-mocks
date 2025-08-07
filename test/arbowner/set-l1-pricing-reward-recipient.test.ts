import { ethers } from "hardhat";
import { describe, it, beforeEach, afterEach } from "mocha";
import { deployAndSetCode, PRECOMPILE_ADDRESSES } from "../utils/utils";
import {
  expectEquivalentTxFromMultipleAddresses,
  expectEquivalentCallFromChainOwner,
  expectEquivalentTxFromChainOwner,
  storageAccessComparerExcludingVersion,
  storageValueComparerExcludingVersion,
} from "../utils/expect-equivalent";
import { ArbOwner__factory, ArbGasInfo__factory } from "../../typechain-types";

describe("ArbOwner.setL1PricingRewardRecipient", function () {
  let originalRecipient: string;

  beforeEach(async function () {
    await deployAndSetCode([
          { contractName: "ArbosStorage", precompileAddress: "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf" },
          { contractName: "contracts/ArbOwner.sol:ArbOwner", precompileAddress: PRECOMPILE_ADDRESSES.ArbOwner },
          { contractName: "contracts/ArbGasInfo.sol:ArbGasInfo", precompileAddress: PRECOMPILE_ADDRESSES.ArbGasInfo }
        ]);

    await expectEquivalentCallFromChainOwner(
      ArbGasInfo__factory,
      PRECOMPILE_ADDRESSES.ArbGasInfo,
      "getL1RewardRecipient",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        result: (mock, underlying) => {
          originalRecipient = mock;
        }
      }
    );
  });

  afterEach(async function() {
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "setL1PricingRewardRecipient",
      [originalRecipient],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
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