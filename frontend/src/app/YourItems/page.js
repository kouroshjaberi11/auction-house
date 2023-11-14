'use client';
import React, { useState } from "react";
import NFTCollection from '../../NFTCollection.json';
import ItemTile from '../../components/ItemTile';
import { getIPFSUrlFromNFTStorage } from '../../utils';
import axios from "axios";

const YourItemsPage = () => {
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
    
    transaction = toObject(await colContract.getMyNFTs());
    let count = 0;
    const items = await Promise.all(transaction.map(async i => {
      console.log(i);
      count = count + 1;
      let tokenUri = await colContract.tokenURI(i[0]);
      tokenUri = getIPFSUrlFromNFTStorage(tokenUri);
      let meta = await axios.get(tokenUri);
      meta = meta.deta;

      let item = {
        image: meta.image,
        name: meta.name,
        description: meta.description
      }
      return item;
    }));

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
        <h1>Welcome to your items</h1>
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

export default YourItemsPage;