// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "./IERC20.sol";
import "./IBNBHCharacter.sol";
import "./IPancakeswapV2Factory.sol";
import "./IPancakeswapV2Router02.sol";
import "./HeroLibrary.sol";
import "./IPriceOracle.sol";
import "./IRandoms.sol";
import "./Address.sol";
import "./AccessControl.sol";
import "./IERC721Receiver.sol";
import "./ReentrancyGuard.sol";
import "./SafeERC20.sol";

contract BNBHero is AccessControl, IERC721Receiver, ReentrancyGuard {
  using SafeERC20 for IERC20;

  IRandoms public randoms;
  IBNBHCharacter public characters;
  IERC20 public angelToken;
  IERC20 public creedToken;

  IPriceOracle public priceOracle;

  struct User {
    uint256 currentRound;
    uint256 angelReward;
    uint256 creedReward;
    uint256 keyReward;
  }

  struct Quotation {
    uint256 usdToCreateHero;
    uint256 angelToCreateHero;
  }

  address public burnAddress;

  mapping(address => User) public users;

  event UpdatedTokenContract(address tokenAddress);
  event UpdatedCharacterContract(address characterAddress);
  event UpdatedBNBPoolAddress(address account);
  event UpdatedFirstLockTime(uint256 lockTime);
  event Fight(
    address player,
    uint256 _attackingHero,
    uint256 round,
    uint256 angleReward,
    uint256 creedReward,
    uint256 keyReward
  );
  event ClaimedRewards(address player, uint256 angelReward, uint256 creed);
  event ExpeditedHero(address player, uint256 _heroId);
  event CreatedHero(address player, uint256 _heroId);
  event UpdatedBurnAddress(address account);
  event CreatedAndSendPrizeHero(address account, uint256 heroIds);
  event UnlockedLevel(address player, uint256 _heroId, uint256 level);
  event UpdatedPriceOracle(address account);
  event CreatedEquipment(address indexed player, uint256 indexed equipmentId);

  mapping(address => bool) public bannedList;
  mapping(address => uint256) public chestsOwned; // user => fragments key owned

  uint256 public fragmentsNeedToOpenChest = 10;

  uint256[] public feeToLevelup;

  Quotation public quotation;

  address[2] public tokensToCreateHero;

  modifier onlyOwner() {
    require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not admin");
    _;
  }

  constructor(
    IERC20 _angelToken,
    IERC20 _creedToken,
    IBNBHCharacter _bnbhCharacter,
    IPriceOracle _priceOracle,
    IRandoms _randoms,
    AngelCreedEquipment _equipment
  ) {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

    angelToken = IERC20(_angelToken);
    creedToken = IERC20(_creedToken);
    characters = _bnbhCharacter;
    priceOracle = _priceOracle;
    randoms = _randoms;
    equipmentsContract = _equipment;

    burnAddress = 0x347871AE7f6DE43b18E2F72d6FAd0191527B96d5;
  }

  function migrateBannedList(address[] memory accounts) public onlyOwner {
    for (uint256 i = 0; i < accounts.length; i++) {
      bannedList[accounts[i]] = true;
    }
  }

  function setTokensToCreateHero(address[2] memory values) public onlyOwner {
    tokensToCreateHero = values;
  }

  function setBannAddress(address account, bool status) public onlyOwner {
    bannedList[account] = status;
  }

  function setQuotation(uint256[] memory values) public onlyOwner {
    quotation.angelToCreateHero = values[0];
    quotation.usdToCreateHero = values[1];
  }

  function setBurnAddress(address account) public onlyOwner {
    burnAddress = account;
    emit UpdatedBurnAddress(account);
  }

  function setPriceOracle(address account) public onlyOwner {
    priceOracle = IPriceOracle(account);
    emit UpdatedPriceOracle(account);
  }

  function setAngelTokenContract(address tokenAddress) public onlyOwner {
    angelToken = IERC20(tokenAddress);
    emit UpdatedTokenContract(tokenAddress);
  }

  function setCharacterContract(address characterAddress) public onlyOwner {
    characters = IBNBHCharacter(characterAddress);
    emit UpdatedCharacterContract(characterAddress);
  }

  function setFeeToLvlUp(uint256[] memory amounts) public onlyOwner {
    feeToLevelup = amounts;
  }

  function getHero(uint256 _heroId)
    public
    view
    returns (HeroLibrary.Hero memory)
  {
    return characters.getHero(_heroId);
  }

  function getHeroesByOwner(address account)
    public
    view
    returns (HeroLibrary.Hero[] memory)
  {
    uint256 balance = characters.balanceOf(account);
    HeroLibrary.Hero[] memory heroes = new HeroLibrary.Hero[](balance);
    for (uint256 i = 0; i < balance; i++) {
      heroes[i] = getHero(characters.tokenOfOwnerByIndex(account, i));
    }
    return heroes;
  }

  function _createHero(address payer, address fighter)
    internal
    returns (uint256)
  {
    uint256 seed = randoms.getRandomSeed(fighter);
    uint256 heroId = characters.mint(fighter, seed);
    return heroId;
  }

  function _createNewEquipment(address payer) internal returns (uint256) {
    require(address(priceOracle) != address(0), "Price Oracle was not set yet");
    uint256 equipmentPrice = priceOracle.getEquipmentPrice();
    require(
      angelToken.balanceOf(payer) >= equipmentPrice,
      "Insufficient BNBH balance"
    );
    uint256 seed = randoms.getRandomSeed(payer);
    uint256 heroId = equipmentsContract.mint(payer, seed);
    payForOperation(payer, equipmentPrice);
    return heroId;
  }

  function useEquipment(uint256 heroId, uint256 equipmentId) external {
    require(characters.ownerOf(heroId) == msg.sender, "not own hero");
    require(
      equipmentsContract.ownerOf(equipmentId) == msg.sender,
      "not own equipment"
    );
    characters.useEquipment(heroId, equipmentId);
    equipmentsContract.getUsed(heroId, equipmentId);
  }

  function sendPrizeHero(address account) public onlyOwner {
    uint256 heroId = _createHero(msg.sender, account);
    emit CreatedAndSendPrizeHero(account, heroId);
  }

  function repairEquipment(uint256 equipmentId) external {
    require(
      equipmentsContract.ownerOf(equipmentId) == msg.sender,
      "not own equipment"
    );
    uint256 currentDurability = equipmentsContract.getDurability(equipmentId);

    uint256 percentNeedToRepair = 100 - currentDurability;

    if (percentNeedToRepair > 0) {
      uint256 repairEquipmentPrice = priceOracle.getRepairEquipmentPrice(
        percentNeedToRepair
      );

      equipmentsContract.increaseDurability(equipmentId, percentNeedToRepair);

      payForOperation(msg.sender, repairEquipmentPrice);
    }
  }

  function createNewHero(uint256 tokenIndex) external {
    uint256 length = tokensToCreateHero.length;
    require(tokenIndex < length, "not valid token");
    require(
      bannedList[msg.sender] == false && isContract(msg.sender) == false,
      "is banned or is contract"
    );
    uint256 heroId = _createHero(msg.sender, msg.sender);

    uint256 price;

    if (tokenIndex == 0) {
      price = quotation.angelToCreateHero;
    } else if (tokenIndex == 1) {
      price = quotation.usdToCreateHero;
    }

    IERC20 token = IERC20(tokensToCreateHero[tokenIndex]);

    require(
      token.balanceOf(msg.sender) >= price,
      "not enough balance create hero"
    );

    token.safeTransferFrom(msg.sender, address(this), price);

    emit CreatedHero(msg.sender, heroId);
  }

  function createNewEquipment() external {
    require(
      bannedList[msg.sender] == false && isContract(msg.sender) == false,
      "is banned or is contract"
    );

    uint256 equipmentId = _createNewEquipment(msg.sender);
    emit CreatedEquipment(msg.sender, equipmentId);
  }

  function payForOperation(address payer, uint256 amount) internal {
    angelToken.safeTransferFrom(payer, address(this), amount);
  }

  function unLockLevel(uint256 _heroId) public {
    uint256 seed = randoms.getRandomSeed(msg.sender) % 100;
    uint256 level = characters.unlockLevel(_heroId, seed);

    (uint256 angelPrice, uint256 creedPrice) = priceOracle.getUnlockLevelPrice(
      level
    );

    require(
      angelToken.balanceOf(msg.sender) >= angelPrice,
      "Insufficient Angel balance"
    );

    require(
      creedToken.balanceOf(msg.sender) >= creedPrice,
      "Insufficient Creed balance"
    );

    angelToken.safeTransferFrom(msg.sender, address(this), angelPrice);
    creedToken.safeTransferFrom(msg.sender, address(this), creedPrice);

    emit UnlockedLevel(msg.sender, _heroId, level);
  }

  function getPriceToUnlockLevel(uint256 _heroId)
    public
    view
    returns (uint256)
  {
    uint256 price = priceOracle.getTokenPrice();
    return
      ((price * feeToLevelup[characters.getLevel(_heroId)]) / 100) / (10**18);
  }

  function fight(
    uint256 _attackingHero,
    uint256 round // chapter * round, start: 0
  )
    external
    nonReentrant
    returns (
      uint256,
      uint256,
      uint256
    )
  {
    require(isContract(msg.sender) == false, "Sender is contract");
    require(round <= users[msg.sender].currentRound, "Not open chapter");

    (
      uint256 creedRewards,
      uint256 angelRewards,
      uint256 keyRewards
    ) = characters.fight(
        msg.sender,
        _attackingHero,
        round,
        randoms.getRandomSeed(msg.sender)
      );

    users[msg.sender].angelReward += (angelRewards);
    users[msg.sender].creedReward += (creedRewards);
    users[msg.sender].keyReward += (keyRewards);

    if (creedRewards > 0 && round == users[msg.sender].currentRound) {
      users[msg.sender].currentRound++;
    }

    uint256 creedNeedToPay = priceOracle.getCreedToFightInRound(round);

    creedToken.safeTransferFrom(msg.sender, address(this), creedNeedToPay);

    emit Fight(
      msg.sender,
      _attackingHero,
      round,
      angelRewards,
      creedRewards,
      keyRewards
    );

    return (angelRewards, creedRewards, keyRewards);
  }

  function openChest() external {
    require(
      users[msg.sender].keyReward >= fragmentsNeedToOpenChest,
      "not enough key"
    );

    require(chestsOwned[msg.sender] > 0, "not have chest");

    users[msg.sender].keyReward -= fragmentsNeedToOpenChest;
    chestsOwned[msg.sender] -= 1;

    uint256 seed = randoms.getRandomSeed(msg.sender);

    characters.mint(msg.sender, seed);
  }

  function expediteHero(uint256 _heroId) public {
    uint256 cost = priceOracle.getExpeditePrice();
    require(
      angelToken.balanceOf(msg.sender) >= cost,
      "Insufficient BNBH balance"
    );
    characters.expediteHero(_heroId);
    payForOperation(msg.sender, cost);
    emit ExpeditedHero(msg.sender, _heroId);
  }

  function claimRewards() external nonReentrant {
    require(users[msg.sender].creedReward > 0, "Insufficient balance");
    uint256 angelReward = users[msg.sender].angelReward;
    uint256 creedReward = users[msg.sender].creedReward;

    users[msg.sender].angelReward = 0;
    users[msg.sender].creedReward = 0;
    angelToken.safeTransfer(msg.sender, angelReward);
    creedToken.safeTransfer(msg.sender, creedReward);

    emit ClaimedRewards(
      msg.sender,
      users[msg.sender].angelReward,
      users[msg.sender].creedReward
    );
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
