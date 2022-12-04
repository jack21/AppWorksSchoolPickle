// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol'; // Just for hardhat test
import './IJar.sol';
import 'hardhat/console.sol';

contract FakeJar is IJar {
  IERC20 _token;

  constructor(IERC20 token) {
    _token = token;
  }

  function token() external view returns (address) {
    console.log('FakeJar.token() -> %s', address(_token));
    return address(_token);
  }

  function transfer(address to, uint amount) external view returns (bool) {
    console.log('FakeJar.transfer(%s, %s) -> true', to, amount);
    return true;
  }

  function transferFrom(address from, address to, uint amount) external view returns (bool) {
    console.log('FakeJar.transferFrom(%s, %s, %s) -> true', from, to, amount);
    return true;
  }

  function getRatio() external view returns (uint) {
    console.log('FakeJar.getRatio() -> 1');
    return 1;
  }

  function decimals() external view returns (uint8) {
    console.log('FakeJar.decimals() -> 0');
    return 0;
  }

  function balanceOf(address owner) external view returns (uint) {
    console.log('FakeJar.balanceOf(%s) -> 0', owner);
    return 0;
  }

  function approve(address spender, uint amount) external view returns (bool) {
    console.log('FakeJar.approve(%s, %s) -> true', spender, amount);
    return true;
  }

  function deposit(uint amount) external {
    console.log('FakeJar.deposit(%s)', amount);
    _token.transferFrom(msg.sender, tx.origin, amount);
  }

  function withdraw(uint amount) external view {
    console.log('FakeJar.withdraw(%s)', amount);
  }

  function earn() external view {
    console.log('FakeJar.earn()');
  }

  function totalSupply() external view override returns (uint256) {
    console.log('FakeJar.totalSupply() -> 0');
    return 0;
  }

  function allowance(address owner, address spender) external view override returns (uint256) {
    console.log('FakeJar.allowance(%s, %s) -> 0', owner, spender);
    return 0;
  }

  function claimInsurance() external view override {
    console.log('FakeJar.claimInsurance()');
  }
}
