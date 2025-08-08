import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentTxFromMultipleAddresses,
  expectEquivalentCallFromChainOwner,
  expectEquivalentTxFromChainOwner,
  storageAccessComparerExcludingVersion,
  storageValueComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbOwner__factory, ArbGasInfo__factory } from "../../typechain-types";

describe("ArbOwner.setSpeedLimit", function () {
  let originalSpeedLimit: bigint;

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwner, ArbPrecompile.ArbGasInfo]);

    await expectEquivalentCallFromChainOwner(
      ArbGasInfo__factory,
      ArbPrecompile.ArbGasInfo,
      "getGasAccountingParams",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        result: (mock, _underlying) => {
          originalSpeedLimit = mock[0];
        }
      }
    );
  });

  afterEach(async function () {
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "setSpeedLimit",
      [originalSpeedLimit],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });

  it("should match native implementation", async function () {
    const newSpeedLimit = 1370000n;

    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "setSpeedLimit",
      [newSpeedLimit],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });

  it("should revert when speed limit is zero", async function () {
    await expectEquivalentTxFromMultipleAddresses(ArbOwner__factory, ArbPrecompile.ArbOwner, "setSpeedLimit", [0n], {
      storageAccess: storageAccessComparerExcludingVersion,
      storageValues: storageValueComparerExcludingVersion
    });
  });
});
