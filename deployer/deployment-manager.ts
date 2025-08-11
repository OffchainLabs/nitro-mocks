import { JsonRpcProvider } from "ethers";
import { ArbPrecompile, deployNitroMocksHardhat, deployNitroMocksAnvil, DeployedContracts } from "./deploy-mocks";

const ARBOS_STORAGE_ADDRESS = "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf";

export interface DeploymentOptions {
  provider: JsonRpcProvider;
  mode: "hardhat" | "anvil";
  precompileNames?: string;
  quiet?: boolean;
}

async function checkIfDeployed(provider: JsonRpcProvider, address: string): Promise<boolean> {
  const code = await provider.send("eth_getCode", [address, "latest"]);
  // hardhat considers these low addresses to be precompiles and gives them 0xfe code
  return code !== "0x" && code !== "0x0" && code !== "0xfe";
}

export async function detectMode(provider: JsonRpcProvider): Promise<"anvil" | "hardhat"> {
  try {
    const clientVersion = await provider.send("web3_clientVersion", []);
    if (clientVersion.toLowerCase().includes("anvil")) {
      return "anvil";
    }
    if (clientVersion.toLowerCase().includes("hardhat")) {
      return "hardhat";
    }
    return "anvil";
  } catch (error) {
    return "anvil";
  }
}

export async function deployWithChecks(options: DeploymentOptions): Promise<DeployedContracts | undefined> {
  const log = options.quiet ? () => {} : console.log;
  
  let toDeployAddresses: ArbPrecompile[] | undefined;
  if (options.precompileNames) {
    toDeployAddresses = options.precompileNames.split(",").map((name: string) => {
      const address = ArbPrecompile[name.trim() as keyof typeof ArbPrecompile];
      if (!address) {
        throw new Error(`Unknown precompile: ${name.trim()}`);
      }
      return address as ArbPrecompile;
    });
  }
  
  if (await checkIfDeployed(options.provider, ARBOS_STORAGE_ADDRESS)) {
    log(`\nArbosStorage already deployed at ${ARBOS_STORAGE_ADDRESS}`);
  }
  
  let shouldDeploy = false;
  if (toDeployAddresses) {
    const needsDeployment = [];
    for (const addr of toDeployAddresses) {
      if (!(await checkIfDeployed(options.provider, addr))) {
        needsDeployment.push(addr);
      }
    }
    shouldDeploy = needsDeployment.length > 0;
    toDeployAddresses = needsDeployment.length > 0 ? needsDeployment : undefined;
  } else {
    shouldDeploy = true;
    for (const address of Object.values(ArbPrecompile)) {
      if (typeof address === "string" && await checkIfDeployed(options.provider, address)) {
        shouldDeploy = false;
        break;
      }
    }
  }
  
  let deployed: DeployedContracts | undefined;
  if (shouldDeploy) {
    log("\nDeploying Arbitrum precompile mocks...\n");
    try {
      const rpcUrl = (options.provider as any)._getConnection?.().url || 
                     (options.provider as any).connection?.url || 
                     "http://localhost:8545";
      
      if (options.mode === "hardhat") {
        deployed = await deployNitroMocksHardhat(toDeployAddresses, rpcUrl);
      } else {
        deployed = await deployNitroMocksAnvil(toDeployAddresses, rpcUrl);
      }
    } catch (error: any) {
      console.error("\nDeployment failed:", error.message);
      throw error;
    }
  } else {
    log("\nAll requested precompiles are already deployed.");
  }
  
  log("\nDeployed precompiles:");
  log(`  - ArbosStorage: ${ARBOS_STORAGE_ADDRESS}`);
  
  for (const [name, address] of Object.entries(ArbPrecompile)) {
    if (typeof address === "string" && await checkIfDeployed(options.provider, address)) {
      log(`  - ${name}: ${address}`);
    }
  }
  
  log("");
  return deployed;
}