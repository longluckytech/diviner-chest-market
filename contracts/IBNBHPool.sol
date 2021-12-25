// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

interface IBNBHPool {
  function claimAngle(address account, uint256 amount) external;

  function claimCreed(address account, uint256 amount) external;
}
