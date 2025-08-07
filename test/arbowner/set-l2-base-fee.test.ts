import { deployAndSetCode, PRECOMPILE_ADDRESSES, getUnderlyingProvider, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentTxFromChainOwner,
  storageAccessComparerExcludingVersion,
  storageValueComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types";

describe("ArbOwner.setL2BaseFee", function () {
  let originalL2BaseFee: bigint;

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwner]);

    const underlyingProvider = getUnderlyingProvider();
    const feeData = await underlyingProvider.getFeeData();
    originalL2BaseFee = feeData.gasPrice || 0n;
  });

  afterEach(async function () {
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "setL2BaseFee",
      [originalL2BaseFee],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
    // for some reason we need to do this twice - i think it may have to do with caching on the underlying provider but i'm not sure
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "setL2BaseFee",
      [originalL2BaseFee],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });

  it("should match native implementation", async function () {
    // setting the l2 base fee actually sets the base fee in the mined block
    // ethers tries to be clever and caches this value - it then uses double this when sending unspecified gas price transactions
    // if we set less than half then future transactions will fail since double that will still not be greater than the original base fee which we set back in the after each
    const newBaseFee = originalL2BaseFee / 2n + 1n;
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "setL2BaseFee",
      [newBaseFee],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});
