// SPDX-License-Identifier: Unlicensed

pragma solidity ^0.8.0;
import "./HeroLibrary.sol";
import "./IERC721Enumerable.sol";
import "./ERC721URIStorage.sol";

interface IBNBHCharacter is IERC721Enumerable {
  // function heroes() external view returns (Hero[] memory);
  function mint(
    address minter,
    uint256 seed,
    uint8 eggType
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
}
