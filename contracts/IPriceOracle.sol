// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

interface IPriceOracle {
  // Views
  function getCharacterPrice() external view returns (uint256);

  function getEquipmentPrice() external view returns (uint256);

  function getRepairEquipmentPrice(uint256 percentNeedToRepair)
    external
    view
    returns (uint256);

  function getExpeditePrice() external view returns (uint256);

  function getTokenPrice() external view returns (uint256);

  function getUnlockLevelPrice(uint256 level)
    external
    view
    returns (uint256, uint256);

  function getCreedToFightInRound(uint256 roundId)
    external
    view
    returns (uint256);
}
