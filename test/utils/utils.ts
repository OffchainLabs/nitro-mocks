import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, JsonRpcProvider, Provider } from "ethers";
import "mocha";

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

export async function deployAndSetCode(
  contractName: string, 
  precompileAddress: string
): Promise<void> {
  const Contract = await hre.ethers.getContractFactory(contractName);
  const contract = await Contract.deploy();
  await contract.waitForDeployment();
  
  await hre.network.provider.send("hardhat_setCode", [
    precompileAddress,
    await hre.network.provider.send("eth_getCode", [await contract.getAddress()])
  ]);
}


