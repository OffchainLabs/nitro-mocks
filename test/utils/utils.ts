import { HardhatRuntimeEnvironment } from "hardhat/types";
import { JsonRpcProvider, Provider } from "ethers";
import "mocha";
import { deployNitroMocksHardhat, ArbPrecompile } from "../../deployer";
import { ArbSys__factory } from "../../typechain-types";
import { getTestNodeRpcUrl, REQUIRED_ARBOS_VERSION } from "../config";
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

async function ensureArbOSVersion(): Promise<void> {
  const arbSys = ArbSys__factory.connect(ArbPrecompile.ArbSys, getUnderlyingProvider());
  const version = Number(await arbSys.arbOSVersion()) - 55;
  if (version < REQUIRED_ARBOS_VERSION) {
    throw new Error(
      `testnode runs ArbOS ${version}, tests need ArbOS ${REQUIRED_ARBOS_VERSION}. Start it with npm run testnode`
    );
  }
}

export async function ensureForkSync(): Promise<void> {
  if (isForkSynced) return;

  await ensureArbOSVersion();
  await forkSync();
  isForkSynced = true;
}

export async function deployAndSetCode(contracts: Array<ArbPrecompile>): Promise<void> {
  await ensureForkSync();

  await deployNitroMocksHardhat(contracts);
}
