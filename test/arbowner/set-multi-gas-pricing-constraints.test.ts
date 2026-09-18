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

type MultiGasConstraint = [[number, bigint][], number, bigint, bigint];

// The ABI decoder returns every integer as a bigint, including the resource kind and the window.
type DecodedMultiGasConstraint = [[bigint, bigint][], bigint, bigint, bigint];

// Backlogs are compared exactly, so only WasmComputation (8) can be weighted: every other kind
// accrues from ordinary chain traffic, which would leave the pinned fork and the live testnode
// disagreeing.
// Installed up front so the transaction under test has constraints to clear before writing its own.
const INITIAL_CONSTRAINTS: MultiGasConstraint[] = [
  [[[8, 2n]], 60, 7000000n, 0n],
  [[[8, 5n]], 120, 3000000n, 0n]
];

const CONSTRAINTS: MultiGasConstraint[] = [[[[8, 3n]], 90, 5000000n, 0n]];

// A backlog only raises the base fee through exp(backlog * weight / (window * target * maxWeight)).
// A wide adjustment window keeps that exponent at 3 bips, so the base fee peaks at 100,030,000.
const BACKLOGGED_CONSTRAINTS: MultiGasConstraint[] = [[[[8, 1n]], 1000000000, 1n, 300000n]];

// ArbOS discards the storage errors from calculating the constraint exponents, so the precompile
// still succeeds when it runs out of gas part way through. eth_estimateGas therefore settles on a
// limit that skips the exponent reads entirely, which the mock has no way to reproduce.
const GAS_LIMIT = 3000000n;

describe("ArbOwner.setMultiGasPricingConstraints", function () {
  let originalValue: MultiGasConstraint[];

  before(async function () {
    await applyNativeArbOwnerTxs([{ method: "setMultiGasPricingConstraints", args: [INITIAL_CONSTRAINTS] }]);
  });

  after(async function () {
    await applyNativeArbOwnerTxs([{ method: "setMultiGasPricingConstraints", args: [[]] }]);
  });

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwner, ArbPrecompile.ArbGasInfo]);

    await expectEquivalentCallFromChainOwner(
      ArbGasInfo__factory,
      ArbPrecompile.ArbGasInfo,
      "getMultiGasPricingConstraints",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        result: (mock, _underlying) => {
          originalValue = (mock as DecodedMultiGasConstraint[]).map(constraint => [
            constraint[0].map(resource => [Number(resource[0]), resource[1]]),
            Number(constraint[1]),
            constraint[2],
            constraint[3]
          ]);
        }
      }
    );
  });

  afterEach(async function () {
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "setMultiGasPricingConstraints",
      [originalValue],
      {
        gasLimit: GAS_LIMIT,
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });

  it("should match native implementation", async function () {
    this.timeout(120000);

    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "setMultiGasPricingConstraints",
      [CONSTRAINTS],
      {
        gasLimit: GAS_LIMIT,
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });

  it("should match native implementation for a constraint with a backlog", async function () {
    this.timeout(120000);

    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "setMultiGasPricingConstraints",
      [BACKLOGGED_CONSTRAINTS],
      {
        gasLimit: GAS_LIMIT,
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});
