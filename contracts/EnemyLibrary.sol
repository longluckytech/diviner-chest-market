// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

library EnemyLibrary {
  struct Enemy {
    uint256 attack;
    uint256 defense;
    uint256 speed;
    uint256 requiredLevel;
    uint256 bonusRate;
    uint256 angelRewards;
    uint256 creedRewards;
    uint256 keyRewards;
  }
}
