import { expect } from "chai";
import { Signer, BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { text } from "node:stream/consumers";
import { addressTestnet } from "../config/address";
import { priceToFight } from "../config/wiki";
import {
  AngelsCreedToken,
  BNBHCharacter,
  BNBHero,
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

// const randomTable = createRandomTable(62, 32, 5, 1);
// const randomTable2 = createRandomTable(49, 43, 7, 1);
// const randomTable3 = createRandomTable(40, 42, 16, 2);
const randomTable4 = createRandomTable(50, 40, 9, 1);
const randomTable5 = createRandomTable(42, 38, 15, 5);
const randomTable6 = createRandomTable(20, 44, 28, 8);

let signers: Signer[];
let game: BNBHero;
let angel: AngelsCreedToken;
let creed: GemToken;
let character: BNBHCharacter;

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

    const Character = await ethers.getContractFactory("BNBHCharacter");
    character = (await Character.connect(deployer).deploy()) as BNBHCharacter;

    const Game = await ethers.getContractFactory("BNBHero");
    game = await Game.connect(deployer).deploy(
      angel.address,
      creed.address,
      character.address
    );
  });

  it("set game admin", async () => {
    await character.connect(deployer).setGameAdmin(game.address);
    await character.connect(deployer).setGameAdmin(await deployer.getAddress());
  });

  it("set random table", async () => {
    // await character.connect(deployer).setRandomTableWithEggType(0, randomTable);
    // await character
    //   .connect(deployer)
    //   .setRandomTableWithEggType(1, randomTable2);
    // await character
    //   .connect(deployer)
    //   .setRandomTableWithEggType(2, randomTable3);
    await character
      .connect(deployer)
      .setRandomTableWithEggType(3, randomTable4);
    await character
      .connect(deployer)
      .setRandomTableWithEggType(4, randomTable5);
    await character
      .connect(deployer)
      .setRandomTableWithEggType(5, randomTable6);
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

  it("Should set eggs", async () => {
    await game
      .connect(deployer)
      .setEggs(0, [ethers.utils.parseEther("100"), 10000]);
    await game
      .connect(deployer)
      .setEggs(1, [ethers.utils.parseEther("100"), 10000]);
    await game
      .connect(deployer)
      .setEggs(2, [ethers.utils.parseEther("100"), 10000]);
    await game
      .connect(deployer)
      .setEggs(3, [ethers.utils.parseEther("100"), 10000]);
    await game
      .connect(deployer)
      .setEggs(4, [ethers.utils.parseEther("100"), 10000]);

    await game
      .connect(deployer)
      .setEggs(5, [ethers.utils.parseEther("100"), 10000]);
  });
  it("Should add heros", async () => {
    // await character.connect(deployer).addHero(0);
    // await character.connect(deployer).addHero(0);
    // await character.connect(deployer).addHero(1);
    // await character.connect(deployer).addHero(2);
    // await character.connect(deployer).addHero(3);
    // await character.connect(deployer).addHero(3);
    (await character.connect(deployer).setHeroTypeLength(0, 2)).wait();
    (await character.connect(deployer).setHeroTypeLength(1, 1)).wait();
    (await character.connect(deployer).setHeroTypeLength(2, 1)).wait();
    (await character.connect(deployer).setHeroTypeLength(3, 2)).wait();
  });

  it("Should sett max egg each user", async function () {
    await game.connect(deployer).setMaxEggUserCanBuy(10000);
  });

  it("Should buy eggs", async () => {
    // User 1 : 1,3,4
    // User 2 : 2
    const hero = [];
    for (let i = 0; i < 300; i++) {
      await network.provider.send("evm_increaseTime", [SECOND_IN_MONTH]);
      await network.provider.send("evm_mine");
      const tx = await game.connect(signers[1]).buyEgg(3);
      const result: any = await tx?.wait();
      if (result.events[3].args.heroRarity.toString() === "0")
        hero.push(result.events[3].args.heroName.toString());
    }
    const rate = [];
    let total = 0;
    for (let i = 0; i < 2; i++) {
      const amount = hero.reduce((prev, cur) => {
        if (cur === i.toString()) return ++prev;
        return prev;
      }, 0);
      rate.push(amount);
      total += amount;
      console.log(`amount ${i} ${amount}`);
    }
    // rate.forEach((r, index) => {
    //   console.log(`rate ${index} ${(r / total) * 100}`);
    // });
  });

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

  // it("Should buy egg with user 2", async () => {
  //   await game.connect(signers[2]).buyEgg(0);
  //   await game.connect(signers[2]).buyEgg(0);

  //   const tokenIds1 = await character.tokensOfOwner(users[2]);
  //   console.log("tokenIds1", tokenIds1);
  // });
  // it("Should buy egg with user 1", async () => {
  //   await game.connect(signers[1]).buyEgg(0);
  //   await game.connect(signers[1]).buyEgg(0);

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

  // it("Should out of egg 5", async () => {
  //   await game.connect(signers[1]).buyEgg(5);
  //   await expect(game.connect(signers[1]).buyEgg(5)).to.be.reverted;
  // });
});
