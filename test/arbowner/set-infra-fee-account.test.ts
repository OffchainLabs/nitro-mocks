import { PRECOMPILE_ADDRESSES, deployAndSetCode, ArbPrecompile } from "../utils/utils";
import { expectEquivalentTxFromMultipleAddresses, expectEquivalentCallFromChainOwner, expectEquivalentTxFromChainOwner, storageAccessComparerExcludingVersion, storageValueComparerExcludingVersion } from "../utils/expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types/factories/contracts/ArbOwner__factory";
import { ArbOwnerPublic__factory } from "../../typechain-types";

describe("ArbOwner.setInfraFeeAccount", function () {
  let originalAccount: string;

  beforeEach(async function() {  
    await deployAndSetCode([
      ArbPrecompile.ArbOwner,
      ArbPrecompile.ArbOwnerPublic
    ]);

    await expectEquivalentCallFromChainOwner(
      ArbOwnerPublic__factory,
      PRECOMPILE_ADDRESSES.ArbOwnerPublic,
      "getInfraFeeAccount",
      [],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        result: (mock, underlying) => {
          originalAccount = mock as string;
        }
      }
    );
  });

  afterEach(async function() {
    await expectEquivalentTxFromChainOwner(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "setInfraFeeAccount",
      [originalAccount],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });

  it("should match native implementation", async function () {
    const newInfraFeeAccount = "0x1234567890123456789012345678901234567890";
    
    await expectEquivalentTxFromMultipleAddresses(
      ArbOwner__factory,
      PRECOMPILE_ADDRESSES.ArbOwner,
      "setInfraFeeAccount",
      [newInfraFeeAccount],
      {
        storageAccess: storageAccessComparerExcludingVersion,
        storageValues: storageValueComparerExcludingVersion
      }
    );
  });
});