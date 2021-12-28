import { Signer } from "ethers";
import fs from "fs";
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

const randomTable = createRandomTable(62, 32, 5, 1);
const randomTable2 = createRandomTable(49, 42, 7, 2);
const randomTable3 = createRandomTable(40, 40, 16, 4);
const randomTable4 = createRandomTable(24, 39, 28, 9);
const randomTable5 = createRandomTable(2, 27, 49, 22);
const randomTable6 = createRandomTable(0, 5, 55, 40);

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
};

const setRandomTable = async () => {
  const { character: characterAddress } = getAllAddresses();

  const character = (await ethers.getContractAt(
    "BNBHCharacter",
    characterAddress
  )) as BNBHCharacter;
  await character.connect(deployer).setRandomTableWithEggType(0, randomTable);
  await character.connect(deployer).setRandomTableWithEggType(1, randomTable2);
  await character.connect(deployer).setRandomTableWithEggType(2, randomTable3);
  await character.connect(deployer).setRandomTableWithEggType(3, randomTable4);
  await character.connect(deployer).setRandomTableWithEggType(4, randomTable5);
  await character.connect(deployer).setRandomTableWithEggType(5, randomTable6);
};

const setEggs = async () => {
  const { game: gameAddress } = getAllAddresses();

  const game = (await ethers.getContractAt("BNBHero", gameAddress)) as BNBHero;
  await game
    .connect(deployer)
    .setEggs(0, [ethers.utils.parseEther("570"), 10, 10]);
  await game
    .connect(deployer)
    .setEggs(1, [ethers.utils.parseEther("855"), 8, 8]);
  await game
    .connect(deployer)
    .setEggs(2, [ethers.utils.parseEther("1140"), 8, 8]);
  await game
    .connect(deployer)
    .setEggs(3, [ethers.utils.parseEther("2140"), 3, 3]);
  await game
    .connect(deployer)
    .setEggs(4, [ethers.utils.parseEther("4000"), 3, 3]);

  await game
    .connect(deployer)
    .setEggs(5, [ethers.utils.parseEther("7140"), 2, 2]);
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

  await character.connect(deployer).addHero(0);
  await character.connect(deployer).addHero(0);
  await character.connect(deployer).addHero(1);
  await character.connect(deployer).addHero(2);
  await character.connect(deployer).addHero(3);
  await character.connect(deployer).addHero(3);
};

const initialSetup = async () => {
  await setGameAdmin();
  await setRandomTable();
  await addHero();

  await setEggs();
  await setMaxEggUserCanBuy();
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

  // await angel.connect(user1).approve(gameAddress, UINT_MAX);
  // await game.connect(deployer).buyEgg(0);
  // await game.connect(deployer).buyEgg(1);
  // await game.connect(deployer).buyEgg(2);
  // await game.connect(deployer).buyEgg(3);
  // await game.connect(deployer).buyEgg(4);
  // for (let i = 1; i <= 2; i++) await game.connect(user1).buyEgg(5);

  // await game.connect(deployer).buyEgg(1, 0);

  // ---- read data
  for (let i = 10; i <= 20; i++)
    console.log("game admin", await character.getHero(i));
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
