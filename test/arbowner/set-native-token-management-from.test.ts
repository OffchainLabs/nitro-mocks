import { deployAndSetCode, ArbPrecompile, getUnderlyingProvider } from "../utils/utils";
import {
  expectEquivalentTxFromMultipleAddresses,
  storageAccessComparerExcludingVersion,
  storageValueComparerExcludingVersion
} from "../utils/expect-equivalent";
import { ArbOwner__factory, ArbOwnerPublic__factory } from "../../typechain-types";

// Writing the stored time back always passes the gate and leaves the chain untouched. Any other
// value is one-way on a shared testnode: from a disabled feature the gate only accepts times at
// least 7 days out, and those can never be pulled back in.
describe("ArbOwner.setNativeTokenManagementFrom", function () {
  let currentValue: bigint;

  before(async function () {
    const arbOwnerPublic = ArbOwnerPublic__factory.connect(ArbPrecompile.ArbOwnerPublic, getUnderlyingProvider());
    currentValue = await arbOwnerPublic.getNativeTokenManagementFrom();
  });

  beforeEach(async function () {
    await deployAndSetCode([ArbPrecompile.ArbOwner]);
  });

  it("should match native implementation", async function () {
    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      ArbPrecompile.ArbOwner,
      "setNativeTokenManagementFrom",
      [currentValue],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});
