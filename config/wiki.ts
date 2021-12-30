import { ethers, BigNumber } from "ethers";

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

export const createRandomTable = (
  n: number,
  r: number,
  sr: number,
  ssr: number
) => {
  if (n + r + sr + ssr !== 100) throw new Error("error");
  const randomTable: number[] = [];
  for (let i = 0; i < n; i++) {
    randomTable.push(0);
  }
  for (let i = 0; i < r; i++) {
    randomTable.push(1);
  }
  for (let i = 0; i < sr; i++) {
    randomTable.push(2);
  }
  for (let i = 0; i < ssr; i++) {
    randomTable.push(3);
  }

  return randomTable;
};
