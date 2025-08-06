import { deployAndSetCode, PRECOMPILE_ADDRESSES } from "../utils/utils";
import { ArbSys__factory } from "../../typechain-types";
import { expectEquivalentCallFromMultipleAddresses } from "../utils/expect-equivalent";

describe("ArbSys.getStorageGasAvailable", function () {
  beforeEach(async function () {
    await deployAndSetCode("ArbosStorage", "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf");
    await deployAndSetCode("contracts/ArbSys.sol:ArbSys", PRECOMPILE_ADDRESSES.ArbSys);
  });

  it("should match native implementation", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbSys__factory,
      PRECOMPILE_ADDRESSES.ArbSys,
      "getStorageGasAvailable",
      []
    );
  });
});