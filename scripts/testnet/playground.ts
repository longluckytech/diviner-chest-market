// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { Signer } from "ethers";
import { ethers } from "hardhat";
import path from "path";
import fs from "fs";
import { createRandomTable, priceToFight } from "../../config/wiki";
import { getSystemErrorName } from "util";
import {
  AngelsCreedToken,
  GemToken,
  ChainlinkRandoms,
  BNBHPriceOracle,
  AngelCreedEquipment,
  Civilian,
  ChestMarket,
} from "../../typechain";

const UINT_MAX = ethers.constants.MaxUint256;

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

let [deployer, admin, signer1, signer2]: Signer[] = [];
let nonceOffset: number = 0;
let baseNonce: number;
const users: string[] = [];

let angel: AngelsCreedToken,
  gem: GemToken,
  busd: GemToken,
  random: ChainlinkRandoms,
  oracle: BNBHPriceOracle,
  equipment: AngelCreedEquipment,
  character: Civilian,
  game: ChestMarket;

const setGameAdmin = async () => {
  await character.connect(deployer).setGameAdmin(game.address, {
    nonce: baseNonce + nonceOffset++,
  });
  await character.connect(deployer).setGameAdmin(await deployer.getAddress(), {
    nonce: baseNonce + nonceOffset++,
  });
  await equipment.connect(deployer).setGameAdmin(game.address, {
    nonce: baseNonce + nonceOffset++,
  });
  await equipment.connect(deployer).setGameAdmin(character.address, {
    nonce: baseNonce + nonceOffset++,
  });
};

const setRandomTable = async () => {
  const randomTable = createRandomTable();
  await equipment.connect(deployer).setRandomTable(randomTable, {
    nonce: baseNonce + nonceOffset++,
  });
  await character.connect(deployer).setRandomTable(randomTable, {
    nonce: baseNonce + nonceOffset++,
  });
};

const setBasicAttributeEquipment = async () => {
  await equipment.connect(deployer).setAttacks([10, 12, 15, 20], {
    nonce: baseNonce + nonceOffset++,
  });
  await equipment.connect(deployer).setDefenses([3, 5, 8, 12], {
    nonce: baseNonce + nonceOffset++,
  });
  await equipment.connect(deployer).setSpeeds([6, 8, 11, 15], {
    nonce: baseNonce + nonceOffset++,
  });

  await equipment.connect(deployer).setBonusAttribute(0, [2, 3, 4, 5], {
    nonce: baseNonce + nonceOffset++,
  });
  await equipment.connect(deployer).setBonusAttribute(1, [1, 1, 2, 2], {
    nonce: baseNonce + nonceOffset++,
  });
  await equipment.connect(deployer).setBonusAttribute(2, [1, 2, 3, 3], {
    nonce: baseNonce + nonceOffset++,
  });
};

const setStatHero = async () => {
  await character.connect(deployer).addStatHero(0, 0, 50, 10, 10, [3, 3, 1], {
    nonce: baseNonce + nonceOffset++,
  });
  await character.connect(deployer).addStatHero(1, 0, 60, 20, 15, [3, 3, 1], {
    nonce: baseNonce + nonceOffset++,
  });
  await character.connect(deployer).addStatHero(2, 0, 80, 10, 20, [3, 3, 1], {
    nonce: baseNonce + nonceOffset++,
  });
  await character.connect(deployer).addStatHero(3, 0, 85, 15, 25, [3, 3, 1], {
    nonce: baseNonce + nonceOffset++,
  });
};

const setTokensToBuyHero = async () => {
  await game
    .connect(deployer)
    .setTokensToCreateHero([angel.address, busd.address]);
};

const mintToken = async () => {
  await angel
    .connect(deployer)
    ["mint(address,uint256)"](
      "0x22c65492d489944C721521824A03e61cd4cAE2EF",
      ethers.utils.parseEther("10000000")
    );

  await angel.connect(signer1).approve(game.address, UINT_MAX);

  await gem
    .connect(deployer)
    ["mint(address,uint256)"](
      "0x22c65492d489944C721521824A03e61cd4cAE2EF",
      ethers.utils.parseEther("10000000")
    );

  await gem.connect(signer1).approve(game.address, UINT_MAX);

  await busd
    .connect(deployer)
    ["mint(address,uint256)"](
      "0x22c65492d489944C721521824A03e61cd4cAE2EF",
      ethers.utils.parseEther("10000000")
    );

  await busd.connect(signer1).approve(game.address, UINT_MAX);
};

const setQuotation = async () => {
  await game
    .connect(deployer)
    .setQuotation([
      ethers.utils.parseEther("10"),
      ethers.utils.parseEther("100"),
    ]);
};

const createNewHero = async () => {
  const baseNonce = await ethers.provider.getTransactionCount(
    await signer1.getAddress()
  );
  let nonceOffset = 0;
  await game.connect(signer1).createNewHero(0, {
    nonce: baseNonce + nonceOffset++,
  });
  await game.connect(signer1).createNewHero(0, {
    nonce: baseNonce + nonceOffset++,
  });
  await game.connect(signer1).createNewHero(1, {
    nonce: baseNonce + nonceOffset++,
  });
  // console.log(await character.tokensOfOwner(await signer1.getAddress()));
};

const addEnemies = async () => {
  const attack = [];
  const defense = [];
  const speed = [];
  const requiredLevels = [];
  const bonusRates = [];
  const angelRewards = [];
  const creedRewards = [];
  const keyRewards = [];
  for (let i = 0; i < 1; i++) {
    attack.push(20 + i * 5);
    defense.push(10 + i * 2);
    speed.push(10 + i * 1);
    requiredLevels.push(i + 1);
    bonusRates.push(5 + i);
    angelRewards.push(10 + i * 50);
    creedRewards.push(500 + i * 10);
    keyRewards.push(i + 1);
  }

  await character
    .connect(deployer)
    .addEnemiesWithRound(
      attack,
      defense,
      speed,
      requiredLevels,
      bonusRates,
      angelRewards,
      creedRewards,
      keyRewards,
      {
        nonce: baseNonce + nonceOffset++,
      }
    );
};

const setCreedToFight = async () => {
  await oracle.connect(deployer).setCreedToFightInRound(priceToFight, {
    nonce: baseNonce + nonceOffset++,
  });
};

const fight = async () => {
  // console.log(
  //   "current heroes : ",
  //   await character.tokensOfOwner(await signer1.getAddress())
  // );
  // Danh vuot cap => fail

  // Fight round 0
  await (await game.connect(signer1).fight(1, 0)).wait();

  const creedReward = await (await game.users(users[1])).creedReward;
  console.log("creed reward : ", creedReward);

  console.log("energy : ", await character.getEnergyPoints(1));
};

async function main() {
  const {
    angel: angelAddress,
    gem: gemAddress,
    busd: busdAddress,
    random: randomAddress,
    oracle: oracleAddress,
    equipment: equipmentAddress,
    character: characterAddress,
    game: gameAddress,
  } = getAllAddresses();

  [deployer, admin, signer1, signer2] = await ethers.getSigners();
  nonceOffset = 10;
  baseNonce = await ethers.provider.getTransactionCount(
    await deployer.getAddress()
  );

  console.log("base nonce : ", baseNonce);
  users.push(await signer1.getAddress());
  users.push(await signer2.getAddress());
  angel = await ethers.getContractAt("AngelsCreedToken", angelAddress);
  gem = await ethers.getContractAt("GemToken", gemAddress);
  busd = await ethers.getContractAt("AngelsCreedToken", busdAddress);
  random = await ethers.getContractAt("ChainlinkRandoms", randomAddress);
  oracle = await ethers.getContractAt("BNBHPriceOracle", oracleAddress);
  equipment = await ethers.getContractAt(
    "AngelCreedEquipment",
    equipmentAddress
  );
  character = await ethers.getContractAt("Civilian", characterAddress);
  game = await ethers.getContractAt("ChestMarket", gameAddress);

  console.log("Attach contract");

  // after deploy token
  // await mintToken();
  // console.log("4");

  // AFTER DEPLOY CHARACTER
  // await setBasicAttributeEquipment();
  // console.log("2");

  // // SETUP AFTER DEPLOY
  // await setGameAdmin();
  // console.log("0");
  // await setRandomTable();
  // console.log("1");

  // await setStatHero();
  // console.log("3");

  // await setQuotation();
  // console.log("5");
  // await setTokensToBuyHero();
  // console.log("6");
  // await addEnemies();
  // console.log("8");
  // await setCreedToFight();
  // console.log("9");

  // await createNewHero();
  // console.log("7");
  // console.log(
  //   "heroes : ",
  //   await character.tokensOfOwner(await signer1.getAddress())
  // );

  await fight();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
