import { describe } from "mocha";
import { ethers } from "hardhat";
import { testL2ToL1Tx } from "../utils/l2-to-l1-test-helpers";

describe("ArbSys.withdrawEth", function () {
  it("should match native implementation", async function () {
    const destination = "0x1234567890123456789012345678901234567890";
    const value = ethers.parseEther("0.1");
    
    await testL2ToL1Tx("withdrawEth", [destination], value);
  });

  it("should match native implementation with no value", async function () {
    const destination = "0x1234567890123456789012345678901234567890";
    const value = ethers.parseEther("0");
    
    await testL2ToL1Tx("withdrawEth", [destination], value);
  });
});