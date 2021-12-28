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
    uint256 angelToBuy;
    uint256 remainEgg;
  }

  uint8 public maxEggUserCanBuy = 10;

  mapping(address => uint8) public users; // so luong trung da mua

  event UpdatedTokenContract(address tokenAddress);
  event UpdatedCharacterContract(address characterAddress);
  event CreatedHero(address player, uint256 _heroId);

  mapping(uint8 => Egg) public eggs; // egg type => max egg

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

  function setMaxEggUserCanBuy(uint8 value) external onlyOwner {
    maxEggUserCanBuy = value;
  }

  function setEggs(uint8 eggType, uint256[] memory values) public onlyOwner {
    eggs[eggType].angelToBuy = values[0];
    eggs[eggType].remainEgg = values[1];
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

  function buyEgg(uint8 eggType) external {
    require(eggType >= 0 && eggType < 6, "Out of egg type");
    require(
      users[msg.sender] < maxEggUserCanBuy,
      "you have bought the allowed egg"
    );
    require(eggs[eggType].remainEgg > 0, "Out of egg with type");
    users[msg.sender]++;

    uint256 seed = random(msg.sender);
    uint256 heroId = characters.mint(msg.sender, seed, eggType);

    uint256 price = eggs[eggType].angelToBuy;

    require(
      angelToken.balanceOf(msg.sender) >= price,
      "not enough balance create hero"
    );

    angelToken.safeTransferFrom(msg.sender, address(this), price);

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
