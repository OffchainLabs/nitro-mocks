import { PRECOMPILE_ADDRESSES, deployAndSetCode } from "../utils/utils";
import { expectEquivalentCallFromMultipleAddresses, storageComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbSys__factory } from "../../typechain-types/factories/@arbitrum/nitro-precompiles/ArbSys__factory";

describe("ArbSys.arbChainID", function () {
  beforeEach(async function() {
    await deployAndSetCode("ArbosStorage", "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf");
    await deployAndSetCode("contracts/ArbSys.sol:ArbSys", PRECOMPILE_ADDRESSES.ArbSys);
  });

  it("should behave equivalently from all standard addresses", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbSys__factory,
      PRECOMPILE_ADDRESSES.ArbSys,
      "arbChainID",
      [],
      {
        storage: storageComparerExcludingVersion
      }
    );
  });
});