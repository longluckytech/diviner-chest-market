import { Signer } from "ethers";
import { ethers } from "hardhat";
import { SendToken } from "../../../typechain";

// const initialSetup = async () => {
//   await setGameAdmin();

//   await setRandomTable();

//   await setStatHero();

//   await createNewHero();
// };

const main = async () => {
  const fac = await ethers.getContractFactory("SendToken");
  const sendToken = await fac.deploy();
  console.log("sendToken", sendToken.address);

  // const sendToken = await fac.attach(
  //   "0x04FfBB7a3226922119F32A7D6E8160774837DF21"
  // );

  // await sendToken.estimateGas.total();
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
