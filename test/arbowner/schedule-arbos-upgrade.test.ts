import { PRECOMPILE_ADDRESSES, deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentTxFromMultipleAddresses,
  expectEquivalentCallFromChainOwner,
  expectEquivalentTxFromChainOwner,
  storageAccessComparerExcludingVersion,
  storageValueComparerExcludingVersion,
  storageAccessComparerExact
} from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types/factories/contracts/ArbOwner__factory";
import { ArbOwnerPublic__factory } from "../../typechain-types";
import { ArbSys__factory } from "../../typechain-types";

describe("ArbOwner.scheduleArbOSUpgrade", function () {
  let originalVersion: bigint;
  let originalTimestamp: bigint;
  let currentVersion: bigint;

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwner]);
    await deployAndSetCode([ArbPrecompile.ArbOwnerPublic, ArbPrecompile.ArbSys]);

    await expectEquivalentCallFromChainOwner(ArbSys__factory, PRECOMPILE_ADDRESSES.ArbSys, "arbOSVersion", [], {
      storageAccess: storageAccessComparerExact,
      result: (mock, _underlying) => {
        currentVersion = BigInt(mock);
      }
    });

    await expectEquivalentCallFromChainOwner(
      ArbOwnerPublic__factory,
      PRECOMPILE_ADDRESSES.ArbOwnerPublic,
      "getScheduledUpgrade",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        result: (mock, _underlying) => {
          const mockResult = mock as [bigint, bigint];
          originalVersion = mockResult[0];
          originalTimestamp = mockResult[1];
        }
      }
    );
  });

  afterEach(async function () {
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
