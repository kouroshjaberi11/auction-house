const hre = require("hardhat");
const fs = require("fs")

async function deploy() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account: ", deployer.address);

  // const balance = await deployer.getBalance();
  // console.log(balance);
  const NFTCollFactory = await hre.ethers.getContractFactory("NFTCollection");

  const NFTCollection = await NFTCollFactory.deploy();

  // Does not work for some reason await NFTCollection.deployed();
  console.log(NFTCollection.address);

  console.log("NFT MARKETPLACE DEPLOYED");
  const data = {
    address: NFTCollection.address,
    abi: JSON.parse(NFTCollection.interface.formatJson())
  }

  fs.writeFileSync('./src/NFTCollection.json', JSON.stringify(data));
}

deploy("NFTCollection", []).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
