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
// multi-gas constraint holds the single-gas backlogs at whatever this test writes. Without it the
// transaction's own gas would grow the backlogs of the constraints it just installed, and the
// pinned fork would disagree with the live testnode. Weighting WasmComputation keeps the
// constraint's own backlog at zero, so the base fee stays at the minimum.
const FREEZING_MULTI_GAS_CONSTRAINTS = [[[[8, 1n]], 60, 7000000n, 0n]];

// Installed up front so the transaction under test has constraints to clear before writing its own.
const INITIAL_CONSTRAINTS = [
  [7000000n, 102n, 0n],
  [10000000n, 600n, 0n]
];

const CONSTRAINTS = [[5000000n, 90n, 0n]];

describe("ArbOwner.setGasPricingConstraints", function () {
  let originalValue: bigint[][];

  before(async function () {
    await applyNativeArbOwnerTxs([
      { method: "setMultiGasPricingConstraints", args: [FREEZING_MULTI_GAS_CONSTRAINTS] },
      { method: "setGasPricingConstraints", args: [INITIAL_CONSTRAINTS] }
    ]);
  });

  after(async function () {
    await applyNativeArbOwnerTxs([
      { method: "setGasPricingConstraints", args: [[]] },
      { method: "setMultiGasPricingConstraints", args: [[]] }
    ]);
  });

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwner, ArbPrecompile.ArbGasInfo]);

    await expectEquivalentCallFromChainOwner(
      ArbGasInfo__factory,
      ArbPrecompile.ArbGasInfo,
      "getGasPricingConstraints",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        result: (mock, _underlying) => {
          originalValue = (mock as bigint[][]).map(constraint => [constraint[0], constraint[1], constraint[2]]);
        }
      }
    );
  });

  afterEach(async function () {
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "setGasPricingConstraints",
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
      "setGasPricingConstraints",
      [CONSTRAINTS],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});
