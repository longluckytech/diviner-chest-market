// SPDX-License-Identifier: Unlicensed

pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "./Strings.sol";
import "./HeroLibrary.sol";
import "./ERC721URIStorage.sol";
import "./AccessControl.sol";
import "./ERC721Enumerable.sol";

contract BNBHCharacter is AccessControl, ERC721, ERC721URIStorage {
  using Strings for uint256;
  bytes32 public constant GAME_ADMIN = keccak256("GAME_ADMIN");
  bytes32 public constant NO_OWNED_LIMIT = keccak256("NO_OWNED_LIMIT");

  uint8[4] public heroTypeLength; // amount of hero in same rarities

  mapping(uint8 => uint8[]) public randomTable; // 6 type egg, 4 rarity
  // Follow pattern ERC721 Enumerable
  HeroLibrary.Hero[] private _heroes;
  mapping(uint256 => uint256) private _heroesIndex;
  mapping(address => uint256[]) private _ownedTokens;
  mapping(uint256 => uint256) private _ownedTokensIndex;
  uint256 public stateLastTokenId = 1;

  string private baseURI;

  constructor() ERC721("AngelCharacter", "CHAR") {
    HeroLibrary.Hero memory fillGapHero = HeroLibrary.Hero(0, 0, 0);

    _heroes.push(fillGapHero);

    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setRoleAdmin(GAME_ADMIN, DEFAULT_ADMIN_ROLE);
  }

  modifier onlyOwner() {
    require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not admin");
    _;
  }

  modifier onlyOwnerOf(address account, uint256 _heroId) {
    require(ownerOf(_heroId) == account, "Must be owner of hero to battle");
    _;
  }

  modifier restricted() {
    _restricted();
    _;
  }

  function _restricted() internal view {
    require(hasRole(GAME_ADMIN, msg.sender), "Does not have role");
  }

  function setGameAdmin(address _gameAdmin) external onlyOwner {
    _grantRole(GAME_ADMIN, _gameAdmin);
  }

  function setRandomTableWithEggType(uint8 eggType, uint8[] memory values)
    external
    onlyOwner
  {
    randomTable[eggType] = values;
  }

  function setHeroTypeLength(uint8 heroType, uint8 _value) external onlyOwner {
    heroTypeLength[heroType] = _value;
  }

  function getRandomTableWithEggType(uint8 eggType)
    external
    view
    returns (uint8[] memory)
  {
    return randomTable[eggType];
  }

  function tokensOfOwner(address owner)
    external
    view
    returns (uint256[] memory)
  {
    return _ownedTokens[owner];
  }

  function tokenOfOwnerByIndex(address owner, uint256 index)
    external
    view
    returns (uint256)
  {
    require(
      index < balanceOf(owner),
      "ERC721Enumerable: owner index out of bounds"
    );
    return _ownedTokens[owner][index];
  }

  function totalSupply() public view returns (uint256) {
    return _heroes.length;
  }

  function tokenByIndex(uint256 index)
    external
    view
    returns (HeroLibrary.Hero memory)
  {
    require(
      index < totalSupply(),
      "ERC721Enumerable: global index out of bounds"
    );
    return _heroes[index];
  }

  function addHero(uint256 rarity) external onlyOwner {
    heroTypeLength[rarity]++;
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal override {
    super._beforeTokenTransfer(from, to, tokenId);

    if (from == address(0)) {
      _addHeroToAllHeroesEnumeration(tokenId);
    } else if (from != to) {
      _removeTokenFromOwnerEnumeration(from, tokenId);
    }
    if (to == address(0)) {
      _removeHeroFromAllHeroesEnumeration(tokenId);
    } else if (to != from) {
      _addTokenToOwnerEnumeration(to, tokenId);
    }
  }

  /**
   * @dev Private function to add a token to this extension's ownership-tracking data structures.
   * @param to address representing the new owner of the given token ID
   * @param tokenId uint256 ID of the token to be added to the tokens list of the given address
   */
  function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
    uint256 length = ERC721.balanceOf(to);
    _ownedTokens[to].push(tokenId);
    _ownedTokensIndex[tokenId] = length;
  }

  /**
   * @dev Private function to add a token to this extension's token tracking data structures.
   * @param tokenId uint256 ID of the token to be added to the tokens list
   */
  function _addHeroToAllHeroesEnumeration(uint256 tokenId) private {
    _heroesIndex[tokenId] = _heroes.length;
  }

  function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId)
    private
  {
    uint256 lastTokenIndex = ERC721.balanceOf(from) - 1;
    uint256 tokenIndex = _ownedTokensIndex[tokenId];

    // When the token to delete is the last token, the swap operation is unnecessary
    if (tokenIndex != lastTokenIndex) {
      uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];

      _ownedTokens[from][tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
      _ownedTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index
    }

    // This also deletes the contents at the last position of the array
    delete _ownedTokensIndex[tokenId];
    _ownedTokens[from].pop();
  }

  function _removeHeroFromAllHeroesEnumeration(uint256 tokenId) private {
    // To prevent a gap in the tokens array, we store the last token in the index of the token to delete, and
    // then delete the last slot (swap and pop).

    uint256 lastTokenIndex = _heroes.length - 1;
    uint256 tokenIndex = _heroesIndex[tokenId];

    // When the token to delete is the last token, the swap operation is unnecessary. However, since this occurs so
    // rarely (when the last minted token is burnt) that we still do the swap here to avoid the gas cost of adding
    // an 'if' statement (like in _removeTokenFromOwnerEnumeration)
    HeroLibrary.Hero memory lastHero = _heroes[lastTokenIndex];

    _heroes[tokenIndex] = lastHero; // Move the last token to the slot of the to-delete token
    _heroesIndex[lastHero.tokenId] = tokenIndex; // Update the moved token's index

    // This also deletes the contents at the last position of the array
    delete _heroesIndex[tokenId];
    _heroes.pop();
  }

  function getHero(uint256 _heroId)
    external
    view
    returns (HeroLibrary.Hero memory)
  {
    uint256 tokenIndex = _heroesIndex[_heroId];
    require(tokenIndex != 0, "Does not exist hero");
    HeroLibrary.Hero memory hero = _heroes[tokenIndex];

    return hero;
  }

  function mint(
    address minter,
    uint256 seed,
    uint8 eggType
  )
    external
    restricted
    returns (
      uint256,
      uint256,
      uint256
    )
  {
    uint256 heroRarity = randomTable[eggType][seed % 100];
    uint256 heroName = seed % heroTypeLength[heroRarity];

    _safeMint(minter, stateLastTokenId);
    _heroes.push(HeroLibrary.Hero(stateLastTokenId, heroRarity, heroName));
    stateLastTokenId++;

    return (stateLastTokenId, heroRarity, heroName);
  }

  function burn(uint256 tokenId) external restricted {
    _burn(tokenId);
  }

  function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
    super._burn(tokenId);
  }

  function tokenURI(uint256 tokenId)
    public
    view
    override(ERC721, ERC721URIStorage)
    returns (string memory)
  {
    require(_exists(tokenId), "Cannot query non-existent token");

    return string(abi.encodePacked(_baseURI(), tokenId.toString()));
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, AccessControl)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }

  function setBaseURI(string memory uri) public onlyOwner {
    baseURI = uri;
  }

  function _baseURI() internal view override returns (string memory) {
    return baseURI;
  }

  function isContract(address account) internal view returns (bool) {
    // This method relies on extcodesize, which returns 0 for contracts in
    // construction, since the code is only stored at the end of the
    // constructor execution.

    uint256 size;
    assembly {
      size := extcodesize(account)
    }
    return size > 0;
  }
}
