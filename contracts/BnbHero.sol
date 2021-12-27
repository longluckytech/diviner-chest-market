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

  struct Egg {
    uint256 gemToBuy;
    uint256 angelToBuy;
    uint256 maxEggCanBuy;
  }

  mapping(address => uint256[6]) public users; // so luong trung da mua

  event UpdatedTokenContract(address tokenAddress);
  event UpdatedCharacterContract(address characterAddress);
  event CreatedHero(address player, uint256 _heroId);

  mapping(uint8 => Egg) public eggs; // egg type => max egg

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

  function setTokensToBuy(address[2] memory values) public onlyOwner {
    tokensToCreateHero = values;
  }

  function setEggs(uint8 eggType, uint256[] memory values) public onlyOwner {
    eggs[eggType].angelToBuy = values[0];
    eggs[eggType].gemToBuy = values[1];
    eggs[eggType].maxEggCanBuy = values[2];
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

  function buyEgg(uint256 tokenIndex, uint8 eggType) external {
    uint256 length = tokensToCreateHero.length;
    require(tokenIndex < length, "not valid token");
    require(eggType >= 0 && eggType < 6, "Out of egg type");
    require(
      users[msg.sender][eggType] < eggs[eggType].maxEggCanBuy,
      "you have bought the allowed egg"
    );
    users[msg.sender][eggType]++;

    uint256 seed = random(msg.sender);
    uint256 heroId = characters.mint(msg.sender, seed, eggType);

    uint256 price;

    if (tokenIndex == 0) {
      price = eggs[eggType].angelToBuy;
    } else if (tokenIndex == 1) {
      price = eggs[eggType].gemToBuy;
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
