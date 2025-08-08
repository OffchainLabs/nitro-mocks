// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../contracts/ArbosStorage.sol";
import "../../contracts/ArbSys.sol";
import "../../contracts/ArbGasInfo.sol";
import "../../contracts/ArbOwner.sol";
import "../../contracts/ArbOwnerPublic.sol";

interface IVm {
    function etch(address target, bytes calldata bytecode) external;
}

library DeployMocks {
    IVm constant vm = IVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    
    address constant ARBOS_STORAGE_ADDRESS = 0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf;
    
    enum ArbPrecompile {
        ArbSys,
        ArbInfo,
        ArbAddressTable,
        ArbBLS,
        ArbFunctionTable,
        ArbosTest,
        ArbosActs,
        ArbOwnerPublic,
        ArbGasInfo,
        ArbAggregator,
        ArbRetryableTx,
        ArbStatistics,
        ArbOwner,
        ArbWasm,
        ArbWasmCache,
        NodeInterface,
        ArbNativeTokenManager,
        ArbDebug
    }
    
    function getPrecompileAddress(ArbPrecompile precompile) internal pure returns (address) {
        if (precompile == ArbPrecompile.ArbSys) return 0x0000000000000000000000000000000000000064;
        if (precompile == ArbPrecompile.ArbInfo) return 0x0000000000000000000000000000000000000065;
        if (precompile == ArbPrecompile.ArbAddressTable) return 0x0000000000000000000000000000000000000066;
        if (precompile == ArbPrecompile.ArbBLS) return 0x0000000000000000000000000000000000000067;
        if (precompile == ArbPrecompile.ArbFunctionTable) return 0x0000000000000000000000000000000000000068;
        if (precompile == ArbPrecompile.ArbosTest) return 0x0000000000000000000000000000000000000069;
        if (precompile == ArbPrecompile.ArbosActs) return 0x000000000000000000000000000000000000006a;
        if (precompile == ArbPrecompile.ArbOwnerPublic) return 0x000000000000000000000000000000000000006b;
        if (precompile == ArbPrecompile.ArbGasInfo) return 0x000000000000000000000000000000000000006C;
        if (precompile == ArbPrecompile.ArbAggregator) return 0x00000000000000000000000000000000000000D3;
        if (precompile == ArbPrecompile.ArbRetryableTx) return 0x000000000000000000000000000000000000006E;
        if (precompile == ArbPrecompile.ArbStatistics) return 0x000000000000000000000000000000000000006F;
        if (precompile == ArbPrecompile.ArbOwner) return 0x0000000000000000000000000000000000000070;
        if (precompile == ArbPrecompile.ArbWasm) return 0x0000000000000000000000000000000000000071;
        if (precompile == ArbPrecompile.ArbWasmCache) return 0x0000000000000000000000000000000000000072;
        if (precompile == ArbPrecompile.NodeInterface) return 0x00000000000000000000000000000000000000C8;
        if (precompile == ArbPrecompile.ArbNativeTokenManager) return 0x00000000000000000000000000000000000000CE;
        if (precompile == ArbPrecompile.ArbDebug) return 0x00000000000000000000000000000000000000ff;
        revert("Unknown precompile");
    }
    
    function deployContractAt(bytes memory bytecode, address targetAddress) private {
        vm.etch(targetAddress, bytecode);
    }
    
    function deployNitroMocks() internal {
        ArbPrecompile[] memory precompiles = new ArbPrecompile[](4);
        precompiles[0] = ArbPrecompile.ArbSys;
        precompiles[1] = ArbPrecompile.ArbGasInfo;
        precompiles[2] = ArbPrecompile.ArbOwner;
        precompiles[3] = ArbPrecompile.ArbOwnerPublic;
        
        deployNitroMocks(precompiles);
    }
    
    function deployNitroMocks(ArbPrecompile[] memory precompiles) internal {
        // Deploy ArbosStorage
        ArbosStorage arbosStorage = new ArbosStorage();
        deployContractAt(address(arbosStorage).code, ARBOS_STORAGE_ADDRESS);
        
        // Deploy each requested precompile
        for (uint256 i = 0; i < precompiles.length; i++) {
            ArbPrecompile precompile = precompiles[i];
            address precompileAddress = getPrecompileAddress(precompile);
            
            if (precompile == ArbPrecompile.ArbSys) {
                ArbSys arbSys = new ArbSys();
                deployContractAt(address(arbSys).code, precompileAddress);
            } else if (precompile == ArbPrecompile.ArbGasInfo) {
                ArbGasInfo arbGasInfo = new ArbGasInfo();
                deployContractAt(address(arbGasInfo).code, precompileAddress);
            } else if (precompile == ArbPrecompile.ArbOwner) {
                ArbOwner arbOwner = new ArbOwner();
                deployContractAt(address(arbOwner).code, precompileAddress);
            } else if (precompile == ArbPrecompile.ArbOwnerPublic) {
                ArbOwnerPublic arbOwnerPublic = new ArbOwnerPublic();
                deployContractAt(address(arbOwnerPublic).code, precompileAddress);
            } else {
                revert("Precompile not yet implemented");
            }
        }
    }
}

// Contract wrapper for script usage
contract DeployMocksScript {
    function run() external {
        DeployMocks.deployNitroMocks();
    }
    
    function runWithPrecompiles(DeployMocks.ArbPrecompile[] memory precompiles) external {
        DeployMocks.deployNitroMocks(precompiles);
    }
}