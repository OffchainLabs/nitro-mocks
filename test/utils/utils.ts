import { HardhatRuntimeEnvironment } from "hardhat/types";
import { JsonRpcProvider, Provider } from "ethers";
import "mocha";
import { deployNitroMocksHardhat, ArbPrecompile } from "../../deployer";
import { getTestNodeRpcUrl } from "../config";
export { ArbPrecompile, getTestNodeRpcUrl };

declare const hre: HardhatRuntimeEnvironment;

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

  await deployNitroMocksHardhat(contracts);
}
