import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-preprocessor";
import { getTestNodeRpcUrl } from "./test/utils/utils";
import "./deployer/hardhat/tasks";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: false,
            runs: 200
          }
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: {
      forking: {
        url: getTestNodeRpcUrl()
      },
      chainId: 412346,
      allowBlocksWithSameTimestamp: true
    },
    localhost: {
      url: "http://127.0.0.1:8770"
    }
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
    alwaysGenerateOverloads: false,
    dontOverrideCompile: false
  }
};

export default config;
