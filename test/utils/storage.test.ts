import { ethers } from "hardhat";
import { expect } from "chai";
import { getAllStorageAccessesFromTx, getAllStorageAccessesFromCall, StorageAccess, StorageAccessType } from "./storage";
import { solidityPackedKeccak256 } from "ethers";

describe("getAllStorageAccessesFromTx", function () {
  let testStorage: any;
  let provider: any;
  let signer: any;

  beforeEach(async function () {
    provider = ethers.provider;
    [signer] = await ethers.getSigners();
    
    const TestStorage = await ethers.getContractFactory("TestStorage");
    testStorage = await TestStorage.deploy();
    await testStorage.waitForDeployment();
  });

  it("should track simple storage write", async function () {
    const tx = await testStorage.setValue(42);
    await tx.wait();
    
    const accesses = await getAllStorageAccessesFromTx(provider, tx.hash);
    
    expect(accesses.length).to.equal(1);
    expect(accesses[0].type).to.equal(StorageAccessType.Write);
    expect(accesses[0].slot).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
    expect(accesses[0].value).to.equal('0x000000000000000000000000000000000000000000000000000000000000002a');
    expect(accesses[0].address.toLowerCase()).to.equal((await testStorage.getAddress()).toLowerCase());
  });

  it("should track read followed by write", async function () {
    await testStorage.setValue(10);
    
    const tx = await testStorage.readAndWrite();
    await tx.wait();
    
    const accesses = await getAllStorageAccessesFromTx(provider, tx.hash);
    
    expect(accesses.length).to.equal(2);
    
    expect(accesses[0].type).to.equal(StorageAccessType.Read);
    expect(accesses[0].slot).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
    
    expect(accesses[1].type).to.equal(StorageAccessType.Write);
    expect(accesses[1].slot).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
    expect(accesses[1].value).to.equal('0x000000000000000000000000000000000000000000000000000000000000000b');
  });

  it("should track mapping storage access", async function () {
    const userAddress = signer.address;
    const tx = await testStorage.setBalance(userAddress, 1000);
    await tx.wait();
    
    const accesses = await getAllStorageAccessesFromTx(provider, tx.hash);
    
    expect(accesses.length).to.equal(1);
    expect(accesses[0].type).to.equal(StorageAccessType.Write);
    expect(accesses[0].value).to.equal('0x00000000000000000000000000000000000000000000000000000000000003e8');
    
    const slot1 = solidityPackedKeccak256(
      ["uint256", "uint256"],
      [userAddress, 1]
    );
    expect(accesses[0].slot.toLowerCase()).to.equal(slot1.toLowerCase());
  });

  it("should track multiple storage operations", async function () {
    await testStorage.setValue(5);
    
    const tx = await testStorage.multipleOperations();
    await tx.wait();
    
    const accesses = await getAllStorageAccessesFromTx(provider, tx.hash);
    
    expect(accesses.length).to.equal(3);
    
    expect(accesses[0].type).to.equal(StorageAccessType.Read);
    expect(accesses[0].slot).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
    
    expect(accesses[1].type).to.equal(StorageAccessType.Write);
    expect(accesses[1].slot).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
    expect(accesses[1].value).to.equal('0x000000000000000000000000000000000000000000000000000000000000000f');
    
    expect(accesses[2].type).to.equal(StorageAccessType.Write);
    const slot1 = solidityPackedKeccak256(
      ["uint256", "uint256"],
      [signer.address, 1]
    );
    expect(accesses[2].slot.toLowerCase()).to.equal(slot1.toLowerCase());
    expect(accesses[2].value).to.equal('0x0000000000000000000000000000000000000000000000000000000000000005');
  });

  it("should track storage accesses with correct program counter order", async function () {
    const tx = await testStorage.multipleOperations();
    await tx.wait();
    
    const accesses = await getAllStorageAccessesFromTx(provider, tx.hash);
    
    for (let i = 1; i < accesses.length; i++) {
      expect(accesses[i].pc).to.be.greaterThan(accesses[i-1].pc);
    }
  });
});

describe("getAllStorageAccessesFromCall (view functions)", function () {
  let testStorage: any;
  let provider: any;
  let signer: any;

  beforeEach(async function () {
    provider = ethers.provider;
    [signer] = await ethers.getSigners();
    
    const TestStorage = await ethers.getContractFactory("TestStorage");
    testStorage = await TestStorage.deploy();
    await testStorage.waitForDeployment();
    
    await testStorage.setValue(42);
    await testStorage.setBalance(signer.address, 100);
  });

  it("should track storage reads in view functions", async function () {
    const iface = testStorage.interface;
    const data = iface.encodeFunctionData("getValueAndBalance", [signer.address]);
    
    const accesses = await getAllStorageAccessesFromCall(
      provider,
      await testStorage.getAddress(),
      data,
      signer.address
    );
    
    expect(accesses.length).to.equal(2);
    
    expect(accesses[0].type).to.equal(StorageAccessType.Read);
    expect(accesses[0].slot).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
    expect(accesses[0].value).to.equal('0x000000000000000000000000000000000000000000000000000000000000002a');
    
    expect(accesses[1].type).to.equal(StorageAccessType.Read);
    const slot1 = solidityPackedKeccak256(
      ["uint256", "uint256"],
      [signer.address, 1]
    );
    expect(accesses[1].slot.toLowerCase()).to.equal(slot1.toLowerCase());
    expect(accesses[1].value).to.equal('0x0000000000000000000000000000000000000000000000000000000000000064');
  });

  it("should track storage reads for public state variables", async function () {
    const iface = testStorage.interface;
    const data = iface.encodeFunctionData("value", []);
    
    const accesses = await getAllStorageAccessesFromCall(
      provider,
      await testStorage.getAddress(),
      data,
      signer.address
    );
    
    expect(accesses.length).to.equal(1);
    expect(accesses[0].type).to.equal(StorageAccessType.Read);
    expect(accesses[0].slot).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
  });
});