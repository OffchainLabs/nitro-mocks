import { ethers } from "hardhat";
import { deployAndSetCode, PRECOMPILE_ADDRESSES } from "../utils/utils";
import { expectEquivalentTxFromMultipleAddresses, storageAccessComparerExcludingVersion, storageValueComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types";

describe("ArbOwner.removeChainOwner", function () {
  beforeEach(async function() {  
    await deployAndSetCode([
          { contractName: "ArbosStorage", precompileAddress: "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf" },
          { contractName: "contracts/ArbOwner.sol:ArbOwner", precompileAddress: PRECOMPILE_ADDRESSES.ArbOwner }
        ]);
    await deployAndSetCode([
          { contractName: "contracts/ArbOwnerPublic.sol:ArbOwnerPublic", precompileAddress: PRECOMPILE_ADDRESSES.ArbOwnerPublic }
        ]);
  });

  it("should remove an existing chain owner when called by existing owner", async function () {
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
    
    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "removeChainOwner",
      [newChainOwner],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});