import { ethers } from "hardhat";
import { testL2ToL1Tx } from "../utils/l2-to-l1-test-helpers";

describe("ArbSys.sendTxToL1", function () {
  it("should match native implementation", async function () {
    const destination = "0x1234567890123456789012345678901234567890";
    const data = "0xdeadbeef";
    const value = ethers.parseEther("0");
    
    await testL2ToL1Tx("sendTxToL1", [destination, data], value);
  })

  it("should handle empty data", async function () {
    const destination = "0x1234567890123456789012345678901234567890";
    const data = "0x";
    const value = ethers.parseEther("0.1");
    
    await testL2ToL1Tx("sendTxToL1", [destination, data], value);
  })

  it("should handle zero value", async function () {
    const destination = "0x1234567890123456789012345678901234567890";
    const data = "0xdeadbeef";
    const value = ethers.parseEther("0");
    
    await testL2ToL1Tx("sendTxToL1", [destination, data], value);
  })

  it("should match native implementation for many calls", async function () {
    this.timeout(500000);
    
    for (let i = 0; i < 16; i++) {
      const destination = `0x${(BigInt("1234567890123456789012345678901234567890") + BigInt(i)).toString(16).padStart(40, '0')}`;
      const data = `0xdeadbeef${i.toString(16).padStart(2, '0')}`;
      const value = ethers.parseEther((0.001 * i).toString());
      
      await testL2ToL1Tx("sendTxToL1", [destination, data], value);
    }
  })
});