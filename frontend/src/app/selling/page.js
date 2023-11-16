'use client';
import React, { useState } from "react";
import NFTCollection from '../../NFTCollection.json';
import AuctionHouse from '../../AuctionHouse.json';
import ItemTile from '../../components/ItemTile';
import { getIPFSUrlFromNFTStorage } from '../../utils';
import axios from "axios";
// TODO: check status of url before displaying to prevent errors
const SellingPage = () => {
  const [data, updateData] = useState([]);
  const [message, updateMessage] = useState("Please give this page a few moments to load NFTs");

  function toObject(data) {
    return JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value // return everything else unchanged
    ));
  }

  React.useEffect(() => {
    const getOpenAuctions = async () => {
      const ethers = require("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      const colContract = new ethers.Contract(process.env.NFTCOLLECTION_CONTRACT, NFTCollection.abi, provider);
      const signer = await provider.getSigner();
      
      const AHContract = new ethers.Contract(process.env.AH_CONTRACT, AuctionHouse.abi, provider);
      
      
      const transaction = toObject(await AHContract.getOpenAuctionsBySender(signer.address));
      
      let count = 0;
      
      const items = await Promise.all(transaction.map(async i => {
        
        count = count + 1;
        const nft = await colContract.getNFT(i[1]);
        let tokenUri = await colContract.tokenURI(i[1]);
        tokenUri = await getIPFSUrlFromNFTStorage(tokenUri);
        
        let price = ethers.formatEther(i[5]);
        let item = {
          price,
          tokenId: i[1],
          seller: i[3],
          owner: i[4],
          image: tokenUri,
          name: nft.name,
          description: nft.description
        }
        return item;
      }));
  
      updateMessage("");
      if (count == 0) {
        updateMessage("There are no auctions currently");
      }
  
      updateFetched(true);
      updateData(items);
    }
    getOpenAuctions();
  }, []);

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col place-items-center mt-20">
        <h1>Welcome to your selling items</h1>
        <h1>{message}</h1>
        <div className="flex flex-col place-items-center mt-20">
            <div className="flex mt-5 justify-between flex-wrap max-w-screen-xl text-center">
                {data.map((value, index) => {
                    return <ItemTile data={value} key={index}></ItemTile>;
                })}
            </div>
        </div>   
      </div>
    </main>
    </>
  )
}

export default SellingPage;