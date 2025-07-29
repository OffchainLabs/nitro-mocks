// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";

struct Storage {
    address addr;
    bytes key;
}

library ArbosState {
    address internal constant ARBOS_STORAGE_ADDRESS = 0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf;
    bytes internal constant ROOT_STORAGE_KEY = hex"";
    
    uint256 internal constant VERSION_OFFSET = 0;
    uint256 internal constant UPGRADE_VERSION_OFFSET = 1;
    uint256 internal constant UPGRADE_TIMESTAMP_OFFSET = 2;
    uint256 internal constant NETWORK_FEE_ACCOUNT_OFFSET = 3;
    uint256 internal constant CHAIN_ID_OFFSET = 4;
    uint256 internal constant GENESIS_BLOCK_NUM_OFFSET = 5;
    uint256 internal constant INFRA_FEE_ACCOUNT_OFFSET = 6;
    uint256 internal constant BROTLI_COMPRESSION_LEVEL_OFFSET = 7;
    uint256 internal constant NATIVE_TOKEN_ENABLED_TIME_OFFSET = 8;
    
    function networkFeeAccount() internal view returns (address) {
        return ArbosStorage(ARBOS_STORAGE_ADDRESS).getAddr(
            ROOT_STORAGE_KEY,
            NETWORK_FEE_ACCOUNT_OFFSET
        );
    }
    
    function setNetworkFeeAccount(address account) internal {
        ArbosStorage(ARBOS_STORAGE_ADDRESS).setAddr(
            ROOT_STORAGE_KEY,
            NETWORK_FEE_ACCOUNT_OFFSET,
            account
        );
    }
    
    function infraFeeAccount() internal view returns (address) {
        return ArbosStorage(ARBOS_STORAGE_ADDRESS).getAddr(
            ROOT_STORAGE_KEY,
            INFRA_FEE_ACCOUNT_OFFSET
        );
    }
    
    function setInfraFeeAccount(address account) internal {
        ArbosStorage(ARBOS_STORAGE_ADDRESS).setAddr(
            ROOT_STORAGE_KEY,
            INFRA_FEE_ACCOUNT_OFFSET,
            account
        );
    }
    
    function brotliCompressionLevel() internal view returns (uint64) {
        return ArbosStorage(ARBOS_STORAGE_ADDRESS).getUint64(
            ROOT_STORAGE_KEY,
            BROTLI_COMPRESSION_LEVEL_OFFSET
        );
    }
    
    function setBrotliCompressionLevel(uint64 level) internal {
        ArbosStorage(ARBOS_STORAGE_ADDRESS).setUint64(
            ROOT_STORAGE_KEY,
            BROTLI_COMPRESSION_LEVEL_OFFSET,
            level
        );
    }
    
    function getScheduledUpgrade() internal view returns (uint64 version, uint64 timestamp) {
        version = ArbosStorage(ARBOS_STORAGE_ADDRESS).getUint64(
            ROOT_STORAGE_KEY,
            UPGRADE_VERSION_OFFSET
        );
        timestamp = ArbosStorage(ARBOS_STORAGE_ADDRESS).getUint64(
            ROOT_STORAGE_KEY,
            UPGRADE_TIMESTAMP_OFFSET
        );
    }

    bytes internal constant L1_PRICING_SUBSTORAGE = hex"00";
    bytes internal constant L2_PRICING_SUBSTORAGE = hex"01";
    bytes internal constant RETRYABLES_SUBSTORAGE = hex"02";
    bytes internal constant ADDRESS_TABLE_SUBSTORAGE = hex"03";
    bytes internal constant CHAIN_OWNER_SUBSTORAGE = hex"04";
    bytes internal constant SEND_MERKLE_SUBSTORAGE = hex"05";
    bytes internal constant BLOCKHASHES_SUBSTORAGE = hex"06";
    bytes internal constant CHAIN_CONFIG_SUBSTORAGE = hex"07";
    bytes internal constant PROGRAMS_SUBSTORAGE = hex"08";
    bytes internal constant FEATURES_SUBSTORAGE = hex"09";
    bytes internal constant NATIVE_TOKEN_OWNER_SUBSTORAGE = hex"0a";
    
    function ChainOwners() internal pure returns (Storage memory) {
        bytes memory key = ArbosStorage(ARBOS_STORAGE_ADDRESS).openSubStorage(
            ROOT_STORAGE_KEY,
            CHAIN_OWNER_SUBSTORAGE
        );
        return Storage(ARBOS_STORAGE_ADDRESS, key);
    }
    
    function L2PricingState() internal pure returns (Storage memory) {
        bytes memory key = ArbosStorage(ARBOS_STORAGE_ADDRESS).openSubStorage(
            ROOT_STORAGE_KEY,
            L2_PRICING_SUBSTORAGE
        );
        return Storage(ARBOS_STORAGE_ADDRESS, key);
    }
    
    function L1PricingState() internal pure returns (Storage memory) {
        bytes memory key = ArbosStorage(ARBOS_STORAGE_ADDRESS).openSubStorage(
            ROOT_STORAGE_KEY,
            L1_PRICING_SUBSTORAGE
        );
        return Storage(ARBOS_STORAGE_ADDRESS, key);
    }
}