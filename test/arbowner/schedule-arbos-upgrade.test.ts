import { PRECOMPILE_ADDRESSES, deployAndSetCode } from "../utils/utils";
import { expectEquivalentTxFromMultipleAddresses, expectEquivalentCallFromChainOwner, expectEquivalentTxFromChainOwner, storageAccessComparerExcludingVersion, storageValueComparerExcludingVersion, storageAccessComparerExact } from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types/factories/contracts/ArbOwner__factory";
import { ArbOwnerPublic__factory } from "../../typechain-types";
import { ArbSys__factory } from "../../typechain-types";

describe("ArbOwner.scheduleArbOSUpgrade", function () {
  let originalVersion: bigint;
  let originalTimestamp: bigint;
  let currentVersion: bigint;

  beforeEach(async function() {  
    await deployAndSetCode("ArbosStorage", "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf");
    await deployAndSetCode("contracts/ArbOwner.sol:ArbOwner", PRECOMPILE_ADDRESSES.ArbOwner);
    await deployAndSetCode("contracts/ArbOwnerPublic.sol:ArbOwnerPublic", PRECOMPILE_ADDRESSES.ArbOwnerPublic);
    await deployAndSetCode("contracts/ArbSys.sol:ArbSys", PRECOMPILE_ADDRESSES.ArbSys);

    await expectEquivalentCallFromChainOwner(
      ArbSys__factory,
      PRECOMPILE_ADDRESSES.ArbSys,
      "arbOSVersion",
      [],
      {
        storageAccess: storageAccessComparerExact,
        result: (mock, underlying) => {
          currentVersion = BigInt(mock);
        }
      }
    );

    await expectEquivalentCallFromChainOwner(
      ArbOwnerPublic__factory,
      PRECOMPILE_ADDRESSES.ArbOwnerPublic,
      "getScheduledUpgrade",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        result: (mock, underlying) => {
          const mockResult = mock as [bigint, bigint];
          originalVersion = mockResult[0];
          originalTimestamp = mockResult[1];
        }
      }
    );
  });

  afterEach(async function() {
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "scheduleArbOSUpgrade",
      [originalVersion, originalTimestamp],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });

  it("should match native implementation", async function () {
    // Schedule an upgrade to the current version (safe for testing)
    const timestamp = BigInt(Math.floor(Date.now() / 1000) + 86400); // 24 hours from now
    
    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "scheduleArbOSUpgrade",
      [currentVersion, timestamp],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});