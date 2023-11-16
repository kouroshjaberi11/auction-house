// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/// @title The collection of NFTs to be used by the auction house
/// @author Kourosh Jaberi
contract NFTCollection is ERC721, ERC721URIStorage {

    /// Next ID for a new NFT
    uint256 private _nextTokenId;

    constructor () ERC721("AuctionHouse", "AUT") {}

    struct NFT {
        uint256 id;                /// token id
        string name;               /// name of NFT
        string description;         /// NFT descripion
        string uri;                /// uri of NFT stored on NFT storage IPFS
    }

    mapping(uint256 => NFT) private idToNFT;

    event Mint(uint256 tokenId, address indexed mintedBy);

    /// @param name of NFT
    /// @param uri of NFT
    /// creates and stores a new NFT
    function mint(string memory name, string memory description, string memory uri) external returns (uint256) {

        _safeMint(msg.sender, _nextTokenId);
        _setTokenURI(_nextTokenId, uri);

        /// add to mappings of id to NFT
        idToNFT[_nextTokenId] = NFT(_nextTokenId, name, description, uri);

        _nextTokenId++;
        emit Mint(_nextTokenId-1, msg.sender);
        return _nextTokenId - 1;
    }

    /// @param tokenId of NFT to get
    /// @return NFT belonging with tokenId tokenId
    function getNFT(uint256 tokenId) external view returns (NFT memory) {
        require(tokenId < _nextTokenId, "Invalid token Id");
        return idToNFT[tokenId];
    }

    /// @return all NFT's belonging to a particular sender
    function getMyNFTs() external view returns (NFT[] memory) {
        uint256 numOwned = 0;
        for (uint i = 0; i<_nextTokenId; i++) {
            if (ownerOf(i) == msg.sender) {
                numOwned++;
            }
        }

        NFT[] memory auctionsIncomplete = new NFT[](numOwned);
        uint j = 0;
        for (uint i = 0; i < _nextTokenId; i++) {
            if (ownerOf(i) == msg.sender) {
                auctionsIncomplete[j] = idToNFT[i];
                j++;
                if (j == numOwned) {
                    break;
                }
            }
        }

        return auctionsIncomplete;
    }

    /// Return the token id of the next NFT
    function getCurrentTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    /// safe transfer of NFTs, can be called externally.
    /// @param from person sending NFTs 
    /// @param to person receiving NFTs
    /// @param tokenId NFT token id
    function transferNFTFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual returns (bool) {
        safeTransferFrom(from, to, tokenId);
        return true;
    }

    /// Return address of the contract
    function getAddress() external view returns (address) {
        return address(this);
    }

    /// The following functions are overrides required by Solidity.

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
