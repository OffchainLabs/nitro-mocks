import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { applyNativeArbOwnerTxs } from "../utils/native-state";
import { ArbGasInfo__factory } from "../../typechain-types";

// Gives L2Calldata (7) and WasmComputation (8) distinct stored base fees (exponents of 1 and 3
// bips), and lifts the block base fee just off the minimum so the SingleDim entry is
// distinguishable from the fee stored for it. The exponents must stay this small: they also set
// the chain's base fee, and pricing gas out of reach of the testnode's own traffic stalls block
// production, which then leaves the base fee stuck where it is. The adjustment window is long
// enough that the one-per-second backlog decay cannot move either exponent during a run.
const MULTI_GAS_CONSTRAINTS = [
  [
    [
      [7, 1n],
      [8, 2n]
    ],
    1000000000,
    1n,
    350000n
  ]
];

describe("ArbGasInfo.getMultiGasBaseFee", function () {
  before(async function () {
    await applyNativeArbOwnerTxs([{ method: "setMultiGasPricingConstraints", args: [MULTI_GAS_CONSTRAINTS] }]);
  });

  after(async function () {
    await applyNativeArbOwnerTxs([{ method: "setMultiGasPricingConstraints", args: [[]] }]);
  });

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbGasInfo]);
  });

  it("should match native implementation", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbGasInfo__factory,
      ArbPrecompile.ArbGasInfo,
      "getMultiGasBaseFee",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
