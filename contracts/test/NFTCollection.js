const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployNFTCollectionFixture () {
  const [owner, ADR1, ADR2] = await ethers.getSigners();
  const NFTCollectionFactory = await ethers.getContractFactory("NFTCollection");
  const NFTCollection = await NFTCollectionFactory.deploy();

  return { NFTCollection, owner, ADR1, ADR2 }
}

// Don't need in depth tests as mint and transferNFTFrom are mostly reliant on ERC721 functions.
describe("NFTCollection Contract", () => {
  describe("Mint NFT - Success", () => {
    it("Can mint new NFT ", async () => {
      const { NFTCollection, owner, adr1, adr2 } = await loadFixture(deployNFTCollectionFixture);

      await NFTCollection.mint("KungFuPanda", "https://bafkreiefi3swi6ngt2h4ncdxv2vkgdiz6f5q2eouuvngyx7fr5ppqpsxyu.ipfs.nftstorage.link/");

      expect(await NFTCollection.ownerOf(0)).to.equal(owner.address);
    });
  });

  describe("transferNFTFrom - Success", () => {
    it("can mint and transfer an NFT from one address to another", async () => {
      const { NFTCollection, owner, ADR1, ADR2 } = await loadFixture(deployNFTCollectionFixture);

      await NFTCollection.mint("KungFuPanda", "https://bafkreiefi3swi6ngt2h4ncdxv2vkgdiz6f5q2eouuvngyx7fr5ppqpsxyu.ipfs.nftstorage.link/");
      expect(await NFTCollection.ownerOf(0)).to.equal(owner.address);
      await NFTCollection.approve(ADR2.address, 0);
      await NFTCollection.connect(ADR2).transferNFTFrom(
        owner.address,
        ADR1.address,
        0
      );
      const ownerNFTTransfer = await NFTCollection.ownerOf(0);
      expect(ownerNFTTransfer).to.equal(ADR1.address);
    });
  })
});


