// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// ERC20 contract for AUC
/// @author Kourosh Jaberi
contract AuctionHouseCoin is ERC20 {
    /// Create initialSupply amount of AUC and give it to contract creator.
    /// @param initialSupply number of AUC to make
    constructor(uint256 initialSupply) ERC20("AuctionHouseCoin", "AUC") {
        _mint(msg.sender, initialSupply);
    }

    /// Mint AUH
    /// @param to address to mint to 
    /// @param amount amount to mint
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    /// Return contract address
    function getAddress() external view returns (address) {
        return address(this);
    }
}