import { Signer } from "ethers";
import fs from "fs";
import { ethers } from "hardhat";
import path from "path";
import { BNBHero, BNBHCharacter, AngelsCreedToken } from "../../../typechain";
import { createRandomTable } from "../../../config/wiki";

const GAME_ADMIN = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("GAME_ADMIN")
);

const UINT_MAX = ethers.constants.MaxUint256;

const randomTable = createRandomTable(55, 30, 10, 5);
const randomTable2 = createRandomTable(45, 30, 15, 5);
const randomTable3 = createRandomTable(20, 55, 20, 5);
const randomTable4 = createRandomTable(10, 60, 20, 10);
const randomTable5 = createRandomTable(0, 30, 45, 25);
const randomTable6 = createRandomTable(0, 0, 60, 35);

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
  // await character.connect(deployer).setGameAdmin(await deployer.getAddress());
};

const setRandomTable = async () => {
  const { character: characterAddress } = getAllAddresses();

  const character = (await ethers.getContractAt(
    "BNBHCharacter",
    characterAddress
  )) as BNBHCharacter;
  await character.connect(deployer).setRandomTableWithEggType(0, randomTable);
  await character.connect(deployer).setRandomTableWithEggType(1, randomTable2);
  await character.connect(deployer).setRandomTableWithEggType(2, randomTable6);
  await character.connect(deployer).setRandomTableWithEggType(3, randomTable3);
  await character.connect(deployer).setRandomTableWithEggType(4, randomTable4);
  await character.connect(deployer).setRandomTableWithEggType(5, randomTable5);
};

const setEggs = async () => {
  const { game: gameAddress } = getAllAddresses();

  const game = (await ethers.getContractAt("BNBHero", gameAddress)) as BNBHero;
  await game
    .connect(deployer)
    .setEggs(0, [
      ethers.utils.parseEther("10"),
      ethers.utils.parseEther("100"),
      10,
    ]);
  await game
    .connect(deployer)
    .setEggs(1, [
      ethers.utils.parseEther("20"),
      ethers.utils.parseEther("200"),
      8,
    ]);
  await game
    .connect(deployer)
    .setEggs(2, [
      ethers.utils.parseEther("30"),
      ethers.utils.parseEther("300"),
      5,
    ]);
  await game
    .connect(deployer)
    .setEggs(3, [
      ethers.utils.parseEther("40"),
      ethers.utils.parseEther("400"),
      3,
    ]);
  await game
    .connect(deployer)
    .setEggs(4, [
      ethers.utils.parseEther("50"),
      ethers.utils.parseEther("500"),
      3,
    ]);

  await game
    .connect(deployer)
    .setEggs(5, [
      ethers.utils.parseEther("60"),
      ethers.utils.parseEther("600"),
      2,
    ]);
};

const initialSetup = async () => {
  await setGameAdmin();
  await setRandomTable();
  await setEggs();
};

const test = async () => {
  const { game: gameAddress, angel: angelAddress, character: characterAddress } = getAllAddresses();

  const angel = (await ethers.getContractAt(
    "AngelsCreedToken",
    angelAddress
  )) as AngelsCreedToken;
  const game = (await ethers.getContractAt("BNBHero", angelAddress)) as BNBHero;
  const character = (await ethers.getContractAt(
    "BNBHCharacter",
    characterAddress
  )) as BNBHCharacter;

  // await angel.connect(deployer).approve(gameAddress, UINT_MAX);
  // await game.connect(deployer).estimateGas.buyEgg(0, 0);
  // await game.connect(deployer).buyEgg(0, 0);
  console.log("game addmin", await character.hasRole(GAME_ADMIN, gameAddress)
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
