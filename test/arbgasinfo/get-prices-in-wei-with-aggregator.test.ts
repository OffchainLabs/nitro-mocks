import { deployAndSetCode, PRECOMPILE_ADDRESSES, ArbPrecompile } from "../utils/utils";
import { expectEquivalentCallFromMultipleAddresses, storageAccessComparerExcludingVersionAndBaseFee } from "../utils/expect-equivalent";
import { ArbGasInfo__factory } from "../../typechain-types";
import { ethers } from "hardhat";

describe("ArbGasInfo.getPricesInWeiWithAggregator", function () {
  beforeEach(async function() {  
    await deployAndSetCode([
          ArbPrecompile.ArbGasInfo
        ]);
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