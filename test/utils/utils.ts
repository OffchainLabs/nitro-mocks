import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, JsonRpcProvider, Provider } from "ethers";
import "mocha";
import { deployNitroMocks, ArbPrecompile } from "../../deployer/hardhat";

declare const hre: HardhatRuntimeEnvironment;

/**
 * Returns the appropriate JSON RPC URL based on the environment.
 * When running in Docker, we need to use host.docker.internal to access
 * the host machine's localhost from within the container.
 */
export function getTestNodeRpcUrl(): string {
  return process.env.IS_DOCKER ? "http://host.docker.internal:8547" : "http://localhost:8547";
}

export interface TestContext {
  underlyingProvider: JsonRpcProvider;
  forkProvider: Provider;
}

export function getUnderlyingProvider(): JsonRpcProvider {
  const forkingConfig = hre.config.networks?.hardhat?.forking;
  if (!forkingConfig || !forkingConfig.url) {
    throw new Error("No forking configuration found");
  }
  return new JsonRpcProvider(forkingConfig.url);
}

export const PRECOMPILE_ADDRESSES = {
  ArbSys: "0x0000000000000000000000000000000000000064",
  ArbOwner: "0x0000000000000000000000000000000000000070",
  ArbOwnerPublic: "0x000000000000000000000000000000000000006b",
  ArbGasInfo: "0x000000000000000000000000000000000000006c",
  ArbInfo: "0x0000000000000000000000000000000000000065",
  ArbRetryableTx: "0x000000000000000000000000000000000000006e",
  ArbStatistics: "0x000000000000000000000000000000000000006f",
  ArbAddressTable: "0x0000000000000000000000000000000000000066",
  ArbAggregator: "0x00000000000000000000000000000000000000d3",
  ArbBLS: "0x0000000000000000000000000000000000000067",
  ArbDebug: "0x00000000000000000000000000000000000000ff",
  ArbFunctionTable: "0x0000000000000000000000000000000000000068",
  ArbNativeTokenManager: "0x00000000000000000000000000000000000000ce",
  ArbWasm: "0x0000000000000000000000000000000000000071",
  ArbWasmCache: "0x0000000000000000000000000000000000000072",
  ArbosActs: "0x000000000000000000000000000000000000006a",
  ArbosTest: "0x0000000000000000000000000000000000000069",
  NodeInterface: "0x00000000000000000000000000000000000000c8"
} as const;

let isForkSynced = false;
let precompilesToDeploy = new Set<ArbPrecompile>();
let hasDeployedArbosStorage = false;

export async function forkSync(): Promise<void> {
  const underlyingBlock = await getUnderlyingProvider().getBlockNumber();
  await hre.network.provider.send("hardhat_reset", [{
    forking: {
      jsonRpcUrl: getTestNodeRpcUrl(),
      blockNumber: underlyingBlock
    }
  }]);
  precompilesToDeploy.clear();
  hasDeployedArbosStorage = false;
}

export async function ensureForkSync(): Promise<void> {
  if (isForkSynced) return;
  
  await forkSync();
  isForkSynced = true;
}

function mapContractNameToPrecompile(contractName: string): ArbPrecompile | null {
  const baseName = contractName.split(':').pop() || contractName;
  
  switch (baseName) {
    case "ArbSys":
      return ArbPrecompile.ArbSys;
    case "ArbGasInfo":
      return ArbPrecompile.ArbGasInfo;
    case "ArbOwner":
      return ArbPrecompile.ArbOwner;
    case "ArbOwnerPublic":
      return ArbPrecompile.ArbOwnerPublic;
    case "ArbosStorage":
      return null;
    default:
      throw new Error(`Unknown contract name: ${contractName}`);
  }
}

export async function deployAndSetCode(
  contracts: Array<{ contractName: string, precompileAddress: string }>
): Promise<void> {
  await ensureForkSync();
  
  let foundArbosStorage = false;
  const precompiles: ArbPrecompile[] = [];
  
  for (const { contractName } of contracts) {
    const precompile = mapContractNameToPrecompile(contractName);
    if (!precompile) {
      foundArbosStorage = true;
    } else {
      precompiles.push(precompile);
    }
  }
  
  if (foundArbosStorage || precompiles.length > 0) {
    await deployNitroMocks(precompiles, undefined, hre.ethers, hre.network);
  }
}


