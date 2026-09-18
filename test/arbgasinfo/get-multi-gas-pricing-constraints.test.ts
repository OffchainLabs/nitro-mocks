import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { applyNativeArbOwnerTxs } from "../utils/native-state";
import { ArbGasInfo__factory } from "../../typechain-types";

// The backlog is compared exactly, so it has to be a value nothing on the chain can move. Only
// WasmComputation (8) qualifies: every other kind accrues from ordinary traffic, and the setup
// transaction's own calldata would grow an L2Calldata-weighted backlog and then decay it, leaving
// the pinned fork and the live testnode disagreeing.
const MULTI_GAS_CONSTRAINTS = [
  [[[8, 2n]], 60, 7000000n, 0n],
  [[[8, 5n]], 120, 3000000n, 0n]
];

describe("ArbGasInfo.getMultiGasPricingConstraints", function () {
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
      "getMultiGasPricingConstraints",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
