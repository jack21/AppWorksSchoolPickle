// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

interface CErc20Delegator is IERC20 {
  function symbol() external view returns (string memory);

  function decimals() external view returns (uint8);

  function balanceOfUnderlying(address owner) external returns (uint);

  function redeemUnderlying(uint redeemAmount) external returns (uint);
}
