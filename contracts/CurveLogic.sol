// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

abstract contract CurveLogic {
    function add_liquidity(
        address curve,
        bytes4 curveFunctionSig,
        uint256 curvePoolSize,
        uint256 curveUnderlyingIndex,
        address underlying
    ) public virtual;
}
