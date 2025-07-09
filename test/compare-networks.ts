import { ethers } from "ethers";
import hre from "hardhat";

async function compareNetworks() {
  console.log("Comparing actual network vs forked network...\n");
  
  // Test address
  const testAddress = "0xCd9e09B30d481cc33937CE33fEB3d94D434F5F75";
  
  // Connect to actual Ethereum mainnet via Llama RPC
  const actualNetworkUrl = "https://eth.llamarpc.com";
  const actualProvider = new ethers.providers.JsonRpcProvider(actualNetworkUrl);
  
  // Get block number from actual network
  const actualBlockNumber = await actualProvider.getBlockNumber();
  console.log(`Actual network block number: ${actualBlockNumber}`);
  
  // Get block number from Hardhat forked network
  const forkedProvider = hre.ethers.provider;
  const forkedBlockNumber = await forkedProvider.getBlockNumber();
  console.log(`Forked network block number: ${forkedBlockNumber}`);
  
  // Compare the difference
  const difference = actualBlockNumber - forkedBlockNumber;
  console.log(`\nDifference: ${difference} blocks`);
  
  if (difference > 0) {
    console.log(`The forked network is ${difference} blocks behind the actual network.`);
  } else if (difference === 0) {
    console.log("Both networks are at the same block!");
  } else {
    console.log(`The forked network is ${Math.abs(difference)} blocks ahead (this shouldn't happen).`);
  }
  
  // Check balances to verify forking
  console.log(`\n--- Checking balance of ${testAddress} ---`);
  
  // Get balance on forked network (should be balance at block 19000000)
  const forkedBalance = await forkedProvider.getBalance(testAddress);
  console.log(`Forked network balance: ${ethers.utils.formatEther(forkedBalance)} ETH`);
  
  // Get the balance at block 19000000 on actual network for comparison
  const historicalBalance = await actualProvider.getBalance(testAddress, 19000000);
  console.log(`Actual network balance at block 19000000: ${ethers.utils.formatEther(historicalBalance)} ETH`);
  
  if (forkedBalance.eq(historicalBalance)) {
    console.log("\n✓ Fork verified! Forked balance matches historical balance at block 19000000");
  } else {
    console.log("\n✗ Fork verification failed! Balances don't match");
  }
}

// Run the comparison
compareNetworks()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });