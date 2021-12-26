// SPDX-License-Identifier: Unlicensed

pragma solidity ^0.8.0;

import "./IBNBHCharacter.sol";
import "./EnumerableSet.sol";
import "./IBEP20.sol";
import "./HeroLibrary.sol";
import "./AccessControl.sol";
import "./IERC721Receiver.sol";
import "./IPriceOracle.sol";

contract BNBHMarket is AccessControl, IERC721Receiver {
  // using EnumerableSet for EnumerableSet.AddressSet;
  using EnumerableSet for EnumerableSet.UintSet;

  IBEP20 public bnbhToken;
  IBNBHCharacter public characters;
  uint256 public taxFee;
  address public taxFeeRecepient;
  string public constant name = "BNBHMarket";
  mapping(address => mapping(uint256 => uint256)) lastPriceChangedTimes;

  event NewListing(
    address seller,
    uint256 tokenId,
    uint256 bnbPrice,
    uint256 bnbhPrice
  );
  event ListingPriceChange(
    address seller,
    uint256 tokenId,
    uint256 bnbPrice,
    uint256 bnbhPrice
  );
  event CancelledListing(address seller, uint256 tokenId);
  event PurchaseListing(
    address buyer,
    address seller,
    uint256 tokenId,
    uint256 bnbPrice,
    uint256 bnbhPrice,
    uint256 tax
  );

  constructor(IBEP20 _bnbhToken, IBNBHCharacter _characters) {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    bnbhToken = _bnbhToken;
    characters = _characters;
    taxFee = 8;
    taxFeeRecepient = 0x43A2A530979520099D80B3b4da412ecC47e449Ef;
  }

  struct Listing {
    address seller;
    uint256 price;
    uint256 listingTime;
  }

  mapping(uint256 => Listing) private listings;

  EnumerableSet.UintSet private listedTokenIDs;

  modifier isListed(uint256 id) {
    require(listedTokenIDs.contains(id), "Token ID not listed");
    _;
  }

  modifier isNotListed(uint256 id) {
    require(!listedTokenIDs.contains(id), "Token ID must not be listed");
    _;
  }

  modifier isSeller(uint256 id) {
    require(listings[id].seller == msg.sender, "Access denied");
    _;
  }

  struct MarketHero {
    uint256 tokenId;
    uint256 heroRarity;
    uint256 heroName;
  }

  modifier onlyOwner() {
    require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not admin");
    _;
  }

  bool public maintenanceMode;
  mapping(address => bool) public bannedList;

  IPriceOracle public priceOracle;
  mapping(uint256 => uint256) public lastTransferredTimes;
  mapping(uint256 => bool) public excludeFromTax;
  uint256 public minimumPrice;

  function migrateExcludeFromTax() public onlyOwner {
    for (uint256 i = 0; i < listedTokenIDs.length(); i++) {
      excludeFromTax[listedTokenIDs.at(i)] = true;
    }
  }

  function removeBannedHeores(uint256[] memory tokenIds) public onlyOwner {
    for (uint256 i = 0; i < tokenIds.length; i++) {
      if (listedTokenIDs.contains(tokenIds[i])) {
        characters.safeTransferFrom(
          address(this),
          0x552889BA6cE8AeFd96fe3Ec43fC27004C1094650,
          tokenIds[i]
        );
        listedTokenIDs.remove(tokenIds[i]);
        delete listings[tokenIds[i]];
      }
    }
  }

  function setTokenAddress(address token) public onlyOwner {
    bnbhToken = IBEP20(token);
  }

  function setCharacterAddress(address character) public onlyOwner {
    characters = IBNBHCharacter(character);
  }

  function setmaintenanceMode(bool mode) public onlyOwner {
    maintenanceMode = mode;
  }

  function setTaxFee(uint256 fee) public onlyOwner {
    taxFee = fee;
  }

  function setTaxFeeRecepient(address account) public onlyOwner {
    taxFeeRecepient = account;
  }

  function setPriceOracle(address oracle) public onlyOwner {
    priceOracle = IPriceOracle(oracle);
  }

  function setMinimumPrice(uint256 amount) public onlyOwner {
    minimumPrice = amount;
  }

  function setBannedAccount(address account, bool state) public onlyOwner {
    bannedList[account] = state;
  }

  // function getCharacterListingIDsPage(
  //   uint256 _limit,
  //   uint256 _pageNumber,
  //   uint256 _minLevel,
  //   uint256 _maxLevel,
  //   uint256 rarity
  // ) public view returns (uint256[] memory) {
  //   uint256 matchingCharactersAmount = getNumberOfCharacterListings(
  //     _minLevel,
  //     _maxLevel,
  //     rarity
  //   );
  //   uint256 pageEnd = _limit * (_pageNumber + 1);
  //   uint256 tokensSize = matchingCharactersAmount >= pageEnd
  //     ? _limit
  //     : matchingCharactersAmount - (_limit * _pageNumber);
  //   uint256[] memory tokens = new uint256[](tokensSize);
  //   uint256 counter = 0;
  //   uint8 tokenIterator = 0;
  //   for (uint256 i = 0; i < listedTokenIDs.length() && counter < pageEnd; i++) {
  //     (uint256 characterLevel, uint256 heroRarity) = characters
  //       .getLevelAndRarity(listedTokenIDs.at(i));
  //     if (
  //       (rarity == 0 || heroRarity == rarity) &&
  //       characterLevel >= _minLevel &&
  //       characterLevel <= _maxLevel
  //     ) {
  //       if (counter >= pageEnd - _limit) {
  //         tokens[tokenIterator] = listedTokenIDs.at(i);
  //         tokenIterator++;
  //       }
  //       counter++;
  //     }
  //   }
  //   return tokens;
  // }

  // function getCharactersForPage(
  //   uint256 _limit,
  //   uint256 _pageNumber,
  //   uint256 _minLevel,
  //   uint256 _maxLevel,
  //   uint256 rarity
  // ) public view returns (MarketHero[] memory) {
  //   uint256[] memory tokenIds = getCharacterListingIDsPage(
  //     _limit,
  //     _pageNumber,
  //     _minLevel,
  //     _maxLevel,
  //     rarity
  //   );
  //   return getCharacterDataByIds(tokenIds);
  // }

  function getAllTokenIds() public view returns (uint256[] memory) {
    uint256[] memory ids = new uint256[](listedTokenIDs.length());
    for (uint256 i = 0; i < listedTokenIDs.length(); i++) {
      ids[i] = listedTokenIDs.at(i);
    }
    return ids;
  }

  function getCharactersForSeller(address seller)
    public
    view
    returns (MarketHero[] memory)
  {
    uint256[] memory tokenIds = getListingIDsBySeller(seller);
    return getCharacterDataByIds(tokenIds);
  }

  function getCharacterDataById(uint256 _heroId)
    public
    view
    returns (MarketHero memory)
  {
    HeroLibrary.Hero memory hero = characters.getHero(_heroId);
    Listing memory listing = listings[_heroId];

    return MarketHero(hero.tokenId, hero.heroName, hero.heroRarity);
  }

  function getCharacterDataByIds(uint256[] memory tokenIds)
    public
    view
    returns (MarketHero[] memory)
  {
    MarketHero[] memory marketHeroes = new MarketHero[](tokenIds.length);
    for (uint256 index = 0; index < tokenIds.length; index++) {
      marketHeroes[index] = getCharacterDataById(tokenIds[index]);
    }
    return marketHeroes;
  }

  function getSellerOfNftID(uint256 _tokenId) public view returns (address) {
    if (!listedTokenIDs.contains(_tokenId)) {
      return address(0);
    }

    return listings[_tokenId].seller;
  }

  function getNumberOfListingsBySeller(address _seller)
    public
    view
    returns (uint256)
  {
    uint256 amount = 0;
    for (uint256 i = 0; i < listedTokenIDs.length(); i++) {
      if (listings[listedTokenIDs.at(i)].seller == _seller) amount++;
    }

    return amount;
  }

  function getListingIDsBySeller(address _seller)
    public
    view
    returns (uint256[] memory tokens)
  {
    uint256 amount = getNumberOfListingsBySeller(_seller);
    tokens = new uint256[](amount);
    uint256 index = 0;
    for (uint256 i = 0; i < listedTokenIDs.length(); i++) {
      uint256 id = listedTokenIDs.at(i);
      if (listings[id].seller == _seller) tokens[index++] = id;
    }
  }

  function getNumberOfCharacterListings(
    uint256 _minLevel,
    uint256 _maxLevel,
    uint256 rarity
  ) public view returns (uint256) {
    uint256 counter = 0;
    for (uint256 i = 0; i < listedTokenIDs.length(); i++) {
      (uint256 characterLevel, uint256 heroRarity) = characters
        .getLevelAndRarity(listedTokenIDs.at(i));
      if (
        (rarity == 0 || heroRarity == rarity) &&
        characterLevel >= _minLevel &&
        characterLevel <= _maxLevel
      ) {
        counter++;
      }
    }
    return counter;
  }

  function canListOrChangePrice(uint256 _heroId) public view returns (bool) {
    return block.timestamp >= lastTransferredTimes[_heroId] + 24 * 3600;
  }

  function addListing(uint256 _id, uint256 _price) public isNotListed(_id) {
    require(maintenanceMode == false, "Market place is in maintenance mode");
    require(bannedList[msg.sender] == false && isContract(msg.sender) == false);
    require(
      characters.ownerOf(_id) == msg.sender,
      "You are not owner of this hero"
    );
    require(
      lastTransferredTimes[_id] + 24 * 3600 < block.timestamp,
      "You need to wait to add hero on market"
    );
    require(
      _price >= minimumPrice,
      "The price should be over than minimum price"
    );
    // require (characters.balanceOf(address(this)) <= 10000, "can not list over 10k heroes");
    HeroLibrary.Hero memory hero = characters.getHero(_id, true);
    require(hero.arrivalTime <= 0, "Hero did not arrive yet");
    // uint256 balance = bnbhToken.balanceOf(msg.sender);

    // require(balance >= _price.mul(taxFee).div(100), "Balance is not enough");
    characters.safeTransferFrom(msg.sender, address(this), _id);
    _price = _price.mul(100 + taxFee).div(100);
    listings[_id] = Listing(msg.sender, _price, block.timestamp);
    listedTokenIDs.add(_id);
    lastTransferredTimes[_id] = block.timestamp;
    // bnbhToken.transferFrom(msg.sender, taxFeeRecepient, _price.mul(10).div(100));
    uint256 tokenPrice = priceOracle.getTokenPrice();
    uint256 bnbhPrice = tokenPrice.mul(_price).div(10**18);
    emit NewListing(msg.sender, _id, _price, bnbhPrice);
  }

  function changeListingPrice(uint256 _id, uint256 _newPrice)
    public
    isListed(_id)
    isSeller(_id)
  {
    require(maintenanceMode == false, "Market place is in maintenance mode");
    require(bannedList[msg.sender] == false && isContract(msg.sender) == false);
    require(
      _newPrice >= minimumPrice,
      "The price should be over than minimum price"
    );
    require(
      block.timestamp >= lastTransferredTimes[_id] + 24 * 3600,
      "You can only change price every 24 hours"
    );
    _newPrice = _newPrice.mul(100 + taxFee).div(100);
    listings[_id].price = _newPrice;
    lastTransferredTimes[_id] = block.timestamp;
    uint256 tokenPrice = priceOracle.getTokenPrice();
    uint256 bnbhPrice = tokenPrice.mul(_newPrice).div(10**18);
    emit ListingPriceChange(msg.sender, _id, _newPrice, bnbhPrice);
  }

  function cancelListing(uint256 _id) public isListed(_id) isSeller(_id) {
    require(maintenanceMode == false, "Market place is in maintenance mode");
    require(bannedList[msg.sender] == false && isContract(msg.sender) == false);
    Listing memory listing = listings[_id];
    characters.safeTransferFrom(address(this), msg.sender, _id);
    characters.resumeStaminaTimeStamp(
      _id,
      block.timestamp - listing.listingTime
    );
    delete listings[_id];
    listedTokenIDs.remove(_id);
    lastTransferredTimes[_id] = block.timestamp;
    emit CancelledListing(msg.sender, _id);
  }

  function purchaseListing(uint256 _id) public isListed(_id) {
    require(maintenanceMode == false, "Market place is in maintenance mode");
    require(bannedList[msg.sender] == false && isContract(msg.sender) == false);
    Listing memory listing = listings[_id];
    uint256 bnbhPrice = priceOracle.getTokenPrice();
    uint256 amount = bnbhPrice.mul(listing.price).div(10**18);
    require(bnbhToken.balanceOf(msg.sender) >= amount, "balance is not enough");
    characters.safeTransferFrom(address(this), msg.sender, _id);
    characters.resumeStaminaTimeStamp(
      _id,
      block.timestamp - listing.listingTime
    );
    uint256 tax = amount.mul(taxFee).div(100 + taxFee);
    if (excludeFromTax[_id] == true) {
      bnbhToken.transferFrom(msg.sender, listing.seller, amount);
      excludeFromTax[_id] = false;
    } else {
      bnbhToken.transferFrom(msg.sender, taxFeeRecepient, tax);
      bnbhToken.transferFrom(msg.sender, listing.seller, amount - (tax));
    }

    delete listings[_id];
    listedTokenIDs.remove(_id);
    lastTransferredTimes[_id] = block.timestamp;
    emit PurchaseListing(
      msg.sender,
      listing.seller,
      _id,
      listing.price,
      amount,
      tax
    );
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

  function onERC721Received(
    address,
    address,
    uint256 tokenId,
    bytes calldata
  ) external view override returns (bytes4) {
    require(
      listedTokenIDs.contains(tokenId) == false,
      "Token ID should be not listed"
    );
    return this.onERC721Received.selector;
  }
}
