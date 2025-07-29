import { deployAndSetCode, PRECOMPILE_ADDRESSES } from "../utils/utils";
import { expectEquivalentTxFromMultipleAddresses, storageAccessComparerExcludingVersion, storageValueComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types";
import { ethers } from "hardhat";

describe("ArbOwner.releaseL1PricerSurplusFunds", function () {
  beforeEach(async function() {  
    await deployAndSetCode("ArbosStorage", "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf");
    await deployAndSetCode("contracts/ArbOwner.sol:ArbOwner", PRECOMPILE_ADDRESSES.ArbOwner);
  });

  it("should match native implementation", async function () {
    // First, we need to ensure there's a surplus by adding balance to the L1PricerFundsPoolAddress
    const L1_PRICER_FUNDS_POOL_ADDRESS = "0xA4B00000000000000000000000000000000000f6";
    const [signer] = await ethers.getSigners();
    
    // Send some ETH to the L1 Pricer Funds Pool to create a surplus
    const depositAmount = ethers.parseEther("1");
    await signer.sendTransaction({
      to: L1_PRICER_FUNDS_POOL_ADDRESS,
      value: depositAmount
    });
    
    // Test releasing a portion of the surplus
    const maxWeiToRelease = ethers.parseEther("0.5");
    
    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "releaseL1PricerSurplusFunds",
      [maxWeiToRelease],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
    
    // Test releasing all remaining surplus
    const largeAmount = ethers.parseEther("10");
    
    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "releaseL1PricerSurplusFunds",
      [largeAmount],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
    
    // Test when there's no surplus (should return 0)
    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "releaseL1PricerSurplusFunds",
      [depositAmount],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});