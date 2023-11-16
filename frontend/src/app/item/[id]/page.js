'use client';

import React, { useState } from "react";
import NFTCollection from '../../../NFTCollection.json';
import AuctionHouse from '../../../AuctionHouse.json';
import AuctionHouseCoin from '../../../AuctionHouseCoin.json'
import { getIPFSUrlFromNFTStorage } from '../../../utils';

import axios from "axios";
import { useRouter, usePathname } from 'next/navigation';
import { storeNFT } from "../../../NftStorage";
import DateTimePicker from "react-datetime-picker";
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';

const Item = () => {
    const ethers = require("ethers");
    const router = useRouter();
    const pathname = usePathname();
    const tokenId = pathname.split("/")[2];

    const [formParams, updateFormParams] = useState({ price: '', date: new Date()});
    const [data, updateData] = useState({});
    const [message, updateMessage] = useState("Loading NFT data...");
    // const [currAddress, updateCurrAddress] = useState("0x");
    const [placeholder, setPlaceholder] = useState("");
    
    function toObject(data) {
        return JSON.parse(JSON.stringify(data, (key, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value // return everything else unchanged
        ));
    }

    async function disableButton(butName) {
        const button = document.getElementById(butName);
        button.disabled = true;       
        button.style.backgroundColor = "grey";      
        button.style.opacity = 0.3;
    }

    async function enableButton(butName) {
        const button = document.getElementById(butName);
        button.disabled = false;       
        button.style.backgroundColor = "blue";      
        button.style.opacity = 1;
    }

    async function helper(cse) {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const AHContract = new ethers.Contract(process.env.NEXT_PUBLIC_AH_CONTRACT, AuctionHouse.abi, signer);
            const auctionId = data.auctionId;
            let transaction = null;
            
            switch(cse) {
                case 0: //cancel
                    transaction = await AHContract.cancelAuction(auctionId);
                    await transaction.wait();
                    alert("Successfully cancelled your Auction!");
                    break;
                case 1: //end
                    transaction = await AHContract.endAuctionForce(auctionId);
                    await transaction.wait();
                    alert("Successfully ended your Auction! Rewards should be claimed soon!");
                    break;
                case 2: //claim
                    transaction = await AHContract.claimItem(auctionId);
                    await transaction.wait();
                    alert("Successfully ended the Auction! Rewards should be claimed soon!");
                    break;
            }
            updateMessage("");
            updateFormParams({ price: '', date: new Date() });
            
            router.push("/");
            return true;
        } catch (e) {
            updateMessage("An error occurred - there is a chance that the smart contract block needs updating. Please try again later.");
            return false;
        }
    }

    async function listNFT(e) {
        e.preventDefault();

        const { price, date } = formParams;
      
        if (!price || !date) {
            updateMessage("Please fill price and date fields!");
            return;
        }

        disableButton("auction-button");
        try {
            const realDate = Number(Date.parse(date).toString().slice(0, -3));
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const realPrice = ethers.parseEther(price);
            const AHContract = new ethers.Contract(process.env.NEXT_PUBLIC_AH_CONTRACT, AuctionHouse.abi, signer);
            const NFTCollection = new ethers.Contract(process.env.NEXT_PUBLIC_NFTCOLLECTION_CONTRACT, AuctionHouseCoin.abi, signer);

            let transaction = await NFTCollection.approve(process.env.NEXT_PUBLIC_AH_CONTRACT, data.tokenId);
            await transaction.wait();

            transaction = await AHContract.createAuction(data.tokenId, realPrice, realDate);
            await transaction.wait();
            alert("Successfully listed your new NFT for Auction!");
            updateMessage("");
            updateFormParams({ price: '', date: new Date() });
      
            router.push("/");
        } catch (e) {
            updateMessage("An error occurred - ensure that you are allowed to do this!");
            enableButton("auction-button");
        }
        
    }

    async function lowerPrice(e) {
        e.preventDefault();
        const price = formParams.price;
        if (!price || data.bidCount !== '0' || data.price <= price) {
            updateMessage("Please fill price field properly!");
            return;
        }
        disableButton("cancel-button");
        disableButton("end-button");
        disableButton("lower-button");
        disableButton("claim-button");
        updateMessage("");
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const realPrice = ethers.parseEther(price);
            const AHContract = new ethers.Contract(process.env.NEXT_PUBLIC_AH_CONTRACT, AuctionHouse.abi, signer);
            const transaction = await AHContract.lowerStartingPrice(data.auctionId, realPrice);
            await transaction.wait();
            alert("Successfully lowered the starting price!");
            updateMessage("");
            updateFormParams({ price: '', date: new Date() });
            router.push("/");
        } catch (e) {
            updateMessage("An error occurred - ensure that you are allowed to do this! Navigating back to home.");
            
            enableButton("cancel-button");
            enableButton("end-button");
            enableButton("lower-button");
            enableButton("claim-button");
        }
    }

    async function cancelAuction(e) {
        e.preventDefault();
        disableButton("cancel-button");
        disableButton("end-button");
        disableButton("lower-button");
        disableButton("claim-button");
        if (!helper(0)) {
            enableButton("cancel-button");
            enableButton("end-button");
            enableButton("lower-button");
            enableButton("claim-button");
        }
    }

    async function endAuction(e) {
        e.preventDefault();
        disableButton("cancel-button");
        disableButton("end-button");
        disableButton("lower-button");
        disableButton("claim-button");
        if (!helper(1)) {
            enableButton("cancel-button");
            enableButton("end-button");
            enableButton("lower-button");
            enableButton("claim-button");
        }
    }

    async function claimItem(e) {
        e.preventDefault();
        disableButton("bid-button");
        disableButton("claim-button");
        if (!helper(2)) {
            enableButton("bid-button");
            enableButton("claim-button");
        }
    }

    async function bidOnItem(e) {
        e.preventDefault();
        const price = formParams.price
        
        if (!price || Number(price) < Number(data.price) || !(Number(price) == Number(data.price) && data.bidCount === "0")) {
            updateMessage("Please fill bid field correctly!");
            return;
        }
        updateMessage("Placing bid ... Please wait")
        disableButton("bid-button");

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const realPrice = ethers.parseEther(price);
            const AHContract = new ethers.Contract(process.env.NEXT_PUBLIC_AH_CONTRACT, AuctionHouse.abi, signer);
            const AUCContract = new ethers.Contract(process.env.NEXT_PUBLIC_COIN_CONTRACT, AuctionHouseCoin.abi, signer);
            
            let transaction = await AUCContract.approve(process.env.NEXT_PUBLIC_AH_CONTRACT, realPrice);
            await transaction.wait();
            transaction = await AHContract.bid(data.auctionId, realPrice);
            await transaction.wait();
            alert("Successfully completed your bid!");
            updateMessage("");
            updateFormParams({ price: '', date: new Date() });
      
            router.push("/");
        } catch (e) {
            updateMessage("An error occurred - ensure that you have entered a value greater than the current bid!");
            enableButton("bid-button");
        }
    }

    // TODO: UseEffect here?
    React.useEffect(() => {
        const getNFTData = async () => {
            try {
                const ether = require("ethers");
                let provider = new ether.BrowserProvider(window.ethereum);
                // const signer = await provider.getSigner();
        
                const colContract = new ether.Contract(process.env.NEXT_PUBLIC_NFTCOLLECTION_CONTRACT, NFTCollection.abi, provider);
                const AHContract = new ether.Contract(process.env.NEXT_PUBLIC_AH_CONTRACT, AuctionHouse.abi, provider);
                const checkId = await colContract.getCurrentTokenId();
                
                if (checkId <= tokenId) {
                    updateMessage("Invalid token id - nothing to display!");
                    return;
                }
                // Could use metadata instead of call to contract
                const nft = await colContract.getNFT(tokenId);
                const currentOwner = await colContract.ownerOf(tokenId);
                const allActiveAuctions = toObject(await AHContract.getUnclaimedAuctions());
                let auctionForNFT = null;
        
                for (let i=0; i < allActiveAuctions.length; i++){ 
                    // TODO: Remove
                    if (allActiveAuctions[i][1] === tokenId.toString()) {
                        auctionForNFT = allActiveAuctions[i];
                        break;
                    }
                }
        
                provider = new ether.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                // TODO: Figure out ipfs and NFTStorage links for images and metadata
                // let meta = await axios.get("ipfs url (confusing af)")
                const link = await getIPFSUrlFromNFTStorage(nft.uri);
        
                let item = {
                    tokenId: tokenId,
                    name: nft.name,
                    description: nft.description,
                    owner: currentOwner,
                    image: link,
                    active: false
                }
                
                if (auctionForNFT != null) {
                    if (document.getElementById("end-date").hasAttribute("hidden")) {
                        document.getElementById("end-date").removeAttribute("hidden");
                    }
                    item.auctionId = auctionForNFT[0];
                    item.seller = auctionForNFT[3];
                    if (auctionForNFT[4] !== "0x0000000000000000000000000000000000000000"){
                        item.owner = auctionForNFT[4];
                    }
                    
                    item.price = ether.formatEther(auctionForNFT[5]);
                    item.bidCount = auctionForNFT[8];
                    item.active = true;
                    item.epoch = Number(auctionForNFT[6] + "000");
                    
                } else {
                    document.getElementById("end-date").setAttribute("hidden", "hidden");
                    document.getElementById("current-bid-owner").innerHTML = `Owner: <span className="text-sm">${item.owner}</span>`;
                }
                
                updateData(item);
                
                document.getElementById("action-form").removeAttribute("hidden");
                if (Date.now() >= item.epoch) {
                    document.getElementById("claim-button").removeAttribute("hidden");
                    enableButton("bid-button");
                }
                // there is no active auction, NFT belongs to user
                if (auctionForNFT === null && currentOwner === signer.address) { // Auction item form should be visible
                    updateMessage("");
                    document.getElementById("auction").removeAttribute("hidden");
                    document.getElementById("show-price").setAttribute("hidden", "hidden");
                    document.getElementById("show-seller").setAttribute("hidden", "hidden");
                } else if (auctionForNFT === null) {    // Just info about the NFT
                    document.getElementById("action-form").setAttribute("hidden", "hidden");
                    
                    updateMessage("You do not own this item and it is not up for sale.");
                } else if (item.seller === signer.address) { //end auction and cancel auction buttons should be visible
                    document.getElementById("seller").removeAttribute("hidden");
                    updateMessage("");
                        
                } else { // bid options should be visible - user does not own NFT and it is available to buy.
                    updateMessage("");
                    if (item.bidCount === "0") {
                        setPlaceholder(`Min ${item.price}AUC`);
                    } else {
                        setPlaceholder(`Min > ${item.price}AUC`);
                    }
                    document.getElementById("bid").removeAttribute("hidden")
                }
            } catch (e) {
                updateMessage("An error occured while loading the NFT... Please try again later.")
            }
    
        }
        getNFTData();
            
    }, []);
    

    return (
    <>
    <main>
        <p>NFT: {tokenId}</p>
        <div className="flex">
          <img src={data.image} alt="" className="object-contain h-100 w-100 mt-30 ml-10" />
          <div className="text-xl mt-20 ml-20 space-y-8 text-black shadow-2xl rounded-lg border-2 p-5">
            <div>
            Name: {data.name}
            </div>
            <div>
                Description: {data.description}
            </div>
            <div id="show-price">
                Price: <span className="">{data.price + " ETH"}</span>
            </div>
            <div id="current-bid-owner">
                Current Bid Owner: <span className="text-sm">{data.owner}</span>
            </div>
            <div id="show-seller">
                Seller: <span className="text-sm">{data.seller}</span>
            </div>
            <div id="end-date">
                End Date: <span className="text-sm">{(new Date(data.epoch)).toUTCString()}</span>
            </div>
            <div id="form-div">
                <div className="text-green text-center mt-3">{message}</div>
                <form className="bg-white shadow-md rounded px-8 pt-4 pb-8 mb-4" id='action-form' hidden>
                    <div hidden id="auction">
                        <h3 className="text-center font-bold text-blue-500 mb-8">Auction your NFT to the marketplace</h3>
                        <div className="mb-6">
                            <label className="block text-blue-500 text-sm font-bold mb-2" htmlFor="price">Price (in AUC)</label>
                            <input 
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="number" 
                            placeholder="Min 0.01 ETH"
                            step="0.01"
                            value={formParams.price} 
                            onChange={e => updateFormParams({...formParams, price: e.target.value})}
                            ></input>
                        </div>
                        <div className="mb-6">
                            <label className="block text-blue-500 text-sm font-bold mb-2" htmlFor="date">Date</label>
                            <DateTimePicker 
                                className="shadow border rounded py-3 px-2 text-gray-darker"
                                closeWidgets={true}
                                onChange={e => updateFormParams({...formParams, date: e})} 
                                value={formParams.date}
                            />
                        </div>
                        <div className="text-red-500 text-center">{message}</div>
                        <button onClick={listNFT} className="font-bold mt-1 w-full bg-blue-500 text-white rounded p-2 shadow-lg" id="auction-button">
                            Auction NFT
                        </button>
                    
                    </div>
                    <div hidden id="seller">
                        <div className="border-2">
                            <div className="mb-6">
                                <label className="block text-blue-500 text-sm font-bold mb-2" htmlFor="price">Price (in AUC)</label>
                                <input 
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type="number" 
                                placeholder="Min 0.01 ETH"
                                step="0.01"
                                value={formParams.price} 
                                onChange={e => updateFormParams({...formParams, price: e.target.value})}
                                ></input>
                            </div>
                            <button onClick={lowerPrice} className="font-bold mt-1 w-full bg-blue-500 text-white rounded p-2 shadow-lg" id="lower-button">
                                Lower Starting Price
                            </button>
                        </div>
                        <div>
                            <button onClick={endAuction} className="font-bold mt-1 w-full bg-blue-500 text-white rounded p-2 shadow-lg" id="end-button">
                                End Auction
                            </button>
                            <button onClick={cancelAuction} className="font-bold mt-1 w-full bg-blue-500 text-white rounded p-2 shadow-lg" id="cancel-button">
                                Cancel Auction
                            </button>
                        </div>
                    </div>
                    <div hidden id="bid">
                        <div className="mb-6">
                            <label className="block text-blue-500 text-sm font-bold mb-2" htmlFor="price">Bid (in AUC)</label>
                            <input 
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="number" 
                            placeholder={placeholder}
                            step="0.01"
                            value={formParams.price} 
                            onChange={e => updateFormParams({...formParams, price: e.target.value})}
                            ></input>
                        </div>
                        <div className="text-red-500 text-center">{message}</div>
                        <button onClick={bidOnItem} className="font-bold mt-1 w-full bg-blue-500 text-white rounded p-2 shadow-lg" id="bid-button">
                            Submit Bid
                        </button>
                    </div>
                </form>
            </div>
            <div>
                <button hidden onClick={claimItem} className="font-bold mt-1 w-full bg-blue-500 text-white rounded p-2 shadow-lg" id="claim-button">
                    Claim Item
                </button>
            </div>
          </div>
        </div>
      {/* </div> */}
    </main>
    </>
    );
}

export default Item;