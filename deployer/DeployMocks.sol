// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/ArbosStorage.sol";
import "../contracts/ArbSys.sol";
import "../contracts/ArbGasInfo.sol";
import "../contracts/ArbOwner.sol";
import "../contracts/ArbOwnerPublic.sol";

interface IVm {
    function etch(address target, bytes calldata bytecode) external;
    function getDeployedCode(string calldata artifactPath) external view returns (bytes memory);
}

library DeployMocks {
    IVm constant vm = IVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    
    address constant ARBOS_STORAGE_ADDRESS = 0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf;
    
    address constant ARB_SYS = 0x0000000000000000000000000000000000000064;
    address constant ARB_INFO = 0x0000000000000000000000000000000000000065;
    address constant ARB_ADDRESS_TABLE = 0x0000000000000000000000000000000000000066;
    address constant ARB_BLS = 0x0000000000000000000000000000000000000067;
    address constant ARB_FUNCTION_TABLE = 0x0000000000000000000000000000000000000068;
    address constant ARBOS_TEST = 0x0000000000000000000000000000000000000069;
    address constant ARBOS_ACTS = 0x000000000000000000000000000000000000006a;
    address constant ARB_OWNER_PUBLIC = 0x000000000000000000000000000000000000006b;
    address constant ARB_GAS_INFO = 0x000000000000000000000000000000000000006C;
    address constant ARB_AGGREGATOR = 0x000000000000000000000000000000000000006D;
    address constant ARB_RETRYABLE_TX = 0x000000000000000000000000000000000000006E;
    address constant ARB_STATISTICS = 0x000000000000000000000000000000000000006F;
    address constant ARB_OWNER = 0x0000000000000000000000000000000000000070;
    address constant ARB_WASM = 0x0000000000000000000000000000000000000071;
    address constant ARB_WASM_CACHE = 0x0000000000000000000000000000000000000072;
    address constant ARB_NATIVE_TOKEN_MANAGER = 0x0000000000000000000000000000000000000073;
    address constant ARB_FILTERED_TRANSACTIONS_MANAGER = 0x0000000000000000000000000000000000000074;
    address constant NODE_INTERFACE = 0x00000000000000000000000000000000000000C8;
    address constant ARB_DEBUG = 0x00000000000000000000000000000000000000ff;
    
    
    function deployNitroMocks() internal {
        address[] memory precompiles = new address[](4);
        precompiles[0] = ARB_SYS;
        precompiles[1] = ARB_GAS_INFO;
        precompiles[2] = ARB_OWNER;
        precompiles[3] = ARB_OWNER_PUBLIC;
        
        deployNitroMocks(precompiles);
    }
    
    // ArbOwner exceeds the EIP-170 size limit and cannot be deployed, so runtime bytecode comes from the artifacts.
    function deployNitroMocks(address[] memory precompiles) internal {
        vm.etch(ARBOS_STORAGE_ADDRESS, vm.getDeployedCode("contracts/ArbosStorage.sol:ArbosStorage"));

        for (uint256 i = 0; i < precompiles.length; i++) {
            address precompileAddress = precompiles[i];

            if (precompileAddress == ARB_SYS) {
                vm.etch(precompileAddress, vm.getDeployedCode("contracts/ArbSys.sol:ArbSys"));
            } else if (precompileAddress == ARB_GAS_INFO) {
                vm.etch(precompileAddress, vm.getDeployedCode("contracts/ArbGasInfo.sol:ArbGasInfo"));
            } else if (precompileAddress == ARB_OWNER) {
                vm.etch(precompileAddress, vm.getDeployedCode("contracts/ArbOwner.sol:ArbOwner"));
            } else if (precompileAddress == ARB_OWNER_PUBLIC) {
                vm.etch(precompileAddress, vm.getDeployedCode("contracts/ArbOwnerPublic.sol:ArbOwnerPublic"));
            } else {
                revert("Precompile not yet implemented");
            }
        }
    }
}