import { PRECOMPILE_ADDRESSES, deployAndSetCode, ArbPrecompile } from "../utils/utils";
import { expectEquivalentCallFromMultipleAddresses, createStorageAccessComparer } from "../utils/expect-equivalent";
import { StorageAccess } from "../utils/storage";
import { ArbSys__factory } from "../../typechain-types/factories/contracts/ArbSys__factory";

const VERSION_SLOT = "0x15fed0451499512d95f3ec5a41c878b9de55f21878b5b4e190d4667ec709b400";

describe("ArbSys.arbOSVersion", function () {
  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbSys]);
  });

  it("should behave equivalently from all standard addresses", async function () {
    // Custom comparer that filters version slot from both mock and underlying accesses
    // This is needed because the native implementation has the version cached
    // and doesn't need to read from storage, while our mock does
    const storageAccessComparerFilteringVersionSlot = (mock: StorageAccess[], underlying: StorageAccess[]) => {
      const mockFiltered = mock.filter(access => access.slot !== VERSION_SLOT);
      const underlyingFiltered = underlying.filter(access => access.slot !== VERSION_SLOT);
      createStorageAccessComparer()(mockFiltered, underlyingFiltered);
    };

    await expectEquivalentCallFromMultipleAddresses(ArbSys__factory, PRECOMPILE_ADDRESSES.ArbSys, "arbOSVersion", [], {
      storageAccess: storageAccessComparerFilteringVersionSlot
    });
  });
});
