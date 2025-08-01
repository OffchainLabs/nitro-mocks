import { deployAndSetCode, PRECOMPILE_ADDRESSES } from "../utils/utils";
import { expectEquivalentCallFromMultipleAddresses, storageAccessComparerExcludingVersionAndBaseFee } from "../utils/expect-equivalent";
import { ArbGasInfo__factory } from "../../typechain-types";
import { ethers } from "hardhat";

describe("ArbGasInfo.getPricesInWeiWithAggregator", function () {
  beforeEach(async function() {  
    await deployAndSetCode("ArbosStorage", "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf");
    await deployAndSetCode("contracts/ArbGasInfo.sol:ArbGasInfo", PRECOMPILE_ADDRESSES.ArbGasInfo);
  });

  it("should match native implementation", async function () {
    const aggregator = ethers.Wallet.createRandom().address;
    
    await expectEquivalentCallFromMultipleAddresses(
      ArbGasInfo__factory,
      PRECOMPILE_ADDRESSES.ArbGasInfo,
      "getPricesInWeiWithAggregator",
      [aggregator],
      {
        storageAccess: storageAccessComparerExcludingVersionAndBaseFee
      }
    );
  });
});