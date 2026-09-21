import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentTxFromMultipleAddresses,
  expectEquivalentCallFromChainOwner,
  expectEquivalentTxFromChainOwner,
  storageAccessComparerExcludingVersion,
  storageValueComparerExcludingVersion
} from "../utils/expect-equivalent";
import { applyNativeArbOwnerTxs } from "../utils/native-state";
import { ArbOwner__factory, ArbGasInfo__factory } from "../../typechain-types";

// ArbOS only updates the backlogs of the pricing model it is currently using, so configuring a
// multi-gas constraint holds the legacy backlog at whatever this test writes. Without it the
// transaction's own gas would grow the backlog after the precompile returned, and the pinned fork
// would disagree with the live testnode. Weighting WasmComputation keeps the constraint's own
// backlog at zero, so the base fee stays at the minimum.
const FREEZING_MULTI_GAS_CONSTRAINTS = [[[[8, 1n]], 60, 7000000n, 0n]];

// Far below backlogTolerance * speedLimit, so the base fee stays at the minimum even if the
// restoration below were to fail.
const BACKLOG = 1000n;

describe("ArbOwner.setGasBacklog", function () {
  let originalValue: bigint;

  before(async function () {
    await applyNativeArbOwnerTxs([{ method: "setMultiGasPricingConstraints", args: [FREEZING_MULTI_GAS_CONSTRAINTS] }]);
  });

  after(async function () {
    await applyNativeArbOwnerTxs([{ method: "setMultiGasPricingConstraints", args: [[]] }]);
  });

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwner, ArbPrecompile.ArbGasInfo]);

    await expectEquivalentCallFromChainOwner(ArbGasInfo__factory, ArbPrecompile.ArbGasInfo, "getGasBacklog", [], {
      storageAccess: storageAccessComparerExcludingVersion,
      result: (mock, _underlying) => {
        originalValue = mock as bigint;
      }
    });
  });

  afterEach(async function () {
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "setGasBacklog",
      [originalValue],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });

  it("should match native implementation", async function () {
    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "setGasBacklog",
      [BACKLOG],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});
