import { ethers } from "ethers";

export const priceToFight = [
  ethers.utils.parseEther("500"),
  ethers.utils.parseEther("600"),
  ethers.utils.parseEther("700"),
  ethers.utils.parseEther("800"),
  ethers.utils.parseEther("800"),
  ethers.utils.parseEther("800"),
  ethers.utils.parseEther("800"),
  ethers.utils.parseEther("1000"),
  ethers.utils.parseEther("1100"),
  ethers.utils.parseEther("1200"),
];

export const createRandomTable = () => {
  const randomTable: number[] = [];
  for (let i = 0; i < 55; i++) {
    randomTable.push(0);
  }
  for (let i = 0; i < 35; i++) {
    randomTable.push(1);
  }
  for (let i = 0; i < 8; i++) {
    randomTable.push(2);
  }
  for (let i = 0; i < 2; i++) {
    randomTable.push(3);
  }

  return randomTable;
};
