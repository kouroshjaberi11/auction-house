// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// ERC20 contract for AUC
/// @author Kourosh Jaberi
contract AuctionHouseCoin is ERC20 {
    constructor(uint256 initialSupply) ERC20("AuctionHouseCoin", "AUC") {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function getAddress() external view returns (address) {
        return address(this);
    }
}