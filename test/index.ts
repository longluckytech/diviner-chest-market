import { expect } from "chai";
import { Signer } from "ethers";
import { ethers, network } from "hardhat";
import { addressTestnet } from "../config/address";
import { priceToFight } from "../config/wiki";
import {
  AngelCreedEquipment,
  AngelsCreedToken,
  BNBHCharacter,
  BNBHero,
  BNBHPriceOracle,
  ChainlinkRandoms,
  GemToken,
} from "../typechain";
import { createRandomTable } from "./../config/wiki";

const batchTxsToBlock = async (callback: any) => {
  await network.provider.send("evm_setAutomine", [false]);
  await callback();
  await network.provider.request({
    method: "evm_mine",
  });
  await network.provider.send("evm_setAutomine", [true]);
};

const DECIMALS = ethers.BigNumber.from(ethers.utils.parseEther("1"));

const dptPerBlock = ethers.utils.parseEther("10");

const randomTable = createRandomTable();

let signers: Signer[];
let random: ChainlinkRandoms;
let equipment: AngelCreedEquipment;
let game: BNBHero;
let oracle: BNBHPriceOracle;
let angel: AngelsCreedToken;
let creed: GemToken;
let character: BNBHCharacter;

const users: string[] = [];
let upkeeper: string;

let deployer: Signer;
let admin: Signer;

const UINT_MAX = ethers.constants.MaxUint256;
const GAME_ADMIN = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("GAME_ADMIN")
);

const setupAccount = async () => {
  signers = await ethers.getSigners();
  [deployer, admin] = signers.slice(signers.length - 2);
  upkeeper = await admin.getAddress();
  for (let i = 1; i <= 15; i++) {
    users[i] = await signers[i].getAddress();
  }
};

describe("Anglescreed", function () {
  this.beforeAll(async () => {
    await setupAccount();
    const { vrf, link } = addressTestnet;

    const Angel = await ethers.getContractFactory("AngelsCreedToken");
    angel = await Angel.connect(deployer).deploy();

    const Creed = await ethers.getContractFactory("GemToken");
    creed = (await Creed.connect(deployer).deploy()) as GemToken;

    const Randoms = await ethers.getContractFactory("ChainlinkRandoms");
    random = await Randoms.connect(deployer).deploy(
      vrf,
      link,
      "0xcaf3c3727e033261d383b315559476f48034c13b18f8cafed4d871abe5049186",
      ethers.utils.parseEther("0.1")
    );

    const Equipment = await ethers.getContractFactory("AngelCreedEquipment");
    equipment = await Equipment.connect(deployer).deploy();

    const Oracle = await ethers.getContractFactory("BNBHPriceOracle");
    oracle = await Oracle.connect(deployer).deploy(angel.address);

    const Character = await ethers.getContractFactory("BNBHCharacter");
    character = await Character.connect(deployer).deploy(equipment.address);

    const Game = await ethers.getContractFactory("BNBHero");
    game = await Game.connect(deployer).deploy(
      angel.address,
      creed.address,
      character.address,
      oracle.address,
      random.address,
      equipment.address
    );
  });

  it("set game admin", async () => {
    await character.connect(deployer).setGameAdmin(game.address);
    await character.connect(deployer).setGameAdmin(await deployer.getAddress());
    await equipment.connect(deployer).setGameAdmin(game.address);
    await equipment.connect(deployer).setGameAdmin(character.address);
  });

  it("set random table", async () => {
    await equipment.connect(deployer).setRandomTable(randomTable);
    await character.connect(deployer).setRandomTable(randomTable);
  });

  it("set basic attribute", async () => {
    await equipment.connect(deployer).setAttacks([10, 12, 15, 20]);
    await equipment.connect(deployer).setDefenses([3, 5, 8, 12]);
    await equipment.connect(deployer).setSpeeds([6, 8, 11, 15]);
  });

  it("set random attribute", async () => {
    await equipment.connect(deployer).setBonusAttribute(0, [2, 3, 4, 5]);
    await equipment.connect(deployer).setBonusAttribute(1, [1, 1, 2, 2]);
    await equipment.connect(deployer).setBonusAttribute(2, [1, 2, 3, 3]);
  });

  it("mint angel, creed", async () => {
    await angel
      .connect(deployer)
      ["mint(address,uint256)"](users[1], ethers.utils.parseEther("1000000.0"));

    await angel.connect(signers[1]).approve(game.address, UINT_MAX);

    await creed
      .connect(deployer)
      ["mint(address,uint256)"](users[1], ethers.utils.parseEther("1000000.0"));

    await creed.connect(signers[1]).approve(game.address, UINT_MAX);

    await angel
      .connect(deployer)
      ["mint(address,uint256)"](users[2], ethers.utils.parseEther("1000000.0"));

    await angel.connect(signers[2]).approve(game.address, UINT_MAX);

    await creed
      .connect(deployer)
      ["mint(address,uint256)"](users[2], ethers.utils.parseEther("1000000.0"));

    await creed.connect(signers[2]).approve(game.address, UINT_MAX);
  });

  it("Should add hero", async () => {
    await character.connect(deployer).addStatHero(0, 0, 50, 10, 10, [3, 3, 1]);
    await character.connect(deployer).addStatHero(1, 0, 60, 20, 15, [3, 3, 1]);
    await character.connect(deployer).addStatHero(2, 0, 80, 10, 20, [3, 3, 1]);
    await character.connect(deployer).addStatHero(3, 0, 85, 15, 25, [3, 3, 1]);
  });

  it("Should set quotation", async () => {
    await game
      .connect(deployer)
      .setQuotation([
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("500"),
      ]);
  });

  it("Should create new hero", async () => {
    // User 1 : 1,3,4
    // User 2 : 2
    await game.connect(signers[1]).createNewHero(0);
    await game.connect(signers[2]).createNewHero(1);
    await game.connect(signers[1]).createNewHero(0);
    await game.connect(signers[1]).createNewHero(0);
  });

  it("Should add enemies", async () => {
    const attack = [];
    const defense = [];
    const speed = [];
    const requiredLevels = [];
    const bonusRates = [];
    const angelRewards = [];
    const creedRewards = [];
    const keyRewards = [];
    for (let i = 0; i < 10; i++) {
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
        keyRewards
      );
  });

  it("set creed to fight", async () => {
    await oracle.connect(deployer).setCreedToFightInRound(priceToFight);
  });

  it("fight", async () => {
    // Danh vuot cap => fail
    await expect(game.connect(signers[1]).fight(1, 1)).to.be.reverted;

    // Fight round 0
    await expect(() =>
      game.connect(signers[1]).fight(1, 0)
    ).to.changeTokenBalance(creed, game, priceToFight[0]);

    const creedReward = await (await game.users(users[1])).creedReward;

    if (creedReward.gt(0)) {
      // current round increase
      expect(
        await (
          await game.connect(signers[1]).users(users[1])
        ).currentRound
      ).to.equal(1);
    }

    // decrease energy
    expect(await character.getEnergyPoints(1)).to.equal(4);
  });

  // it("mint an equipment", async () => {
  //   await game.connect(signers[1]).createNewEquipment();

  //   console.log(
  //     "token owned : ",
  //     await equipment.tokenOfOwnerByIndex(users[1], 0)
  //   );

  //   console.log(await equipment.getEquipment(1));
  // });

  // it("Should fail when out of energy", async () => {
  //   await expect(game.connect(signers[1]).fight(0, 0, 0)).to.revertedWith(
  //     "BNBHero: hero needs to resume energy"
  //   );
  // });

  // it("Should exp");

  // it("Should unlock level", async () => {
  //   await game.connect(signers[1]).unLockLevel(0);
  //   await game.connect(signers[1]).fight(0, 0, 0);
  // });

  // it("use an equipment", async () => {
  //   console.log("category : ", await equipment.getCategory(1));
  //   await game.connect(signers[1]).useEquipment(1, 1);

  //   console.log("used by : ", await equipment.getUsedBy(1));
  //   console.log("equips : ", await character.getEquipmentsId(1));
  // });

  // it("repair an equipment", async () => {
  //   await expect(() =>
  //     game.connect(signers[1]).repairEquipment(1)
  //   ).to.changeTokenBalance(angel, signers[1], 0);
  // });
});
