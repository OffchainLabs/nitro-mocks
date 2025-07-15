import { expect } from "chai";
import { ethers, network } from "hardhat";
import { ArbosStorage } from "../../typechain-types";
import { ZeroHash, zeroPadValue, toBeHex, toNumber } from "ethers";

describe("ArbosStorage", function () {
  const ARBOS_ADDRESS = "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf";
  const EXPECTED_VERSION_SLOT = "0x15fed0451499512d95f3ec5a41c878b9de55f21878b5b4e190d4667ec709b400";
  
  let arbosStorage: ArbosStorage;

  describe("Fork Integration", function () {
    it("Should read existing version from fork", async function () {
      const storedValue = await network.provider.send("eth_getStorageAt", [
        ARBOS_ADDRESS,
        EXPECTED_VERSION_SLOT
      ]);
      
      const version = parseInt(storedValue, 16);
      
      // Version 32 (0x20) is expected on mainnet
      expect(version).to.equal(32);
    });
  });

  beforeEach(async function () {
    const ArbosStorageFactory = await ethers.getContractFactory("ArbosStorage");
    const deployed = await ArbosStorageFactory.deploy();
    await deployed.waitForDeployment();
    
    const bytecode = await network.provider.send("eth_getCode", [
      await deployed.getAddress()
    ]);
    
    await network.provider.send("hardhat_setCode", [
      ARBOS_ADDRESS,
      bytecode
    ]);
    
    arbosStorage = await ethers.getContractAt("ArbosStorage", ARBOS_ADDRESS);
  });

  describe("Storage Mapping", function () {
    it("Should map key 0 to the expected version slot", async function () {
      const key0 = ZeroHash; // 32 bytes of zeros
      const mappedSlot = await arbosStorage.mapAddress(key0);
      
      expect(mappedSlot).to.equal(EXPECTED_VERSION_SLOT);
    });

    it("Should preserve last byte in mapped slots", async function () {
      // The algorithm preserves the last byte of the key
      const key0 = ZeroHash;
      const key42 = zeroPadValue("0x2a", 32);
      const key255 = zeroPadValue("0xff", 32);
      
      const slot0 = await arbosStorage.mapAddress(key0);
      const slot42 = await arbosStorage.mapAddress(key42);
      const slot255 = await arbosStorage.mapAddress(key255);
      
      expect(slot0.slice(-2)).to.equal("00");
      expect(slot42.slice(-2)).to.equal("2a");
      expect(slot255.slice(-2)).to.equal("ff");
    });

    it("Should produce different pages for different key prefixes", async function () {
      // Keys with different first 31 bytes map to different pages
      const key1 = zeroPadValue("0x01", 32);
      const key2 = zeroPadValue("0x0100", 32);
      
      const slot1 = await arbosStorage.mapAddress(key1);
      const slot2 = await arbosStorage.mapAddress(key2);
      
      expect(slot1.slice(0, -2)).to.not.equal(slot2.slice(0, -2));
    });

    it("Should create consecutive slots for keys with same first 31 bytes", async function () {
      const base = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab";
      const key0 = base + "cd00";
      const key1 = base + "cd01";
      const key2 = base + "cd02";
      const keyFF = base + "cdff";
      
      const slot0 = await arbosStorage.mapAddress(key0);
      const slot1 = await arbosStorage.mapAddress(key1);
      const slot2 = await arbosStorage.mapAddress(key2);
      const slotFF = await arbosStorage.mapAddress(keyFF);
      
      // All share the same page (first 31 bytes)
      const page = slot0.slice(0, -2);
      expect(slot1.slice(0, -2)).to.equal(page);
      expect(slot2.slice(0, -2)).to.equal(page);
      expect(slotFF.slice(0, -2)).to.equal(page);
      
      expect(slot0.slice(-2)).to.equal("00");
      expect(slot1.slice(-2)).to.equal("01");
      expect(slot2.slice(-2)).to.equal("02");
      expect(slotFF.slice(-2)).to.equal("ff");
    });
  });

  describe("Version Storage", function () {
    it("Should store version at the expected slot", async function () {
      const testVersion = 42;
      
      await arbosStorage.setVersion(testVersion);
      
      const retrievedVersion = await arbosStorage.getVersion();
      expect(Number(retrievedVersion)).to.equal(testVersion);
      
      const storedValue = await arbosStorage.getStorageAt(EXPECTED_VERSION_SLOT);
      const directVersion = toNumber(storedValue);
      expect(directVersion).to.equal(testVersion);
    });

    it("Should handle direct slot access", async function () {
      const testVersion = 999;
      const versionBytes = zeroPadValue(toBeHex(testVersion), 32);
      
      await arbosStorage.setStorageAt(EXPECTED_VERSION_SLOT, versionBytes);
      
      const retrievedVersion = await arbosStorage.getVersion();
      
      expect(Number(retrievedVersion)).to.equal(testVersion);
    });
  });
});