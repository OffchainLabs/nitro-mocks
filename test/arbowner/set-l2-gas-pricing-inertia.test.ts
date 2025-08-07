import { ethers } from "hardhat";
import { deployAndSetCode, PRECOMPILE_ADDRESSES } from "../utils/utils";
import { expectEquivalentTxFromChainOwner, storageAccessComparerExcludingVersion, storageValueComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbOwner__factory, ArbGasInfo__factory } from "../../typechain-types";

describe("ArbOwner.setL2GasPricingInertia", function () {
  let originalPricingInertia: bigint;

  beforeEach(async function() {  
    await deployAndSetCode([
          { contractName: "ArbosStorage", precompileAddress: "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf" },
          { contractName: "contracts/ArbOwner.sol:ArbOwner", precompileAddress: PRECOMPILE_ADDRESSES.ArbOwner }
        ]);
    await deployAndSetCode([
          { contractName: "contracts/ArbGasInfo.sol:ArbGasInfo", precompileAddress: PRECOMPILE_ADDRESSES.ArbGasInfo }
        ]);

    const arbGasInfo = ArbGasInfo__factory.connect(PRECOMPILE_ADDRESSES.ArbGasInfo, ethers.provider);
    originalPricingInertia = await arbGasInfo.getPricingInertia();
  });

  afterEach(async function() {
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "setL2GasPricingInertia",
      [originalPricingInertia],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });

  it("should match native implementation", async function () {
    const newPricingInertia = 100n;
    
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "setL2GasPricingInertia",
      [newPricingInertia],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});