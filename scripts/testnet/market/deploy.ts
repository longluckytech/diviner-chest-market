import { Signer } from "ethers";
import fs from "fs";
import { ethers } from "hardhat";
import path from "path";
import { AngelCreedEquipment, BNBHCharacter } from "../../../typechain";

const GAME_ADMIN = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("GAME_ADMIN")
);

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

const deployBusd = async () => {
  const Gem = await ethers.getContractFactory("GemToken");
  const gem = await Gem.connect(deployer).deploy({
    nonce: baseNonce + nonceOffset++,
  });

  setAddress("busd", gem.address);
};

const deployRandom = async () => {
  const Randoms = await ethers.getContractFactory("ChainlinkRandoms");
  const { vrf, link } = getAllAddresses();
  const random = await Randoms.connect(deployer).deploy(
    vrf,
    link,
    "0xcaf3c3727e033261d383b315559476f48034c13b18f8cafed4d871abe5049186",
    ethers.utils.parseEther("0.1"),
    {
      nonce: baseNonce + nonceOffset++,
    }
  );

  setAddress("random", random.address);
};

const deployOracle = async () => {
  const Oracle = await ethers.getContractFactory("BNBHPriceOracle");
  const { angel, gem } = getAllAddresses();
  const oracle = await Oracle.connect(deployer).deploy(angel, {
    nonce: baseNonce + nonceOffset++,
  });

  setAddress("oracle", oracle.address);
};

const deployEquipment = async () => {
  const Equipment = await ethers.getContractFactory("AngelCreedEquipment");
  const equipment = await Equipment.connect(deployer).deploy({
    nonce: baseNonce + nonceOffset++,
  });

  setAddress("equipment", equipment.address);
};

const deployCharacter = async () => {
  const equipment = getAddress("equipment");
  const Character = await ethers.getContractFactory("BNBHCharacter");
  const character = await Character.connect(deployer).deploy(equipment, {
    nonce: baseNonce + nonceOffset++,
  });

  setAddress("character", character.address);
};

const deployGame = async () => {
  const { angel, gem, character, oracle, random, equipment } =
    getAllAddresses();

  const Game = await ethers.getContractFactory("BNBHero");
  const game = await Game.connect(deployer).deploy(
    angel,
    gem,
    character,
    oracle,
    random,
    equipment,
    {
      nonce: baseNonce + nonceOffset++,
    }
  );

  setAddress("game", game.address);
};

const setGameAdmin = async () => {
  const {
    character: characterAddress,
    equipment: equipmentAddress,
    game: gameAddress,
  } = getAllAddresses();

  const character = (await ethers.getContractAt(
    "BNBHCharacter",
    characterAddress
  )) as BNBHCharacter;

  const equipment = (await ethers.getContractAt(
    "AngelCreedEquipment",
    equipmentAddress
  )) as AngelCreedEquipment;

  await character.connect(deployer).setGameAdmin(gameAddress);
  await character.connect(deployer).setGameAdmin(await deployer.getAddress());
  await equipment.connect(deployer).setGameAdmin(gameAddress);
  await equipment.connect(deployer).setGameAdmin(characterAddress);
};

// const initialSetup = async () => {
//   await setGameAdmin();

//   await setRandomTable();

//   await setStatHero();

//   await createNewHero();
// };

const main = async () => {
  [deployer, admin, user1, user2] = await ethers.getSigners();
  nonceOffset = 0;
  baseNonce = await ethers.provider.getTransactionCount(
    await deployer.getAddress()
  );
  console.log("base nonce  : ", baseNonce);
  // await deployAngel();
  // await deployGem();
  // await deployBusd();
  // await deployRandom();
  // await deployOracle();
  // await deployEquipment();
  await deployCharacter();
  await deployGame();
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
