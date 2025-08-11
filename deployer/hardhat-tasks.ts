import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { JsonRpcProvider } from "ethers";
import { deployWithChecks } from "./deployment-manager";

task("deploy-precompiles", "Deploy Arbitrum precompile mock contracts to a Hardhat node")
  .addOptionalParam("precompiles", "Comma-separated list of precompile names to deploy (e.g., ArbSys,ArbGasInfo)")
  .addFlag("quiet", "Suppress console output")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const signers = await hre.ethers.getSigners();
    const provider = signers[0].provider as JsonRpcProvider;
    
    return deployWithChecks({
      provider,
      mode: "hardhat",
      precompileNames: taskArgs.precompiles,
      quiet: taskArgs.quiet
    });
  });