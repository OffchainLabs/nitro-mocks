// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ArbosStorage} from "../ArbosStorage.sol";

library ArbosState {
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
}