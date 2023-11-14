require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();


const API_URL = process.env.API_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
// console.log(API_URL);
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    hardhat: {
      chainId: 1337
    },
    sepolia: {
      url: API_URL,
      accounts: [ PRIVATE_KEY ]
    }
  },
  solidity: "0.8.20",
};
