// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TestStorage {
    uint256 public value;
    mapping(address => uint256) public balances;

    function setValue(uint256 _value) public {
        value = _value;
    }

    function readAndWrite() public {
        uint256 temp = value;
        value = temp + 1;
    }

    function setBalance(address user, uint256 amount) public {
        balances[user] = amount;
    }

    function multipleOperations() public {
        uint256 temp = value;
        value = temp + 10;
        balances[msg.sender] = temp;
    }

    function getValueAndBalance(address user) public view returns (uint256, uint256) {
        return (value, balances[user]);
    }
}
