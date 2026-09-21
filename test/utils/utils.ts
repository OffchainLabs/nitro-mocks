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
let forkBlockNumber: number | undefined;
let hasUnderlyingTx = false;
const precompilesToDeploy = new Set<ArbPrecompile>();

/**
 * The block underlying reads should use. Pinning to the fork block stops a value that moves
 * between blocks from being read at a different height on each side. Once a transaction has
 * been sent to the underlying chain its write sits past that block, while the fork holds it
 * locally, so from then on only the tip has what the fork has.
 */
export function getUnderlyingReadBlock(): number | "latest" {
  if (forkBlockNumber === undefined) {
    throw new Error("Fork is not synced yet");
  }
  return hasUnderlyingTx ? "latest" : forkBlockNumber;
}

export function markUnderlyingTx(): void {
  hasUnderlyingTx = true;
}

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
  forkBlockNumber = underlyingBlock;
  hasUnderlyingTx = false;
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
