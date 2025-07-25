import { ethers } from "hardhat";
import { deployAndSetCode, PRECOMPILE_ADDRESSES } from "../utils/utils";
import { expectEquivalentTxFromMultipleAddresses, storageAccessComparerExcludingVersion, storageValueComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types";

describe("ArbOwner.addChainOwner", function () {
  beforeEach(async function() {  
    await deployAndSetCode("ArbosStorage", "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf");
    await deployAndSetCode("contracts/ArbOwner.sol:ArbOwner", PRECOMPILE_ADDRESSES.ArbOwner);
    await deployAndSetCode("contracts/ArbOwnerPublic.sol:ArbOwnerPublic", PRECOMPILE_ADDRESSES.ArbOwnerPublic);
  });

  it("should add a new chain owner when called by existing owner", async function () {
    // Use a random address to avoid conflicts
    const newChainOwner = ethers.Wallet.createRandom().address;
    
    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "addChainOwner",
      [newChainOwner],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});