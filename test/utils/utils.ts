import { HardhatRuntimeEnvironment } from "hardhat/types";
import { JsonRpcProvider, Provider } from "ethers";
import "mocha";
import { deployNitroMocks, ArbPrecompile } from "../../deployer/hardhat";
export { ArbPrecompile };

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

let isForkSynced = false;
const precompilesToDeploy = new Set<ArbPrecompile>();

export async function forkSync(): Promise<void> {
  const underlyingBlock = await getUnderlyingProvider().getBlockNumber();
  await hre.network.provider.send("hardhat_reset", [
    {
      forking: {
        jsonRpcUrl: getTestNodeRpcUrl(),
        blockNumber: underlyingBlock
      }
    }
  ]);
  precompilesToDeploy.clear();
}

export async function ensureForkSync(): Promise<void> {
  if (isForkSynced) return;

  await forkSync();
  isForkSynced = true;
}

export async function deployAndSetCode(contracts: Array<ArbPrecompile>): Promise<void> {
  await ensureForkSync();

  await deployNitroMocks(contracts, undefined, hre.ethers, hre.network);
}
