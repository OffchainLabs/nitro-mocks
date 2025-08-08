import { deployAndSetCode, ArbPrecompile } from "../utils/utils";
import {
  expectEquivalentCallFromMultipleAddresses,
  storageAccessComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbSys__factory } from "../../typechain-types/factories/contracts/ArbSys__factory";

describe("ArbSys.mapL1SenderContractAddressToL2Alias", function () {
  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbSys]);
  });

  it("should behave equivalently from all standard addresses", async function () {
    const testAddress = "0x1234567890123456789012345678901234567890";
    const unusedAddress = "0x0000000000000000000000000000000000000000";

    await expectEquivalentCallFromMultipleAddresses(
      ArbSys__factory,
      ArbPrecompile.ArbSys,
      "mapL1SenderContractAddressToL2Alias",
      [testAddress, unusedAddress],
      {
        storageAccess: storageAccessComparerExcludingVersion
      }
    );
  });
});
