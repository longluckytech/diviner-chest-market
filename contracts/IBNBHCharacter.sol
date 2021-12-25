// SPDX-License-Identifier: Unlicensed

pragma solidity ^0.8.0;
import "./HeroLibrary.sol";
import "./IERC721Enumerable.sol";
import "./ERC721URIStorage.sol";

interface IBNBHCharacter is IERC721Enumerable {
  // function heroes() external view returns (Hero[] memory);
  function mint(address minter, uint256 seed) external returns (uint256);

  function fight(
    address player,
    uint256 _attackingHero,
    uint256 round,
    uint256 seed
  )
    external
    returns (
      uint256,
      uint256,
      uint256
    );

  function getHero(uint256 _heroId)
    external
    view
    returns (HeroLibrary.Hero memory);

  function getLevel(uint256 _heroId) external view returns (uint256);

  function getRarity(uint256 _heroId) external view returns (uint256);

  function expediteHero(uint256 _heroId) external;

  function unlockLevel(uint256 _heroId, uint256 seed)
    external
    returns (uint256);

  function useEquipment(uint256 _heroId, uint256 _equipmentId) external;
}
