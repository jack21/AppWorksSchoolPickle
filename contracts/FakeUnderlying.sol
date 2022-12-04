// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import 'hardhat/console.sol';

contract FakeUnderlying {
  address private target;

  constructor(address _target) {
    target = _target;
  }

  function balanceOf(address owner) external view returns (uint result) {
    result = 532236852761844906399596241454107344303261890115;
    console.log('FakeUnderlying.balanceOf(%s) -> %s', owner, result);
    return result;
  }

  function approve(address spender, uint amount) public view returns (bool) {
    console.log('FakeUnderlying.approve(%s, %s) -> true', spender, amount);
    return true;
  }

  function allowance(address owner, address spender) public view returns (uint) {
    console.log('FakeUnderlying.allowance(%s, %s) -> 0', owner, spender);
    return 0;
  }
}
