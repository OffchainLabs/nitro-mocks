import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { applyNativeArbOwnerTxs } from "../utils/native-state";
import { ArbGasInfo__factory } from "../../typechain-types";

const SINGLE_GAS_CONSTRAINTS = [
  [7000000n, 102n, 0n],
  [10000000n, 600n, 0n]
];

// ArbOS only updates the backlogs of the pricing model it is currently using, so configuring a
// multi-gas constraint holds the single-gas backlogs still while the test reads them.
const FREEZING_MULTI_GAS_CONSTRAINTS = [[[[7, 1n]], 60, 7000000n, 0n]];

describe("ArbGasInfo.getGasPricingConstraints", function () {
  before(async function () {
    await applyNativeArbOwnerTxs([
      { method: "setGasPricingConstraints", args: [SINGLE_GAS_CONSTRAINTS] },
      { method: "setMultiGasPricingConstraints", args: [FREEZING_MULTI_GAS_CONSTRAINTS] }
    ]);
  });

  after(async function () {
    await applyNativeArbOwnerTxs([
      { method: "setMultiGasPricingConstraints", args: [[]] },
      { method: "setGasPricingConstraints", args: [[]] }
    ]);
  });

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbGasInfo]);
  });

  it("should match native implementation", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbGasInfo__factory,
      ArbPrecompile.ArbGasInfo,
      "getGasPricingConstraints",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
