import { ethers } from "hardhat";
import { deployAndSetCode, PRECOMPILE_ADDRESSES, getUnderlyingProvider } from "../utils/utils";
import { expectEquivalentTxFromMultipleAddresses, expectEquivalentTxFromChainOwner, storageAccessComparerExcludingVersion, storageValueComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types";

describe("ArbOwner.setL2BaseFee", function () {
  let originalL2BaseFee: bigint;

  beforeEach(async function() {  
    await deployAndSetCode("ArbosStorage", "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf");
    await deployAndSetCode("contracts/ArbOwner.sol:ArbOwner", PRECOMPILE_ADDRESSES.ArbOwner);

    const underlyingProvider = getUnderlyingProvider();
    const gasPrice = await underlyingProvider.getGasPrice();
    originalL2BaseFee = gasPrice.toBigInt();
  });

  afterEach(async function() {
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "setL2BaseFee",
      [originalL2BaseFee],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });

  it("should match native implementation", async function () {
    const newBaseFee = ethers.parseUnits("0.00096", "gwei");
    
    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "setL2BaseFee",
      [newBaseFee],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});