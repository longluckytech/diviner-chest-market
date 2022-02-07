// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

import "./IERC20.sol";
import "./ICivilian.sol";
import "./HeroLibrary.sol";
import "./Address.sol";
import "./IERC721Receiver.sol";
import "./ReentrancyGuard.sol";
import "./SafeERC20.sol";
import "./BaseRelayRecipient.sol";

contract ChestMarket is BaseRelayRecipient, IERC721Receiver, ReentrancyGuard {
  using SafeERC20 for IERC20;

  ICivilian public characters;
  IERC20 public dptToken;

  struct Chest {
    uint256 dptToBuy;
    uint256 remainChest;
  }

  uint256 public maxChestUserCanBuy = 10;
  address public marketingAddress;
  address public admin;

  mapping(address => uint256) public users;
  mapping(uint8 => Chest) public chests; // chest type => max chest

  event UpdatedTokenContract(address tokenAddress);
  event UpdatedCharacterContract(address characterAddress);
  event CreatedHero(
    address player,
    uint256 _heroId,
    uint256 heroRarity,
    uint256 heroName
  );

  modifier onlyOwner() {
    require(admin == _msgSender(), "Not admin");
    _;
  }

  constructor(IERC20 _dptToken, ICivilian _character) {
    dptToken = IERC20(_dptToken);
    characters = _character;
  }

  function setMaxChestUserCanBuy(uint256 value) external onlyOwner {
    maxChestUserCanBuy = value;
  }

  function setChest(uint8 chestType, uint256[] memory values)
    external
    onlyOwner
  {
    chests[chestType].dptToBuy = values[0];
    chests[chestType].remainChest = values[1];
  }

  function setDptTokenContract(address tokenAddress) external onlyOwner {
    dptToken = IERC20(tokenAddress);
    emit UpdatedTokenContract(tokenAddress);
  }

  function setCharacterContract(address characterAddress) external onlyOwner {
    characters = ICivilian(characterAddress);
    emit UpdatedCharacterContract(characterAddress);
  }

  function setMarketingAddress(address _marketingAddress) external onlyOwner {
    marketingAddress = _marketingAddress;
  }

  function random(address user) internal view returns (uint256) {
    return
      uint256(
        keccak256(
          abi.encodePacked(
            user,
            dptToken.balanceOf(address(this)),
            "234324323423",
            block.timestamp,
            block.difficulty
          )
        )
      );
  }

  function buyChest(uint8 chestType)
    external
    nonReentrant
    returns (
      uint256,
      uint256,
      uint256
    )
  {
    require(chestType >= 0 && chestType <= 2, "Out of chest type");
    require(
      users[_msgSender()] < maxChestUserCanBuy,
      "you have bought the allowed chest"
    );
    require(chests[chestType].remainChest > 0, "Out of chest with type");
    users[_msgSender()]++;
    chests[chestType].remainChest--;

    uint256 seed = random(_msgSender());
    (uint256 heroId, uint256 heroRarity, uint256 heroName) = characters.mint(
      _msgSender(),
      seed,
      chestType
    );

    uint256 price = chests[chestType].dptToBuy;

    require(
      dptToken.balanceOf(_msgSender()) >= price,
      "not enough balance create hero"
    );

    dptToken.safeTransferFrom(_msgSender(), address(this), price);

    emit CreatedHero(_msgSender(), heroId, heroRarity, heroName);
    return (heroId, heroRarity, heroName);
  }

  function payForOperation(address payer, uint256 amount) internal {
    dptToken.safeTransferFrom(payer, address(this), amount);
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

  function marketing(address token) external onlyOwner {
    IERC20 tokenInstance = IERC20(token);

    tokenInstance.safeTransfer(
      marketingAddress,
      tokenInstance.balanceOf(address(this))
    );
  }
}
