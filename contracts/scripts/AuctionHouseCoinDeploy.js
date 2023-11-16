const hre = require("hardhat");
const fs = require("fs")

async function deploy(params) {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account: ", deployer.address);

  const AUCFactory = await hre.ethers.getContractFactory("AuctionHouseCoin");

  const AUC = await AUCFactory.deploy(...params);

  //does not work: await NFTCollection.deployed();

  console.log("Auction House Coin DEPLOYED");
  const data = {
    address: AUC.address,
    abi: JSON.parse(AUC.interface.formatJson())
  }

  fs.writeFileSync('./src/AuctionHouseCoin.json', JSON.stringify(data));
}

deploy(["100000000000000000000000000"]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});