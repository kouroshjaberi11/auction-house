'use client';
import React, { useState } from "react";
import NFTCollection from '../NFTCollection.json';
import AuctionHouse from '../AuctionHouse.json';
import ItemTile from '../components/ItemTile';
import { getIPFSUrlFromNFTStorage } from '../utils';
import axios from "axios";

export default function Home() {
  const util = require("util");
  const [data, updateData] = useState([]);
  const [dataFetched, updateFetched] = useState(false);
  const [message, updateMessage] = useState('Please give this page a few minutes to load NFTs');

  function toObject(data) {
    return JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value // return everything else unchanged
    ));
  }
  async function getOpenAuctions() {
    const ethers = require("ethers");
    const provider = new ethers.BrowserProvider(window.ethereum);
    // const signer = await provider.getSigner();
    const colContract = new ethers.Contract(process.env.NFTCOLLECTION_CONTRACT, NFTCollection.abi, provider);
    const AHContract = new ethers.Contract(process.env.AH_CONTRACT, AuctionHouse.abi, provider);
    
    let transaction = await colContract.getCurrentTokenId();
    
    transaction = toObject(await AHContract.getUnclaimedAuctions());
    
    
    let count = 0
    const items = await Promise.all(transaction.map(async i => {
     
      count = count + 1;
      const nft = await colContract.getNFT(i[1]);
      let tokenUri = await colContract.tokenURI(i[1]);
      console.log(tokenUri);
      tokenUri = await getIPFSUrlFromNFTStorage(tokenUri);
      console.log(tokenUri);
      let meta = await axios.get(tokenUri);
      
      meta = meta.data;

      //await colContract.tokenURI(i[1]);
      // const owner = await colContract.ownerOf(nft.tokenId);
      let price = ethers.formatEther(i[5]);
      let item = {
        price,
        tokenId: i[1],
        seller: i[3],
        owner: i[4],
        image: meta,
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

  React.useEffect(() => {
    if(!dataFetched)
      getOpenAuctions();
  }, []);

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col place-items-center mt-20">
        <h1>Welcome to the marketplace</h1>
        <h1>Newly created NFT's can take up to 48 hours to appear</h1>
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
