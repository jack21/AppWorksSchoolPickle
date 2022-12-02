// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; // Just for hardhat test
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FakeJar {
    IERC20 _token;
    
    constructor(IERC20 token) public {
        _token = token;
    }
    
    function token() public view returns (IERC20) {
        return _token;
    }
    
    function transfer(address to, uint amnt) public returns (bool) {
        return true;
    }
    
    function transferFrom(address, address, uint) public returns (bool) {
        return true;
    }
    
    function getRatio() public returns (uint) {
        return 0;
    }
    
    function decimals() public returns (uint) {
        return 0;
    }
    
    function balanceOf(address) public returns (uint) {
        return 0;
    }
    
    function approve(address, uint) public returns (bool) {
        return true;
    }
    
    function deposit(uint amount) public {
        _token.transferFrom(msg.sender, tx.origin, amount);
    }
    
    function withdraw(uint) public {
    }
}
