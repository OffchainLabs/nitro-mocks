import { PRECOMPILE_ADDRESSES, deployAndSetCode, forkSync } from "../utils/utils";
import { expectEquivalentCallFromMultipleAddresses, storageAccessComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbSys__factory } from "../../typechain-types/factories/contracts/ArbSys__factory";

describe("ArbSys.arbBlockNumber", function () {
  beforeEach(async function() {
    await forkSync();
    await deployAndSetCode("ArbosStorage", "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf");
    await deployAndSetCode("contracts/ArbSys.sol:ArbSys", PRECOMPILE_ADDRESSES.ArbSys);
  });
  
  it("should behave equivalently from all standard addresses", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbSys__factory,
      PRECOMPILE_ADDRESSES.ArbSys,
      "arbBlockNumber",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        result: (mockResult: any, underlyingResult: any) => {
          // The fork starts at the same block as the underlying provider,
          // but each deployAndSetCode call mines a new block on the fork.
          // Since we called deployAndSetCode twice in beforeEach (for ArbosStorage and ArbSys),
          // the mock should be exactly 2 blocks ahead of the underlying.
          if (typeof mockResult !== 'bigint' || typeof underlyingResult !== 'bigint') {
            throw new Error(`Expected bigint results, got mock=${typeof mockResult}, underlying=${typeof underlyingResult}`);
          }
          if (mockResult !== underlyingResult + 2n) {
            throw new Error(`Expected mock block to be underlying + 2, got mock=${mockResult}, underlying=${underlyingResult}`);
          }
        }
      }
    );
  });
});