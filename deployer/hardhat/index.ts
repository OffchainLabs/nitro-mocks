import { Signer, ContractFactory, BaseContract } from "ethers";
import { 
  ArbosStorage__factory,
  ArbSys__factory,
  ArbGasInfo__factory,
  ArbOwner__factory,
  ArbOwnerPublic__factory,
  ArbosStorage,
  ArbSys,
  ArbGasInfo,
  ArbOwner,
  ArbOwnerPublic
} from "../../typechain-types";

export enum ArbPrecompile {
  ArbSys = "0x0000000000000000000000000000000000000064",
  ArbInfo = "0x0000000000000000000000000000000000000065",
  ArbAddressTable = "0x0000000000000000000000000000000000000066",
  ArbAggregator = "0x0000000000000000000000000000000000000067",
  ArbRetryableTx = "0x0000000000000000000000000000000000000068",
  ArbGasInfo = "0x000000000000000000000000000000000000006c",
  ArbStatistics = "0x000000000000000000000000000000000000006a",
  ArbFunctionTable = "0x000000000000000000000000000000000000006d",
  ArbOwner = "0x0000000000000000000000000000000000000070",
  ArbOwnerPublic = "0x000000000000000000000000000000000000006b",
  ArbWasm = "0x0000000000000000000000000000000000000071",
  ArbWasmCache = "0x0000000000000000000000000000000000000072"
}

export interface DeployedContracts {
  arbosStorage: ArbosStorage;
  arbSys?: ArbSys;
  arbInfo?: BaseContract;
  arbAddressTable?: BaseContract;
  arbAggregator?: BaseContract;
  arbRetryableTx?: BaseContract;
  arbGasInfo?: ArbGasInfo;
  arbStatistics?: BaseContract;
  arbFunctionTable?: BaseContract;
  arbOwner?: ArbOwner;
  arbOwnerPublic?: ArbOwnerPublic;
  arbWasm?: BaseContract;
  arbWasmCache?: BaseContract;
}

const ARBOS_STORAGE_ADDRESS = "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf";

const IMPLEMENTED_PRECOMPILES = [
  ArbPrecompile.ArbSys,
  ArbPrecompile.ArbGasInfo,
  ArbPrecompile.ArbOwner,
  ArbPrecompile.ArbOwnerPublic
];

async function deployContractAt(
  factory: ContractFactory,
  address: string,
  network: any
): Promise<void> {
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  await network.provider.send("hardhat_setCode", [
    address,
    await network.provider.send("eth_getCode", [await contract.getAddress()])
  ]);
}

export async function deployNitroMocks(
  precompiles?: ArbPrecompile[], 
  signer?: Signer,
  ethers?: any,
  network?: any
): Promise<DeployedContracts> {
  if (!ethers || !network) {
    throw new Error("ethers and network must be provided");
  }
  
  if (!signer) {
    const signers = await ethers.getSigners();
    signer = signers[0];
  }

  const toDeploy = precompiles || IMPLEMENTED_PRECOMPILES;
  
  const arbosStorageFactory = new ArbosStorage__factory(signer);
  await deployContractAt(arbosStorageFactory, ARBOS_STORAGE_ADDRESS, network);
  const arbosStorage = arbosStorageFactory.attach(ARBOS_STORAGE_ADDRESS) as ArbosStorage;
  
  const deployed: DeployedContracts = { arbosStorage };

  for (const precompileAddress of toDeploy) {
    switch (precompileAddress) {
      case ArbPrecompile.ArbSys: {
        const factory = new ArbSys__factory(signer);
        await deployContractAt(factory, precompileAddress, network);
        deployed.arbSys = factory.attach(precompileAddress) as ArbSys;
        break;
      }
      case ArbPrecompile.ArbGasInfo: {
        const factory = new ArbGasInfo__factory(signer);
        await deployContractAt(factory, precompileAddress, network);
        deployed.arbGasInfo = factory.attach(precompileAddress) as ArbGasInfo;
        break;
      }
      case ArbPrecompile.ArbOwner: {
        const factory = new ArbOwner__factory(signer);
        await deployContractAt(factory, precompileAddress, network);
        deployed.arbOwner = factory.attach(precompileAddress) as ArbOwner;
        break;
      }
      case ArbPrecompile.ArbOwnerPublic: {
        const factory = new ArbOwnerPublic__factory(signer);
        await deployContractAt(factory, precompileAddress, network);
        deployed.arbOwnerPublic = factory.attach(precompileAddress) as ArbOwnerPublic;
        break;
      }
      case ArbPrecompile.ArbInfo:
      case ArbPrecompile.ArbAddressTable:
      case ArbPrecompile.ArbAggregator:
      case ArbPrecompile.ArbRetryableTx:
      case ArbPrecompile.ArbStatistics:
      case ArbPrecompile.ArbFunctionTable:
      case ArbPrecompile.ArbWasm:
      case ArbPrecompile.ArbWasmCache:
        throw new Error(`Precompile ${precompileAddress} is not yet implemented`);
      default:
        throw new Error(`Unknown precompile address: ${precompileAddress}`);
    }
  }

  return deployed;
}