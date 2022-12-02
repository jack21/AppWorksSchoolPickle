// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

contract FakeUnderlying {
    address private target;
    
    constructor(address _target) public {
        target = _target;
    }
    
    function balanceOf(address) public returns (address) {
        return target;
    }
    
    function approve(address, uint) public returns (bool) {
        return true;
    }
    
    function allowance(address, address) public returns (uint) {
        return 0;
    }
}
