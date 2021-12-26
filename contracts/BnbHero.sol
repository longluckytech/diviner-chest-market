// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "./IERC20.sol";
import "./IBNBHCharacter.sol";
import "./HeroLibrary.sol";
import "./Address.sol";
import "./AccessControl.sol";
import "./IERC721Receiver.sol";
import "./ReentrancyGuard.sol";
import "./SafeERC20.sol";

contract BNBHero is AccessControl, IERC721Receiver, ReentrancyGuard {
  using SafeERC20 for IERC20;

  IBNBHCharacter public characters;
  IERC20 public angelToken;
  IERC20 public creedToken;

  struct Quotation {
    uint256 usdToCreateHero;
    uint256 angelToCreateHero;
  }

  mapping(address => uint256[6]) public users; // so luong trung da mua

  uint256 public maxEggCanBuy = 10;

  event UpdatedTokenContract(address tokenAddress);
  event UpdatedCharacterContract(address characterAddress);
  event CreatedHero(address player, uint256 _heroId);

  mapping(address => bool) public bannedList;
  mapping(address => uint256) public chestsOwned; // user => fragments key owned

  uint256 public fragmentsNeedToOpenChest = 10;

  uint256[] public feeToLevelup;

  Quotation[] public quotations;

  address[2] public tokensToCreateHero;

  modifier onlyOwner() {
    require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not admin");
    _;
  }

  constructor(
    IERC20 _angelToken,
    IERC20 _creedToken,
    IBNBHCharacter _character
  ) {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

    angelToken = IERC20(_angelToken);
    creedToken = IERC20(_creedToken);
    characters = _character;
  }

  function setTokensToCreateHero(address[2] memory values) public onlyOwner {
    tokensToCreateHero = values;
  }

  function setMaxEggCanBuy(uint8 maxEgg) external onlyOwner {
    maxEggCanBuy = maxEgg;
  }

  function setAngelTokenContract(address tokenAddress) public onlyOwner {
    angelToken = IERC20(tokenAddress);
    emit UpdatedTokenContract(tokenAddress);
  }

  function setCharacterContract(address characterAddress) public onlyOwner {
    characters = IBNBHCharacter(characterAddress);
    emit UpdatedCharacterContract(characterAddress);
  }

  function random(address user) internal view returns (uint256) {
    return
      uint256(
        keccak256(
          abi.encodePacked(
            user,
            "234324323423",
            block.timestamp,
            block.difficulty
          )
        )
      );
  }

  function createNewHero(uint256 tokenIndex, uint8 eggType) external {
    uint256 length = tokensToCreateHero.length;
    require(tokenIndex < length, "not valid token");

    uint256 seed = random(msg.sender);
    uint256 heroId = characters.mint(msg.sender, seed, eggType);

    uint256 price;

    if (tokenIndex == 0) {
      price = quotations[eggType].angelToCreateHero;
    } else if (tokenIndex == 1) {
      price = quotations[eggType].usdToCreateHero;
    }

    IERC20 token = IERC20(tokensToCreateHero[tokenIndex]);

    require(
      token.balanceOf(msg.sender) >= price,
      "not enough balance create hero"
    );

    token.safeTransferFrom(msg.sender, address(this), price);

    emit CreatedHero(msg.sender, heroId);
  }

  function payForOperation(address payer, uint256 amount) internal {
    angelToken.safeTransferFrom(payer, address(this), amount);
  }

  function onERC721Received(
    address,
    address,
    uint256,
    bytes calldata
  ) external pure override returns (bytes4) {
    return this.onERC721Received.selector;
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

  function emergencyWithdraw() external onlyOwner {}
}
