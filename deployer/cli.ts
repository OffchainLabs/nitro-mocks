#!/usr/bin/env node

import { Command } from "commander";
import { JsonRpcProvider } from "ethers";
import { deployWithChecks, detectMode } from "./deployment-manager";

async function deploy(options: { rpcUrl: string; precompiles?: string; quiet?: boolean }) {
  try {
    const provider = new JsonRpcProvider(options.rpcUrl);
    
    if (!options.quiet) {
      console.log(`\nDetecting deployment mode for ${options.rpcUrl}...`);
    }
    
    const mode = await detectMode(provider);
    
    if (!options.quiet) {
      console.log(`Detected: ${mode}`);
    }
    
    await deployWithChecks({
      provider,
      mode,
      precompileNames: options.precompiles,
      quiet: options.quiet
    });
    
    if (!options.quiet) {
      console.log("\nDeployment complete!");
    }
    
  } catch (error: any) {
    console.error("\nDeployment failed:", error.message);
    process.exit(1);
  }
}

const program = new Command();

program
  .name("nitro-mocks-deploy")
  .description("Deploy Arbitrum precompile mocks to Anvil or Hardhat nodes")
  .version("1.0.0")
  .option("-r, --rpc-url <url>", "RPC URL to connect to", "http://localhost:8545")
  .option("-p, --precompiles <list>", "Comma-separated list of precompiles to deploy (e.g., ArbSys,ArbGasInfo)")
  .option("-q, --quiet", "Suppress console output")
  .action(deploy);

program.parse();