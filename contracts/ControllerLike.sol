// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

abstract contract ControllerLike {
    function swapExactJarForJar (
        address _fromJar, // From which Jar
        address _toJar, // To which Jar
        uint256 _fromJarAmount, // How much jar tokens to swap
        uint256 _toJarMinAmount, // How much jar tokens you'd like at a minimum
        address[] calldata _targets,
        bytes[] calldata _data
    ) external virtual;
}
