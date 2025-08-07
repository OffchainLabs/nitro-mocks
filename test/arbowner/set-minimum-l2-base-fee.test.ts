import { ethers } from "hardhat";
import { deployAndSetCode, getUnderlyingProvider, PRECOMPILE_ADDRESSES, ArbPrecompile } from "../utils/utils";
import { expectEquivalentTxFromMultipleAddresses, expectEquivalentCallFromChainOwner, expectEquivalentTxFromChainOwner, storageAccessComparerExcludingVersion, storageValueComparerExcludingVersion, getChainOwner } from "../utils/expect-equivalent";
import { ArbOwner__factory, ArbGasInfo__factory } from "../../typechain-types";

describe("ArbOwner.setMinimumL2BaseFee", function () {
  let originalValue: bigint;

  beforeEach(async function() {  
    await deployAndSetCode([
          ArbPrecompile.ArbOwner, ArbPrecompile.ArbGasInfo]);
    
    await expectEquivalentCallFromChainOwner(
      ArbGasInfo__factory,
      PRECOMPILE_ADDRESSES.ArbGasInfo,
      "getMinimumGasPrice",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        result: (mock, underlying) => {
          originalValue = mock;
        }
      }
    );
  });
  
  afterEach(async function() {
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "setMinimumL2BaseFee",
      [originalValue],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
    
    // we need to mine a block afterwards to that base fee settings get reverted
    await (await getChainOwner().connect(getUnderlyingProvider()).sendTransaction({to: getChainOwner().address, value: 0n, gasPrice: 1000000000n, gasLimit: 300000})).wait();
    await new Promise(resolve => setTimeout(resolve, 1000)); // wait for the block to be mined
    await (await getChainOwner().connect(getUnderlyingProvider()).sendTransaction({to: getChainOwner().address, value: 0n, gasPrice: 1000000000n, gasLimit: 300000})).wait();
    
  });

  it("should match native implementation", async function () {
    const newMinBaseFee = ethers.parseUnits("0.0000005", "gwei");
    
    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "setMinimumL2BaseFee",
      [newMinBaseFee],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});