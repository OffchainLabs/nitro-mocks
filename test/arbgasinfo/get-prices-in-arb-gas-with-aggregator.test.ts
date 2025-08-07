import { deployAndSetCode, PRECOMPILE_ADDRESSES } from "../utils/utils";
import { expectEquivalentCallFromMultipleAddresses, storageAccessComparerExcludingVersionAndBaseFee } from "../utils/expect-equivalent";
import { ArbGasInfo__factory } from "../../typechain-types";
import { ethers } from "hardhat";

describe("ArbGasInfo.getPricesInArbGasWithAggregator", function () {
  beforeEach(async function() {  
    await deployAndSetCode([
          { contractName: "ArbosStorage", precompileAddress: "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf" },
          { contractName: "contracts/ArbGasInfo.sol:ArbGasInfo", precompileAddress: PRECOMPILE_ADDRESSES.ArbGasInfo }
        ]);
  });

  it("should match native implementation", async function () {
    const aggregator = ethers.Wallet.createRandom().address;
    
    await expectEquivalentCallFromMultipleAddresses(
      ArbGasInfo__factory,
      PRECOMPILE_ADDRESSES.ArbGasInfo,
      "getPricesInArbGasWithAggregator",
      [aggregator],
      {
        storageAccess: storageAccessComparerExcludingVersionAndBaseFee
      }
    );
  });
});