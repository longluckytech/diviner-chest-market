import { Signer } from "ethers";
import fs from "fs";
import lineReader from "line-reader";
import { ethers } from "hardhat";
import path from "path";
import {
  BNBHero,
  BNBHCharacter,
  AngelsCreedToken,
  GemToken,
} from "../../../typechain";
import { createRandomTable } from "../../../config/wiki";

const GAME_ADMIN = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("GAME_ADMIN")
);

const UINT_MAX = ethers.constants.MaxUint256;

// const randomTable = createRandomTable(62, 32, 5, 1);
// const randomTable2 = createRandomTable(49, 43, 7, 1);
// const randomTable3 = createRandomTable(40, 42, 16, 2);
const randomTable4 = createRandomTable(50, 40, 9, 1);
const randomTable5 = createRandomTable(42, 38, 15, 5);
const randomTable6 = createRandomTable(20, 44, 28, 8);

const pathToAddress = path.join(__dirname, "./address.json");

const getAllAddresses = () => {
  const addressFileContent = JSON.parse(
    fs.readFileSync(pathToAddress, "utf-8")
  );

  return addressFileContent;
};

const getAddress = (contractName: string) => {
  const addressFileContent = JSON.parse(
    fs.readFileSync(pathToAddress, "utf-8")
  );

  return addressFileContent[contractName];
};

const setAddress = (contractName: string, address: string) => {
  const addressFileContent = JSON.parse(
    fs.readFileSync(pathToAddress, "utf-8")
  );

  addressFileContent[contractName] = address;

  fs.writeFileSync(pathToAddress, JSON.stringify(addressFileContent), "utf-8");
};

let [deployer, admin, user1, user2]: Signer[] = [];
let nonceOffset: number = 0;
let baseNonce: number;

const deployAngel = async () => {
  const Angel = await ethers.getContractFactory("AngelsCreedToken");
  const angel = await Angel.connect(deployer).deploy({
    nonce: baseNonce + nonceOffset++,
  });

  setAddress("angel", angel.address);
};

const deployGem = async () => {
  const Gem = await ethers.getContractFactory("GemToken");
  const gem = await Gem.connect(deployer).deploy({
    nonce: baseNonce + nonceOffset++,
  });

  setAddress("gem", gem.address);
};

const deployCharacter = async () => {
  const Character = await ethers.getContractFactory("BNBHCharacter");
  const character = await Character.connect(deployer).deploy({
    nonce: baseNonce + nonceOffset++,
  });

  setAddress("character", character.address);
};

const deployGame = async () => {
  const { angel, gem, character } = getAllAddresses();

  const Game = await ethers.getContractFactory("BNBHero");
  const game = await Game.connect(deployer).deploy(angel, gem, character, {
    nonce: baseNonce + nonceOffset++,
  });

  setAddress("game", game.address);
};

const setGameAdmin = async () => {
  const { character: characterAddress, game: gameAddress } = getAllAddresses();

  const character = (await ethers.getContractAt(
    "BNBHCharacter",
    characterAddress
  )) as BNBHCharacter;

  await character.connect(deployer).setGameAdmin(gameAddress);
  await character.connect(deployer).setGameAdmin(await deployer.getAddress());

  console.log("set game admin");
};

const setRandomTable = async () => {
  const { character: characterAddress } = getAllAddresses();

  const character = (await ethers.getContractAt(
    "BNBHCharacter",
    characterAddress
  )) as BNBHCharacter;
  // await (
  //   await character.connect(deployer).setRandomTableWithEggType(0, randomTable)
  // ).wait();
  // await (
  //   await character.connect(deployer).setRandomTableWithEggType(1, randomTable2)
  // ).wait();
  // await (
  //   await character.connect(deployer).setRandomTableWithEggType(2, randomTable3)
  // ).wait();
  await (
    await character.connect(deployer).setRandomTableWithEggType(3, randomTable4)
  ).wait();
  await (
    await character.connect(deployer).setRandomTableWithEggType(4, randomTable5)
  ).wait();
  await (
    await character.connect(deployer).setRandomTableWithEggType(5, randomTable6)
  ).wait();

  console.log("set random table");
};

const setEggs = async () => {
  const { game: gameAddress } = getAllAddresses();

  const game = (await ethers.getContractAt("BNBHero", gameAddress)) as BNBHero;
  // await (
  //   await game.connect(deployer).setEggs(0, [ethers.utils.parseEther("570"), 0])
  // ).wait();
  // await (
  //   await game.connect(deployer).setEggs(1, [ethers.utils.parseEther("855"), 0])
  // ).wait();
  // await (
  //   await game
  //     .connect(deployer)
  //     .setEggs(2, [ethers.utils.parseEther("1140"), 0])
  // ).wait();
  await (
    await game
      .connect(deployer)
      .setEggs(3, [ethers.utils.parseEther("4000"), 1000])
  ).wait();
  await (
    await game
      .connect(deployer)
      .setEggs(4, [ethers.utils.parseEther("8000"), 400])
  ).wait();
  await (
    await game
      .connect(deployer)
      .setEggs(5, [ethers.utils.parseEther("12000"), 100])
  ).wait();

  console.log("set egg");
};

const setMaxEggUserCanBuy = async () => {
  const { game: gameAddress } = getAllAddresses();

  const game = (await ethers.getContractAt("BNBHero", gameAddress)) as BNBHero;

  await game.connect(deployer).setMaxEggUserCanBuy(10);
};

const addHero = async () => {
  const { character: characterAddress, game: gameAddress } = getAllAddresses();

  const character = (await ethers.getContractAt(
    "BNBHCharacter",
    characterAddress
  )) as BNBHCharacter;

  // await (await character.connect(deployer).addHero(0)).wait();
  // await (await character.connect(deployer).addHero(0)).wait();
  // await (await character.connect(deployer).addHero(1)).wait();
  // await (await character.connect(deployer).addHero(2)).wait();
  // await (await character.connect(deployer).addHero(3)).wait();
  // await (await character.connect(deployer).addHero(3)).wait();

  (await character.connect(deployer).setHeroTypeLength(0, 2)).wait();
  (await character.connect(deployer).setHeroTypeLength(1, 1)).wait();
  (await character.connect(deployer).setHeroTypeLength(2, 1)).wait();
  (await character.connect(deployer).setHeroTypeLength(3, 2)).wait();
  console.log("set hero");
};

const initialSetup = async () => {
  await setGameAdmin();
  await setRandomTable();
  await addHero();
  await setEggs();
  // await setMaxEggUserCanBuy();
};

const test = async () => {
  const {
    game: gameAddress,
    angel: angelAddress,
    character: characterAddress,
  } = getAllAddresses();

  const angel = (await ethers.getContractAt(
    "AngelsCreedToken",
    angelAddress
  )) as AngelsCreedToken;

  const character = (await ethers.getContractAt(
    "BNBHCharacter",
    characterAddress
  )) as BNBHCharacter;

  const game = (await ethers.getContractAt("BNBHero", gameAddress)) as BNBHero;

  // console.log("getAddressWallet", getAddressWallet());

  // await character.connect(deployer).burn(73);

  await game.connect(deployer).setAngelTokenContract(angelAddress);

  // await character
  //   .connect(deployer)
  //   .grantRole(GAME_ADMIN, "0x0c5aa3f44250ab17c0cb90b2717e727df2ae66b2");

  // await game
  //   .connect(deployer)
  //   .setmarketingAddress("0x01bcfade840e9079b3dc18e9aaf35a2aca349c7e");

  // await character
  //   .connect(deployer)
  //   .transferFrom(
  //     await deployer.getAddress(),
  //     "0x347871AE7f6DE43b18E2F72d6FAd0191527B96d5",
  //     65
  //   );

  // await game
  //   .connect(deployer)
  //   .marketing("0x205f93cd558aac99c4609d0511829194b5405533");
  // for (let i = 0; i < 6; i++) console.log(await game.eggs(i));
  // console.log("hero", await character.getHero(815));

  // for (let i = 0; i < 6; i++) console.log(await game.eggs(i));
  // ---- read data
  // for (let i = 0; i < 4; i++) console.log(await character.heroTypeLength(i));
  // for (let i = 0; i < 6; i++)
  //   console.log(await character.getRandomTableWithEggType(i));
  // console.log("tokensToCreateHero", await game.tokensToCreateHero(0));
  // console.log("tokensToCreateHero", await game.tokensToCreateHero(1));
  // console.log("characters", await game.characters());
  // console.log("egg", await game.eggs(0));
  // console.log(
  //   "tokenId",
  //   await character.tokensOfOwner(await deployer.getAddress())
  // );
  // console.log("stateLastTokenId", await character.stateLastTokenId());
};

const main = async () => {
  [deployer, admin, user1, user2] = await ethers.getSigners();
  nonceOffset = 0;
  baseNonce = await ethers.provider.getTransactionCount(
    await deployer.getAddress()
  );

  // await deployAngel();
  // await deployGem();

  // await deployCharacter();
  // await deployGame();

  // await initialSetup();

  await test();
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
