// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AuctionHouseCoin.sol";
import "./NFTCollection.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AuctionHouse is IERC721Receiver, AccessControl {
    /// admin of the auction house
    address payable admin;

    /// the manager role
    bytes32 public constant MANAGER = keccak256("MANAGER");

    uint256 private _nextTokenId;

    /// Address for the ERC20 contract for AUC
    address private _addressPaymentToken;

    /// Address for the ERC721 contract for the NFCollection
    address private _addressNFTCollection;
 
    /// is a 10x the percentage (ie. 25 --> 2.5%)
    uint256 fee = 25;
    uint256 feesAccumulated = 0;
    
    constructor(address addressPaymentToken, address addressNFTCollection) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        admin = payable(msg.sender);
        _addressNFTCollection = addressNFTCollection;
        _addressPaymentToken = addressPaymentToken;
    }

    /// Auction object for auctions
    struct Auction {
        uint256 id; /// Auction Index
        uint256 nftId; /// NFT Id
        uint256 fee;   /// Fee for the auction
        address creator; /// Creator of the Auction
        address payable currentBidOwner; /// Address of the highest bider
        uint256 currentBidPrice; /// Current highest bid for the auction
        uint256 endAuction; /// Timestamp for the end day&time of the auction
        bool complete;      /// whether an auction is complete or not (rewards claimed)
        uint256 bidCount; /// Number of bid placed on the auction
    }

    mapping(uint256 => Auction) private idToAuction;

    /// Set fee by manager or admin only
    function setFee(uint256 newFee) public payable {
        require(hasRole(MANAGER, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Only admin/manager can update the fee price");
        fee = newFee;
    }

    function getFee() public view returns (uint256) {
        return fee;
    }

    /// Change admin only by admin
    /// @param newAddress is the new admin address
    function changeAdmin(address newAddress) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Only admin can change the admin address");
        grantRole(DEFAULT_ADMIN_ROLE, newAddress);
        renounceRole(DEFAULT_ADMIN_ROLE, msg.sender);
        admin = payable(newAddress);
    }

    /// Check that address is an admin
    function isAdmin(address _address) external view returns (bool) {
        if (hasRole(DEFAULT_ADMIN_ROLE, _address)) return true;
        return false;
    }

    /// Check that manager is an admin
    function isManager(address _address) external view returns (bool) {
        if (hasRole(MANAGER, _address)) return true;
        return false;
    }

    /// Add a manager - only done by admin
    /// @param adr address of new manager
    function addManager(address adr) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Only admin can add manager");
        require(!hasRole(MANAGER, adr), "Address already belongs to a manager");
        grantRole(MANAGER, adr);
    }

    /// remove a manager - only done by admin
    /// @param adr address of manager to remove
    function removeManager(address adr) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Only admin can remove manager");
        require(hasRole(MANAGER, adr), "Address does not belong to a manager");
        revokeRole(MANAGER, adr);
    }

    /// withdraw fees to admin account - done by admin or manager
    /// @param amt is the amount to withdraw
    function withdrawFees(uint256 amt) external {
        require(hasRole(MANAGER, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Only admin/manager can withdraw fees");
        require(amt > 0 && amt <= feesAccumulated, "Withdrawal amount must be greater than 0 and less than or equal to the AUC in the contract");
        ERC20 paymentToken = ERC20(_addressPaymentToken);
        paymentToken.transfer(payable(admin), Math.min(amt, feesAccumulated));
        feesAccumulated = 0;
    }

    /// retrieves data for specifc nft front end
    /// @param auctionId is id of the nft
    function getListedForAuction(uint256 auctionId) external view returns (Auction memory) {
        require(auctionId < _nextTokenId, "Invalid auction Id");
        return idToAuction[auctionId];
    }

    function getCurrentToken() external view returns (uint256) {
        return _nextTokenId;
    }

    function getAddress() external view returns (address) {
        return address(this);
    }

    /// creates an auction
    /// @param _nftId is the existing ID for the NFT
    /// @param _startingBid is the starting bid for new auction
    /// @param _endAuction is the end date&time for the auction
    function createAuction(
        uint256 _nftId,
        uint256 _startingBid,
        uint256 _endAuction
    ) external {
        require(_endAuction > block.timestamp, "Invalid end time for auction");
        require(_startingBid > 0, "Invalid starting bid price");

        /// Not sure if this is necessary, have it in place so that there is no way an item 
        /// can be listed twice, since it would be in possession of the contract on the second time.
        /// So only way that can happen is if the contract invokes the createAuction, 
        /// which I don't know if it can happen, but better safe than sorry.
        require(msg.sender != address(this), "Contract should not invoke this function!");
        
        NFTCollection nftCollection = NFTCollection(_addressNFTCollection);

        require(nftCollection.getCurrentTokenId() > _nftId, "Invalid NFT ID");
        require(nftCollection.ownerOf(_nftId) == msg.sender, "Caller is not the owner of NFT");
        require(nftCollection.getApproved(_nftId) == address(this), "Require NFT ownership transfer approval");


        require(nftCollection.transferNFTFrom(msg.sender, address(this), _nftId));
        
        address payable currentBidOwner = payable(address(0));

        Auction memory newAuction = Auction({
            id: _nextTokenId,
            nftId: _nftId,
            fee: fee,
            creator: msg.sender,
            currentBidOwner: currentBidOwner,
            currentBidPrice: _startingBid,
            endAuction: _endAuction,
            complete: false,
            bidCount: 0
        });

        idToAuction[_nextTokenId] = newAuction;

        _nextTokenId++;
    }

    /// Returns of a list of all unclaimed auctions
    function getUnclaimedAuctions() external view returns (Auction[] memory) {
        uint256 numIncomplete = 0;
        for (uint i = 0; i<_nextTokenId; i++) {
            if (!idToAuction[i].complete) {
                numIncomplete++;
            }
        }

        Auction[] memory auctionsIncomplete = new Auction[](numIncomplete);
        if (numIncomplete == 0) {
            return auctionsIncomplete;
        }
        uint j = 0;
        for (uint i = _nextTokenId-1; i >= 0; i++) {
            if (!idToAuction[i].complete) {
                auctionsIncomplete[j] = idToAuction[i];
                j+=1;
                if (j == numIncomplete) {
                    break;
                }
            }
        }

        return auctionsIncomplete;
    }

    /// Returns of a list of all unclaimed auctions
    function getOpenAuctionsBySender() external view returns (Auction[] memory) {
        uint256 numIncomplete = 0;
        for (uint i = 0; i<_nextTokenId; i++) {
            if (!idToAuction[i].complete && idToAuction[i].creator == msg.sender) {
                numIncomplete++;
            }
        }

        Auction[] memory auctionsIncomplete = new Auction[](numIncomplete);

        if (numIncomplete == 0) {
            return auctionsIncomplete;
        }

        uint j = 0;
        for (uint i = _nextTokenId-1; i >= 0; i++) {
            if (!idToAuction[i].complete && idToAuction[i].creator == msg.sender) {
                auctionsIncomplete[j] = idToAuction[i];
                j+=1;
                if (j == numIncomplete) {
                    break;
                }
            }
        }

        return auctionsIncomplete;
    }

    /// Checks if an auction can still be bid upon.
    function isOpen(uint256 _id) public view returns (bool) {
        require(_id < _nextTokenId, "Auction does not exist");
        Auction storage auction = idToAuction[_id];

        if (block.timestamp >= auction.endAuction || auction.complete) return false;
        return true;
    }

    function getCurrentBidOwner(uint256 _id) public view returns (address) {
        require(_id < _nextTokenId, "Auction does not exist");
        return idToAuction[_id].currentBidOwner;
    }

    function getCurrentBid(uint256 _id) public view returns (uint256) {
        require(_id < _nextTokenId, "Auction does not exist");
        return idToAuction[_id].currentBidPrice;
    }

    function getCurrentBidCount(uint256 _id) public view returns (uint256) {
        require(_id < _nextTokenId, "Auction does not exist");
        return idToAuction[_id].bidCount;
    }

    /// Bid on a new auction
    /// @param _id is the auction _id
    /// @param newBid is the new bid
    /// @return true on successful bid
    function bid(uint256 _id, uint256 newBid) external returns (bool) {
        require(getCurrentBid(_id) < newBid || (idToAuction[_id].bidCount == 0 && newBid == getCurrentBid(_id)), "Invalid bid amount");
        require(isOpen(_id), "Item not for sale.");

        Auction storage auction = idToAuction[_id];

        // Get the AUC token contract
        ERC20 paymentToken = ERC20(_addressPaymentToken);
        require(paymentToken.balanceOf(msg.sender) >= newBid, "Not enough funds");
        require(paymentToken.transferFrom(msg.sender, address(this), newBid), "Transfer of tokens failed");
        
        // return tokens of previous owner
        if (auction.bidCount > 0) {
            paymentToken.transfer(auction.currentBidOwner, auction.currentBidPrice);
        }

        address payable newBidOwner = payable(msg.sender);
        auction.currentBidOwner = newBidOwner;
        auction.currentBidPrice = newBid;
        auction.bidCount++;

        return true;
    }

    /// helper function for ending auction
    function endAuction(uint256 _id) private {
        //require(isOpen(_id), "Item is not up for auction");

        Auction storage auction = idToAuction[_id];
        require(!auction.complete, "Auction is already complete, rewards have been claimed");
        auction.complete = true;
        require(auction.bidCount > 0, "There must be at least one bid placed before claiming auction rewards");

        NFTCollection nftCollection = NFTCollection(_addressNFTCollection);

        require(nftCollection.transferNFTFrom(address(this), auction.currentBidOwner, auction.nftId));

        ERC20 paymentToken = ERC20(_addressPaymentToken);
        
        uint256 transactionFee = Math.max(auction.currentBidPrice * auction.fee / 1000.0, 1);
        require(paymentToken.transfer(auction.creator, auction.currentBidPrice - transactionFee));
        feesAccumulated += transactionFee;
    }

    /// called by any user to send AUC to seller and NFT to buyer - only if auction time is done
    /// @param _id is the id of the auction
    function claimItem(uint256 _id) external {
        require(_id < _nextTokenId, "Auction does not exist");
        require(block.timestamp >= idToAuction[_id].endAuction, "Auction is still ongoing");
        endAuction(_id);
    }

    /// Called by seller to send AUC to seller and NFT to buyer - can be called anytime
    /// @param _id is the id of the auction
    function endAuctionForce(uint256 _id) external {
        require(_id < _nextTokenId, "Auction does not exist");
        // Dont care about auction time being over?
        Auction storage auction = idToAuction[_id];
        require(auction.creator == msg.sender, "Auction can only be ended by seller");

        // in the case that auction time is over, there are no bids, and it has not been ended
        //return NFT to seller, mark auction as complete.
        if (auction.endAuction < block.timestamp && auction.bidCount == 0 && !auction.complete) {
            NFTCollection nftCollection = NFTCollection(_addressNFTCollection);

            require(nftCollection.transferNFTFrom(address(this), auction.creator, _id));
            auction.complete = true;
            return;
        }
        endAuction(_id);
    }

    /// Cancel an active auction
    /// @param _id is the id of the auction
    function cancelAuction(uint256 _id) external {
        require(_id < _nextTokenId, "Auction does not exist");
        Auction storage auction = idToAuction[_id];
        
        require(isOpen(_id), "Item is not up for auction");

        require(auction.creator == msg.sender, "Cancellation can only happen by auction creator");

        NFTCollection nftCollection = NFTCollection(_addressNFTCollection);

        require(nftCollection.transferNFTFrom(address(this), auction.creator, _id));
        // Bid was placed; return tokens
        if (auction.bidCount != 0) {
            ERC20 paymentToken = ERC20(_addressPaymentToken);
            require(paymentToken.transfer(auction.currentBidOwner, auction.currentBidPrice));
        }

        auction.complete = true;
    }

    /// Lower starting price of an auction if no bids placed
    /// @param _id is the id of the auction
    /// @param newPrice is the new starting bid
    function lowerStartingPrice(uint256 _id, uint256 newPrice) external {
        require(_id < _nextTokenId, "Auction does not exist");
        require(isOpen(_id), "Item is not up for auction");

        Auction storage auction = idToAuction[_id];
        
        require(auction.bidCount == 0, "Cannot lower, bid has already been placed");
        require(auction.currentBidPrice > newPrice && newPrice > 0, "new price must be between 0 and the previous starting bid (exclusive)");
        require(auction.creator == msg.sender, "Only creator can change starting bid");

        auction.currentBidPrice = newPrice;
    }


    /// required by solidity
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}