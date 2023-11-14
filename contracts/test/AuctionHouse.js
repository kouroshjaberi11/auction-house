const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

  
async function deployAuctionHouseFixture() {
  const [owner, ADR1, ADR2] = await ethers.getSigners();

  const NFTCollectionFactory = await ethers.getContractFactory("NFTCollection");
  const NFTCollection = await NFTCollectionFactory.deploy();

  const paymentTokentFactory = await ethers.getContractFactory("AuctionHouseCoin");
  const paymentToken = await paymentTokentFactory.deploy(1000000);
  
  const AuctionHouseFactory = await ethers.getContractFactory("AuctionHouse");
  const AuctionHouse = await AuctionHouseFactory.deploy(paymentToken.getAddress(), NFTCollection.getAddress()); //fill deploy field with constructor details.
  return { AuctionHouse, paymentToken, NFTCollection, owner, ADR1, ADR2 };
}

async function deployAuctionHouseFixtureRoles() {
  const { AuctionHouse, paymentToken, NFTCollection, owner, ADR1, ADR2 } = await deployAuctionHouseFixture();
  await AuctionHouse.addManager(ADR2);
  return { AuctionHouse, paymentToken, NFTCollection, owner, ADR1, ADR2 };
}


// Deploy contracts and mint 1 NFT
async function deployAuctionHouseFixtureMint() {
  const { AuctionHouse, paymentToken, NFTCollection, owner, ADR1, ADR2 } = await deployAuctionHouseFixture();

  await NFTCollection.mint("KungFuPanda", "everybody was kung fu fighting", 
        "https://bafkreiefi3swi6ngt2h4ncdxv2vkgdiz6f5q2eouuvngyx7fr5ppqpsxyu.ipfs.nftstorage.link/");
  return { AuctionHouse, paymentToken, NFTCollection, owner, ADR1, ADR2 };
}

// deploy contracts, mint 1 NFT, create auction
async function deployAuctionHouseFixtureAuction() {
  const { AuctionHouse, paymentToken, NFTCollection, owner, ADR1, ADR2 } = await deployAuctionHouseFixtureMint();
  // Let auction house transfer NFT
  await NFTCollection.approve(await AuctionHouse.getAddress(), 0);

  let endAuction = Math.floor(Date.now() / 1000) + 3600;
  await AuctionHouse.createAuction(0, 50, endAuction);
  return { AuctionHouse, paymentToken, NFTCollection, owner, ADR1, ADR2 };
}

// deploy contracts, mint 1 NFT, create auction, 1 bid.
async function deployAuctionHouseFixtureBid() {
  const { AuctionHouse, paymentToken, NFTCollection, owner, ADR1, ADR2 } = await deployAuctionHouseFixtureAuction();

  await paymentToken.connect(ADR1).approve(AuctionHouse.getAddress(), 10000);
  await paymentToken.connect(owner).approve(AuctionHouse.getAddress(), 100000);
  await paymentToken.transfer(ADR1.address, 10000);
  await AuctionHouse.connect(ADR1).bid(0, 50);
  await AuctionHouse.addManager(ADR2);

  return { AuctionHouse, paymentToken, NFTCollection, owner, ADR1, ADR2 };
}

describe("Auction House Contract Tests", () => {
  describe("Admin Tests", () => {
    it("Failure - change admin", async () => {
      const { AuctionHouse, ADR2 } = await loadFixture(deployAuctionHouseFixtureRoles);
      await expect(AuctionHouse.connect(ADR2).changeAdmin(ADR2)).to.be.revertedWith("Only admin can change the admin address");
    });

    it("Success - change admin", async () => {
      const { AuctionHouse, owner, ADR2 } = await loadFixture(deployAuctionHouseFixtureRoles);
      await AuctionHouse.connect(owner).changeAdmin(ADR2);
      expect(await AuctionHouse.isAdmin(owner)).to.equal(false);
      expect(await AuctionHouse.isAdmin(ADR2)).to.equal(true);
    });

    it("Failure - add manager invalid caller", async () => {
      const { AuctionHouse, ADR1, ADR2 } = await loadFixture(deployAuctionHouseFixtureRoles);
      await expect(AuctionHouse.connect(ADR2).addManager(ADR1)).to.be.revertedWith("Only admin can add manager");
    });

    it("Failure - add manager adding non-manager", async () => {
      const { AuctionHouse, owner, ADR2 } = await loadFixture(deployAuctionHouseFixtureRoles);
      await expect(AuctionHouse.connect(owner).addManager(ADR2)).to.be.revertedWith("Address already belongs to a manager");
    });

    it("Failure - remove manager invalid caller", async () => {
      const { AuctionHouse, ADR2 } = await loadFixture(deployAuctionHouseFixtureRoles);
      await expect(AuctionHouse.connect(ADR2).removeManager(ADR2)).to.be.revertedWith("Only admin can remove manager");
    });

    it("Failure - remove manager removing non-manager", async () => {
      const { AuctionHouse, owner, ADR1 } = await loadFixture(deployAuctionHouseFixtureRoles);
      await expect(AuctionHouse.connect(owner).removeManager(ADR1)).to.be.revertedWith("Address does not belong to a manager");
    });

    it("Success - add manager", async () => {
      const { AuctionHouse, owner, ADR1 } = await loadFixture(deployAuctionHouseFixtureRoles);
      await AuctionHouse.connect(owner).changeAdmin(ADR1);
      await AuctionHouse.connect(ADR1).addManager(owner);

      expect(await AuctionHouse.isManager(owner)).to.equal(true);
    });

    it("Success - remove manager", async () => {
      const { AuctionHouse, owner, ADR1, ADR2 } = await loadFixture(deployAuctionHouseFixtureRoles);
      await AuctionHouse.connect(owner).changeAdmin(ADR1);
      await AuctionHouse.connect(ADR1).removeManager(ADR2);

      expect(await AuctionHouse.isManager(ADR2)).to.equal(false);
    });

    it("Failure - Invalid role to set fee", async () => {
      const { AuctionHouse, ADR1 } = await loadFixture(deployAuctionHouseFixture);
      await expect(AuctionHouse.connect(ADR1).setFee(20)).to.be.revertedWith("Only admin/manager can update the fee price");
    });

    it("Success - check that manager and admin can set fee", async () => {
      const { AuctionHouse, owner, ADR2 } = await loadFixture(deployAuctionHouseFixtureRoles);
      await AuctionHouse.connect(ADR2).setFee(20);
      let newFee = await AuctionHouse.getFee();
      expect(newFee).to.equal(20);
      await AuctionHouse.connect(owner).setFee(22);
      newFee = await AuctionHouse.getFee();
      expect(newFee).to.equal(22)
    });

    it("Failure - withdraw fees invalid caller", async () => {
      const { AuctionHouse, ADR1 } = await loadFixture(deployAuctionHouseFixture);
      await expect(AuctionHouse.connect(ADR1).withdrawFees(1)).to.be.revertedWith("Only admin/manager can withdraw fees");
    });

    it ("Failure - withdraw fees with invalid amt", async () => {
      const { AuctionHouse, ADR2 } = await loadFixture(deployAuctionHouseFixtureBid);
      await expect(AuctionHouse.connect(ADR2).withdrawFees(0)).to.be.revertedWith("Withdrawal amount must be greater than 0 and less than or equal to the AUC in the contract");
    });

    it ("Failure - withdraw fees - amount too high", async () => {
      const { AuctionHouse, paymentToken, owner, ADR2 } = await loadFixture(deployAuctionHouseFixtureBid);
      await AuctionHouse.endAuctionForce(0);
      let newBal = await paymentToken.balanceOf(owner);
      // owner of item sells for 50 - 1 is removed by fee - originally had 990000
      expect(newBal).to.equal(990049);
      await expect(AuctionHouse.connect(ADR2).withdrawFees(2)).to.be.revertedWith("Withdrawal amount must be greater than 0 and less than or equal to the AUC in the contract");
    });

    it ("Success - withdraw fees manager", async () => {
      const { AuctionHouse, paymentToken, owner, ADR2 } = await loadFixture(deployAuctionHouseFixtureBid);
      await AuctionHouse.endAuctionForce(0);
      let newBal = await paymentToken.balanceOf(owner);
      // owner of item sells for 50 - 1 is removed by fee - originally had 990000
      expect(newBal).to.equal(990049);
      // contract has 1 AUC
      await AuctionHouse.connect(ADR2).withdrawFees(1);
      newBal = await paymentToken.balanceOf(owner);
      const houseBal = await paymentToken.balanceOf(await AuctionHouse.getAddress());
      expect(newBal).to.equal(990050);
      expect(houseBal).to.equal(0);
    });

    it ("Success - withdraw fees manager more than 1", async () => {
      const { AuctionHouse, paymentToken, owner, ADR2 } = await loadFixture(deployAuctionHouseFixtureBid);
      await AuctionHouse.bid(0, 1000);
      await AuctionHouse.endAuctionForce(0);
      let newBal = await paymentToken.balanceOf(owner);
      expect(newBal).to.equal(989975);
      //contract has 50 AUC
      await AuctionHouse.connect(ADR2).withdrawFees(1);
      newBal = await paymentToken.balanceOf(owner);
      const houseBal = await paymentToken.balanceOf(await AuctionHouse.getAddress());
      expect(newBal).to.equal(989976);
      expect(houseBal).to.equal(24);
    });

    it ("Success - withdraw fees admin", async () => {
      const { AuctionHouse, paymentToken, owner, ADR2 } = await loadFixture(deployAuctionHouseFixtureBid);
      await AuctionHouse.endAuctionForce(0);
      let newBal = await paymentToken.balanceOf(owner);
      // owner of item sells for 50 - 1 is removed by fee - originally had 990000
      expect(newBal).to.equal(990049);
      // contract has 1 AUC
      await AuctionHouse.connect(owner).withdrawFees(1);
      newBal = await paymentToken.balanceOf(owner);
      const houseBal = await paymentToken.balanceOf(await AuctionHouse.getAddress());
      expect(newBal).to.equal(990050);
      expect(houseBal).to.equal(0);
    });
  });

  describe("Deployment", () => {
    it("Should have appropriate values for payment token, NFTCollection, and _nextTokenId", async () => {
      const { AuctionHouse, paymentToken, NFTCollection } = await loadFixture(deployAuctionHouseFixture);
      expect(AuctionHouse._addressNFTCollection).to.equal(NFTCollection.address);
      expect(AuctionHouse._addressPaymentToken).to.equal(paymentToken.address);
      expect(await AuctionHouse.getCurrentToken()).to.equal(0);
    });
  });

  describe("Create Auction", () => {
    describe("Failures", async () => {
      const endAuction = Math.floor(Date.now() / 1000) + 3600;
      it ("Reject auction due to caller not being owner of the NFT", async () => {
        const { AuctionHouse, ADR1 } = await loadFixture(deployAuctionHouseFixtureMint);

        await expect(AuctionHouse.connect(ADR1).createAuction(0, 50, endAuction)).to.be.revertedWith("Caller is not the owner of NFT");
      });

      it ("Reject auction due to no approval for auction house", async () => {
        const { AuctionHouse } = await loadFixture(deployAuctionHouseFixtureMint);
        await expect(AuctionHouse.createAuction(0, 50, endAuction)).to.be.revertedWith("Require NFT ownership transfer approval");
      });

      it ("Reject auction due to invalid bid price", async () => {
        const { AuctionHouse } = await loadFixture(deployAuctionHouseFixtureMint);
        await expect(AuctionHouse.createAuction(0, 0, endAuction)).to.be.revertedWith("Invalid starting bid price");
      });

      it ("Reject auction due to invalid end time", async () => {
        const { AuctionHouse } = await loadFixture(deployAuctionHouseFixtureMint);
        await expect(AuctionHouse.createAuction(0, 50, 2023333)).to.be.revertedWith("Invalid end time for auction");
      });

      it ("Reject auction due to non-minted NFT id", async () => {
        const { AuctionHouse } = await loadFixture(deployAuctionHouseFixtureMint);
        await expect(AuctionHouse.createAuction(1, 50, endAuction)).to.be.revertedWith("Invalid NFT ID");
      })
    });

    describe ("Success", () => {
      const endAuction = Math.floor(Date.now() / 1000) + 3600;

      it ("Check auction is created and has appropriate owner", async () => {
        const { AuctionHouse, NFTCollection, owner } = await loadFixture(deployAuctionHouseFixtureMint);
        const houseAddress = await AuctionHouse.getAddress()
        await NFTCollection.approve(houseAddress, 0);
        const currentOwner = await NFTCollection.ownerOf(0);
        expect(currentOwner).to.equal(owner.address);
        await AuctionHouse.createAuction(0, 50, endAuction);
        const currentBid = await AuctionHouse.getCurrentBid(0);
        const houseOwner = await NFTCollection.ownerOf(0);
        expect(currentBid).to.equal(50);
        expect(houseOwner).to.equal(houseAddress);
      });
    });
  });

  describe ("Bidding", () => {
    describe("Failures", () => {
      it("Reject bid due to incorrect auction id", async () => {
        const { AuctionHouse, ADR1 } = await loadFixture(deployAuctionHouseFixtureAuction);
        await expect(AuctionHouse.connect(ADR1).bid(1, 51)).to.be.revertedWith("Auction does not exist");
      });
      it("Reject due to invalid bid amount", async () => {
        const { AuctionHouse, ADR1 } = await loadFixture(deployAuctionHouseFixtureAuction);
        await expect(AuctionHouse.connect(ADR1).bid(0, 49)).to.be.revertedWith("Invalid bid amount");
      });
      it("Reject due to auction house not having approval for token transfer", async () => {
        const { AuctionHouse, ADR1 } = await loadFixture(deployAuctionHouseFixtureAuction);
        expect(AuctionHouse.connect(ADR1).bid(0, 51)).to.be.revertedWith("");
      });
      it("Reject due to insufficient funds", async () => {
        const { AuctionHouse, paymentToken,  ADR1 } = await loadFixture(deployAuctionHouseFixtureAuction);
        await paymentToken.connect(ADR1).approve(await AuctionHouse.getAddress(), 10000);
        await expect(AuctionHouse.connect(ADR1).bid(0, 51)).to.be.revertedWith("Not enough funds");
      })
    });
    
    describe("Success", () => {
      it("Check bid exists with appropriate values", async () => {
        const { AuctionHouse, paymentToken, ADR1, ADR2 } = await loadFixture(deployAuctionHouseFixtureBid);
        const houseAddress = await AuctionHouse.getAddress();
        
        let bal1 = await paymentToken.balanceOf(ADR1.address);
        let houseBal = await paymentToken.balanceOf(houseAddress);

        let currentBidOwner = await AuctionHouse.getCurrentBidOwner(0);
        let currentBid = await AuctionHouse.getCurrentBid(0);
        let currentBidCount = await AuctionHouse.getCurrentBidCount(0);

        expect(bal1).to.equal(9950);
        expect(houseBal).to.equal(50);
        expect(currentBid).to.equal(50);
        expect(currentBidOwner).to.equal(ADR1.address);
        expect(currentBidCount).to.equal(1);

        //check that doing another bid works
        await paymentToken.connect(ADR2).approve(houseAddress, 1000);
        await paymentToken.transfer(ADR2.address, 1000);
        await AuctionHouse.connect(ADR2).bid(0, 1000);

        bal1 = await paymentToken.balanceOf(ADR1.address);
        houseBal = await paymentToken.balanceOf(houseAddress);
        const bal2 = await paymentToken.balanceOf(ADR2.address);

        currentBidOwner = await AuctionHouse.getCurrentBidOwner(0);
        currentBid = await AuctionHouse.getCurrentBid(0);
        currentBidCount = await AuctionHouse.getCurrentBidCount(0);

        expect(bal1).to.equal(10000);
        expect(bal2).to.equal(0);
        expect(houseBal).to.equal(1000);
        expect(currentBid).to.equal(1000);
        expect(currentBidOwner).to.equal(ADR2.address);
        expect(currentBidCount).to.equal(2);
      });
    });
  });

  describe("End Auction", () => {
    describe("Success", () => {
      it ("Check all values are appropriate on success", async () => {
        const { AuctionHouse, NFTCollection, paymentToken, owner, ADR1 } = await loadFixture(deployAuctionHouseFixtureBid);
        await AuctionHouse.connect(owner).endAuctionForce(0);
        const newOwner = await NFTCollection.ownerOf(0);
        const sellerBal = await paymentToken.balanceOf(owner);
        const buyerBal = await paymentToken.balanceOf(newOwner);
        const houseBal = await paymentToken.balanceOf(await AuctionHouse.getAddress());
        expect(buyerBal).to.equal(9950);
        expect(newOwner).to.equal(ADR1.address);
        // seller(owner) starts with 1000000 - gives 10000 - gets 49 for sale of NFT with fee deducted
        expect(sellerBal).to.equal(990049);
        expect(houseBal).to.equal(1);
      });
      it ("Check all values are appropriate - No bid", async () => {
        const { AuctionHouse, NFTCollection, paymentToken, owner } = await loadFixture(deployAuctionHouseFixtureAuction.bind(null, true));
        await time.increase(3600);
        await AuctionHouse.connect(owner).endAuctionForce(0);
        const newOwner = await NFTCollection.ownerOf(0);
        expect(newOwner).to.equal(owner.address);
        const houseBal = await paymentToken.balanceOf(await AuctionHouse.getAddress());
        expect(houseBal).to.equal(0);
      });
    });

    describe("Failures", () => {
      it ("Reject due to invalid user ending auction", async () => {
        const { AuctionHouse, ADR1 } = await loadFixture(deployAuctionHouseFixtureBid);
        await expect(AuctionHouse.connect(ADR1).endAuctionForce(0)).to.be.revertedWith("Auction can only be ended by seller");
      });

      it ("Reject due to auction already being over", async () => {
        const { AuctionHouse, owner } = await loadFixture(deployAuctionHouseFixtureBid);
        await AuctionHouse.connect(owner).endAuctionForce(0);
        await expect(AuctionHouse.connect(owner).endAuctionForce(0)).to.be.revertedWith("Auction is already complete, rewards have been claimed");
      });

      it ("No bids placed on auction", async () => {
        const { AuctionHouse, owner } = await loadFixture(deployAuctionHouseFixtureAuction);
        await expect(AuctionHouse.connect(owner).endAuctionForce(0)).to.be.revertedWith("There must be at least one bid placed before claiming auction rewards");
      });
    });
  });
  
  describe("Claim Item", () => {
    describe("Success", () => {
      it ("Check all values are appropriate", async () => {
        const { AuctionHouse, NFTCollection, paymentToken, owner, ADR1, ADR2 } = await loadFixture(deployAuctionHouseFixtureBid);
        await time.increase(3600);
        await AuctionHouse.connect(ADR2).claimItem(0);
        const newOwner = await NFTCollection.ownerOf(0);
        const sellerBal = await paymentToken.balanceOf(owner);
        const buyerBal = await paymentToken.balanceOf(newOwner);
        const houseBal = await paymentToken.balanceOf(await AuctionHouse.getAddress());
        expect(buyerBal).to.equal(9950);
        expect(newOwner).to.equal(ADR1.address);
        // seller(owner) starts with 1000000 - gives 10000 - gets 49 for sale of NFT with fee deducted
        expect(sellerBal).to.equal(990049);
        expect(houseBal).to.equal(1);
      });
    });

    describe("Failures", () => {
      it("Reject due to auction is still open", async () => {
        const { AuctionHouse, ADR2 } = await loadFixture(deployAuctionHouseFixtureBid);
        await expect(AuctionHouse.connect(ADR2).claimItem(0)).to.be.revertedWith("Auction is still ongoing");
      });

      it ("Reject due to items already being claimed", async () => {
        const { AuctionHouse, NFTCollection, paymentToken, ADR2, ADR1 } = await loadFixture(deployAuctionHouseFixtureBid);
        await time.increase(3600);
        await AuctionHouse.connect(ADR2).claimItem(0);
        await expect(AuctionHouse.connect(ADR1).claimItem(0)).to.be.revertedWith("Auction is already complete, rewards have been claimed")
      });
      //other test cases for failure have been covered in End Auction
    });
  });

  describe("Cancel Auction", () => {
    describe("Failures", () => {
      it("Reject due to non-owner calling cancel", async () => {
        const { AuctionHouse, ADR1 } = await loadFixture(deployAuctionHouseFixtureBid);
        await expect(AuctionHouse.connect(ADR1).cancelAuction(0)).to.be.revertedWith("Cancellation can only happen by auction creator");
      });

      it ("Reject due to item no longer being up for auction.", async () => {
        const { AuctionHouse, owner } = await loadFixture(deployAuctionHouseFixtureBid);
        await time.increase(3600);
        await expect(AuctionHouse.connect(owner).cancelAuction(0)).to.be.revertedWith("Item is not up for auction");
      });
    });

    describe("Success", () => {
      it("Check all values appropriate - No bids", async () => {
        const { AuctionHouse, NFTCollection, owner } = await loadFixture(deployAuctionHouseFixtureAuction);
        await AuctionHouse.connect(owner).cancelAuction(0);
        const newOwner = await NFTCollection.ownerOf(0);
        expect(newOwner).to.equal(owner.address);
      });

      it("Check all values appropriate - bids", async () => {
        const { AuctionHouse, NFTCollection, paymentToken, owner, ADR1 } = await loadFixture(deployAuctionHouseFixtureBid);
        await AuctionHouse.connect(owner).cancelAuction(0);
        const newOwner = await NFTCollection.ownerOf(0);
        const bal1 = await paymentToken.balanceOf(ADR1.address);
        expect(newOwner).to.equal(owner.address);
        expect(bal1).to.equal(10000);
      });
    });
  });

  describe("Get open auctions", () => {
    it("Return 1 auction", async () => {
      const { AuctionHouse, owner } = await loadFixture(deployAuctionHouseFixtureBid);
      const res = await AuctionHouse.getUnclaimedAuctions();
      expect(res.length).to.equal(1);
    });
  });

  describe("Lower Starting Price", () => {
    describe("Failures", () => {
      it ("Reject due to new bid has already been placed", async () => {
        const { AuctionHouse, owner } = await loadFixture(deployAuctionHouseFixtureBid);
        await expect(AuctionHouse.connect(owner).lowerStartingPrice(0, 45)).to.be.revertedWith("Cannot lower, bid has already been placed");
      });

      it ("Reject due to new bid is not less than previous starting bid", async () => {
        const { AuctionHouse, owner } = await loadFixture(deployAuctionHouseFixtureAuction);
        await expect(AuctionHouse.connect(owner).lowerStartingPrice(0, 50)).to.be.revertedWith("new price must be between 0 and the previous starting bid (exclusive)");
      });

      it ("Reject due to new bid is less than or equal to 0", async () => {
        const { AuctionHouse, owner } = await loadFixture(deployAuctionHouseFixtureAuction);
        await expect(AuctionHouse.connect(owner).lowerStartingPrice(0, 0)).to.be.revertedWith("new price must be between 0 and the previous starting bid (exclusive)");
      });

      it ("Reject due to non-owner lowering price", async () => {
        const { AuctionHouse, ADR1 } = await loadFixture(deployAuctionHouseFixtureAuction);
        await expect(AuctionHouse.connect(ADR1).lowerStartingPrice(0, 45)).to.be.revertedWith("Only creator can change starting bid");
      });
    });

    describe("Success", () => {
      it ("Check values are appropriate", async () => {
        const { AuctionHouse, owner } = await loadFixture(deployAuctionHouseFixtureAuction);
        await AuctionHouse.connect(owner).lowerStartingPrice(0, 45);
        const currentBid = await AuctionHouse.getCurrentBid(0);
        expect(currentBid).to.equal(45);
      });
    });
  });
});

