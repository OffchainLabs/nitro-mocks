import { ContractFactory, BaseContract, JsonRpcProvider, Signer } from "ethers";
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
} from "../typechain-types";

let hre: any;
try {
  hre = require("hardhat");
} catch {
  // hre might be available as global at runtime
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

async function deployContractAt(
  factory: ContractFactory, 
  address: string,
  provider: JsonRpcProvider,
  setCodeMethod: 'hardhat' | 'anvil'
): Promise<void> {
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const bytecode = await provider.send("eth_getCode", [await contract.getAddress(), "latest"]);
  
  const method = setCodeMethod === 'anvil' ? 'anvil_setCode' : 'hardhat_setCode';
  await provider.send(method, [address, bytecode]);
}

async function deployNitroMocksBase(
  provider: JsonRpcProvider,
  signer: Signer,
  setCodeMethod: 'hardhat' | 'anvil',
  precompiles?: ArbPrecompile[]
): Promise<DeployedContracts> {
  
  const toDeploy = precompiles || IMPLEMENTED_PRECOMPILES;

  const arbosStorageFactory = new ArbosStorage__factory(signer);
  await deployContractAt(arbosStorageFactory, ARBOS_STORAGE_ADDRESS, provider, setCodeMethod);
  const arbosStorage = arbosStorageFactory.attach(ARBOS_STORAGE_ADDRESS) as ArbosStorage;

  const deployed: DeployedContracts = { arbosStorage };

  for (const precompileAddress of toDeploy) {
    switch (precompileAddress) {
      case ArbPrecompile.ArbSys: {
        const factory = new ArbSys__factory(signer);
        await deployContractAt(factory, precompileAddress, provider, setCodeMethod);
        deployed.arbSys = factory.attach(precompileAddress) as ArbSys;
        break;
      }
      case ArbPrecompile.ArbGasInfo: {
        const factory = new ArbGasInfo__factory(signer);
        await deployContractAt(factory, precompileAddress, provider, setCodeMethod);
        deployed.arbGasInfo = factory.attach(precompileAddress) as ArbGasInfo;
        break;
      }
      case ArbPrecompile.ArbOwner: {
        const factory = new ArbOwner__factory(signer);
        await deployContractAt(factory, precompileAddress, provider, setCodeMethod);
        deployed.arbOwner = factory.attach(precompileAddress) as ArbOwner;
        break;
      }
      case ArbPrecompile.ArbOwnerPublic: {
        const factory = new ArbOwnerPublic__factory(signer);
        await deployContractAt(factory, precompileAddress, provider, setCodeMethod);
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

export async function deployNitroMocksHardhat(
  precompiles?: ArbPrecompile[],
  rpcUrl?: string
): Promise<DeployedContracts> {
  let provider: JsonRpcProvider;
  let signer: Signer;
  
  if (rpcUrl) {
    provider = new JsonRpcProvider(rpcUrl);
    signer = await provider.getSigner();
  } else {
    // Check again at runtime in case hre wasn't available at module load time
    if (!hre && typeof global !== 'undefined' && (global as any).hre) {
      hre = (global as any).hre;
    }
    
    if (!hre) {
      throw new Error("deployNitroMocksHardhat requires either an rpcUrl or Hardhat environment");
    }
    const signers = await hre.ethers.getSigners();
    signer = signers[0];
    provider = signer.provider as JsonRpcProvider;
  }
  
  return deployNitroMocksBase(provider, signer, 'hardhat', precompiles);
}

export async function deployNitroMocksAnvil(
  precompiles?: ArbPrecompile[],
  rpcUrl: string = "http://localhost:8545"
): Promise<DeployedContracts> {
  const provider = new JsonRpcProvider(rpcUrl);
  const signer = await provider.getSigner();
  
  return deployNitroMocksBase(provider, signer, 'anvil', precompiles);
}
