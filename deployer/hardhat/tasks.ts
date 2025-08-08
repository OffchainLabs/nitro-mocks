import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ArbPrecompile, deployNitroMocks, DeployedContracts } from "./deploy-mocks";

const ARBOS_STORAGE_ADDRESS = "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf";

async function checkIfDeployed(hre: HardhatRuntimeEnvironment, address: string): Promise<boolean> {
  const code = await hre.network.provider.send("eth_getCode", [address, "latest"]);
  // hardhat considers these low addresses to be precompiles and gives them 0xfe code
  return code !== "0x" && code !== "0x0" && code !== "0xfe";
}

task("deploy-precompiles", "Deploy Arbitrum precompile mock contracts to a Hardhat node")
  .addOptionalParam("precompiles", "Comma-separated list of precompile names to deploy (e.g., ArbSys,ArbGasInfo)")
  .addFlag("quiet", "Suppress console output")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const log = taskArgs.quiet ? () => {} : console.log;
    
    // Parse requested precompiles
    let toDeployAddresses: ArbPrecompile[] | undefined;
    if (taskArgs.precompiles) {
      toDeployAddresses = taskArgs.precompiles.split(",").map((name: string) => {
        const address = ArbPrecompile[name.trim() as keyof typeof ArbPrecompile];
        if (!address) {
          throw new Error(`Unknown precompile: ${name.trim()}`);
        }
        return address as ArbPrecompile;
      });
    }
    
    // Check ArbosStorage
    if (await checkIfDeployed(hre, ARBOS_STORAGE_ADDRESS)) {
      log(`\nArbosStorage already deployed at ${ARBOS_STORAGE_ADDRESS}`);
    }
    
    // Determine what needs deployment
    let shouldDeploy = false;
    if (toDeployAddresses) {
      // Filter to only non-deployed addresses
      const needsDeployment = [];
      for (const addr of toDeployAddresses) {
        if (!(await checkIfDeployed(hre, addr))) {
          needsDeployment.push(addr);
        }
      }
      shouldDeploy = needsDeployment.length > 0;
      toDeployAddresses = needsDeployment.length > 0 ? needsDeployment : undefined;
    } else {
      // Deploy all if none exist yet
      shouldDeploy = true;
      for (const address of Object.values(ArbPrecompile)) {
        if (typeof address === "string" && await checkIfDeployed(hre, address)) {
          shouldDeploy = false;
          break;
        }
      }
    }
    
    // Deploy if needed
    let deployed: DeployedContracts | undefined;
    if (shouldDeploy) {
      log("\nDeploying Arbitrum precompile mocks...\n");
      try {
        deployed = await deployNitroMocks(toDeployAddresses);
      } catch (error: any) {
        console.error("\nDeployment failed:", error.message);
        throw error;
      }
    }
    
    // Show final state
    log("\nDeployed precompiles:");
    log(`  - ArbosStorage: ${ARBOS_STORAGE_ADDRESS}`);
    
    for (const [name, address] of Object.entries(ArbPrecompile)) {
      if (typeof address === "string" && await checkIfDeployed(hre, address)) {
        log(`  - ${name}: ${address}`);
      }
    }
    
    log("");
    return deployed;
  });