import { PRECOMPILE_ADDRESSES, deployAndSetCode } from "../utils/utils";
import { expectEquivalentCallFromMultipleAddresses, storageAccessComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbSys__factory } from "../../typechain-types/factories/contracts/ArbSys__factory";
import { StorageAccess } from "../utils/storage";
import { expect } from "chai";

describe("ArbSys.sendMerkleTreeState", function () {
  beforeEach(async function() {
    await deployAndSetCode([
          { contractName: "ArbosStorage", precompileAddress: "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf" },
          { contractName: "contracts/ArbSys.sol:ArbSys", precompileAddress: PRECOMPILE_ADDRESSES.ArbSys }
        ]);
  });

  it("should match native implementation", async function () {
    await expectEquivalentCallFromMultipleAddresses(
      ArbSys__factory,
      PRECOMPILE_ADDRESSES.ArbSys,
      "sendMerkleTreeState",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});