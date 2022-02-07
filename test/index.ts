import { expect } from "chai";
import { Signer, BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { text } from "node:stream/consumers";
import { addressTestnet } from "../config/address";
import { priceToFight } from "../config/wiki";
import {
  AngelsCreedToken,
  Civilian,
  ChestMarket,
  GemToken,
} from "../typechain";
import { createRandomTable } from "./../config/wiki";
const SECOND_IN_MONTH = 4;

const batchTxsToBlock = async (callback: any) => {
  await network.provider.send("evm_setAutomine", [false]);
  await callback();
  await network.provider.request({
    method: "evm_mine",
  });
  await network.provider.send("evm_setAutomine", [true]);
};

const randomTable = createRandomTable(42, 31, 20, 6, 1);
const randomTable2 = createRandomTable(15, 20, 35, 22, 8);
const randomTable3 = createRandomTable(0, 10, 30, 35, 25);
// const randomTable4 = createRandomTable(50, 40, 9, 1);
// const randomTable5 = createRandomTable(42, 36, 17, 5);
// const randomTable6 = createRandomTable(20, 40, 30, 10);

let signers: Signer[];
let game: ChestMarket;
let angel: AngelsCreedToken;
let creed: GemToken;
let character: Civilian;

const users: string[] = [];

let deployer: Signer;
let admin: Signer;

const UINT_MAX = ethers.constants.MaxUint256;
const GAME_ADMIN = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("GAME_ADMIN")
);

const setupAccount = async () => {
  signers = await ethers.getSigners();
  [deployer, admin] = signers.slice(signers.length - 2);
  for (let i = 1; i <= 15; i++) {
    users[i] = await signers[i].getAddress();
  }
};

describe("Angles creed", function () {
  this.beforeAll(async () => {
    await setupAccount();
    const Angel = await ethers.getContractFactory("AngelsCreedToken");
    angel = await Angel.connect(deployer).deploy();

    const Creed = await ethers.getContractFactory("GemToken");
    creed = (await Creed.connect(deployer).deploy()) as GemToken;

    const Character = await ethers.getContractFactory("Civilian");
    character = (await Character.connect(deployer).deploy()) as Civilian;

    const Game = await ethers.getContractFactory("ChestMarket");
    game = await Game.connect(deployer).deploy(
      angel.address,
      character.address
    );
  });

  it("set game admin", async () => {
    await character.connect(deployer).setGameAdmin(game.address);
    await character.connect(deployer).setGameAdmin(await deployer.getAddress());
  });

  it("set random table", async () => {
    await character
      .connect(deployer)
      .setRandomTableWithChestType(0, randomTable);
    await character
      .connect(deployer)
      .setRandomTableWithChestType(1, randomTable2);
    await character
      .connect(deployer)
      .setRandomTableWithChestType(2, randomTable3);
    // await character
    //   .connect(deployer)
    //   .setRandomTableWithChestType(3, randomTable4);
    // await character
    //   .connect(deployer)
    //   .setRandomTableWithChestType(4, randomTable5);
    // await character
    //   .connect(deployer)
    //   .setRandomTableWithChestType(5, randomTable6);
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

  it("Should set chests", async () => {
    await game
      .connect(deployer)
      .setChest(0, [ethers.utils.parseEther("100"), 10000]);
    await game
      .connect(deployer)
      .setChest(1, [ethers.utils.parseEther("100"), 10000]);
    await game
      .connect(deployer)
      .setChest(2, [ethers.utils.parseEther("100"), 10000]);
  });
  it("Should add heros", async () => {
    (await character.connect(deployer).setHeroTypeLength(0, 2)).wait();
    (await character.connect(deployer).setHeroTypeLength(1, 2)).wait();
    (await character.connect(deployer).setHeroTypeLength(2, 2)).wait();
    (await character.connect(deployer).setHeroTypeLength(3, 2)).wait();
    (await character.connect(deployer).setHeroTypeLength(4, 2)).wait();
  });

  it("Should sett max chest each user", async function () {
    await game.connect(deployer).setMaxChestUserCanBuy(10000);
  });

  it("should buy chest", async () => {
    const tx = await game.connect(signers[1]).buyChest(2);
  });

  // it("Should buy chests", async () => {
  //   // User 1 : 1,3,4
  //   // User 2 : 2
  //   const hero = [];
  //   for (let i = 0; i < 100; i++) {
  //     await network.provider.send("evm_increaseTime", [SECOND_IN_MONTH]);
  //     await network.provider.send("evm_mine");
  //     const tx = await game.connect(signers[1]).buyChest(5);
  //     const result: any = await tx?.wait();
  //     hero.push(result.events[3].args.heroRarity.toString());
  //   }
  //   const rate = [];
  //   let total = 0;
  //   for (let i = 0; i < 4; i++) {
  //     const amount = hero.reduce((prev, cur) => {
  //       if (cur === i.toString()) return ++prev;
  //       return prev;
  //     }, 0);
  //     rate.push(amount);
  //     total += amount;
  //     console.log(`amount ${i} ${amount}`);
  //   }
  //   rate.forEach((r, index) => {
  //     console.log(`rate ${index} ${(r / total) * 100}`);
  //   });

  //   console.log("hero", hero);
  // });

  // it("Should burn with game admin", async () => {
  //   const tokenIds1 = await character.tokensOfOwner(users[1]);
  //   console.log("tokenIds1", tokenIds1);

  //   await character.connect(deployer).burn(tokenIds1[2].toString());
  //   const tokenIds2 = await character.tokensOfOwner(users[1]);
  //   console.log("tokenIds2", tokenIds2);

  //   expect((await character.tokensOfOwner(users[1])).length).equal(
  //     tokenIds1.length - 1
  //   );
  // });

  // it("Should buy chest with user 2", async () => {
  //   await game.connect(signers[2]).buyChest(0);
  //   await game.connect(signers[2]).buyChest(0);

  //   const tokenIds1 = await character.tokensOfOwner(users[2]);
  //   console.log("tokenIds1", tokenIds1);
  // });
  // it("Should buy chest with user 1", async () => {
  //   await game.connect(signers[1]).buyChest(0);
  //   await game.connect(signers[1]).buyChest(0);

  //   const tokenIds1 = await character.tokensOfOwner(users[1]);
  //   console.log("tokenIds1", tokenIds1);
  // });

  // it("Should burn user 1 in 3", async () => {
  //   const tokenIds1 = await character.tokensOfOwner(users[1]);

  //   await character.connect(deployer).burn(tokenIds1[3].toString());
  //   const tokenIds2 = await character.tokensOfOwner(users[1]);
  //   console.log("tokenIds2", tokenIds2);

  //   expect((await character.tokensOfOwner(users[1])).length).equal(
  //     tokenIds1.length - 1
  //   );
  // });

  // it("Should burn user 2 in 1", async () => {
  //   const tokenIds1 = await character.tokensOfOwner(users[2]);

  //   await character.connect(deployer).burn(tokenIds1[1].toString());
  //   const tokenIds2 = await character.tokensOfOwner(users[2]);
  //   console.log("tokenIds2", tokenIds2);

  //   expect((await character.tokensOfOwner(users[2])).length).equal(
  //     tokenIds1.length - 1
  //   );
  // });

  // it("Should out of chest 5", async () => {
  //   await game.connect(signers[1]).buyChest(5);
  //   await expect(game.connect(signers[1]).buyChest(5)).to.be.reverted;
  // });
});
