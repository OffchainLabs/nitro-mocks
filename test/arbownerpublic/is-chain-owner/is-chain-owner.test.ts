import { PRECOMPILE_ADDRESSES, deployAndSetCode } from "../../utils/utils";
import { expectEquivalentCallFromMultipleAddresses, storageComparerExcludingVersion } from "../../utils/expect-equivalent";
import { ArbOwnerPublic__factory } from "../../../typechain-types/factories/contracts/ArbOwnerPublic__factory";
import { ethers } from "hardhat";

describe("ArbOwnerPublic.isChainOwner", function () {
  beforeEach(async function() {
    await deployAndSetCode("ArbosStorage", "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf");
    await deployAndSetCode("contracts/ArbOwnerPublic.sol:ArbOwnerPublic", PRECOMPILE_ADDRESSES.ArbOwnerPublic);
  });

  it("should behave equivalently for existing chain owners", async function () {
    const arbOwnerPublic = ArbOwnerPublic__factory.connect(PRECOMPILE_ADDRESSES.ArbOwnerPublic, ethers.provider);
    const chainOwners = await arbOwnerPublic.getAllChainOwners();
    
    if (chainOwners.length > 0) {
      await expectEquivalentCallFromMultipleAddresses(
        ArbOwnerPublic__factory,
        PRECOMPILE_ADDRESSES.ArbOwnerPublic,
        "isChainOwner",
        [chainOwners[0]],
        {
          storage: storageComparerExcludingVersion
        }
      );
    }
  });

  it("should behave equivalently for non-chain owners", async function () {
    const testAddress = "0x0000000000000000000000000000000000000001";
    
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwnerPublic__factory,
      PRECOMPILE_ADDRESSES.ArbOwnerPublic,
      "isChainOwner",
      [testAddress],
      {
        storage: storageComparerExcludingVersion
      }
    );
  });

  it("should behave equivalently for zero address", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbOwnerPublic__factory,
      PRECOMPILE_ADDRESSES.ArbOwnerPublic,
      "isChainOwner",
      ["0x0000000000000000000000000000000000000000"],
      {
        storage: storageComparerExcludingVersion
      }
    );
  });
});