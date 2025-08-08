import { ContractFactory, BaseContract } from "ethers";
import {
  ArbosStorage__factory,
  ArbSys__factory,
  ArbGasInfo__factory,
  ArbOwner__factory,
  ArbOwnerPublic__factory,
  ArbosStorage,
  ArbSys,
  ArbGasInfo,
  ArbOwner,
  ArbOwnerPublic
} from "../../typechain-types";

// Try to import hre - will work in Hardhat context
let hre: any;
try {
  hre = require("hardhat");
} catch {
  // Not in Hardhat context - will be handled in deployNitroMocks
}

export enum ArbPrecompile {
  ArbSys = "0x0000000000000000000000000000000000000064",
  ArbInfo = "0x0000000000000000000000000000000000000065",
  ArbAddressTable = "0x0000000000000000000000000000000000000066",
  ArbBLS = "0x0000000000000000000000000000000000000067",
  ArbFunctionTable = "0x0000000000000000000000000000000000000068",
  ArbosTest = "0x0000000000000000000000000000000000000069",
  ArbosActs = "0x000000000000000000000000000000000000006a",
  ArbOwnerPublic = "0x000000000000000000000000000000000000006b",
  ArbGasInfo = "0x000000000000000000000000000000000000006c",
  ArbAggregator = "0x00000000000000000000000000000000000000d3",
  ArbRetryableTx = "0x000000000000000000000000000000000000006e",
  ArbStatistics = "0x000000000000000000000000000000000000006f",
  ArbOwner = "0x0000000000000000000000000000000000000070",
  ArbWasm = "0x0000000000000000000000000000000000000071",
  ArbWasmCache = "0x0000000000000000000000000000000000000072",
  NodeInterface = "0x00000000000000000000000000000000000000c8",
  ArbNativeTokenManager = "0x00000000000000000000000000000000000000ce",
  ArbDebug = "0x00000000000000000000000000000000000000ff"
}

export interface DeployedContracts {
  arbosStorage: ArbosStorage;
  arbSys?: ArbSys;
  arbInfo?: BaseContract;
  arbAddressTable?: BaseContract;
  arbAggregator?: BaseContract;
  arbRetryableTx?: BaseContract;
  arbGasInfo?: ArbGasInfo;
  arbStatistics?: BaseContract;
  arbFunctionTable?: BaseContract;
  arbOwner?: ArbOwner;
  arbOwnerPublic?: ArbOwnerPublic;
  arbWasm?: BaseContract;
  arbWasmCache?: BaseContract;
}

const ARBOS_STORAGE_ADDRESS = "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf";

const IMPLEMENTED_PRECOMPILES = [
  ArbPrecompile.ArbSys,
  ArbPrecompile.ArbGasInfo,
  ArbPrecompile.ArbOwner,
  ArbPrecompile.ArbOwnerPublic
];

async function deployContractAt(factory: ContractFactory, address: string): Promise<void> {
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  await hre.network.provider.send("hardhat_setCode", [
    address,
    await hre.network.provider.send("eth_getCode", [await contract.getAddress()])
  ]);
}

export async function deployNitroMocks(
  precompiles?: ArbPrecompile[]
): Promise<DeployedContracts> {
  if (!hre) {
    throw new Error("deployNitroMocks must be run in a Hardhat environment");
  }

  const signers = await hre.ethers.getSigners();
  const signer = signers[0];

  const toDeploy = precompiles || IMPLEMENTED_PRECOMPILES;

  const arbosStorageFactory = new ArbosStorage__factory(signer);
  await deployContractAt(arbosStorageFactory, ARBOS_STORAGE_ADDRESS);
  const arbosStorage = arbosStorageFactory.attach(ARBOS_STORAGE_ADDRESS) as ArbosStorage;

  const deployed: DeployedContracts = { arbosStorage };

  for (const precompileAddress of toDeploy) {
    switch (precompileAddress) {
      case ArbPrecompile.ArbSys: {
        const factory = new ArbSys__factory(signer);
        await deployContractAt(factory, precompileAddress);
        deployed.arbSys = factory.attach(precompileAddress) as ArbSys;
        break;
      }
      case ArbPrecompile.ArbGasInfo: {
        const factory = new ArbGasInfo__factory(signer);
        await deployContractAt(factory, precompileAddress);
        deployed.arbGasInfo = factory.attach(precompileAddress) as ArbGasInfo;
        break;
      }
      case ArbPrecompile.ArbOwner: {
        const factory = new ArbOwner__factory(signer);
        await deployContractAt(factory, precompileAddress);
        deployed.arbOwner = factory.attach(precompileAddress) as ArbOwner;
        break;
      }
      case ArbPrecompile.ArbOwnerPublic: {
        const factory = new ArbOwnerPublic__factory(signer);
        await deployContractAt(factory, precompileAddress);
        deployed.arbOwnerPublic = factory.attach(precompileAddress) as ArbOwnerPublic;
        break;
      }
      case ArbPrecompile.ArbInfo:
      case ArbPrecompile.ArbAddressTable:
      case ArbPrecompile.ArbBLS:
      case ArbPrecompile.ArbFunctionTable:
      case ArbPrecompile.ArbosTest:
      case ArbPrecompile.ArbosActs:
      case ArbPrecompile.ArbAggregator:
      case ArbPrecompile.ArbRetryableTx:
      case ArbPrecompile.ArbStatistics:
      case ArbPrecompile.ArbWasm:
      case ArbPrecompile.ArbWasmCache:
      case ArbPrecompile.NodeInterface:
      case ArbPrecompile.ArbNativeTokenManager:
      case ArbPrecompile.ArbDebug:
        throw new Error(`Precompile ${precompileAddress} is not yet implemented`);
      default:
        throw new Error(`Unknown precompile address: ${precompileAddress}`);
    }
  }

  return deployed;
}
