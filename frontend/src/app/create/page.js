'use client';

import { useState } from "react";
import NFTCollection from '../../NFTCollection.json';
import AuctionHouse from '../../AuctionHouse.json';
import { useRouter } from 'next/navigation';
import { storeNFT } from "../../NftStorage";
import DateTimePicker from "react-datetime-picker";
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';

const Create = () => {
    const router = useRouter();
    const [formParams, updateFormParams] = useState({ name: '', desc: '', price: '', date: new Date()});
    const [file, setFile] = useState(null);
    const [message, updateMessage] = useState('');
    const ethers = require("ethers");

    async function disableButton() {
        const listButton = document.getElementById("list-button");
        const auctionButton = document.getElementById("auction-button");
        listButton.disabled = true;
        auctionButton.disabled = true;
        listButton.style.backgroundColor = "grey";
        auctionButton.style.backgroundColor = "grey";
        listButton.style.opacity = 0.3;
        auctionButton.style.opacity = 0.3;
    }

    async function enableButton() {
        const listButton = document.getElementById("list-button");
        const auctionButton = document.getElementById("auction-button");
        listButton.disabled = false;
        auctionButton.disabled = false;
        auctionButton.style.backgroundColor = "blue"
        listButton.style.backgroundColor = "blue";
        listButton.style.opacity = 1;
        auctionButton.style.opacity = 1;
    }
    //This function uploads the NFT image to IPFS
    function OnChangeFile(e) {
        var file = e.target.files[0];
        //check for file extension
        try {
            disableButton();
            setFile(file);
        }
        catch(e) {
          updateMessage("An error occured during uploading...");
        }
        
        enableButton();
    }

    async function createNFT(e) {
      e.preventDefault();
      
      const { name, desc } = formParams;
      
      if (!name || !desc || !file) {
        updateMessage("Please fill all the fields!");
        return;
      }
      
      try {
        disableButton();
        const token = await storeNFT(file, name, desc);
        if (!token.url || token.url == -1) {
          return;
        }

        
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        const signer = await provider.getSigner();
        
        updateMessage("Uploading NFT (may take up to 5 minutes... look out for metamask prompts!)");
        
        const colContract = new ethers.Contract(process.env.NEXT_PUBLIC_NFTCOLLECTION_CONTRACT, NFTCollection.abi, signer);
        // mint the new NFT
        const mintNft = await colContract.mint(name, desc, token.url);
        await mintNft.wait();
        
        alert("Successfully created your NFT!");
        enableButton();
        updateMessage("");
        updateFormParams({ name: '', description: '', price: '' });
        router.push("/");
      } catch (e) {
        updateMessage("An error occured during creation.")
        enableButton();
      }
      
    }

    // only called by listNFT
    async function completeAuction(tokenId, sender) {
      try {
        const { price, date } = formParams;
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        const realDate = Number(Date.parse(date).toString().slice(0, -3));

        const signer = await provider.getSigner();
        // Ensures signer was the one to emit the event
        if (sender !== signer.address) {
          return;
        }

        const colContract = new ethers.Contract(process.env.NEXT_PUBLIC_NFTCOLLECTION_CONTRACT, NFTCollection.abi, signer);

        // confirms it was the sender - removes the listener
        colContract.off("Mint", completeAuction);
        const realPrice = ethers.parseEther(price);
        const AHContract = new ethers.Contract(process.env.NEXT_PUBLIC_AH_CONTRACT, AuctionHouse.abi, signer);

        // Approve contract to transfer ownership of NFT to itself.
        const approve = await colContract.approve(process.env.NEXT_PUBLIC_AH_CONTRACT, tokenId);
        await approve.wait();
        const transaction = await AHContract.createAuction(tokenId, realPrice, realDate);
        await transaction.wait();

        alert("Successfully listed your new NFT for Auction!");
        enableButton();
        updateMessage("");
        updateFormParams({ name: '', description: '', price: '', data: new Date() });
        
        router.push("/");
      } catch (e) {
        updateMessage("An exception occurred during auction.")
      }
    }

    async function listNFT(e) {
      e.preventDefault();

      const { name, desc, price, date } = formParams;
      
      if (!name || !desc || !price || !file || !date) {
        updateMessage("Please fill all the fields!");
        return;
      }
      
      if (Date.now() > Date.parse(date)) {
        updateMessage("Invalid date!");
        return;
      }
      try {
        const token = await storeNFT(file, name, desc);
        if (!token.url || token.url == -1) {
          updateMessage("There was an error uploading to NFT Storage");
          enableButton();
          return;
        }
        
        // What are providers!?!?!?!?
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        const signer = await provider.getSigner();
        disableButton();
        updateMessage("Uploading NFT (may take up to 5 minutes... look out for metamask prompts!)");
        
        const colContract = new ethers.Contract(process.env.NEXT_PUBLIC_NFTCOLLECTION_CONTRACT, NFTCollection.abi, signer);
        
        // mint the new NFT

        // Adds an event listener when Mint even is emitted by NFTCollection
        colContract.on("Mint", completeAuction);
        try {
          const mintNft = await colContract.mint(name, desc, token.url);
          await mintNft.wait();
        } catch (e) {
          colContract.off("Mint", completeAuction);
          updateMessage("An error occured while minting");
          enableButton();
        }
        
      } catch (e) {
        updateMessage("An error occured while auctioning");
      }

    }

    return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="flex flex-col place-items-center mt-10" id="nftForm">
          <form className="bg-white shadow-md rounded px-8 pt-4 pb-8 mb-4">
            <h3 className="text-center font-bold text-blue-500 mb-8">Upload your NFT to the marketplace</h3>
            <div className="mb-4">
              <label className="block text-blue-500 text-sm font-bold mb-2" htmlFor="name">NFT Name</label>
              <input 
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="name" 
                type="text" 
                placeholder="Name" 
                onChange={e => updateFormParams({...formParams, name: e.target.value})} 
                value={formParams.name}
              ></input>
            </div>
            <div className="mb-6">
              <label className="block text-blue-500 text-sm font-bold mb-2" htmlFor="description">NFT Description</label>
              <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                cols="40"
                rows="5"
                id="description"
                type="text"
                placeholder="Description"
                value={formParams.desc}
                onChange={e => updateFormParams({...formParams, desc: e.target.value})}
              ></textarea>
            </div>
            <div className="mb-6">
              <label className="block text-blue-500 text-sm font-bold mb-2" htmlFor="price">Price (in AUC) - Optional</label>
              <input 
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="number" 
                placeholder="Min 0.01 AUH"
                step="0.01"
                value={formParams.price} 
                onChange={e => updateFormParams({...formParams, price: e.target.value})}
              ></input>
            </div>
            <div className="mb-6">
              <label className="block text-blue-500 text-sm font-bold mb-2" htmlFor="date">End date for auction</label>
              <DateTimePicker 
                className="shadow border rounded py-3 px-2 text-gray-darker" 
                onChange={e => updateFormParams({...formParams, date: e})} 
                value={formParams.date}
              />
            </div>
            <div>
              <label className="block text-blue-500 text-sm font-bold mb-2" htmlFor="image">Upload Image (&lt;500 KB)</label>
              <input type={"file"} onChange={OnChangeFile}></input>
            </div>
            <br></br>
            <div className="text-red-500 text-center">{message}</div>
            <div>
              <button onClick={createNFT} className="font-bold mt-5 w-full bg-blue-500 text-white rounded p-2 shadow-lg" id="list-button">
                Create NFT
              </button>
              <button onClick={listNFT} className="font-bold mt-1 w-full bg-blue-500 text-white rounded p-2 shadow-lg" id="auction-button">
                Auction new NFT
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default Create;