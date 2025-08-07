import { deployAndSetCode, PRECOMPILE_ADDRESSES } from "../utils/utils";
import { expectEquivalentTxFromMultipleAddresses, expectEquivalentCallFromChainOwner, expectEquivalentTxFromChainOwner, storageAccessComparerExcludingVersion, storageValueComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbOwner__factory, ArbGasInfo__factory } from "../../typechain-types";

describe("ArbOwner.setAmortizedCostCapBips", function () {
  let originalValue: bigint;

  beforeEach(async function() {  
    await deployAndSetCode([
          { contractName: "ArbosStorage", precompileAddress: "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf" },
          { contractName: "contracts/ArbOwner.sol:ArbOwner", precompileAddress: PRECOMPILE_ADDRESSES.ArbOwner }
        ]);
    await deployAndSetCode([
          { contractName: "contracts/ArbGasInfo.sol:ArbGasInfo", precompileAddress: PRECOMPILE_ADDRESSES.ArbGasInfo }
        ]);

    await expectEquivalentCallFromChainOwner(
      ArbGasInfo__factory,
      PRECOMPILE_ADDRESSES.ArbGasInfo,
      "getAmortizedCostCapBips",
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
      "setAmortizedCostCapBips",
      [originalValue],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });

  it("should match native implementation", async function () {
    const testCaps = [65535, 0, 10];
    
    for (const cap of testCaps) {
      await expectEquivalentTxFromMultipleAddresses(
        ArbOwner__factory,
        PRECOMPILE_ADDRESSES.ArbOwner,
        "setAmortizedCostCapBips",
        [cap],
        {
          storageAccess: storageAccessComparerExcludingVersion,
          storageValues: storageValueComparerExcludingVersion
        }
      );
    }
  });
});