import { readFileSync } from "fs";
import { join } from "path";
import { BaseContract, JsonRpcProvider, Signer } from "ethers";
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
  ArbAggregator = "0x000000000000000000000000000000000000006d",
  ArbRetryableTx = "0x000000000000000000000000000000000000006e",
  ArbStatistics = "0x000000000000000000000000000000000000006f",
  ArbOwner = "0x0000000000000000000000000000000000000070",
  ArbWasm = "0x0000000000000000000000000000000000000071",
  ArbWasmCache = "0x0000000000000000000000000000000000000072",
  ArbNativeTokenManager = "0x0000000000000000000000000000000000000073",
  ArbFilteredTransactionsManager = "0x0000000000000000000000000000000000000074",
  NodeInterface = "0x00000000000000000000000000000000000000c8",
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

// ArbOwner exceeds the EIP-170 size limit and cannot be deployed, so runtime bytecode comes from the artifacts.
function readDeployedBytecode(contractName: string): string {
  const artifactPath = join(__dirname, "..", "artifacts", "contracts", `${contractName}.sol`, `${contractName}.json`);
  return JSON.parse(readFileSync(artifactPath, "utf8")).deployedBytecode;
}

async function setCodeAt(
  provider: JsonRpcProvider,
  address: string,
  contractName: string,
  setCodeMethod: 'hardhat' | 'anvil'
): Promise<void> {
  const method = setCodeMethod === 'anvil' ? 'anvil_setCode' : 'hardhat_setCode';
  await provider.send(method, [address, readDeployedBytecode(contractName)]);
}

async function deployNitroMocksBase(
  provider: JsonRpcProvider,
  signer: Signer,
  setCodeMethod: 'hardhat' | 'anvil',
  precompiles?: ArbPrecompile[]
): Promise<DeployedContracts> {
  
  const toDeploy = precompiles || IMPLEMENTED_PRECOMPILES;

  await setCodeAt(provider, ARBOS_STORAGE_ADDRESS, "ArbosStorage", setCodeMethod);
  const arbosStorage = ArbosStorage__factory.connect(ARBOS_STORAGE_ADDRESS, signer);

  const deployed: DeployedContracts = { arbosStorage };

  for (const precompileAddress of toDeploy) {
    switch (precompileAddress) {
      case ArbPrecompile.ArbSys:
        await setCodeAt(provider, precompileAddress, "ArbSys", setCodeMethod);
        deployed.arbSys = ArbSys__factory.connect(precompileAddress, signer);
        break;
      case ArbPrecompile.ArbGasInfo:
        await setCodeAt(provider, precompileAddress, "ArbGasInfo", setCodeMethod);
        deployed.arbGasInfo = ArbGasInfo__factory.connect(precompileAddress, signer);
        break;
      case ArbPrecompile.ArbOwner:
        await setCodeAt(provider, precompileAddress, "ArbOwner", setCodeMethod);
        deployed.arbOwner = ArbOwner__factory.connect(precompileAddress, signer);
        break;
      case ArbPrecompile.ArbOwnerPublic:
        await setCodeAt(provider, precompileAddress, "ArbOwnerPublic", setCodeMethod);
        deployed.arbOwnerPublic = ArbOwnerPublic__factory.connect(precompileAddress, signer);
        break;
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
      case ArbPrecompile.ArbNativeTokenManager:
      case ArbPrecompile.ArbFilteredTransactionsManager:
      case ArbPrecompile.NodeInterface:
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
