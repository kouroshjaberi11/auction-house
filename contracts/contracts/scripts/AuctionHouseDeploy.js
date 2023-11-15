const hre = require("hardhat");
const fs = require("fs");
require('dotenv').config();

async function deploy(params) {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account: ", deployer.address);

  const AHFactory = await hre.ethers.getContractFactory("AuctionHouse");

  const AH = await AHFactory.deploy(...params);

  console.log(AH.address);

  console.log("Auction House DEPLOYED");
  const data = {
    address: AH.address,
    abi: JSON.parse(AH.interface.formatJson())
  }

  fs.writeFileSync('./src/AuctionHouse.json', JSON.stringify(data));
}

deploy([process.env.COIN_CONTRACT, process.env.NFTCOLLECTION_CONTRACT]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});